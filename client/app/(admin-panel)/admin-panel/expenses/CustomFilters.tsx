"use client";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseType } from "@/lib/formSchemas";
import { useRouter, useSearchParams } from "next/navigation";

const CustomFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const expenseType = searchParams?.get("expenseType");
  const isPaid = searchParams?.get("isPaid");
  const fromDate = searchParams?.get("fromDate");
  const toDate = searchParams?.get("toDate");

  return (
    <div className="flex items-center gap-3">
      <Select
        defaultValue={expenseType || "All"}
        onValueChange={(value) => {
          const newSearchParams = new URLSearchParams(searchParams?.toString());
          newSearchParams.set("expenseType", value);
          newSearchParams.delete("cPage");
          router.push(`?${newSearchParams.toString()}`);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Expense Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All</SelectItem>
         {ExpenseType.map((key, index) => (
  <SelectItem key={`${key}-${index}`} value={key}>
    {key.charAt(0).toUpperCase() + key.slice(1)}
  </SelectItem>
))}

        </SelectContent>
      </Select>
      <Select
        defaultValue={isPaid || "All"}
        onValueChange={(value) => {
          const newSearchParams = new URLSearchParams(searchParams?.toString());
          newSearchParams.set("isPaid", value);
          newSearchParams.delete("cPage");
          router.push(`?${newSearchParams.toString()}`);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All</SelectItem>
          <SelectItem value="0">Pending</SelectItem>
          <SelectItem value="1">Paid</SelectItem>
        </SelectContent>
      </Select>

      <DateRangePicker
        onUpdate={(values) => {
          if (!values.range.from || !values.range.to) return;

          const formatDate = (date: Date) => {
            // Format as YYYY-MM-DD to avoid timezone issues
            return date.toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD format
          };

          const newSearchParams = new URLSearchParams(searchParams?.toString());
          newSearchParams.set("fromDate", formatDate(values.range.from));
          newSearchParams.set("toDate", formatDate(values.range.to));
          newSearchParams.delete("cPage");
          router.push(`?${newSearchParams.toString()}`);
        }}
        initialDateFrom={
          fromDate
            ? new Date(fromDate)
            : new Date(new Date().setDate(new Date().getDate() - 30))
        }
        initialDateTo={toDate ? new Date(toDate) : new Date()}
        align="start"
        locale="en-GB"
        showCompare={false}
      />
    </div>
  );
};

export default CustomFilters;
