export const DIRECTORY_CLASSIFICATIONS = [
  "MANUFACTURER",
  "TRADER",
  "CONTRACTOR",
  "PROFESSIONAL",
  "OTHER",
] as const;

export const DIRECTORY_DISTRICTS = [
  "रायगड",
  "ठाणे",
  "मुंबई",
  "मुंबई उपनगर",
  "पालघर",
  "पुणे",
  "नाशिक",
  "रत्नागिरी",
  "सिंधुदुर्ग",
] as const;

export interface DirectoryFilters {
  q: string;
  category: string;
  district: string;
  classification: string;
  sort: "recent" | "name" | "oldest";
  page: number;
}

export const emptyDirectoryFilters: DirectoryFilters = {
  q: "",
  category: "",
  district: "",
  classification: "",
  sort: "recent",
  page: 1,
};

export function parseDirectoryFilters(
  params: Pick<URLSearchParams, "get">,
): DirectoryFilters {
  const page = Number(params.get("page") || "1");
  const sort = params.get("sort");
  const classification = params.get("classification") || "";
  return {
    q: (params.get("q") || "").trim().slice(0, 200),
    category: (params.get("category") || "").slice(0, 100),
    district: (params.get("district") || "").slice(0, 100),
    classification: DIRECTORY_CLASSIFICATIONS.some(
      (item) => item === classification,
    )
      ? classification
      : "",
    sort: sort === "name" || sort === "oldest" ? sort : "recent",
    page: Number.isSafeInteger(page) && page >= 1 && page <= 100000 ? page : 1,
  };
}

export function directoryQuery(filters: DirectoryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.district) params.set("district", filters.district);
  if (filters.classification)
    params.set("classification", filters.classification);
  if (filters.sort !== "recent") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function directoryHref(filters: DirectoryFilters): string {
  const query = directoryQuery(filters).toString();
  return `/directory${query ? `?${query}` : ""}`;
}
