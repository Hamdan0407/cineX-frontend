import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalElements === 0) return null;

  const startElem = currentPage * pageSize + 1;
  const endElem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 1.5rem",
      borderTop: "1px solid var(--border)",
      background: "rgba(255, 255, 255, 0.02)",
      color: "var(--text-secondary)",
      fontSize: "0.85rem",
      flexWrap: "wrap",
      gap: "1rem"
    }}>
      <div>
        Showing <strong style={{ color: "#fff" }}>{startElem}</strong> to{" "}
        <strong style={{ color: "#fff" }}>{endElem}</strong> of{" "}
        <strong style={{ color: "#fff" }}>{totalElements}</strong> entries
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              border: "1px solid var(--border)",
              color: "#fff",
              padding: "0.35rem 0.65rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: currentPage === 0 ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.08)",
              color: currentPage === 0 ? "var(--text-muted)" : "#fff",
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => {
            // Show first, last, current, and adjacent pages
            if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
              return (
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: currentPage === i ? "var(--primary)" : "var(--border)",
                    background: currentPage === i ? "var(--primary)" : "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    fontWeight: currentPage === i ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {i + 1}
                </button>
              );
            } else if (i === 1 && currentPage > 2 || i === totalPages - 2 && currentPage < totalPages - 3) {
              return <span key={i} style={{ padding: "0.35rem 0.25rem", color: "var(--text-muted)" }}>...</span>;
            }
            return null;
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || totalPages === 0}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: currentPage >= totalPages - 1 || totalPages === 0 ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.08)",
              color: currentPage >= totalPages - 1 || totalPages === 0 ? "var(--text-muted)" : "#fff",
              cursor: currentPage >= totalPages - 1 || totalPages === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
