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

  if (totalLength === undefined || totalLength <= 0) {
    return null;
  }

  const safeItemsPerPage =
    Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 50;
  const normalizedCurrentPage = Number.isFinite(currentPage) ? currentPage : 1;
  const totalPages = Math.max(1, Math.ceil(totalLength / safeItemsPerPage));
  const safeCurrentPage = Math.min(
    Math.max(1, normalizedCurrentPage),
    totalPages,
  );

  const generatePageNumbers = () => {
    const pagesToShow = 5;
    const pageNumbers: number[] = [];

    for (
      let i = Math.max(1, safeCurrentPage - Math.floor(pagesToShow / 2));
      i <= Math.min(totalPages, safeCurrentPage + Math.floor(pagesToShow / 2));
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
          <PaginationItem>
            <PaginationPrevious
              href={`?${generateQuery(safeCurrentPage - 1)}`}
              disabled={safeCurrentPage === 1}
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

          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href={`?${generateQuery(pageNumber)}`}
                isActive={pageNumber === safeCurrentPage}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}

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

          <PaginationItem>
            <PaginationNext
              href={`?${generateQuery(safeCurrentPage + 1)}`}
              disabled={safeCurrentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default CustomPagination;
