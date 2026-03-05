"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import StockAcceptedForm from "./StockAcceptedForm";
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
import useHttp from "@/lib/hooks/usePost";
import { toast } from "sonner";
import dayjs from "dayjs";

const StockTable = ({ data }: { data: any[] }) => {
  const router = useRouter();
  const search = useSearchParams();

  const [explanation, setExplanation] = useState("");

  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/stock-order/reject",
    "PATCH",
  );

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
    const newSearchParams = new URLSearchParams(search?.toString());
    newSearchParams.delete("cPage");
    router.push(`?${newSearchParams}`);
    router.refresh();
  }, []);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="text-lg">
            <TableHead className="">Date</TableHead>
            <TableHead className="">Customer</TableHead>
            <TableHead className="text-center">Product Code</TableHead>
            <TableHead className="text-center">Size</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-center">Total Amount</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data &&
            data[0]?.formatted_date &&
            data.map((invoice) => (
              <TableRow key={invoice.id} className="text-lg">
                <TableCell className="font-medium">
                  {dayjs(invoice.formatted_date).format("DD-MM-YYYY")}
                </TableCell>

                <TableCell className="font-medium">{invoice.name}</TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/product/${invoice.product_id}`}
                    target="_blank"
                    className="font-bold text-blue-700"
                  >
                    {invoice.productCode}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  {invoice.size} ({invoice.size_country})
                </TableCell>
                <TableCell className="text-center">
                  {invoice.quantity}
                </TableCell>
                <TableCell className="text-center">
                  {invoice.currencySymbol
                    ? `${invoice.currencySymbol} ${parseFloat(invoice.total_price).toFixed(0)}`
                    : `€ ${parseFloat(invoice.total_price).toFixed(0)}`}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-3">
                    <StockAcceptedForm id={invoice.id} />

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
    </div>
  );
};

export default StockTable;
