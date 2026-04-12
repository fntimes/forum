const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// 1. Read all partials
const partialsDir = path.join(SRC, 'partials');
const partials = {};
fs.readdirSync(partialsDir).forEach(file => {
  const name = path.basename(file, '.html');
  partials[name] = fs.readFileSync(path.join(partialsDir, file), 'utf-8');
});

// 2. Parse front-matter from page files
function parsePage(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parts = raw.split('---');
  const meta = {};
  parts[1].trim().split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    meta[key] = val;
  });
  const body = parts.slice(2).join('---').trim();
  return { meta, body };
}

// 3. Inject GNB active states into header
function injectGnbActive(headerHtml, gnbActive, megaActiveHref) {
  if (gnbActive) {
    headerHtml = headerHtml.replace(
      `<a href="#">${gnbActive}</a>`,
      `<a href="#" class="gnb-active">${gnbActive}</a>`
    );
  }
  if (megaActiveHref) {
    headerHtml = headerHtml.replace(
      `<a href="${megaActiveHref}">`,
      `<a href="${megaActiveHref}" class="mega-active">`
    );
  }
  return headerHtml;
}

// 4. Assemble page
function buildPage(pagePath) {
  const { meta, body } = parsePage(pagePath);

  let header = injectGnbActive(partials['header'], meta.gnbActive, meta.megaActiveHref);

  let html = partials['head']
    + '\n' + header
    + '\n' + partials['mobile-nav']
    + (meta.noHero === 'true' ? '' : '\n' + partials['hero'])
    + '\n' + body
    + '\n' + partials['footer']
    + '\n' + partials['scripts'];

  // Replace all template variables
  html = html.replace(/\{\{title\}\}/g, meta.title || '');
  html = html.replace(/\{\{heroTitle\}\}/g, meta.heroTitle || '');
  html = html.replace(/\{\{extraScripts\}\}/g, meta.extraScripts || '');

  // Write output
  const outPath = path.join(DIST, meta.outputPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`Built: ${meta.outputPath}`);
}

// 5. Copy static assets
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  });
}

// Full build
function build() {
  // Re-read partials (may have changed)
  fs.readdirSync(partialsDir).forEach(file => {
    const name = path.basename(file, '.html');
    partials[name] = fs.readFileSync(path.join(partialsDir, file), 'utf-8');
  });

  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  const pagesDir = path.join(SRC, 'pages');
  fs.readdirSync(pagesDir).forEach(file => {
    if (file.endsWith('.html')) {
      buildPage(path.join(pagesDir, file));
    }
  });

  ['css', 'js', 'images'].forEach(dir => {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) {
      copyDir(src, path.join(DIST, dir));
    }
  });

  ['favicon.ico', 'CNAME', 'robots.txt'].forEach(file => {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST, file));
    }
  });

  console.log('Build complete.');
}

// Initial build
build();

// Watch mode
if (process.argv.includes('--watch')) {
  let timer = null;

  function rebuild() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('\nFile changed, rebuilding...');
      try { build(); } catch (e) { console.error('Build error:', e.message); }
    }, 200);
  }

  function watchDirRecursive(dir) {
    fs.watch(dir, (event, filename) => {
      if (filename && (filename.endsWith('.swp') || filename.startsWith('.'))) return;
      rebuild();
    });
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      if (entry.isDirectory()) {
        watchDirRecursive(path.join(dir, entry.name));
      }
    });
  }

  [SRC, path.join(ROOT, 'css'), path.join(ROOT, 'js')].forEach(watchDirRecursive);

  console.log('Watching for changes... (Ctrl+C to stop)');
}
