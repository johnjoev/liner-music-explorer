import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Liner — Music explorer', description: 'Explore the Chinook music catalogue by genre, artist, and album.', icons: { icon: '/icon.svg' } };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
