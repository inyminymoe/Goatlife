import { getCurrentExecMessage } from '@/app/_actions/execMessage';

const DEFAULT_TIMEOUT = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

export async function fetchExecMessage() {
  try {
    return await withTimeout(getCurrentExecMessage());
  } catch (error) {
    console.error('[services/execMessage] fetchExecMessage failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}
