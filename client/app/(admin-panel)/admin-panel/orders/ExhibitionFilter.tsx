"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ExhibitionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams?.get("exhibitionLocation") || "";
  const [location, setLocation] = useState(active);

  useEffect(() => setLocation(active), [active]);

  const apply = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value.trim()) params.set("exhibitionLocation", value.trim());
    else params.delete("exhibitionLocation");
    params.delete("cPage");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
      event.preventDefault();
      apply(location);
    }}>
      <label className="flex flex-col gap-1 text-sm" htmlFor="exhibition-location-filter">
        <span>Exhibition Location</span>
        <Input
          id="exhibition-location-filter"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Search location"
        />
      </label>
      <Button type="submit">Filter</Button>
      <Button type="button" variant="outline" onClick={() => {
        setLocation("");
        apply("");
      }}>Clear</Button>
    </form>
  );
}
