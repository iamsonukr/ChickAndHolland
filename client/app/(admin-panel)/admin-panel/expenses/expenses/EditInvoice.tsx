"use client";

import { memo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { v4 as uuidv4 } from "uuid";
import useHttp from "@/lib/hooks/usePost";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Define the Zod validation schema
const invoiceFormSchema = z.object({
  invoice: z.string().min(1, "Invoice number is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const EditInvoice = ({
  invoice: invoiceNumber,
  id,
}: {
  invoice: string;
  id: number;
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  // Default values for the form
  let invoiceCreateion = `IN#${uuidv4().replace(/-/g, "").substring(0, 4)} ${id}`;
  const defaultValues: Partial<InvoiceFormValues> = {
    invoice: invoiceNumber || invoiceCreateion,
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  });

  const { loading, error, executeAsync } = useHttp(
    `expenses/invoice/${id}`,
    "PATCH",
  );

  async function onSubmit(data: InvoiceFormValues) {
    try {
      await executeAsync({
        invoice: data.invoice,
      });
      router.refresh();
      toast.success("Invoice Updated");
      setOpen(false);
    } catch (error) {
      toast.error("Error at Updating Invoice");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {invoiceNumber ? (
          <p className="cursor-pointer">{invoiceNumber}</p>
        ) : (
          <Button variant="outline">Add Invoice</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {invoiceNumber ? "Edit Invoice" : "Add Invoice"}
          </DialogTitle>
          <DialogDescription>
            {invoiceNumber
              ? `Update invoice details for invoice #${invoiceNumber}`
              : "Create a new invoice by filling out the details below"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="invoice"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Invoice </FormLabel>
                  <FormControl>
                    <Input
                      className="col-span-3"
                      placeholder="INV-001"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-3 col-start-2" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save Invoice</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default memo(EditInvoice);
