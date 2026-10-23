import { HttpError } from "./http";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function readPagination(params: URLSearchParams, defaultLimit = 25) {
  const page = Number(params.get("page") || "1");
  const limit = Number(params.get("limit") || String(defaultLimit));
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw new HttpError(
      400,
      "Invalid pagination. Use a positive page and a limit between 1 and 100.",
    );
  return { page, limit, skip: (page - 1) * limit };
}
