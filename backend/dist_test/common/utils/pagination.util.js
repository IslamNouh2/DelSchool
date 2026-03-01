"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
async function paginate(model, queryArgs = {}, params = {}) {
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
