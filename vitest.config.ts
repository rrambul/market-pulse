import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => resolve(root, p);

export default defineConfig({
  plugins: [
    // The packages use NodeNext-style explicit `.js` specifiers in TS source.
    // When we alias the packages to their TS source (for source-mapped
    // coverage), rewrite those `./foo.js` imports to the real `./foo.ts`.
    {
      name: 'resolve-js-as-ts',
      enforce: 'pre',
      resolveId(source, importer) {
        if (importer && source[0] === '.' && source.endsWith('.js')) {
          const candidate = resolve(dirname(importer), `${source.slice(0, -3)}.ts`);
          if (existsSync(candidate)) return candidate;
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      '@market-pulse/contracts': src('packages/contracts/src/index.ts'),
      '@market-pulse/utils': src('packages/utils/src/index.ts'),
      '@market-pulse/state': src('packages/state/src/index.ts'),
      '@market-pulse/ui': src('packages/ui/src/index.ts'),
      '@market-pulse/market-client': src('packages/market-client/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.ts', 'server/*/src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        'apps/*/src/index.ts', // side-effect entry points (register the element)
        'server/*/src/index.ts', // http/ws bootstrap entry
      ],
      // perFile enforces "everything ≥ 80%" — every source file, not just the aggregate.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80, perFile: true },
      reporter: ['text-summary', 'text'],
    },
  },
});
