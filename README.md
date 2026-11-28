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

A photo has one primary `album` and an optional `tags` list of other album slugs. It appears in all of them, with no duplicate files. `medium` is `film` or `digital`. Film photos get the amber format badge (35MM / 120) and their stock and camera in the enlarged view. Photos with `"featured": true` make up the home page, in the order they appear in the file. Videos never appear on the home page.

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

One-time setup:
1. Cloudflare > R2 > create a bucket (e.g. `portfolio-photos`). In its Settings, enable the Public Development URL (r2.dev) and copy it.
2. Put that URL in `src/data/site.json` as `"imageBase"` (no trailing slash).
3. R2 > Manage API tokens > Create API token with Object Read & Write on that bucket. Copy `.env.example` to `.env` and fill in the account ID, access key ID, secret and bucket name. `.env` never goes to GitHub.

### Keeping the site in sync with your folders (recommended)

Your export folder is the master copy. Organise it in File Explorer, one folder per album, then run:

    npm run sync -- "F:\Website\Portfolio"

That one command:
- adds new photos (resized, listed in `photos.json`, uploaded to R2),
- removes photos you deleted from the folders, from both the site and R2,
- moves photos you moved to another album folder,
- leaves videos and everything else you set by hand (featured, titles, stocks) alone.

Then publish: `git add .`, `git commit -m "Update photos"`, `git push`.

Home page: make a folder called `Home` inside your top folder and put copies of the photos you want on the home page in it. Sync adds them; delete a copy to take it off. The Home folder never shows as an album. (Without a Home folder, the home page falls back to photos marked `"featured": true`, then to everything.)

Rules:
- Always sync the same top folder you imported from. Pointing at one album folder (`...\Portraits`) only syncs that album.
- Film: anything inside a `Film` / `35mm` / `120` folder, or a folder named after a stock (`Portra 400`, `Cinestill 800T`), is marked film, with the stock taken from the folder name.
- If a sync would remove more than 20 photos (or 30% of them), it lists them and asks you to type `yes` first. An empty or wrong folder never removes anything.
- A photo moved to another album loses its `"featured"` mark; set it again if needed.

### Manual steps (if you prefer)
- `npm run photos -- "F:\Website\Portfolio"` only adds new photos; `npm run upload` uploads them.
- Home page: use a `Home` folder (above), or set `"featured": true` in `photos.json`.
- Album names and menu order: `albums.json`. Albums with no photos are hidden automatically.

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

One-time setup:
1. Cloudflare > R2 > create a bucket (e.g. `portfolio-photos`). In its Settings, enable the Public Development URL (r2.dev) and copy it.
2. Put that URL in `src/data/site.json` as `"imageBase"` (no trailing slash).
3. R2 > Manage API tokens > Create API token with Object Read & Write on that bucket. Copy `.env.example` to `.env` and fill in the account ID, access key ID, secret and bucket name. `.env` never goes to GitHub.

Each batch (no renaming needed):
1. Have your Lightroom JPEG exports in folders, one folder per album, e.g. `D:\Exports\Formula Student\`, `D:\Exports\Berlin\`. Sub-folders inside are fine.
2. Film: anything inside a folder called `Film` (or 35mm / 120 / Analog), or a folder named after a stock (`Portra 400`, `Cinestill 800T`, `Velvia 50`...), is marked as film. The stock name is taken from the folder. Everything else is digital.
3. `npm run photos -- "D:\Exports"` (or put the folders in `incoming/` and run `npm run photos`). Folder names become album names, new albums are created automatically, and every photo is added to `photos.json`. The first real batch removes the placeholder samples. Running it again only adds photos that are new.
4. `npm run upload` - sends `out/` to R2. Already-uploaded files are skipped.
5. In `photos.json`, set `"featured": true` on the photos for the home page (until you do, the home page shows everything). In `albums.json`, reorder or rename albums, or move one to `"group": "video"`.
6. `git add .`, `git commit`, `git push`. Empty `out/` when you like.

Albums with no photos are hidden from the menu automatically.

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

One-time setup:
1. Cloudflare > R2 > create a bucket (e.g. `portfolio-photos`). In its Settings, enable the Public Development URL (r2.dev) and copy it.
2. Put that URL in `src/data/site.json` as `"imageBase"` (no trailing slash).
3. R2 > Manage API tokens > Create API token with Object Read & Write on that bucket. Copy `.env.example` to `.env` and fill in the account ID, access key ID, secret and bucket name. `.env` never goes to GitHub.

Each batch:
1. Export from Lightroom into `incoming/<album>/digital/` or `incoming/<album>/film/`. For film, a subfolder named after the stock fills it in for you: `incoming/berlin/film/cinestill-800t/`. Folder names must match album slugs in `albums.json`.
2. `npm run photos` - resizes into `out/` and adds the entries to `src/data/photos.json` (35mm vs 120 is guessed from the frame shape; check it).
3. `npm run upload` - sends `out/` to R2. Already-uploaded files are skipped.
4. In `photos.json`: set `"featured": true` on the photos for the home page, add titles if you like, and reorder entries to change the order on the site.
5. Empty `incoming/` and `out/`, then `git add .`, `git commit`, `git push`.

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

**R2 (photos)** - see "Adding photos" above. When you buy a domain, connect it to the bucket as a custom domain (e.g. `img.yourdomain.com`) and update `imageBase`; the r2.dev URL is rate-limited and meant for testing.

**Deploy (site)**
1. Workers & Pages > Create > connect your GitHub repo.
2. Build command: `npm run build`
3. Output / build directory: `dist`
4. Set `site` in `astro.config.mjs` to your real domain once you have one.

## Structure

    src/layouts/Base.astro        page shell, mobile menu, fonts
    src/components/Sidebar.astro  side panel with album lists
    src/components/Gallery.astro  photo/video grid, film badge, filter, viewer
    src/pages/index.astro         home page (featured items)
    src/pages/albums/[slug].astro one page per album
    src/pages/about.astro
    scripts/prepare-photos.mjs    resize + manifest generator
