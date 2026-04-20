export type ApiResponse<TData> = {
  data: TData;
  settings: {
    status: number;
    message: string;
  };
};

export function ok<TData>(data: TData, message = 'Success'): ApiResponse<TData> {
  return {
    data,
    settings: {
      status: 200,
      message
    }
  };
}

export function created<TData>(data: TData, message = 'Created'): ApiResponse<TData> {
  return {
    data,
    settings: {
      status: 201,
      message
    }
  };
}
