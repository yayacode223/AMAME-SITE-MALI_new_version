import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  /** Total nombre de pages (du backend). */
  totalPages: number;
  /** Page courante 0-indexée (telle que retournée par le backend). */
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  /** Callback avec la nouvelle page 0-indexée. */
  onPageChange: (page: number) => void;
}

const getPageNumbers = (totalPages: number, currentPage: number): (number | string)[] => {
  const current = currentPage + 1;
  const delta = 2;
  const range: (number | string)[] = [];
  let prev = 0;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
      if (i - prev > 1) range.push("...");
      range.push(i);
      prev = i;
    }
  }
  return range;
};

const Pagination = ({
  totalPages,
  currentPage,
  hasNext,
  hasPrevious,
  onPageChange,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(totalPages, currentPage);

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrevious}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg border-amame-border gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Précédent</span>
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, i) =>
          page === "..." ? (
            <span key={`d-${i}`} className="px-2 text-amame-muted text-sm">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage + 1 === page ? "default" : "outline"}
              size="sm"
              className={`w-9 h-9 p-0 rounded-lg text-sm ${
                currentPage + 1 === page
                  ? "bg-amame-green hover:bg-amame-green-dark text-white"
                  : "border-amame-border hover:bg-gray-50"
              }`}
              onClick={() => onPageChange(Number(page) - 1)}
            >
              {page}
            </Button>
          ),
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg border-amame-border gap-1"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
