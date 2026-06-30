"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_BEADERS = "__all__";

const buildSearch = ({
  query,
  orderType,
  due,
  stage,
  beader,
}: {
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
}) => {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (orderType) params.set("orderType", orderType);
  if (due) params.set("due", due);
  if (stage) params.set("stage", stage);
  if (beader) params.set("beader", beader);

  params.delete("cPage");
  return params.toString();
};

export default function BeaderFilter({
  beaders,
  query,
  orderType,
  due,
  stage,
  beader,
}: {
  beaders: string[];
  query?: string;
  orderType?: string;
  due?: string;
  stage?: string;
  beader?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (value: string) => {
    const nextBeader = value === ALL_BEADERS ? "" : value;
    const search = buildSearch({
      query,
      orderType,
      due,
      stage,
      beader: nextBeader,
    });
    const nextPath = pathname ?? "/admin-panel/orders";

    router.push(search ? `${nextPath}?${search}` : nextPath);
  };

  return (
    <Select value={beader || ALL_BEADERS} onValueChange={handleChange}>
      <SelectTrigger className="w-[170px]">
        <SelectValue placeholder="Beader" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_BEADERS}>All Beaders</SelectItem>
        {beaders.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
