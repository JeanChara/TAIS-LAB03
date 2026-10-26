/**
 * Utilidades compartidas por las pruebas.
 * Pruebas generadas con un segundo asistente de IA (Claude) para completar
 * las tareas opcionales (*) de tasks.md que Kiro no ejecutó.
 */
import { vi } from 'vitest';

/** Crea una respuesta HTTP con cuerpo JSON. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Crea una respuesta HTTP sin cuerpo (para códigos de error). */
export function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

/** Reemplaza fetch global por un mock que devuelve la respuesta indicada. */
export function mockFetch(factory: () => Response | Promise<Response>) {
  const fn = vi.fn(async (_url: string, _init?: RequestInit) => factory());
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Reemplaza fetch global por un mock que falla con el error indicado. */
export function mockFetchError(error: unknown) {
  const fn = vi.fn(async (_url: string, _init?: RequestInit): Promise<Response> => {
    throw error;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** fetch que nunca responde y se rechaza con AbortError cuando se aborta la señal. */
export function mockHangingFetch() {
  const state: { signal?: AbortSignal } = {};
  const fn = vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        state.signal = init?.signal ?? undefined;
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }),
  );
  vi.stubGlobal('fetch', fn);
  return { fn, state };
}

/** Espera a que terminen las operaciones asíncronas pendientes (lectura del cuerpo, etc.). */
export async function flush(): Promise<void> {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
}
