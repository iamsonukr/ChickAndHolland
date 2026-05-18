"use client";

import { useState, useEffect } from "react";

import CreateOrder from "./CreateOrder";
import FreshOrdersAcceptedForm from "../request/FreshOrdersAcceptedForm";
import StockAcceptedForm from "../request/StockAcceptedForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/custom/password-input";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";

const EditOrderAction = ({
  order,
  customers,
}: {
  order: any;
  customers: any[];
}) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [verified, setVerified] = useState(false);
  const [openVerify, setOpenVerify] = useState(false);
  const [password, setPassword] = useState("");

  const { executeAsync: verifyEditPassword, loading: verifying } = useHttp(
    "/admin-settings/verify-edit-password",
    "POST",
  );

  const handleSuccess = () => setOpenEdit(false); // 👈 collapse back after save

  useEffect(() => {
    if (!openEdit) {
      // reset verification when edit closed
      setVerified(false);
      setPassword("");
    }
  }, [openEdit]);

  const onVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error("Edit password is required");
      return;
    }

    try {
      await verifyEditPassword({ password });
      setVerified(true);
      setOpenVerify(false);
      setOpenEdit(true);
      toast.success("Password verified");
    } catch (err: any) {
      toast.error(err?.message || "Invalid edit password");
    }
  };

  if (!openEdit) {
    return (
      <Dialog open={openVerify} onOpenChange={setOpenVerify}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={() => setOpenVerify(true)}>
            Edit
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Edit Password</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onVerifySubmit}>
            <div className="space-y-2">
              <Label htmlFor={`edit-password-${order.id}`}>Edit Password</Label>
              <PasswordInput
                id={`edit-password-${order.id}`}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenVerify(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={verifying}>
                Verify
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (order.orderSource === "regular") {
    return (
      <CreateOrder
        customers={customers}
        ordersTotalCount={0}
        editOrder={order}
        triggerLabel="Edit"
        onSuccess={handleSuccess} // 👈
      />
    );
  }

  if (order.orderType === "Stock") {
    const stockOrderId = order.Stock_order?.id ?? order.stockId;

    if (!stockOrderId) {
      return (
        <Button variant="outline" disabled>
          Edit
        </Button>
      );
    }

    return (
      <StockAcceptedForm
        id={stockOrderId}
        editMode
        retailerOrderId={order.id}
        editOrder={order}
        triggerLabel="Edit"
        onSuccess={handleSuccess} // 👈
      />
    );
  }

  if (order.favouriteOrder?.id) {
    return (
      <FreshOrdersAcceptedForm
        customers={customers}
        id={order.favouriteOrder.id}
        editMode
        retailerOrderId={order.id}
        editOrder={order}
        triggerLabel="Edit"
        onSuccess={handleSuccess} // 👈
      />
    );
  }

  return (
    <Button variant="outline" disabled>
      Edit
    </Button>
  );
};

export default EditOrderAction;