import { useState, useCallback, useEffect } from "react";

export function usePagination(totalItems: number, itemsPerPage: number = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (pageNum: number) => {
      setPage(Math.max(1, Math.min(pageNum, totalPages)));
    },
    [totalPages],
  );

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    totalPages,
    itemsPerPage,
    goToNextPage,
    goToPrevPage,
    goToPage,
    resetPage,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
  };
}
