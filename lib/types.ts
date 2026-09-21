export type Track = { id: number; title: string; artist: string; album: string; genre: string; composer: string | null; milliseconds: number; price: number };
export type Option = { id: number; name: string };
export type Catalogue = { tracks: Track[]; total: number; page: number; pages: number; genres: Option[]; artists: Option[]; albums: Option[]; stats: { artists: number; albums: number; minutes: number }; distribution: { name: string; count: number }[] };
