"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
}: DataTablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", safeTotalPages);
      } else if (currentPage >= safeTotalPages - 2) {
        pages.push(
          1,
          "...",
          safeTotalPages - 3,
          safeTotalPages - 2,
          safeTotalPages - 1,
          safeTotalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          safeTotalPages,
        );
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#e3e8ee] bg-[#f6f9fc]/40 text-xs text-[#64748d] ${className}`}
    >
      {/* Left: Item Counter & Page Size Selector */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
        <div>
          <span>
            แสดง{" "}
            <strong className="text-[#0d253d] font-mono">
              {startItem}-{endItem}
            </strong>{" "}
            จากทั้งหมด{" "}
            <strong className="text-[#0d253d] font-mono">{totalItems}</strong>{" "}
            รายการ
          </span>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-[#64748d] hidden md:inline">
              แถวต่อหน้า:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-7 rounded-lg border border-[#e3e8ee] bg-white px-2 text-xs text-[#0d253d] focus:outline-none focus:ring-1 focus:ring-[#533afd]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation */}
      <div className="flex items-center space-x-1 self-center sm:self-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="h-7 w-7 rounded-lg p-0 border-[#e3e8ee] text-[#64748d] hover:text-[#0d253d] disabled:opacity-40"
          title="หน้าแรก"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-7 w-7 rounded-lg p-0 border-[#e3e8ee] text-[#64748d] hover:text-[#0d253d] disabled:opacity-40"
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-center space-x-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-[#64748d] text-xs font-mono"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isCurrent = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                className={`h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-[#533afd] text-white shadow-xs"
                    : "text-[#273951] hover:bg-[#e3e8ee]/80 border border-transparent"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          className="h-7 w-7 rounded-lg p-0 border-[#e3e8ee] text-[#64748d] hover:text-[#0d253d] disabled:opacity-40"
          title="หน้าถัดไป"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage >= safeTotalPages}
          className="h-7 w-7 rounded-lg p-0 border-[#e3e8ee] text-[#64748d] hover:text-[#0d253d] disabled:opacity-40"
          title="หน้าสุดท้าย"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
