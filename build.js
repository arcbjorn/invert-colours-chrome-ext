const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  await esbuild.build({
    entryPoints: ['src/content.ts', 'src/popup.ts'],
    bundle: true,
    outdir: 'dist',
    platform: 'browser',
    target: 'chrome90',
    format: 'iife',
    minify: true,
    sourcemap: false,
  });

  fs.copyFileSync('src/popup.html', 'dist/popup.html');
  fs.copyFileSync('manifest.json', 'dist/manifest.json');

  const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf8'));
  manifest.action.default_popup = 'popup.html';
  manifest.content_scripts[0].js = ['content.js'];

  delete manifest.action.default_icon;
  delete manifest.icons;

  fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

  console.log('✨ Build complete! Extension ready in dist/ folder');
}

build().catch(console.error);