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
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        apply(from, to);
      }}
    >
      <span className="self-center text-sm font-medium">
        Order Received Date
      </span>
      <label className="space-y-1 text-sm" htmlFor="orders-date-from">
        <span>From</span>
        <Input
          id="orders-date-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => setFrom(event.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm" htmlFor="orders-date-to">
        <span>To</span>
        <Input
          id="orders-date-to"
          type="date"
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
