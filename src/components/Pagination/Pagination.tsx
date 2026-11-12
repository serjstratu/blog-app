
import './pagination.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    disabled?: boolean;
    onPageChange: (page: number) => void;
}

const Pagination = ({currentPage, totalPages, hasNextPage, hasPreviousPage, disabled = false, onPageChange,}: PaginationProps) => (
    <nav
        className="pagination"
        aria-label="Posts pagination"
        data-testid="pagination"
    >
        <button
            type="button"
            data-testid="pagination-previous"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage || disabled}
        >
            Previous
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
                type="button"
                key={pageNumber}
                data-testid={`pagination-page-${pageNumber}`}
                className={pageNumber === currentPage ? 'is-active' : ''}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(pageNumber)}
                disabled={disabled}
            >
                {pageNumber}
            </button>
        ))}

        <button
            type="button"
            data-testid="pagination-next"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || disabled}
        >
            Next
        </button>
    </nav>
);

export default Pagination;
