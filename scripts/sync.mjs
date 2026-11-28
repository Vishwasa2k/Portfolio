// One command to make the site match your folders:
//   npm run sync -- "D:\Exports"
// 1. adds new photos   2. removes photos you deleted or moved   3. uploads / deletes in R2
// Then: git add . / git commit / git push
import { spawnSync } from 'node:child_process';

const run = (script, args) => {
  const r = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const args = process.argv.slice(2);
if (!args.some((a) => !a.startsWith('--'))) {
  console.error('Tell me which folder to sync, e.g.  npm run sync -- "F:\\Website\\Portfolio"');
  process.exit(1);
}
run('scripts/prepare-photos.mjs', ['--sync', ...args]);
console.log('\n--- R2 ---');
run('scripts/upload.mjs', []);
console.log('\nDone. Now publish:  git add .   git commit -m "Update photos"   git push');
