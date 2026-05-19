export interface ApiErrorBody {
  message: string
  code?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: ApiErrorBody,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
