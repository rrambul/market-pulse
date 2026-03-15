export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let lastCall = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

/**
 * Creates a RAF-based batcher for coalescing high-frequency updates.
 * Collects items and flushes them once per animation frame.
 * This is the key pattern for handling thousands of WebSocket messages
 * without causing layout thrashing.
 */
export function createRAFBatcher<T>(onFlush: (items: T[]) => void): {
  add: (item: T) => void;
  destroy: () => void;
} {
  let buffer: T[] = [];
  let rafId: number | null = null;

  function flush() {
    if (buffer.length > 0) {
      const batch = buffer;
      buffer = [];
      onFlush(batch);
    }
    rafId = requestAnimationFrame(flush);
  }

  rafId = requestAnimationFrame(flush);

  return {
    add(item: T) {
      buffer.push(item);
    },
    destroy() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      buffer = [];
    },
  };
}
