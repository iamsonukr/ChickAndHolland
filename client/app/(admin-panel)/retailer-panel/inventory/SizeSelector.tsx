"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sizeChart = [
  { EU: 32, IT: 36, US: 0,  UK: 4  },
  { EU: 34, IT: 38, US: 2,  UK: 6  },
  { EU: 36, IT: 40, US: 4,  UK: 8  },
  { EU: 38, IT: 42, US: 6,  UK: 10 },
  { EU: 40, IT: 44, US: 8,  UK: 12 },
  { EU: 42, IT: 46, US: 10, UK: 14 },
  { EU: 44, IT: 48, US: 12, UK: 16 },
  { EU: 46, IT: 50, US: 14, UK: 18 },
  { EU: 48, IT: 52, US: 16, UK: 20 },
  { EU: 50, IT: 54, US: 18, UK: 22 },
  { EU: 52, IT: 56, US: 20, UK: 24 },
  { EU: 54, IT: 58, US: 22, UK: 26 },
  { EU: 56, IT: 60, US: 24, UK: 28 },
  { EU: 58, IT: 62, US: 26, UK: 30 },
  { EU: 60, IT: 64, US: 28, UK: 32 },
];

const convert = (euSize, from, to) => {
  const row = sizeChart.find((r) => r[from] === euSize || r.EU === euSize);
  if (!row) return euSize;
  return row[to];
};

export default function SizeSelector() {
  const [type, setType] = useState("EU");

  useEffect(() => {
    const all = document.querySelectorAll(".size-convert");

    all.forEach((td) => {
      const eu = Number(td.getAttribute("data-eu"));
      const from = td.getAttribute("data-from");

      const newSize = convert(eu, from, type);
      td.innerHTML = `${newSize} (${type})`;
    });
  }, [type]);

  return (
    <div className="flex justify-end items-center gap-3">

      <p
        className="
          text-md font-semibold
          text-neutral-900 dark:text-neutral-100
          bg-neutral-100 dark:bg-neutral-800
          px-3 py-1.5 rounded-md
          border border-neutral-300 dark:border-neutral-700
          shadow-sm whitespace-nowrap
        "
      >
        🌍 Please select the country based on your size
      </p>

      <Select value={type} onValueChange={(v) => setType(v)}>
        <SelectTrigger className="w-[220px] bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100">
          <SelectValue placeholder="Select size system" />
        </SelectTrigger>

        <SelectContent className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
          <SelectItem value="EU">🇪🇺 Europe</SelectItem>
          <SelectItem value="US">🇺🇸 United States</SelectItem>
          <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
          <SelectItem value="IT">🇮🇹 Italy</SelectItem>
        </SelectContent>
      </Select>

    </div>
  );
}
