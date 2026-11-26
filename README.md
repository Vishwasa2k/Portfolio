# Photography portfolio (Astro)

Minimal gallery site with a side panel (Photography and Video albums, About / Contact), a home page of featured work, film badges and an All / Film / Digital filter inside photo albums, and video albums that play your own clips or YouTube/Vimeo links. Photos and videos are served from Cloudflare R2; the site itself is code only and deploys from GitHub.

## Run locally

    npm install
    npm run dev

With `PUBLIC_IMAGE_BASE` empty it shows the placeholder images in `public/sample`. Delete that folder once you have real photos.

## Things you edit

| File | What it controls |
|---|---|
| `src/data/site.json` | Name, tagline, email, Instagram/Behance links, About text |
| `src/data/albums.json` | Albums. `group` is `photo` or `video` (decides which menu it sits under); order in the file = order in the menu |
| `src/data/photos.json` | Every photo and video: album, medium, film stock, camera |

A photo has one primary `album` and an optional `tags` list of other album slugs. It appears in all of them, with no duplicate files. `medium` is `film` or `digital`. Film photos get the amber format badge (35MM / 120) and their stock and camera in the enlarged view. Items with `"featured": true` make up the home page, in the order they appear in the file.

## Adding videos

A video entry is like a photo entry, with `"type": "video"`. `file` is the thumbnail image shown in the grid, and `w`/`h` are the video's dimensions. Then either:

- `"video": "renders/porsche.mp4"` - an MP4 you uploaded to R2 (H.264, ideally under ~50 MB), or
- `"embed": "https://youtu.be/XXXXXXXXXXX"` - a YouTube or Vimeo link (best for long or large videos).

    {
      "id": "renders-porsche",
      "type": "video",
      "file": "renders/porsche-thumb.jpg",
      "video": "renders/porsche.mp4",
      "w": 1920, "h": 1080,
      "album": "renders",
      "tags": [],
      "title": "Porsche 911 - Blender",
      "camera": "Blender, Cycles"
    }

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

    src/layouts/Base.astro        page shell, mobile menu, fonts
    src/components/Sidebar.astro  side panel with album lists
    src/components/Gallery.astro  photo/video grid, film badge, filter, viewer
    src/pages/index.astro         home page (featured items)
    src/pages/albums/[slug].astro one page per album
    src/pages/about.astro
    scripts/prepare-photos.mjs    resize + manifest generator
