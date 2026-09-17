import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { EmptyState } from "@/src/components/feedback/EmptyState";
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchAccessor?: (item: T) => string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = "Filter records...",
  searchAccessor,
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) => {
      if (searchAccessor) {
        return searchAccessor(item).toLowerCase().includes(q);
      }
      return Object.values(item).some(
        (val) => val && String(val).toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, searchAccessor]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const result = aVal > bVal ? 1 : -1;
      return sortAsc ? result : -result;
    });
  }, [filteredData, sortKey, sortAsc]);

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Table toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="pl-8 text-xs h-8 bg-slate-900/60 border-slate-800"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="font-mono text-slate-200">{sortedData.length}</span> records
        </div>
      </div>

      {/* Table container */}
      <div className="rounded-md border border-slate-800 bg-slate-900/40 overflow-hidden">
        {pagedData.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} className="border-0 rounded-none bg-transparent" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableHead key={idx} className={col.className}>
                    {col.sortable && col.accessorKey ? (
                      <button
                        onClick={() => handleSort(col.accessorKey!)}
                        className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>{col.header}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.map((item, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className={col.className}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? "")
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Table pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            Page <span className="font-mono text-slate-200">{currentPage}</span> of{" "}
            <span className="font-mono text-slate-200">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
