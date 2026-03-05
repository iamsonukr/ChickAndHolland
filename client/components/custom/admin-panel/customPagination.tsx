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
import { useRouter } from "next/navigation";

const CustomPagination = ({
  totalLength,
  currentPage,
  resetOtherFields = true,
}: {
  totalLength: number | undefined;
  currentPage: number;
  resetOtherFields?: boolean;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  if (totalLength === undefined || totalLength <= 0) {
    return null;
  }

  const itemsPerPage = 100;
  const totalPages = Math.ceil(totalLength / itemsPerPage);

  const generatePageNumbers = () => {
    const pagesToShow = 5; // Number of page links to show (excluding ellipsis).
    const pageNumbers = [];

    for (
      let i = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
      i <= Math.min(totalPages, currentPage + Math.floor(pagesToShow / 2));
      i++
    ) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  // Function to generate the new query string based on the current state
  const generateQuery = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString());

    // if (resetOtherFields) {
    //   newSearchParams.forEach((value, key) => {
    //     if (key !== "cPage") {
    //       newSearchParams.delete(key); // Remove all other params except `cPage`
    //     }
    //   });
    // }

    newSearchParams.set("cPage", page.toString());
    return newSearchParams.toString();
  };

  return (
    <Pagination className="border p-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={`?${generateQuery(currentPage - 1)}`}
            disabled={currentPage === 1}
          />
        </PaginationItem>

        {currentPage > 1 && (
          <PaginationItem>
            <PaginationLink href={`?${generateQuery(1)}`}>1</PaginationLink>
          </PaginationItem>
        )}

        {currentPage > 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {generatePageNumbers().map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href={`?${generateQuery(pageNumber)}`}
              isActive={pageNumber === currentPage}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}

        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink href={`?${generateQuery(totalPages)}`}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            href={`?${generateQuery(currentPage + 1)}`}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default CustomPagination;
