import { z } from 'zod';

export const listingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(10),
  search: z.string().optional().or(z.literal('')),
  sortBy: z.string().optional().or(z.literal('')),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  filters: z.string().optional().or(z.literal(''))
});

export type ListingQuery = z.infer<typeof listingQuerySchema>;

export type Pagination = {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export function buildPagination(totalRecords: number, page: number, limit: number): Pagination {
  return {
    totalRecords,
    totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    currentPage: page,
    pageSize: limit
  };
}
