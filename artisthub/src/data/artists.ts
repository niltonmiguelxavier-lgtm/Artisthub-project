import type { Artist } from '../types';

// The signed-in artist for this demo session. In a real backend this
// would come from the authenticated user's profile document.
export const currentArtist: Artist = {
  id: 'artist-001',
  stageName: 'Nélio Kaya',
  fullName: 'Nélio Fernando Kaya',
  handle: 'nelio-kaya',
  bio: 'Vocalista e compositor de Maputo. Mistura afrobeat, marrabenta e produção contemporânea para contar histórias do quotidiano moçambicano.',
  location: 'Maputo, Moçambique',
  genres: ['Afrobeat', 'Marrabenta', 'R&B'],
  followers: 12480,
  verified: true,
  socials: {
    instagram: 'https://instagram.com/nelio.kaya',
    youtube: 'https://youtube.com/@nelio.kaya',
    tiktok: 'https://tiktok.com/@nelio.kaya',
    spotify: 'https://open.spotify.com/artist/nelio-kaya',
  },
};

export const featuredArtists: Artist[] = [
  currentArtist,
  {
    id: 'artist-002',
    stageName: 'Ivy Cumbane',
    fullName: 'Ivy Cumbane',
    handle: 'ivy-cumbane',
    bio: 'Produtora e cantora de Beira, explora sonoridades entre house e ritmos tradicionais do sul de África.',
    location: 'Beira, Moçambique',
    genres: ['Amapiano', 'House'],
    followers: 8340,
    verified: false,
    socials: { instagram: 'https://instagram.com/ivycumbane' },
  },
  {
    id: 'artist-003',
    stageName: 'Dj Zavala',
    fullName: 'Zavala Machel',
    handle: 'dj-zavala',
    bio: 'DJ e produtor residente em Tete, especializado em sets ao vivo com influência de pandza e afro house.',
    location: 'Tete, Moçambique',
    genres: ['Pandza', 'Afro House'],
    followers: 5620,
    verified: false,
    socials: { tiktok: 'https://tiktok.com/@djzavala' },
  },
];
