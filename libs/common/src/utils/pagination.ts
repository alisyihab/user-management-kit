export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  orderBy?: string;
  order?: "asc" | "desc";
}

export function getPaginationParams(options: PaginationOptions) {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildSearchFilter<T extends string>(
  search: string | undefined,
  searchFields: T[],
): Record<string, any> | undefined {
  if (!search || !searchFields.length) return undefined;

  const orConditions = searchFields.map((field) => ({
    [field]: { contains: search, mode: "insensitive" },
  }));

  return { OR: orConditions };
}

export function buildOrderBy<T extends string>(
  field?: T,
  direction: "asc" | "desc" = "desc",
): Record<string, any>[] {
  const orderField = field || "createdAt";
  return [{ [orderField]: direction }];
}

export function buildSelect<T extends string>(fields: T[]): Record<T, true> {
  return Object.fromEntries(fields.map((f) => [f, true])) as Record<T, true>;
}
