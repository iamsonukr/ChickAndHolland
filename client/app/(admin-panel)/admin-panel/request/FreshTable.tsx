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
import { useEffect, useRef, useState } from "react";
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
import { formatDateOnlyDisplay } from "@/lib/dateOnly";

const splitCsvValues = (value: unknown) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatSizeWithCountry = (size: string, sizeCountry?: string) => {
  if (!sizeCountry) {
    return size;
  }

  if (size.includes(`(${sizeCountry})`) || size.startsWith(`${sizeCountry} `)) {
    return size;
  }

  return `${size} (${sizeCountry})`;
};

const formatFreshTableSize = (invoice: {
  original_size?: unknown;
  product_size?: unknown;
  size?: unknown;
  size_country?: unknown;
}) => {
  const sizes = splitCsvValues(
    invoice.original_size ?? invoice.product_size ?? invoice.size ?? "",
  );
  const sizeCountries = splitCsvValues(invoice.size_country);
  const fallbackCountry = sizeCountries.length === 1 ? sizeCountries[0] : "";

  if (!sizes.length) {
    return "N/A";
  }

  const formattedSizes = sizes
    .map((size, index) =>
      formatSizeWithCountry(size, sizeCountries[index] || fallbackCountry),
    )
    .filter((value, index, values) => values.indexOf(value) === index);

  return formattedSizes.join(", ");
};

const getCustomerStoreName = (invoice: any) =>
  invoice?.customerStoreName ||
  invoice?.customer_store_name ||
  invoice?.storeName ||
  invoice?.customer_name ||
  "";

export function FreshTable({ data }: { data: any[] }) {
  const { loading, error, executeAsync } = useHttp(
    "/retailer-orders/admin/fresh-order/reject",
    "PATCH",
  );
  const router = useRouter();

  const search = useSearchParams();
  const hasResetPage = useRef(false);
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
    if (hasResetPage.current) return;
    hasResetPage.current = true;

    const newSearchParams = new URLSearchParams(search.toString());
    newSearchParams.delete("cPage");
    router.push(`?${newSearchParams}`);
    router.refresh();
  }, [router, search]);
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-sm sm:text-base">
          <TableHead className="">Date</TableHead>
          <TableHead className="text-center">Customer</TableHead>
          <TableHead className="text-center">Type</TableHead>
          <TableHead className="text-center">Sizes</TableHead>
          <TableHead className="text-center">Quantity</TableHead>
          <TableHead className="text-center">Total Amount</TableHead>
          <TableHead> Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((invoice) => (
          <TableRow key={invoice.id} className="text-sm sm:text-base">
            <TableCell className="font-medium">
              {formatDateOnlyDisplay(invoice.formatted_date, "DD-MM-YYYY")}
            </TableCell>
            <TableCell className="text-center">{getCustomerStoreName(invoice)}</TableCell>
            <TableCell className="text-center">
              {invoice.requestType || "Fresh"}
            </TableCell>
            <TableCell className="max-w-[150px] truncate text-center">
              {formatFreshTableSize(invoice)}
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
