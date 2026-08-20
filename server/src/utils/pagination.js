const positiveInteger = (value, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= maximum ? number : fallback;
};

const parsePagination = (query = {}, options = {}) => {
  const defaultLimit = positiveInteger(options.defaultLimit, 6);
  const maxLimit = positiveInteger(options.maxLimit, 50);
  const maxPage = positiveInteger(options.maxPage, 1_000_000);
  const page = positiveInteger(query.page, 1, maxPage);
  const requestedLimit = positiveInteger(query.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);

  return { page, limit, offset: (page - 1) * limit };
};

const buildPaginationMeta = ({ page, limit, totalItems }) => {
  const total = Math.max(0, Number(totalItems) || 0);
  const totalPages = total ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total_items: total,
    total_pages: totalPages,
    has_previous: page > 1 && totalPages > 0,
    has_next: page < totalPages,
  };
};

module.exports = { buildPaginationMeta, parsePagination };
