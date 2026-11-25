import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Sparkles } from "lucide-react";
import { draftReminderEmail } from "@/lib/ai/reminder-email.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface AiReminderTarget {
  groupId: string;
  debtorName: string;
  debtorEmail?: string | null;
  receiverName: string;
  amountText: string;
  householdName: string;
  receiverEsewa?: string | null;
  link?: string;
}

const tones = ["friendly", "neutral", "firm"] as const;

export function AiReminderDialog({ target, onClose }: { target: AiReminderTarget | null; onClose: () => void }) {
  const draft = useServerFn(draftReminderEmail);
  const [tone, setTone] = useState<(typeof tones)[number]>("friendly");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    setAmount(target.amountText); setTo(target.debtorEmail ?? ""); setNotes(""); setSubject(""); setBody(""); setTone("friendly");
  }, [target]);

  async function generate() {
    if (!target) return;
    setBusy(true);
    try {
      const r = await draft({ data: { ...target, amountText: amount, receiverEsewa: target.receiverEsewa ?? "", link: target.link ?? "", tone, notes } });
      setSubject(r.subject); setBody(r.body);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't draft the email");
    } finally { setBusy(false); }
  }

  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI email reminder</DialogTitle>
          <DialogDescription>Reminder for {target?.debtorName}, who owes {target?.receiverName}. Review the draft before sending.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="ai-amt">Amount owed</Label><Input id="ai-amt" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Tone</Label>
              <div className="flex gap-1 rounded-lg border p-1">
                {tones.map((t) => (
                  <button key={t} type="button" onClick={() => setTone(t)} className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold capitalize transition ${tone === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ai-notes">Extra details (optional)</Label><Textarea id="ai-notes" rows={2} placeholder="e.g. for October electricity and groceries, please pay by Friday" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button onClick={generate} disabled={busy || !amount.trim()} className="w-full bg-gradient-primary shadow-glow">
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {body ? "Write again" : "Draft email"}
          </Button>
          {body && (
            <div className="space-y-3 border-t pt-3">
              <div className="space-y-1.5"><Label htmlFor="ai-to">Send to</Label><Input id="ai-to" type="email" placeholder="member@email.com" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="ai-sub">Subject</Label><Input id="ai-sub" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="ai-body">Message</Label><Textarea id="ai-body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { void navigator.clipboard.writeText(`${subject}\n\n${body}`); toast.success("Copied"); }}><Copy /> Copy</Button>
                <Button asChild className="flex-1"><a href={mailto}><Mail /> Open in email</a></Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
