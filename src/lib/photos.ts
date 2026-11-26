import photosData from '../data/photos.json';
import albumsData from '../data/albums.json';
import site from '../data/site.json';

export type Medium = 'film' | 'digital';

/** One item in an album: a photo, or a video (file = its thumbnail/poster image). */
export interface Photo {
  id: string;
  type?: 'photo' | 'video';
  file: string;
  w: number;
  h: number;
  album: string;
  tags: string[];
  medium?: Medium;
  title?: string;
  format?: string;
  stock?: string;
  camera?: string;
  featured?: boolean;
  /** Video file in your R2 bucket, e.g. "renders/porsche.mp4" */
  video?: string;
  /** Or a YouTube / Vimeo link */
  embed?: string;
}

export interface Album {
  slug: string;
  title: string;
  group: 'photo' | 'video';
  description?: string;
  cover?: string;
}

export const photos = photosData as Photo[];
export const albums = albumsData as Album[];

/** Where photos are served from: PUBLIC_IMAGE_BASE if set, otherwise "imageBase" in site.json. */
const base = (import.meta.env.PUBLIC_IMAGE_BASE || (site as Record<string, string>).imageBase || '').replace(/\/$/, '');

export const imageUrl = (file: string) => `${base}/${file.replace(/^\//, '')}`;

export const isVideo = (p: Photo) => p.type === 'video' || !!p.video || !!p.embed;
export const isFilm = (p: Photo) => !isVideo(p) && p.medium === 'film';

/** An item belongs to its primary album and to any album listed in tags. */
export const photosInAlbum = (slug: string) =>
  photos.filter((p) => p.album === slug || p.tags.includes(slug));

export const coverFor = (album: Album) =>
  photos.find((p) => p.id === album.cover) ?? photosInAlbum(album.slug)[0];

export const mediumLabel = (p: Photo) =>
  isFilm(p) ? (p.format ? p.format.toUpperCase() : 'FILM') : '';

export const captionFor = (p: Photo) =>
  isFilm(p) ? [p.stock, p.camera].filter(Boolean).join(' - ') : p.camera ?? '';

/** Turn a YouTube or Vimeo link into an autoplaying embed URL. */
export const embedUrl = (url: string) => {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return url;
};

/** Home page: photos marked featured, in manifest order (falls back to all photos). Videos never show here. */
export const homePhotos = () => {
  const stills = photos.filter((p) => !isVideo(p));
  const f = stills.filter((p) => p.featured);
  return f.length ? f : stills;
};
