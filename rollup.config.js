import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

// Externals: everything the consumer (or peer) supplies. Firebase is path-matched
// so both `firebase` and `firebase/firestore` etc. are externalized for the
// firebase entry.
const external = [
  'react',
  'react/jsx-runtime',
  'react-dom',
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
];

// JS-only TypeScript plugin. Declarations are emitted once for the whole src
// tree by the `build:types` script (tsc against tsconfig.build.json) so we
// don't duplicate d.ts files between the core and firebase entries.
const tsPlugin = () =>
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    noEmitOnError: false,
    sourceMap: true,
    rootDir: 'src',
    exclude: ['**/*.test.*', '**/*.spec.*', 'tests/**', 'examples/**'],
  });

export default [
  // CSS-only build: pipes globals.css through PostCSS (Tailwind preflight +
  // tokens) and extracts it to dist/styles.css. The JS chunk is a noop and
  // gets removed in the build script's tail.
  {
    input: 'src/styles/globals.css',
    output: {
      file: 'dist/__styles-noop.js',
      format: 'esm',
    },
    plugins: [
      postcss({
        config: { path: './postcss.config.js' },
        extensions: ['.css'],
        extract: 'styles.css',
        minimize: true,
      }),
    ],
  },
  // Core entry: storage-free renderer + primitives. No firebase imports.
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [resolve({ browser: true }), commonjs(), tsPlugin()],
  },
  // Firebase entry: opt-in adapter for Firestore/Storage/Auth.
  {
    input: 'src/firebase/index.ts',
    output: {
      file: 'dist/firebase/index.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [resolve({ browser: true }), commonjs(), tsPlugin()],
  },
];
