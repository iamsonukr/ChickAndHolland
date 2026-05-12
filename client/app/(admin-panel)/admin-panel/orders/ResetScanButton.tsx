"use client";

import { FormEvent, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/custom/button";
import { PasswordInput } from "@/components/custom/password-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useHttp from "@/lib/hooks/usePost";

type ResetScanButtonProps = {
  order: {
    id: number | string;
    orderSource: "regular" | "retailer";
    purchaeOrderNo?: string | null;
  };
};

const ResetScanButton = ({ order }: ResetScanButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const { executeAsync, loading } = useHttp(
    `/admin-scan/orders/${order.orderSource}/${order.id}/reset`,
    "POST",
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password.trim()) {
      toast.error("Reset password is required");
      return;
    }

    try {
      const response = await executeAsync(
        { password },
        {},
        (error) => toast.error(error?.message ?? "Reset failed"),
      );

      toast.success(
        response?.message ?? "Product scans reset to Pattern successfully",
      );
      setPassword("");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      if (!error?.message) {
        toast.error("Reset failed");
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setPassword("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Scan Progress</DialogTitle>
          <DialogDescription>
            Order No: <strong>{order.purchaeOrderNo || order.id}</strong>
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor={`reset-password-${order.orderSource}-${order.id}`}>
              Reset Password
            </Label>
            <PasswordInput
              id={`reset-password-${order.orderSource}-${order.id}`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              loading={loading}
              disabled={!password.trim()}
            >
              Reset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetScanButton;
