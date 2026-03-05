"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  addExpenseFormSchema,
  AddExpenseForm as AddExpenseFormType,
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
const AddExpenseForm = ({
  expenseName,
  expenseLength,
}: {
  expenseName: "Chic & Holland expenses" | "Ozil Expenses";
  expenseLength: number;
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddExpenseFormType>({
    resolver: zodResolver(addExpenseFormSchema),
    defaultValues: {
      payer: "",
      expenseType: "",
      amount: undefined,
      currency: undefined,
      expenseName: expenseName,
      otherType: "",
      invoice: "",
    },
  });

  const { loading, error, executeAsync } = useHttp("/expenses");

  const router = useRouter();

  const onSubmit = async (data: AddExpenseFormType) => {
    try {
      const response = await executeAsync(data);

      if (error) {
        return toast.error("Failed to add expense");
      }

      form.reset();
      form.setValue("expenseType", "");
      form.setValue("currency", "");

      // form.setValue("expenseName", "");
      setOpen(false);
      toast.success(response.message ?? "Expense added successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add expense");
    }
  };

  useEffect(() => {
    let invoice = `IN#${uuidv4().replace(/-/g, "").substring(0, 4)} ${expenseLength}`;

    form.setValue("invoice", invoice);
  }, [expenseLength]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New expense <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[100%] overflow-y-auto md:min-w-[50%] lg:min-w-[35%]">
        <SheetHeader>
          <SheetTitle>Add New Expense</SheetTitle>
          <SheetDescription>
            Fill in the form below to add a new Expense
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-8 space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="payer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expenseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the expense type of this expense" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="opex">Opex</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("expenseType") === "others" && (
              <FormField
                control={form.control}
                name="otherType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Expences</FormLabel>
                    <FormControl>
                      <Input placeholder="Other" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="invoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the currency of this expense" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="euro">Euro</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                      <SelectItem value="inr">INR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/*<FormField*/}
            {/*  control={form.control}*/}
            {/*  name="expenseName"*/}
            {/*  render={({ field }) => (*/}
            {/*    <FormItem>*/}
            {/*      <FormLabel>Expense Category</FormLabel>*/}
            {/*      <Select onValueChange={field.onChange} value={field.value}>*/}
            {/*        <FormControl>*/}
            {/*          <SelectTrigger>*/}
            {/*            <SelectValue placeholder="Select the category of this expense" />*/}
            {/*          </SelectTrigger>*/}
            {/*        </FormControl>*/}
            {/*        <SelectContent>*/}
            {/*          <SelectItem value="Chic & Holland expenses">*/}
            {/*            Chic & Holland expenses*/}
            {/*          </SelectItem>*/}
            {/*          <SelectItem value="Ozil Expenses">*/}
            {/*            Ozil Expenses*/}
            {/*          </SelectItem>*/}
            {/*        </SelectContent>*/}
            {/*      </Select>*/}
            {/*      <FormMessage />*/}
            {/*    </FormItem>*/}
            {/*  )}*/}
            {/*/>*/}

            <div>
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? "Loading..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddExpenseForm;
