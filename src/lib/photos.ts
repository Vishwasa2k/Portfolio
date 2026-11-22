import photosData from '../data/photos.json';
import albumsData from '../data/albums.json';

export type Medium = 'film' | 'digital';

export interface Photo {
  id: string;
  file: string;
  w: number;
  h: number;
  album: string;
  tags: string[];
  medium: Medium;
  title?: string;
  format?: string;
  stock?: string;
  camera?: string;
  featured?: boolean;
}

export interface Album {
  slug: string;
  title: string;
  group: 'themes' | 'places';
  description?: string;
  cover?: string;
}

export const photos = photosData as Photo[];
export const albums = albumsData as Album[];

const base = (import.meta.env.PUBLIC_IMAGE_BASE ?? '').replace(/\/$/, '');

export const imageUrl = (file: string) => `${base}/${file.replace(/^\//, '')}`;

/** A photo belongs to its primary album and to any album listed in tags. */
export const photosInAlbum = (slug: string) =>
  photos.filter((p) => p.album === slug || p.tags.includes(slug));

export const filmPhotos = () => photos.filter((p) => p.medium === 'film');

export const coverFor = (album: Album) =>
  photos.find((p) => p.id === album.cover) ?? photosInAlbum(album.slug)[0];

export const mediumLabel = (p: Photo) =>
  p.medium === 'film' ? (p.format ? p.format.toUpperCase() : 'FILM') : '';

export const captionFor = (p: Photo) => {
  if (p.medium === 'film') {
    return [p.stock, p.camera].filter(Boolean).join(' - ');
  }
  return p.camera ?? '';
};
