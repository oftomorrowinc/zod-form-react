// Build dist/styles.css from src/styles/globals.css.
//
// tsup doesn't own CSS pipelines (intentionally), so the Tailwind preflight +
// shadcn token sheet ships through a tiny PostCSS invocation here. Output is
// a static .css file referenced by the package.json `./styles.css` export;
// consumers `import '@oftomorrow/zod-form/styles.css'` to apply it.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const input = 'src/styles/globals.css';
const output = 'dist/styles.css';

const css = readFileSync(input, 'utf8');
const result = await postcss([tailwindcss, autoprefixer]).process(css, {
  from: input,
  to: output,
});

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, result.css);

console.log(`built ${output} (${result.css.length} bytes)`);
