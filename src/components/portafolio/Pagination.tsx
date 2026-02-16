"use client";
import { Button } from "antd";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  current,
  total,
  pageSize,
  onChange,
  loading = false,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  if (total <= pageSize) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-8">
      <div className="text-sm text-gray-600">
        Mostrando {startItem}-{endItem} de {total} proyectos
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          icon={<ChevronLeftIcon size={16} />}
          onClick={() => onChange(current - 1)}
          disabled={current === 1 || loading}
          type="text"
          size="small"
        >
          Anterior
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (current <= 3) {
              pageNum = i + 1;
            } else if (current >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = current - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                onClick={() => onChange(pageNum)}
                disabled={loading}
                type={current === pageNum ? "primary" : "text"}
                size="small"
                className="min-w-[32px]"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          icon={<ChevronRightIcon size={16} />}
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages || loading}
          type="text"
          size="small"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
