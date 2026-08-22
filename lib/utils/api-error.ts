import axios from 'axios';

export function formatApiError(error: unknown): { message: string; status?: number } {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      error.message ||
      'An unexpected error occurred';
    return { message: String(message), status };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: String(error) };
}

export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}
