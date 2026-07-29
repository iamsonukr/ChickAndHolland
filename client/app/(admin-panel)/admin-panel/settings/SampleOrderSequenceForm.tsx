"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useHttp from "@/lib/hooks/usePost";

const SampleOrderSequenceForm = () => {
  const [nextNumber, setNextNumber] = useState("");
  const [nextStyleNo, setNextStyleNo] = useState("NS001164");
  const { executeAsync: fetchSequence, loading: loadingSequence } = useHttp(
    "/admin-settings/sample-order-sequence",
    "GET",
  );
  const { executeAsync: updateSequence, loading: saving } = useHttp(
    "/admin-settings/sample-order-sequence",
    "PUT",
  );

  const loadSequence = useCallback(async () => {
    try {
      const response: any = await fetchSequence();
      setNextNumber(String(response?.nextNumber ?? ""));
      setNextStyleNo(response?.nextStyleNo ?? "NS001164");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to load sample order sequence");
    }
  }, [fetchSequence]);

  useEffect(() => {
    loadSequence();
  }, [loadSequence]);

  const onSave = async () => {
    const value = Number(nextNumber);

    if (!Number.isInteger(value) || value < 1) {
      toast.error("Enter a positive whole number.");
      return;
    }

    try {
      const response: any = await updateSequence({ nextNumber: value });
      setNextNumber(String(response?.nextNumber ?? value));
      setNextStyleNo(response?.nextStyleNo ?? nextStyleNo);
      toast.success(response?.message ?? "Sample order sequence updated");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update sample order sequence");
    }
  };

  return (
    <div className="w-full max-w-xl rounded-md border bg-background p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold">Sample Order NS Sequence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controls the next Style No. used by Retailer Panel sample orders.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Next Style No.</Label>
          <Input value={nextStyleNo} readOnly className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sample-next-number">Next Number</Label>
          <Input
            id="sample-next-number"
            type="number"
            min={1}
            value={nextNumber}
            onChange={(event) => setNextNumber(event.target.value)}
            placeholder="1164"
          />
        </div>
        <Button
          type="button"
          onClick={onSave}
          className="w-full"
          disabled={loadingSequence || saving}
        >
          {saving ? "Saving..." : "Update Sample Sequence"}
        </Button>
      </div>
    </div>
  );
};

export default SampleOrderSequenceForm;
