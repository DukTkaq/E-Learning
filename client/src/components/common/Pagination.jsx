import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPaginationItems } from '../../utils/pagination';

export default function Pagination({ page, totalPages, onPageChange, disabled = false, ariaLabel = 'Pagination' }) {
  if (totalPages <= 1) return null;

  const items = getPaginationItems(page, totalPages);
  const buttonClass = 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Previous page"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={`${buttonClass} border-primary/20 bg-white text-primary hover:bg-primary/5`}
      >
        <ChevronLeft size={18} />
        <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
      </button>

      {items.map((item) => typeof item === 'number' ? (
        <button
          key={item}
          type="button"
          aria-label={`Page ${item}`}
          aria-current={item === page ? 'page' : undefined}
          disabled={disabled}
          onClick={() => onPageChange(item)}
          className={`${buttonClass} ${item === page ? 'border-primary bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20' : 'border-primary/20 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'}`}
        >
          {item}
        </button>
      ) : (
        <span key={item} aria-hidden="true" className="px-1 font-bold text-slate-400">…</span>
      ))}

      <button
        type="button"
        aria-label="Next page"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`${buttonClass} border-primary/20 bg-white text-primary hover:bg-primary/5`}
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
