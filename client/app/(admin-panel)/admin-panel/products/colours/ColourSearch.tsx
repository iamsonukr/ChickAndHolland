"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input"; // adjust to your input component

export default function ColourSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      const value = e.target.value;

      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      // Reset to first page on new search
      params.delete("cPage");

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <Input
      type="text"
      placeholder="Filter colours… "
      defaultValue={defaultValue}
      onChange={handleChange}
      className="max-w-sm"
    />
  );
}