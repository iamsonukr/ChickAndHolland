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
      className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        const newParams = new URLSearchParams(searchParams?.toString());
        const trimmedQuery = searchQuery.trim();

        if (trimmedQuery) {
          newParams.set("q", trimmedQuery);
        } else {
          newParams.delete("q");
        }

        newParams.delete("cPage");
        router.push(`?${newParams.toString()}`, { scroll: false });
      }}
    >
      <Input
        className="w-full"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
        }}
        placeholder={placeholder ?? "Search"}
      />
      <Button className="gap-2 sm:w-auto" type="submit">
        <Search className="h-4 w-4" />
        <span className="sm:hidden">Search</span>
      </Button>
    </form>
  );
};

export default CustomSearchBar;
