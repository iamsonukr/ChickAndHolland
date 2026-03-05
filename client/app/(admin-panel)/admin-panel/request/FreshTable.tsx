"use client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import FreshOrdersAcceptedForm from "./FreshOrdersAcceptedForm";
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import dayjs from "dayjs";

export function FreshTable({ data }: { data: any[] }) {
  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/fresh-order/reject",
    "PATCH",
  );
  const router = useRouter();

  const search = useSearchParams();
  const [details, setDetails] = useState([]);
  const [explanation, setExplanation] = useState("");
  const reject = async (id: number) => {
    try {
      const res = await executeAsync({ comment: explanation, id: id });
      toast.success(res.msg);
      router.refresh();
    } catch (error) {
      toast.error("Failed To Reject Order");
      console.log(error);
    }
  };

  useEffect(() => {
    const newSearchParams = new URLSearchParams(search.toString());
    newSearchParams.delete("cPage");
    router.push(`?${newSearchParams}`);
    router.refresh();
  }, []);
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-lg">
          <TableHead className="">Date</TableHead>
          <TableHead className="text-center">Customer</TableHead>
          <TableHead className="text-center">Sizes</TableHead>
          <TableHead className="text-center">Quantity</TableHead>
          <TableHead className="text-center">Total Amount</TableHead>
          <TableHead> Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((invoice) => (
          <TableRow key={invoice.id} className="text-lg">
            <TableCell className="font-medium">
              {dayjs(invoice.formatted_date).format("DD-MM-YYYY")}
            </TableCell>
            <TableCell className="text-center">{invoice.name}</TableCell>
          <TableCell className="max-w-[150px] truncate text-center">
  {invoice.admin_us_size
    ? ` ${invoice.admin_us_size
        .split(",")
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ")}`
    : invoice.product_size
      ? `${invoice.size_country.split(",")[0]} ${
          invoice.product_size
            .split(",")
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(", ")
        }`
      : "N/A"}
</TableCell>


            <TableCell className="text-center">
              {invoice.total_quantity}
            </TableCell>
            <TableCell className="text-center">
              {invoice.currencySymbol
                ? `${invoice.currencySymbol} ${parseFloat(invoice.total_amount).toFixed(0)}`
                : `€ ${parseFloat(invoice.total_amount).toFixed(0)}`}
            </TableCell>
            <TableCell>
              <div className="flex justify-center gap-3">
                <FreshOrdersAcceptedForm customers={details} id={invoice.id} />

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Reject</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Enter Any Explanation</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Textarea
                        placeholder="Explanation"
                        onChange={(w) => setExplanation(w.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => reject(invoice.id)}
                      >
                        Reject
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}