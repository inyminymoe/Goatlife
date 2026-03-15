import { NextResponse } from 'next/server';

export async function parseJsonBody<T = unknown>(
  req: Request
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const data = await req.json();
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }),
    };
  }
}
