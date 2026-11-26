import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  attemptProviderDelivery,
  computeNextRetryIso,
  updateEmailLog,
  type EmailDeliveryStatus,
} from "./email-service.server";

export interface QueueProcessResult {
  processed: number;
  succeeded: number;
  deferredForRetry: number;
  failed: number;
}

/**
 * Processes pending email jobs from the persistent `email_logs` queue.
 * - Uses temporary lock (`next_retry_at`) to prevent concurrent duplicate sends.
 * - Respects `max_retries` and exponential backoff to prevent infinite loops.
 * - Never throws; safe for Vercel background triggers and Cron jobs.
 */
export async function processEmailQueue(opts: {
  groupId?: string;
  limit?: number;
} = {}): Promise<QueueProcessResult> {
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 20);
  const result: QueueProcessResult = {
    processed: 0,
    succeeded: 0,
    deferredForRetry: 0,
    failed: 0,
  };

  try {
    const nowIso = new Date().toISOString();
    let query = supabaseAdmin
      .from("email_logs")
      .select("*")
      .eq("status", "pending")
      .not("html_body", "is", null)
      .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (opts.groupId) {
      query = query.eq("group_id", opts.groupId);
    }

    const { data: jobs, error } = await query;

    if (error || !jobs || jobs.length === 0) {
      if (error) {
        console.warn("[QueueProcessor] Query warning:", error.message);
      }
      return result;
    }

    for (const job of jobs) {
      result.processed++;

      // Enforce max retries guard
      if (job.retry_count >= job.max_retries) {
        await updateEmailLog(job.id, {
          status: "failed",
          errorMessage: job.error_message || "Maximum retry attempts reached.",
          nextRetryAt: null,
        });
        result.failed++;
        continue;
      }

      // Claim lease for 2 minutes so another concurrent worker does not double-send
      const leaseUntil = new Date(Date.now() + 120 * 1000).toISOString();
      const { error: claimErr } = await supabaseAdmin
        .from("email_logs")
        .update({ next_retry_at: leaseUntil, updated_at: new Date().toISOString() })
        .eq("id", job.id)
        .eq("status", "pending");

      if (claimErr) {
        console.warn(`[QueueProcessor] Could not claim job ${job.id}:`, claimErr.message);
        continue;
      }

      const delivery = await attemptProviderDelivery({
        to: job.recipient_email,
        subject: job.subject,
        html: job.html_body!,
        text: job.text_body,
        idempotencyKey: job.idempotency_key,
      });

      if (delivery.success) {
        const finalStatus: EmailDeliveryStatus = delivery.provider === "gmail_smtp" ? "delivered" : "accepted";
        await updateEmailLog(job.id, {
          status: finalStatus,
          provider: delivery.provider,
          resendEmailId: delivery.emailId || null,
          errorMessage: null,
          sentAt: new Date().toISOString(),
          nextRetryAt: null,
          ...(finalStatus === "delivered" ? { deliveredAt: new Date().toISOString() } : {}),
        });
        result.succeeded++;
      } else {
        const nextRetryCount = job.retry_count + 1;
        const canRetry = delivery.transientError && nextRetryCount < job.max_retries;

        if (canRetry) {
          await updateEmailLog(job.id, {
            status: "pending",
            retryCount: nextRetryCount,
            nextRetryAt: computeNextRetryIso(nextRetryCount),
            errorMessage: delivery.error || "Temporary delivery error; scheduled for retry.",
          });
          result.deferredForRetry++;
        } else {
          await updateEmailLog(job.id, {
            status: "failed",
            retryCount: nextRetryCount,
            nextRetryAt: null,
            errorMessage: delivery.error || "Email delivery failed.",
          });
          result.failed++;
        }
      }
    }

    return result;
  } catch (err) {
    console.error("[QueueProcessor] Unexpected error (non-fatal):", err);
    return result;
  }
}
