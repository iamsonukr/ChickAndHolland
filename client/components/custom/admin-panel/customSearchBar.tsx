"use client";

import { useState } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const CustomSearchBar = ({
  query,
  placeholder,
}: {
  query: string;
  placeholder?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState(query);
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <form
      className="flex flex-1 flex-row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const newParams = new URLSearchParams(searchParams);
        newParams.set("q", encodeURIComponent(searchQuery));
        newParams.delete("cPage");
        router.push(`?${newParams.toString()}`, { scroll: false });
      }}
    >
      <Input
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
        }}
        placeholder={placeholder ?? "Search"}
      />
      <Button size={"icon"} type="submit">
        <Search />
      </Button>
    </form>
  );
};

export default CustomSearchBar;
