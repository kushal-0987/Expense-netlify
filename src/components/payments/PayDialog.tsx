import { toast } from "sonner";
import { Copy, Download, Loader2, QrCode, Smartphone } from "lucide-react";
import type { Member } from "@/lib/data/types";
import { useQrUrl } from "./use-qr-url";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PayDialog({ receiver, amountText, onClose }: { receiver: Member | null; amountText?: string; onClose: () => void }) {
  const qr = useQrUrl(receiver?.esewa_qr_path);

  async function download() {
    if (!qr.data || !receiver) return;
    try {
      const blob = await (await fetch(qr.data)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `esewa-qr-${receiver.name.replace(/\s+/g, "-").toLowerCase()}.${blob.type.split("/")[1] ?? "png"}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Could not download the QR");
    }
  }

  return (
    <Dialog open={!!receiver} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay {receiver?.name} on eSewa</DialogTitle>
          <DialogDescription>{amountText ? <>Send <span className="font-semibold text-foreground">{amountText}</span>, then record the payment here.</> : "Scan the QR or send to the number below."}</DialogDescription>
        </DialogHeader>
        {receiver?.esewa_qr_path && (
          <div className="space-y-2">
            <div className="mx-auto flex aspect-square w-full max-w-[16rem] items-center justify-center overflow-hidden rounded-xl border bg-card p-2">
              {qr.data ? <img src={qr.data} alt={`eSewa QR for ${receiver.name}`} className="h-full w-full object-contain" /> : qr.isError ? <QrCode className="h-10 w-10 text-muted-foreground" /> : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
            </div>
            <Button variant="outline" size="sm" className="mx-auto flex" onClick={download} disabled={!qr.data}><Download /> Save QR (to scan from gallery)</Button>
          </div>
        )}
        {receiver?.esewa_phone && (
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="h-4 w-4 text-primary" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">eSewa ID</div>
                <div className="tabular text-base font-semibold">{receiver.esewa_phone}</div>
              </div>
            </div>
            <Button size="sm" variant="soft" onClick={() => { void navigator.clipboard.writeText(receiver.esewa_phone!); toast.success("Number copied"); }}><Copy /> Copy</Button>
          </div>
        )}
        {!receiver?.esewa_phone && !receiver?.esewa_qr_path && <p className="text-sm text-muted-foreground">{receiver?.name} hasn't added eSewa details yet.</p>}
      </DialogContent>
    </Dialog>
  );
}
