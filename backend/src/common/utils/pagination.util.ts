export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function paginate<T>(
  model: any,
  queryArgs: any = {},
  params: PaginationParams = {},
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 10)); // max 100 per page
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      ...queryArgs,
      skip,
      take: limit,
      orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder || 'asc' } : queryArgs.orderBy,
    }),
    model.count({ where: queryArgs.where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
