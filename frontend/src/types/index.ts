export type ApiResponse<T> = {
  data: T;
  settings: {
    status: number;
    message: string;
  };
};

export type Paginated<TRecord> = {
  records: TRecord[];
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
};
