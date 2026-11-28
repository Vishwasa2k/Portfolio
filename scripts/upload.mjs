// Upload everything in out/ to your Cloudflare R2 bucket, keeping the folder structure.
// Files already in the bucket are skipped (use --force to re-upload).
//
// Needs a .env file in the project folder (see .env.example) with your R2 API token details.
// Run:  npm run upload
import fs from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

try { process.loadEnvFile('.env'); } catch { /* no .env file */ }
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing R2 settings. Copy .env.example to .env and fill in R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.');
  process.exit(1);
}

const OUT = 'out';
const force = process.argv.includes('--force');
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: !!process.env.R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);

if (!fs.existsSync(OUT)) { console.log('Nothing to upload: no out/ folder.'); process.exit(0); }
const files = walk(OUT).filter((f) => TYPES[path.extname(f).toLowerCase()]);
const PENDING = path.join(OUT, 'pending-deletes.json');

let up = 0, skip = 0;
for (const file of files) {
  const key = path.relative(OUT, file).split(path.sep).join('/');
  if (!force) {
    try { await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key })); skip++; continue; } catch { /* not there yet */ }
  }
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: fs.readFileSync(file),
    ContentType: TYPES[path.extname(file).toLowerCase()],
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  up++;
  console.log(`up  ${key}`);
}
// Delete photos that were removed from the site (written by npm run sync)
let del = 0;
if (fs.existsSync(PENDING)) {
  const keys = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const res = await s3.send(new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
    }));
    if (res.Errors?.length) {
      res.Errors.forEach((e) => console.warn(`!!  could not delete ${e.Key}: ${e.Message}`));
      console.warn('Kept the list; run npm run upload again to retry.');
      process.exit(1);
    }
    del += batch.length;
  }
  fs.rmSync(PENDING);
  if (del) console.log(`del ${del} removed photo(s) from R2`);
}

console.log(`\n${up} uploaded, ${skip} already in the bucket${del ? `, ${del} deleted` : ''}.`);
