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
    <div className="flex items-center justify-between mt-12 mb-8">
      <div className="text-sm text-gray-600 font-medium">
        Mostrando <span className="font-semibold text-gray-900">{startItem}-{endItem}</span> de <span className="font-semibold text-gray-900">{total}</span> proyectos
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          icon={<ChevronLeftIcon size={16} />}
          onClick={() => onChange(current - 1)}
          disabled={current === 1 || loading}
          type="text"
          size="middle"
          className="!text-gray-600 !border-gray-300 hover:!text-gray-900 hover:!border-gray-400 hover:!bg-gray-50 disabled:!text-gray-300 disabled:!border-gray-200 transition-all duration-200"
        >
          Anterior
        </Button>
        
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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

            const isActive = current === pageNum;

            return (
              <Button
                key={pageNum}
                onClick={() => onChange(pageNum)}
                disabled={loading}
                type="text"
                size="small"
                className={`!min-w-[36px] !h-8 !font-medium transition-all duration-200 ${
                  isActive 
                    ? '!bg-white !text-gray-900 !shadow-sm !border-gray-200' 
                    : '!text-gray-600 !border-transparent hover:!text-gray-900 hover:!bg-gray-50'
                }`}
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
          size="middle"
          className="!text-gray-600 !border-gray-300 hover:!text-gray-900 hover:!border-gray-400 hover:!bg-gray-50 disabled:!text-gray-300 disabled:!border-gray-200 transition-all duration-200"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
