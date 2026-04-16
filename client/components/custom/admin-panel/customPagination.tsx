"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";

const CustomPagination = ({
  totalLength,
  currentPage,
  itemsPerPage = 50,
  resetOtherFields = true,
}: {
  totalLength: number | undefined;
  currentPage: number;
  itemsPerPage: number;
  resetOtherFields?: boolean;
}) => {
  const searchParams = useSearchParams();
  console.log("🚀 ~ file: customPagination.tsx:17 ~ CustomPagination ~ searchParams:", searchParams?.toString(), totalLength, currentPage);

  if (totalLength === undefined || totalLength <= 0) {
    return null;
  }

  
  const totalPages = Math.ceil(totalLength / itemsPerPage);

  const generatePageNumbers = () => {
    const pagesToShow = 5;
    const pageNumbers: number[] = [];

    for (
      let i = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
      i <= Math.min(totalPages, currentPage + Math.floor(pagesToShow / 2));
      i++
    ) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const generateQuery = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString());
    newSearchParams.set("cPage", page.toString());
    return newSearchParams.toString();
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="w-full overflow-x-auto rounded-md border p-2">
      <Pagination className="justify-start sm:justify-center">
        <PaginationContent className="w-max flex-nowrap">
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            href={`?${generateQuery(currentPage - 1)}`}
            disabled={currentPage === 1}
          />
        </PaginationItem>

        {!pageNumbers.includes(1) && (
          <>
            <PaginationItem>
              <PaginationLink href={`?${generateQuery(1)}`}>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </>
        )}

        {/* Page number window */}
        {pageNumbers.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href={`?${generateQuery(pageNumber)}`}
              isActive={pageNumber === currentPage}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Last page — only show if not already in the generated range */}
        {!pageNumbers.includes(totalPages) && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href={`?${generateQuery(totalPages)}`}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            href={`?${generateQuery(currentPage + 1)}`}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default CustomPagination;
