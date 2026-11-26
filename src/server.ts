import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/webhooks/resend" && request.method === "POST") {
        const { handleResendWebhook } = await import("./lib/notifications/webhook-handler.server");
        const rawBody = await request.text();
        const { status, body } = await handleResendWebhook(rawBody, request.headers);
        return new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.pathname === "/api/notifications/process" && request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({})) as { groupId?: string };
          const groupId = typeof body?.groupId === "string" && /^[0-9a-f-]{36}$/i.test(body.groupId)
            ? body.groupId
            : undefined;
          const { processEmailQueue } = await import("./lib/notifications/queue-processor.server");
          const result = await processEmailQueue({ groupId, limit: 10 });
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          console.error("[/api/notifications/process] Non-fatal error:", err);
          return new Response(JSON.stringify({ ok: false }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
      }

      if (url.pathname === "/api/cron/process-emails" && (request.method === "GET" || request.method === "POST")) {
        const cronSecret = process.env["CRON_SECRET"];
        if (cronSecret) {
          const authHeader = request.headers.get("authorization") ?? "";
          if (authHeader !== `Bearer ${cronSecret}`) {
            return new Response("Unauthorized", { status: 401 });
          }
        } else if (process.env["LOVABLE_CRON_SECRET"]) {
          const { authenticateCronRequest } = await import("./integrations/supabase/cron-auth");
          const denied = await authenticateCronRequest(request);
          if (denied) return denied;
        }
        const { processEmailQueue } = await import("./lib/notifications/queue-processor.server");
        const result = await processEmailQueue({ limit: 20 });
        return new Response(JSON.stringify({ ok: true, ...result }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
