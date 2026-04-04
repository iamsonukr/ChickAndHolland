"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdjustSequenceButton = () => {
  const { executeAsync, loading } = useHttp("/retailer-orders/sequence", "POST");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    const val = Number(value);
    if (isNaN(val) || val < 1) {
      toast.error("Enter a positive number (no decimals).");
      return;
    }
    try {
      setPending(true);
      const res: any = await executeAsync({ nextNumber: val });
      toast.success(res?.message || `Next sequence set to ${res?.nextSequence}`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update sequence");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={loading || pending}>
          Adjust Sequence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust PO Sequence</DialogTitle>
          <DialogDescription>
            Sets the next global PO number. It will not go below the highest existing PO.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="next-seq">Next Number</Label>
          <Input
            id="next-seq"
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 240"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || loading}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustSequenceButton;
