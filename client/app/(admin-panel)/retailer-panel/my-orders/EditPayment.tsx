"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const EditPayment = ({
  id,
  fun,
  balance,
  paid,
}: {
  id: number;
  fun: () => void;
  balance: number;
  paid: number;
}) => {
  const [editPayment, setEditPayment] = useState(false);
  const router = useRouter();
  const editForm = useForm({
    defaultValues: {
      editAmount: "",
    },
  });
  const watch = editForm.watch();
  const { executeAsync: paymentChange } = useHttp(
    `/retailer-orders/admin/editPayment/${id}/${watch.editAmount}`,
    "PATCH",
  );
  const { executeAsync: deleteChange } = useHttp(
    `/retailer-orders/admin/deletePayment/${id}`,
    "DELETE",
  );
  const paymentEdit = async () => {
    if (
      Number(watch.editAmount) <= 0 ||
      Number(watch.editAmount) > balance + paid
    ) {
      return toast.error("Please enter the valid amount");
    }
    try {
      await paymentChange();
      setEditPayment(false);
      fun();
      toast.success("Payment Edited");
    } catch (error) {
      toast.error("Error Editing Payment");
    }
  };

  const paymentDelete = async () => {
    try {
      await deleteChange();
      fun();
      toast.success("Payment Deleted");
    } catch (error) {
      toast.error("Error Deleted Payment");
    }
  };

  useEffect(() => {
    editForm.reset();
  }, []);
  return (
    <div className="flex flex-col items-end justify-end space-y-2">
      {!editPayment ? (
        <div className="flex gap-2">
          <Button
            className="w-fit"
            onClick={() => {
              setEditPayment(true);
            }}
          >
            Edit
          </Button>
          <Button
            className="w-fit"
            onClick={() => {
              paymentDelete();
            }}
            variant={"destructive"}
          >
            Delete
          </Button>
        </div>
      ) : (
        <>
          <Form {...editForm}>
            <form
              onSubmit={(e) => e.preventDefault()}
              // onSubmit={form.handleSubmit(onSubmit)}
              className="= space-y-1 rounded-lg p-2"
            >
              <FormField
                control={editForm.control}
                name="editAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Enter Amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant={"destructive"}
                  onClick={() => {
                    setEditPayment(false);
                    editForm.reset();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    paymentEdit();
                  }}
                >
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  );
};

export default memo(EditPayment);
