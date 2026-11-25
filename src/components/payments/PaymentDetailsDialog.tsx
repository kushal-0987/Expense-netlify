import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, QrCode, Trash2 } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import type { Member } from "@/lib/data/types";
import { removePaymentQr, setMemberPaymentInfo, uploadPaymentQr } from "@/lib/data/api";
import { normalizeEsewaPhone } from "@/lib/payments/esewa";
import { useQrUrl } from "./use-qr-url";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_BYTES = 3 * 1024 * 1024;

export function PaymentDetailsDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const { group, me, refresh } = useGroup();
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const existing = useQrUrl(member?.esewa_qr_path);

  useEffect(() => {
    if (!member) return;
    setPhone(member.esewa_phone ?? "");
    setFile(null);
    setPreview(null);
    setRemoveQr(false);
  }, [member]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return void toast.error("Use a PNG, JPG or WebP picture");
    if (f.size > MAX_BYTES) return void toast.error("Picture must be under 3 MB");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRemoveQr(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!member) return;
    const normalized = phone.trim() ? normalizeEsewaPhone(phone) : null;
    if (phone.trim() && !normalized) return void toast.error("Enter a 10-digit eSewa mobile number starting with 9");
    setBusy(true);
    try {
      let path = removeQr ? null : member.esewa_qr_path;
      if (file) path = await uploadPaymentQr(group.id, member.id, file);
      await setMemberPaymentInfo(member.id, normalized, path);
      if (member.esewa_qr_path && member.esewa_qr_path !== path) await removePaymentQr(member.esewa_qr_path);
      await refresh();
      toast.success("eSewa details saved");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const shown = preview ?? (removeQr ? null : existing.data ?? null);
  const isMe = member?.id === me?.id;

  return (
    <Dialog open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isMe ? "Your eSewa details" : `eSewa details for ${member?.name ?? ""}`}</DialogTitle>
          <DialogDescription>Others in the household will see this so they can pay {isMe ? "you" : member?.name} back.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="esewa-phone">eSewa mobile number</Label>
            <Input id="esewa-phone" inputMode="tel" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>eSewa QR picture</Label>
            <div className="flex items-center gap-4 rounded-xl border border-dashed p-3">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {shown ? <img src={shown} alt="eSewa QR" className="h-full w-full object-contain" /> : existing.isLoading && member?.esewa_qr_path && !removeQr ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <QrCode className="h-8 w-8 text-muted-foreground" />}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Open eSewa → My QR, take a screenshot, and upload it here.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}><ImagePlus /> {shown ? "Change" : "Upload"}</Button>
                  {shown && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setFile(null); setPreview(null); setRemoveQr(true); }}><Trash2 /> Remove</Button>
                  )}
                </div>
              </div>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
