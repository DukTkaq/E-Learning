export const clampPage = (page, totalPages) => {
  const total = Math.max(0, Number(totalPages) || 0);
  if (!total) return 1;
  const current = Number.isSafeInteger(Number(page)) ? Number(page) : 1;
  return Math.min(total, Math.max(1, current));
};

export const getPaginationItems = (currentPage, totalPages) => {
  const total = Math.max(0, Number(totalPages) || 0);
  if (!total) return [];

  const current = clampPage(currentPage, total);
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 'ellipsis-right', total];
  if (current >= total - 2) return [1, 'ellipsis-left', total - 2, total - 1, total];
  return [1, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total];
};
