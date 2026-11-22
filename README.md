# Photography portfolio (Astro)

Dark gallery site with albums (themes + places), a Film page that collects every film frame, and a film/digital filter inside each album. Photos are served from Cloudflare R2; the site itself is code only and deploys from GitHub.

## Run locally

    npm install
    npm run dev

With `PUBLIC_IMAGE_BASE` empty it shows the placeholder images in `public/sample`. Delete that folder once you have real photos.

## Things you edit

| File | What it controls |
|---|---|
| `src/data/site.json` | Name, tagline, email, Instagram/Behance links, About text |
| `src/data/albums.json` | Albums. `group` is `themes` or `places`; `cover` is a photo id |
| `src/data/photos.json` | Every photo: album, medium, film stock, camera |

A photo has one primary `album` and an optional `tags` list of other album slugs. It appears in all of them, with no duplicate files. `medium` is `film` or `digital`. Film photos get the amber format badge (35MM / 120), a stock and camera line, and appear on the Film page. Mark up to a few with `"featured": true`; the first featured photo is the home page hero.

## Adding photos

1. Put exports in `incoming/<album-slug>/<film|digital>/` (the album folder name must match a slug in `albums.json`).
2. Run `npm run photos`. It resizes to 2400px on the long edge (JPEG, quality 82) into `out/` and writes `out/new-photos.json`.
3. Paste the entries from `out/new-photos.json` into `src/data/photos.json` and fill in `title`, `stock`, `camera` (change `format` to `120` where needed).
4. Upload the album folders inside `out/` to your R2 bucket, keeping the same folder structure.
5. `git commit` and `git push`. Cloudflare redeploys.

Only the manifest and code go to GitHub. `incoming/` and `out/` are git-ignored.

## Cloudflare setup

**R2 (photos)**
1. Cloudflare dashboard > R2 > create bucket (e.g. `portfolio-photos`).
2. Upload your `out/` folders.
3. Bucket > Settings > enable the public `r2.dev` URL for testing, or connect a custom domain (e.g. `img.yourdomain.com`) for the real site.

**Deploy (site)**
1. Workers & Pages > Create > connect your GitHub repo.
2. Build command: `npm run build`
3. Output / build directory: `dist`
4. Environment variable: `PUBLIC_IMAGE_BASE` = your R2 public URL, no trailing slash.
5. Set `site` in `astro.config.mjs` to your real domain once you have one.

## Structure

    src/layouts/Base.astro        header, footer, fonts
    src/components/Gallery.astro  masonry grid, film badge, filter, lightbox
    src/pages/index.astro         hero, album cards, film strip
    src/pages/albums/[slug].astro one page per album
    src/pages/film.astro          all film photos
    src/pages/about.astro
    scripts/prepare-photos.mjs    resize + manifest generator
