import { defineConfig } from 'tsup';

// Mirrors @oftomorrow/effective's tsup shape, adapted for a browser-targeted
// React component library:
//   - `platform: 'browser'` (not node) so external module resolution doesn't
//     try to bundle node built-ins for things like fs/path.
//   - `target: 'es2020'` so the emitted JS works in current evergreen browsers
//     and Node 20+ without transpilation.
//   - React, react-dom, react/jsx-runtime, zod, react-hook-form, the Radix
//     packages, lucide-react, clsx, tailwind-merge, CVA, and firebase are
//     declared external — they come from peer/regular dependencies in the
//     consumer's bundle, not ours.
//
// Two entries:
//   `.`         — storage-free renderer + primitives
//   `./firebase` — opt-in Firestore + Storage adapter
//
// CSS (dist/styles.css) is built separately by the `build:css` script in
// package.json (postcss + tailwind), not by tsup — tsup intentionally doesn't
// own CSS pipelines.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'firebase/index': 'src/firebase/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2020',
  platform: 'browser',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'zod',
    'react-hook-form',
    '@hookform/resolvers',
    '@hookform/resolvers/zod',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    'lucide-react',
    /^@radix-ui\//,
    /^firebase($|\/)/,
  ],
});
