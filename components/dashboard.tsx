'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Disc3,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  X,
  LogOut,
  Music2,
  Users,
  Library,
  Clock3,
  RotateCcw,
} from 'lucide-react';
import type { Catalogue, Option } from '@/lib/types';

function Picker({
  label,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  options: Option[];
  selected: number[];
  onChange: (ids: number[]) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div
      className="picker"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <button
        className={'filter-button ' + (selected.length ? 'selected' : '')}
        aria-expanded={open}
        aria-controls={`filter-${label}`}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        {label}
        {selected.length > 0 && <b>{selected.length}</b>}
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="popover" id={`filter-${label}`}>
          <label className="picker-search">
            <Search size={16} />
            <input
              autoFocus
              placeholder={`Find ${label.toLowerCase()}`}
              aria-label={`Find ${label.toLowerCase()}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="option-list">
            {options
              .filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
              .map((o) => (
                <label key={o.id} className="option">
                  <input
                    type="checkbox"
                    checked={selected.includes(o.id)}
                    onChange={() =>
                      onChange(
                        selected.includes(o.id)
                          ? selected.filter((id) => id !== o.id)
                          : [...selected, o.id],
                      )
                    }
                  />
                  <span>{o.name}</span>
                </label>
              ))}
            {!options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())).length && (
              <p className="muted">No available options.</p>
            )}
          </div>
          <div className="picker-footer">
            <button onClick={() => onChange([])}>Clear selection</button>
            <button onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
const format = (value: number) => value.toLocaleString('en-US');
export default function Dashboard({
  setup = false,
  preview = false,
  email,
}: {
  setup?: boolean;
  preview?: boolean;
  email?: string;
}) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [genres, setGenres] = useState<number[]>([]);
  const [artists, setArtists] = useState<number[]>([]);
  const [albums, setAlbums] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [data, setData] = useState<Catalogue | null>(null);
  const [loading, setLoading] = useState(!setup);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [jump, setJump] = useState('1');
  useEffect(() => {
    if (query.trim() === search) return;
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);
  useEffect(() => {
    if (setup) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      q: search,
      genres: genres.join(','),
      artists: artists.join(','),
      albums: albums.join(','),
      page: String(page),
      size: String(size),
    });
    fetch(`/api/catalogue?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (response.status === 401) {
          window.location.assign('/login');
          return;
        }
        if (!response.ok) throw new Error(result.error);
        setData(result);
        setJump(String(result.page));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'Unable to load the catalogue.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [search, genres, artists, albums, page, size, retry, setup]);
  const reset = () => {
    setQuery('');
    setSearch('');
    setGenres([]);
    setArtists([]);
    setAlbums([]);
    setPage(1);
  };
  const count = genres.length + artists.length + albums.length;
  const chips = [
    ...genres.map((id) => ({
      key: `g${id}`,
      name: data?.genres.find((o) => o.id === id)?.name ?? String(id),
      remove: () => {
        setGenres(genres.filter((x) => x !== id));
        setArtists([]);
        setAlbums([]);
        setPage(1);
      },
    })),
    ...artists.map((id) => ({
      key: `a${id}`,
      name: data?.artists.find((o) => o.id === id)?.name ?? String(id),
      remove: () => {
        setArtists(artists.filter((x) => x !== id));
        setAlbums([]);
        setPage(1);
      },
    })),
    ...albums.map((id) => ({
      key: `l${id}`,
      name: data?.albums.find((o) => o.id === id)?.name ?? String(id),
      remove: () => {
        setAlbums(albums.filter((x) => x !== id));
        setPage(1);
      },
    })),
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand">
          <Disc3 size={31} />
          <span>
            liner<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <a href="/" className="nav-active">
          <Library size={19} /> Music explorer
        </a>
        <div className="sidebar-note">
          <div className="mini-record">
            <Disc3 size={39} />
          </div>
          <strong>
            A closer look
            <br />
            at the music.
          </strong>
          <p>Explore the artists, albums, and tracks behind the catalogue.</p>
          <a href="https://github.com/lerocha/chinook-database" target="_blank" rel="noreferrer">
            About the dataset <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">{email ? email.slice(0, 2).toUpperCase() : 'L'}</span>
          <div>
            <strong>{email?.split('@')[0] || 'Music workspace'}</strong>
            <small>
              {preview ? 'Local preview' : setup ? 'Setup in progress' : 'Personal account'}
            </small>
          </div>
          {email && (
            <form action="/auth/signout" method="post">
              <button aria-label="Sign out" title="Sign out" className="icon-button">
                <LogOut size={17} />
              </button>
            </form>
          )}
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span> <strong>Music explorer</strong>
          </span>
          <span className="source-label">
            <Disc3 size={14} /> CHINOOK COLLECTION
          </span>
          {email && (
            <form className="mobile-account" action="/auth/signout" method="post">
              <button className="icon-button" aria-label="Sign out">
                <LogOut size={18} /> Sign out
              </button>
            </form>
          )}
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">THE COLLECTION</div>
              <h1>
                Music, in perspective<span>.</span>
              </h1>
              <p>Find the familiar. Discover what’s next.</p>
            </div>
            <a
              className="source-link"
              href="https://github.com/lerocha/chinook-database"
              target="_blank"
              rel="noreferrer"
            >
              Dataset source <ArrowUpRight size={16} />
            </a>
          </div>
          {setup && (
            <div className="setup-notice" role="status">
              <strong>Your workspace is ready to connect.</strong>
              <span>
                Add your Supabase project settings and import the catalogue to start exploring. No
                database is connected yet.
              </span>
            </div>
          )}
          {preview && (
            <div className="preview-notice" role="status">
              <span>
                <strong>Local preview</strong> · Explore all 3,503 tracks. Cloud database and
                sign-in are not connected.
              </span>
              <a href="/login">
                Preview sign-in <ArrowUpRight size={13} />
              </a>
            </div>
          )}
          <section className="stats-grid" aria-label="Matching catalogue statistics">
            {[
              { label: 'Tracks', value: data?.total, icon: Music2, note: 'In your selection' },
              {
                label: 'Artists',
                value: data?.stats.artists,
                icon: Users,
                note: 'Distinct voices',
              },
              {
                label: 'Albums',
                value: data?.stats.albums,
                icon: Library,
                note: 'Across the collection',
              },
              {
                label: 'Listening hours',
                value: data ? Math.round(data.stats.minutes / 60) : undefined,
                icon: Clock3,
                note: 'Total track duration',
              },
            ].map(({ label, value, icon: Icon, note }) => (
              <div className="stat" key={label}>
                <div className="stat-label">
                  {label}
                  <Icon size={18} />
                </div>
                <div className="stat-number">{value === undefined ? '—' : format(value)}</div>
                <div className="stat-note">{note}</div>
              </div>
            ))}
          </section>
          <div className="content-grid">
            <section className="catalogue panel">
              <div className="panel-heading">
                <div>
                  <h2>Track library</h2>
                  <p>Your catalogue, one discovery at a time.</p>
                </div>
                <span className="count-badge">
                  {data ? `${format(data.total)} tracks` : 'Catalogue'}
                </span>
              </div>
              <div className="controls">
                <label className="search-field">
                  <Search size={19} />
                  <input
                    aria-label="Search tracks, artists, albums, or composers"
                    placeholder="Search tracks, artists, albums…"
                    value={query}
                    maxLength={200}
                    disabled={setup}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      aria-label="Clear search"
                      className="icon-button"
                      onClick={() => setQuery('')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
                <div className="filters">
                  <SlidersHorizontal size={17} className="filter-icon" />
                  <Picker
                    label="Genres"
                    options={data?.genres ?? []}
                    selected={genres}
                    disabled={setup || loading || !data}
                    onChange={(v) => {
                      setGenres(v);
                      setArtists([]);
                      setAlbums([]);
                      setPage(1);
                    }}
                  />
                  <span className="cascade-arrow">›</span>
                  <Picker
                    label="Artists"
                    options={data?.artists ?? []}
                    selected={artists}
                    disabled={setup || loading || !data}
                    onChange={(v) => {
                      setArtists(v);
                      setAlbums([]);
                      setPage(1);
                    }}
                  />
                  <span className="cascade-arrow">›</span>
                  <Picker
                    label="Albums"
                    options={data?.albums ?? []}
                    selected={albums}
                    disabled={setup || loading || !data}
                    onChange={(v) => {
                      setAlbums(v);
                      setPage(1);
                    }}
                  />
                  {(count > 0 || query) && (
                    <button className="reset" onClick={reset}>
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                </div>
                {chips.length > 0 && (
                  <div className="chips">
                    {chips.map((c) => (
                      <button key={c.key} onClick={c.remove}>
                        {c.name}
                        <X size={12} />
                        <span className="sr-only">Remove filter</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div
                className="table-wrap"
                aria-busy={loading}
                tabIndex={0}
                role="region"
                aria-label="Track results; scroll to see more rows and columns"
              >
                <table>
                  <thead>
                    <tr>
                      <th className="number-col">#</th>
                      <th>TRACK / ARTIST</th>
                      <th>ALBUM</th>
                      <th>GENRE</th>
                      <th className="duration">TIME</th>
                      <th className="price">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!error &&
                      data?.tracks.map((track, index) => (
                        <tr key={track.id}>
                          <td className="number-col">{(data.page - 1) * size + index + 1}</td>
                          <td>
                            <div className="track-cell">
                              <div className={`track-art color-${track.id % 5}`} aria-hidden="true">
                                <Music2 size={19} />
                              </div>
                              <div>
                                <strong>{track.title}</strong>
                                <span>{track.artist}</span>
                              </div>
                            </div>
                          </td>
                          <td className="album-cell">{track.album}</td>
                          <td>
                            <span className="genre-tag">{track.genre}</span>
                          </td>
                          <td className="duration">
                            {Math.floor(track.milliseconds / 60000)}:
                            {String(Math.floor(track.milliseconds / 1000) % 60).padStart(2, '0')}
                          </td>
                          <td className="price">${Number(track.price).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {error ? (
                  <div className="empty-state" role="alert">
                    <strong>{error}</strong>
                    <button className="primary-button" onClick={() => setRetry(retry + 1)}>
                      Try again
                    </button>
                  </div>
                ) : setup ? (
                  <div className="empty-state">
                    <div className="empty-disc">
                      <Disc3 size={44} />
                    </div>
                    <h3>The next discovery starts here.</h3>
                    <p>Connect the database to bring your music library to life.</p>
                    <span className="setup-pill">Awaiting database connection</span>
                  </div>
                ) : loading && !data ? (
                  <div className="empty-state" role="status">
                    <span className="spinner" />
                    Loading your catalogue…
                  </div>
                ) : data?.total === 0 ? (
                  <div className="empty-state">
                    <Search size={32} />
                    <h3>No tracks found</h3>
                    <p>Try another search or clear your filters.</p>
                    <button className="primary-button" onClick={reset}>
                      Clear all filters
                    </button>
                  </div>
                ) : null}
              </div>
              <footer className="pagination">
                <span aria-live="polite">
                  {loading
                    ? 'Updating…'
                    : data?.total
                      ? `Showing ${format((data.page - 1) * size + 1)}–${format(Math.min(data.page * size, data.total))} of ${format(data.total)}`
                      : 'No tracks to display'}
                </span>
                <div className="page-controls">
                  <label>
                    Rows{' '}
                    <select
                      aria-label="Rows per page"
                      value={size}
                      disabled={setup || loading}
                      onChange={(e) => {
                        setSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 20, 50].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    aria-label="Previous page"
                    disabled={setup || loading || !data || data.page <= 1}
                    onClick={() => setPage((data?.page ?? 1) - 1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (data) {
                        const value = Number(jump);
                        setPage(
                          Number.isFinite(value)
                            ? Math.max(1, Math.min(data.pages, Math.floor(value)))
                            : 1,
                        );
                      }
                    }}
                  >
                    <label>
                      Page{' '}
                      <input
                        type="number"
                        min="1"
                        max={data?.pages ?? 1}
                        aria-label="Jump to page"
                        value={jump}
                        disabled={setup || loading}
                        onChange={(e) => setJump(e.target.value)}
                      />{' '}
                      of {data?.pages ?? 1}
                    </label>
                  </form>
                  <button
                    aria-label="Next page"
                    disabled={setup || loading || !data || data.page >= data.pages}
                    onClick={() => setPage((data?.page ?? 1) + 1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </footer>
            </section>
            <aside className="insights">
              <section className="panel genre-panel">
                <div className="eyebrow">IN THE MIX</div>
                <h2>By genre</h2>
                <p>A snapshot of your selection.</p>
                <div className="genre-bars">
                  {data?.distribution.length ? (
                    data.distribution.map((genre, index) => (
                      <div className="genre-bar" key={genre.name}>
                        <div>
                          <span>
                            <i className={`swatch swatch-${index}`} />
                            {genre.name}
                          </span>
                          <strong>{format(genre.count)}</strong>
                        </div>
                        <div className="bar-track">
                          <div
                            className={`bar-fill swatch-${index}`}
                            style={{ width: `${(genre.count / data.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-insights">
                      Genre breakdown appears when tracks are available.
                    </div>
                  )}
                </div>
                <div className="insight-footnote">Top 5 genres · matching tracks</div>
              </section>
              <section className="discovery-card">
                <Disc3 size={33} />
                <h2>
                  Follow your
                  <br />
                  curiosity.
                </h2>
                <p>Start with a genre. Narrow it to an artist. Find an album worth exploring.</p>
                <div className="filter-path">
                  GENRE <span>→</span> ARTIST <span>→</span> ALBUM
                </div>
              </section>
            </aside>
          </div>
          <footer className="page-footer">
            <span>LINER / MUSIC EXPLORER</span>
            <span>Chinook dataset · Prices in USD</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
