export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    details?: unknown,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code ?? defaultCodeFor(statusCode);
  }
}

const defaultCodeFor = (status: number): string => {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status >= 500) return "internal_error";
  return "error";
};
