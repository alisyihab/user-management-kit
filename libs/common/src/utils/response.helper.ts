import { GlobalResponse } from "../dto/src/response/global-response.dto";

export function successResponse<T>(
  data?: T,
  message = "Success",
  meta?: any,
  status?: number,
): GlobalResponse<T> {
  const response: Record<string, any> = {
    statusCode: status || 200,
    message,
  };

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  if (meta !== undefined && meta !== null) {
    response.meta = meta;
  }

  return new GlobalResponse<T>(response);
}
