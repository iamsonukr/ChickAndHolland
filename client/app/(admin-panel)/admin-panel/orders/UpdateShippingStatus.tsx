"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShippingStatus,
  ShippingStatusForm,
  updateShippingStatusFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit } from "lucide-react";

const UpdateShippingStatus = ({
  orderData,
  id,
  orderStatus,
  formattedshippingDate,
}: {
  orderData: string;
  id: number;
  orderStatus: string;
  formattedshippingDate: string | null;
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<ShippingStatusForm>({
    resolver: zodResolver(updateShippingStatusFormSchema),
    defaultValues: {
      shippingStatus: orderData || "",
    },
  });

  const { loading, error, executeAsync } = useHttp(
    "/orders/orderShippingStatus",
    "PUT",
  );

  const router = useRouter();

  const onSubmit = async (values: ShippingStatusForm) => {
    try {
      // if (
      //   orderStatus !== "Ready To Delivery" &&
      //   values.shippingStatus == "Shipped"
      // ) {
      //   toast.error("Change status to move to delivery");
      //   router.refresh();

      //   return;
      // }
      const response = await executeAsync(
        {
          orderId: id,
          status: values.shippingStatus,
        },
        {},
        (error) => {
          return toast.error("Failed to update order status", {
            description: error?.message ?? "Something went wrong",
          });
        },
      );

      if (!response.success) {
        return toast.error("Failed to update order status");
      }

      setOpen(false);
      toast.success(response.message ?? "Shipping status updated successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to update order status", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="flex w-full justify-between gap-2">
          {orderData} <br></br>{" "}
          {formattedshippingDate && `(${formattedshippingDate})`}{" "}
          <Edit className="!h-[35px] !w-[35px] bg-white p-1" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shippingStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ShippingStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Update Shipping Status</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateShippingStatus;
