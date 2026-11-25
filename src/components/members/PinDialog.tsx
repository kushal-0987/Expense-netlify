import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Member } from "@/lib/data/types";
import { setMemberPin } from "@/lib/pin/member-pin.functions";
import { isValidPin } from "@/lib/pin/rules";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PinDialog({ member, onClose, onSaved }: { member: Member | null; onClose: () => void; onSaved: () => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setPin(""), [member]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!member) return;
    if (!isValidPin(pin)) return void toast.error("PIN must be 4 to 6 digits");
    setBusy(true);
    try {
      await setMemberPin({ data: { memberId: member.id, pin } });
      toast.success(`PIN saved for ${member.name}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the PIN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set PIN for {member?.name}</DialogTitle>
          <DialogDescription>They'll use this with the invite link. Tell them the PIN privately.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-pin">PIN (4–6 digits)</Label>
            <Input id="new-pin" inputMode="numeric" maxLength={6} autoFocus value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="text-center text-2xl tracking-[0.5em]" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Save PIN</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
