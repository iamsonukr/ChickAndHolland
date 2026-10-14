"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFrom = searchParams?.get("dateFrom") || "";
  const dateTo = searchParams?.get("dateTo") || "";
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  useEffect(() => {
    setFrom(dateFrom);
    setTo(dateTo);
  }, [dateFrom, dateTo]);

  const apply = (nextFrom: string, nextTo: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    for (const [key, value] of [
      ["dateFrom", nextFrom],
      ["dateTo", nextTo],
    ]) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("cPage");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <form
      className="grid w-full grid-cols-2 items-end gap-3 lg:w-fit lg:grid-cols-[auto_10rem_10rem_auto_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        apply(from, to);
      }}
    >
      <span className="col-span-2 text-sm font-medium lg:col-span-1 lg:self-center">
        Order Received Date
      </span>
      <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor="orders-date-from">
        <span>From</span>
        <Input
          id="orders-date-from"
          type="date"
          className="min-w-0 max-w-full"
          value={from}
          max={to || undefined}
          onChange={(event) => setFrom(event.target.value)}
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor="orders-date-to">
        <span>To</span>
        <Input
          id="orders-date-to"
          type="date"
          className="min-w-0 max-w-full"
          value={to}
          min={from || undefined}
          onChange={(event) => setTo(event.target.value)}
        />
      </label>
      <Button type="submit">Apply Dates</Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setFrom("");
          setTo("");
          apply("", "");
        }}
      >
        Clear Dates
      </Button>
    </form>
  );
}
