import type { NextRequest } from 'next/server';
import { store } from '@/server/store';
import type { FeedEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events stream of the activity feed.
 * Replays the buffered feed, then pushes new events as they happen.
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: FeedEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      for (const event of store.events) {
        send(event);
      }
      const listener = (event: FeedEvent) => send(event);
      store.emitter.on('event', listener);

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 25000);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        store.emitter.off('event', listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
