// Resize photos for the web and add them to the site automatically.
// Works with your existing folders and filenames - nothing needs renaming.
//
//   npm run photos                      reads from the incoming/ folder in this project
//   npm run photos -- "D:\Exports"      or reads straight from any folder on your PC
//
// Every top-level folder becomes an album, named after the folder:
//   Exports\Formula Student\DSC_0412.jpg            -> album "Formula Student", digital
//   Exports\Berlin\Film\Cinestill 800T\0001.jpg     -> album "Berlin", film, stock "Cinestill 800T"
//   Exports\Berlin\Portra 400\scan12.jpg             -> film too (a film stock name in the path counts)
// Anything else is treated as digital. Sub-folders that aren't film are fine and are ignored.
//
// Then run:  npm run upload
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IN = process.argv[2] ?? 'incoming';
const OUT = 'out';
const MANIFEST = 'src/data/photos.json';
const ALBUMS = 'src/data/albums.json';
const MAX_EDGE = 2400;
const QUALITY = 82;
const EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);
const FILM_CAMERA = 'Nikon F3 + 50mm f/1.8'; // default camera for 35mm film; edit afterwards if different

// A folder counts as film if it is called film/analog/35mm/120, or names a film stock.
const FILM_WORD = /^(film|films|analog|analogue|35mm|120|medium[ -]?format)$/i;
const STOCK_WORD = /(portra|ektar|gold|ultramax|colorplus|kodacolor|ektachrome|tri-?x|t-?max|double-?x|cinestill|velvia|provia|superia|fujicolor|c200|acros|ilford|hp5|fp4|delta|kentmere|agfa|apx|vista|lomo|rollei|foma)/i;

if (!fs.existsSync(IN)) {
  console.error(`Folder not found: ${IN}`);
  process.exit(1);
}

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase());

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const albums = JSON.parse(fs.readFileSync(ALBUMS, 'utf8'));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);

// Gather jobs
const jobs = [];
let rawSkipped = 0;
for (const folder of fs.readdirSync(IN, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const albumDir = path.join(IN, folder);
  for (const file of walk(albumDir).sort()) {
    const ext = path.extname(file).toLowerCase();
    if (!EXT.has(ext)) { if (/\.(nef|cr2|cr3|arw|raf|dng|orf|rw2)$/i.test(file)) rawSkipped++; continue; }
    const segs = path.relative(albumDir, path.dirname(file)).split(path.sep).filter(Boolean);
    const filmIdx = segs.findIndex((s) => FILM_WORD.test(s) || STOCK_WORD.test(s));
    let medium = 'digital', stock = '';
    if (filmIdx >= 0) {
      medium = 'film';
      const stockSeg = segs.slice(filmIdx).find((s) => STOCK_WORD.test(s));
      stock = stockSeg ? titleCase(stockSeg) : '';
    }
    jobs.push({ folder, file, segs, medium, stock });
  }
}
if (!jobs.length) {
  console.log(`No photos found in ${IN}.${rawSkipped ? ` (${rawSkipped} RAW files skipped - export JPEGs from Lightroom first.)` : ''}`);
  process.exit(0);
}

// First real batch: drop the placeholder sample entries
const before = manifest.length;
for (let i = manifest.length - 1; i >= 0; i--) if (manifest[i].file.startsWith('sample/')) manifest.splice(i, 1);
if (manifest.length < before) console.log(`Removed ${before - manifest.length} placeholder entries.\n`);

const existing = new Set(manifest.map((p) => p.id));
const albumBySlug = new Map(albums.map((a) => [a.slug, a]));
let added = 0, skipped = 0;
const newAlbums = [];

for (const { folder, file, segs, medium, stock } of jobs) {
  const slug = slugify(folder);
  if (!albumBySlug.has(slug)) {
    const album = { slug, title: folder, group: 'photo', description: '' };
    const firstVideo = albums.findIndex((a) => a.group === 'video');
    albums.splice(firstVideo < 0 ? albums.length : firstVideo, 0, album);
    albumBySlug.set(slug, album);
    newAlbums.push(folder);
  }

  // Unique name built from sub-folders + original filename, so DSC_0001 in two folders can't clash
  const name = slugify([...segs, path.parse(file).name].join('-'));
  const id = `${slug}--${name}`;
  if (existing.has(id)) { skipped++; continue; }

  const rel = `${slug}/${name}.jpg`;
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let info;
  try {
    info = await sharp(file)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(dest);
  } catch (e) {
    console.warn(`!!  could not read ${file}: ${e.message}`);
    continue;
  }

  const entry = { id, file: rel, w: info.width, h: info.height, album: slug, tags: [], medium, title: '', featured: false };
  if (medium === 'film') {
    const ratio = Math.max(info.width, info.height) / Math.min(info.width, info.height);
    entry.format = ratio < 1.4 ? '120' : '35mm';
    entry.stock = stock;
    entry.camera = entry.format === '35mm' ? FILM_CAMERA : '';
  }
  manifest.push(entry);
  existing.add(id);
  added++;
  console.log(`ok  ${rel}${medium === 'film' ? `  [film ${entry.format}${stock ? ', ' + stock : ''}]` : ''}`);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(ALBUMS, JSON.stringify(albums, null, 2) + '\n');

console.log(`\n${added} photos added, ${skipped} already on the site.`);
if (newAlbums.length) console.log(`New albums: ${newAlbums.join(', ')}`);
if (rawSkipped) console.log(`${rawSkipped} RAW files skipped - export JPEGs from Lightroom for those.`);
console.log('Next: npm run upload');
