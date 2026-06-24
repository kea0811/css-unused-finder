import { NextResponse } from 'next/server';
import { analyze } from '@/src';

export const runtime = 'edge';

/**
 * Stateless analysis endpoint. POST `{ css, markup? }` and get the same report
 * the UI renders — handy for scripting or CI. Nothing is stored.
 *
 * ```bash
 * curl -X POST https://css-unused-finder-three.vercel.app/api/analyze \
 *   -H 'content-type: application/json' \
 *   -d '{"css":".a{color:red!important}"}'
 * ```
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { css, markup } = (body ?? {}) as { css?: unknown; markup?: unknown };

  if (typeof css !== 'string') {
    return NextResponse.json({ error: 'Field "css" is required and must be a string.' }, {
      status: 400,
    });
  }
  if (markup !== undefined && typeof markup !== 'string') {
    return NextResponse.json({ error: 'Field "markup" must be a string when provided.' }, {
      status: 400,
    });
  }

  return NextResponse.json(analyze({ css, markup }));
}
