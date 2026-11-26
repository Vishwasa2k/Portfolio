// Resize photos for the web and add them to src/data/photos.json automatically.
//
// Folder layout (album = a slug from src/data/albums.json):
//   incoming/<album>/digital/photo.jpg
//   incoming/<album>/film/photo.jpg
//   incoming/<album>/film/<film-stock>/photo.jpg     e.g. film/cinestill-800t/  -> stock "Cinestill 800T"
//
// Run:  npm run photos
// Then: npm run upload   (sends the resized files in out/ to your R2 bucket)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IN = 'incoming';
const OUT = 'out';
const MANIFEST = 'src/data/photos.json';
const ALBUMS = 'src/data/albums.json';
const MAX_EDGE = 2400;
const QUALITY = 82;
const EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);
const FILM_CAMERA = 'Nikon F3 + 50mm f/1.8'; // default camera for 35mm film; edit afterwards if different

if (!fs.existsSync(IN)) {
  console.error(`No "${IN}" folder. Create ${IN}/<album>/<digital|film>/ and add photos.`);
  process.exit(1);
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleCase = (s) =>
  s.split(/[-_ ]+/).map((w) => (/\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const albumSlugs = new Set(JSON.parse(fs.readFileSync(ALBUMS, 'utf8')).map((a) => a.slug));
const existing = new Set(manifest.map((p) => p.id));
const images = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => EXT.has(path.extname(f).toLowerCase())).sort() : [];

// Collect [album, medium, stock, sourcePath]
const jobs = [];
for (const album of fs.readdirSync(IN, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  if (!albumSlugs.has(album)) {
    console.warn(`!! "${album}" is not an album slug in ${ALBUMS} - skipped. Rename the folder or add the album first.`);
    continue;
  }
  for (const f of images(path.join(IN, album, 'digital'))) jobs.push([album, 'digital', '', path.join(IN, album, 'digital', f)]);
  const filmDir = path.join(IN, album, 'film');
  for (const f of images(filmDir)) jobs.push([album, 'film', '', path.join(filmDir, f)]);
  if (fs.existsSync(filmDir)) {
    for (const stock of fs.readdirSync(filmDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
      for (const f of images(path.join(filmDir, stock))) jobs.push([album, 'film', titleCase(stock), path.join(filmDir, stock, f)]);
    }
  }
}

let added = 0, skipped = 0;
for (const [album, medium, stock, src] of jobs) {
  const base = slugify(path.parse(src).name);
  const id = `${album}-${medium}-${base}`;
  if (existing.has(id)) { skipped++; continue; }

  const rel = `${album}/${medium}-${base}.jpg`;
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const info = await sharp(src)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(dest);

  const entry = { id, file: rel, w: info.width, h: info.height, album, tags: [], medium, title: '', featured: false };
  if (medium === 'film') {
    const ratio = Math.max(info.width, info.height) / Math.min(info.width, info.height);
    entry.format = ratio < 1.4 ? '120' : '35mm'; // square / 6x7 -> 120, 3:2 -> 35mm
    entry.stock = stock;
    entry.camera = entry.format === '35mm' ? FILM_CAMERA : '';
  }
  manifest.push(entry);
  existing.add(id);
  added++;
  console.log(`ok  ${rel}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB${medium === 'film' ? `  [${entry.format}${stock ? ', ' + stock : ''}]` : ''}`);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${added} added to ${MANIFEST}, ${skipped} already there.`);
if (added) console.log(`Next: npm run upload, then set "featured": true on the ones you want on the home page.`);
