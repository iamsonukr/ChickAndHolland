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
import { Input } from "@/components/ui/input";
import {
  UpdateTrackingIdForm,
  updateTrackingIdFormSchema,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const UpdateTrackingId = ({
  trackingId,
  id,
}: {
  trackingId: string;
  id: number;
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateTrackingIdForm>({
    resolver: zodResolver(updateTrackingIdFormSchema),
    defaultValues: {
      trackingId: trackingId || "",
    },
  });

  const { loading, error, executeAsync } = useHttp("/orders/tracking", "PUT");
  const router = useRouter();

  const onSubmit = async (values: UpdateTrackingIdForm) => {
    try {
      const response = await executeAsync(
        {
          orderId: id,
          trackingNo: values.trackingId,
        },
        {},
        (error) => {
          return toast.error("Failed to update tracking ID", {
            description: error?.message ?? "Something went wrong",
          });
        },
      );

      if (!response.success) {
        return toast.error("Failed to update tracking ID");
      }

      setOpen(false);
      toast.success(response.message ?? "Tracking ID updated successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to update tracking ID", {
        description: error?.message ?? "Something went wrong",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          {trackingId || "Add Tracking ID"}
        </div>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="trackingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tracking ID" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Update Tracking ID</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTrackingId;
