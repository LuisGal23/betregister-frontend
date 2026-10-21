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
      let msg = 'Revisa los datos del formulario.';
      if (typeof result.detail === 'string') {
        msg = result.detail;
      } else if (Array.isArray(result.detail) && result.detail.length > 0) {
        msg = result.detail
          .map((e: any) => e.msg || e.message || (typeof e === 'string' ? e : JSON.stringify(e)))
          .join(' · ');
      } else if (result.detail?.message) {
        msg = result.detail.message;
      } else if (typeof result.message === 'string') {
        msg = result.message;
      } else if (typeof result.error === 'string') {
        msg = result.error;
      }
      throw new ApiError(response.status, msg);
    }
    return response.json();
  }
}
