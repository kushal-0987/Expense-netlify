import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/finance/money";
import { createGroup } from "@/lib/data/api";

export function CreateGroupForm({ defaultName, onCreated }: { defaultName?: string; onCreated: (groupId: string) => void }) {
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState(defaultName ?? "");
  const [currency, setCurrency] = useState("NPR");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Give your group a name");
    setBusy(true);
    try {
      const id = await createGroup(name.trim(), currency, memberName.trim());
      toast.success(`${name.trim()} is ready`);
      onCreated(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the group");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="g-name">Group name</Label>
        <Input id="g-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Pokhrel Family" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-me">Your name in this group</Label>
        <Input id="g-me" maxLength={60} value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Kushal" />
      </div>
      <div className="space-y-1.5">
        <Label>Currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Create group
      </Button>
    </form>
  );
}
