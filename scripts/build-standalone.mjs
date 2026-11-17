import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distAssetsDir = path.join(rootDir, 'dist', 'assets');

if (!fs.existsSync(distAssetsDir)) {
  throw new Error('dist/assets not found. Run npm run build first.');
}

const cssFile = fs.readdirSync(distAssetsDir).find((f) => f.endsWith('.css'));
if (!cssFile) {
  throw new Error('Compiled CSS file not found in dist/assets.');
}

const compiledCss = fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf8');

const inlineCssPlugin = {
  name: 'inline-compiled-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({
      contents: `
        if (typeof document !== 'undefined' && !document.getElementById('almoazin-standalone-css')) {
          var s = document.createElement('style');
          s.id = 'almoazin-standalone-css';
          s.textContent = ${JSON.stringify(compiledCss)};
          document.head.appendChild(s);
        }
      `,
      loader: 'js',
    }));
  },
};

await esbuild.build({
  entryPoints: [path.join(rootDir, 'src', 'main.tsx')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020', 'chrome90', 'safari14'],
  minify: true,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [inlineCssPlugin],
  outfile: path.join(rootDir, 'public', 'almoazin-standalone.js'),
});

console.log('Built public/almoazin-standalone.js successfully.');
