// Byte ranges for the videos under /assets/video/ (wrangler.jsonc routes that path to the worker first).
// Workers Static Assets answers a Range request with `200 OK` and the whole file. Safari does not play a video without
// `206 Partial Content`, and no browser can seek in a file it has not finished loading. This module fetches the file from the
// asset binding and returns the requested bytes.

import type { Env } from './env';

// Workers runtime global (the repo has no @cloudflare/workers-types): a stream that sends a fixed Content-Length.
declare const FixedLengthStream: new (length: number) => { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> };

interface ByteRange {
  start: number;
  end: number;
}

/** Parses a single `bytes=` range against the file size. `null`: no usable range (serve the full file). `false`: not satisfiable. */
function parseRange(header: string | null, size: number): ByteRange | null | false {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === '' && match[2] === '')) return null;
  if (match[1] === '') {
    const suffix = Number(match[2]);
    if (suffix === 0) return false;
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  if (start >= size || start > end) return false;
  return { start, end };
}

/** Passes on the bytes `start..end` (inclusive) of `body` and stops reading the source after the last one. */
function slice(body: ReadableStream<Uint8Array>, start: number, end: number): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const chunkStart = offset;
        offset += value.byteLength;
        if (offset <= start) continue;
        controller.enqueue(value.subarray(Math.max(0, start - chunkStart), Math.min(value.byteLength, end + 1 - chunkStart)));
        if (offset > end) {
          controller.close();
          await reader.cancel();
        }
        return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

export async function handleVideo(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return env.ASSETS.fetch(request);

  // The asset binding gets the request without the range headers; conditional headers (If-None-Match) stay.
  const headers = new Headers(request.headers);
  headers.delete('range');
  headers.delete('if-range');
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: request.method, headers }));

  // Anything that is not a video file (304, or the single-page fallback for an unknown name) goes out unchanged.
  const size = Number(asset.headers.get('content-length') ?? NaN);
  const isVideo = (asset.headers.get('content-type') ?? '').startsWith('video/');
  if (asset.status !== 200 || !isVideo || !Number.isFinite(size) || size <= 0) return asset;

  const out = new Headers(asset.headers);
  out.set('accept-ranges', 'bytes');

  // If-Range with a validator that no longer matches means: send the full, current file.
  const ifRange = request.headers.get('if-range');
  const rangeHeader = ifRange && ifRange !== asset.headers.get('etag') ? null : request.headers.get('range');
  const range = parseRange(rangeHeader, size);

  if (range === false) {
    await asset.body?.cancel();
    out.set('content-range', `bytes */${size}`);
    out.delete('content-length');
    return new Response(null, { status: 416, headers: out });
  }
  if (range === null || request.method === 'HEAD' || !asset.body) {
    return new Response(asset.body, { status: 200, headers: out });
  }

  const length = range.end - range.start + 1;
  out.set('content-range', `bytes ${range.start}-${range.end}/${size}`);
  out.set('content-length', String(length));
  const fixed = new FixedLengthStream(length);
  // A viewer who seeks or leaves aborts the response; that is not an error worth reporting.
  slice(asset.body, range.start, range.end).pipeTo(fixed.writable).catch(() => {});
  return new Response(fixed.readable, { status: 206, headers: out });
}
