// Resize photos for the web and generate manifest entries.
//
// Put photos in:   incoming/<album-slug>/<film|digital>/your-photo.jpg
// Run:             npm run photos
// Output:          out/<album-slug>/<medium>-<name>.jpg   (upload this folder to R2)
//                  out/new-photos.json                    (paste entries into src/data/photos.json)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IN = 'incoming';
const OUT = 'out';
const MAX_EDGE = 2400;
const QUALITY = 82;
const EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);

if (!fs.existsSync(IN)) {
  console.error(`No "${IN}" folder. Create ${IN}/<album-slug>/<film|digital>/ and add photos.`);
  process.exit(1);
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const entries = [];
const counters = {};

for (const album of fs.readdirSync(IN, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const medium of ['film', 'digital']) {
    const dir = path.join(IN, album.name, medium);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => EXT.has(path.extname(f).toLowerCase())).sort();
    for (const f of files) {
      const base = slugify(path.parse(f).name);
      const rel = `${album.name}/${medium}-${base}.jpg`;
      const dest = path.join(OUT, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });

      const info = await sharp(path.join(dir, f))
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(dest);

      counters[album.name] = (counters[album.name] ?? 0) + 1;
      const entry = {
        id: `${album.name}-${medium}-${base}`,
        file: rel,
        w: info.width,
        h: info.height,
        album: album.name,
        tags: [],
        medium,
        title: '',
      };
      if (medium === 'film') {
        entry.format = '35mm'; // change to "120" where needed
        entry.stock = '';
        entry.camera = '';
      }
      entries.push(entry);
      console.log(`ok  ${rel}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
    }
  }
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'new-photos.json'), JSON.stringify(entries, null, 2));
console.log(`\n${entries.length} photos processed. Paste ${OUT}/new-photos.json entries into src/data/photos.json,`);
console.log(`then upload the ${OUT}/ folders (not new-photos.json) to your R2 bucket.`);
