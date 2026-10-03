import { Injectable } from '@angular/core';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
@Injectable({ providedIn: 'root' })
export class ApiService {
  async request<T = { ok: boolean }>(path: string, body?: unknown, timeoutMs = 12000): Promise<T> {
    const response = await fetch('/api' + path, {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(timeoutMs),
      ...(body === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        typeof result.detail === 'string'
          ? result.detail
          : (result.detail?.message ?? 'Revisa los datos del formulario.'),
      );
    }
    return response.json();
  }
}
