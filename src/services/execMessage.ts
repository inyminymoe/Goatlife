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
    console.log('[fetchExecMessage] Calling getCurrentExecMessage...');
    const result = await withTimeout(getCurrentExecMessage());
    console.log('[fetchExecMessage] Result:', result);

    if (!result) {
      console.error('[fetchExecMessage] Result is undefined or null');
      return { ok: false as const, error: 'UNKNOWN' };
    }

    return result;
  } catch (error) {
    console.error('[services/execMessage] fetchExecMessage failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}
