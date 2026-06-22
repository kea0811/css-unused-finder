import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    bundle: true,
    splitting: false,
    sourcemap: false,
    target: 'node18',
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
  },
  {
    entry: { bin: 'src/bin.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    bundle: true,
    splitting: false,
    sourcemap: false,
    target: 'node18',
    banner: { js: '#!/usr/bin/env node' },
  },
]);
