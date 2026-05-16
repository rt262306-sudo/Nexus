import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { searchMusic, type SearchResult } from '../lib/api';
import { Play, TrendingUp, Music2, Loader2, ChevronLeft } from 'lucide-react';

const GENRES = [
  { name: 'Pop',        query: 'top pop hits 2024',        color: 'linear-gradient(135deg,#f82c5a,#ff8c42)' },
  { name: 'Hip-Hop',   query: 'top hip hop rap 2024',      color: 'linear-gradient(135deg,#7c3aed,#f82c5a)' },
  { name: 'Bollywood', query: 'bollywood hits 2024',        color: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { name: 'Electronic',query: 'edm electronic hits',        color: 'linear-gradient(135deg,#06b6d4,#7c3aed)' },
  { name: 'Rock',      query: 'classic rock hits',          color: 'linear-gradient(135deg,#374151,#f82c5a)' },
  { name: 'Lo-Fi',     query: 'lofi hip hop chill beats',   color: 'linear-gradient(135deg,#065f46,#06b6d4)' },
];

const TRENDING_QUERIES = [
  'Blinding Lights The Weeknd',
  'Levitating Dua Lipa',
  'Stay Kid LAROI Justin Bieber',
  'As It Was Harry Styles',
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 🎵';
  return 'Good evening 🌙';
};

const HomePage: React.FC = () => {
  const { playTrack, currentTrack } = usePlayer();
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ name: string, tracks: SearchResult[] } | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  // Fetch trending tracks dynamically so thumbnails are always real
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const results = await searchMusic('top hits 2024 trending');
        if (!cancelled) {
          setTrending(results.slice(0, 6));
          setTrendingLoading(false);
        }
      } catch {
        if (!cancelled) setTrendingLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleGenreClick = async (genreName: string, query: string) => {
    setPlaylistLoading(true);
    setSelectedPlaylist({ name: genreName, tracks: [] });
    try {
      const results = await searchMusic(query);
      setSelectedPlaylist({ name: genreName, tracks: results });
    } catch (error) {
      console.error("Failed to load playlist:", error);
      setSelectedPlaylist(null);
    } finally {
      setPlaylistLoading(false);
    }
  };

  if (selectedPlaylist) {
    return (
      <div className="page-container fade-in">
        <button 
          onClick={() => setSelectedPlaylist(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 20, background: 'none', border: 'none', padding: 0 }}
        >
          <ChevronLeft size={20} />
          <span>Back to Home</span>
        </button>

        <h1 className="page-title">{selectedPlaylist.name} Hits</h1>

        {playlistLoading ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ width: 'calc(50% - 7px)', minWidth: 140 }}>
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 14, background: 'var(--bg-elevated)', marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: 12, width: '80%', background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 6 }} />
                <div style={{ height: 10, width: '50%', background: 'var(--bg-elevated)', borderRadius: 6 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {selectedPlaylist.tracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, selectedPlaylist.tracks)}
                style={{ width: 'calc(50% - 7px)', minWidth: 140, cursor: 'pointer', marginBottom: 12 }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-elevated)', marginBottom: 10 }}>
                  <img src={track.thumbnail} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={24} fill="white" color="white" />
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.uploaderName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-container fade-in" style={{ paddingBottom: 16 }}>

      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>{getGreeting()}</p>
        <h1 className="page-title" style={{ marginBottom: 0 }}>What do you feel like?</h1>
      </div>

      {/* Trending Now */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Trending Now</h2>
        </div>

        {trendingLoading ? (
          <div style={{ display: 'flex', gap: 14 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ minWidth: 140, flexShrink: 0 }}>
                <div style={{ width: 140, height: 140, borderRadius: 14, background: 'var(--bg-elevated)', marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 12, width: 100, background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 6 }} />
                <div style={{ height: 10, width: 70, background: 'var(--bg-elevated)', borderRadius: 6 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {trending.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                style={{ minWidth: 140, cursor: 'pointer', flexShrink: 0 }}
              >
                <div style={{
                  width: 140,
                  height: 140,
                  borderRadius: 14,
                  background: 'var(--bg-elevated)',
                  marginBottom: 10,
                  overflow: 'hidden',
                  position: 'relative',
                  border: currentTrack?.title === track.title
                    ? '2px solid var(--accent-primary)'
                    : '2px solid transparent',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  transition: 'border 0.2s',
                }}>
                  {track.thumbnail && (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 10,
                  }}>
                    <div style={{
                      width: 30, height: 30,
                      borderRadius: '50%',
                      background: currentTrack?.title === track.title ? 'rgba(255,255,255,0.9)' : 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginLeft: 'auto',
                    }}>
                      <Play
                        size={13}
                        fill={currentTrack?.title === track.title ? 'var(--accent-primary)' : 'white'}
                        color={currentTrack?.title === track.title ? 'var(--accent-primary)' : 'white'}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.uploaderName}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Browse Genres */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Music2 size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Browse Genres</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {GENRES.map((genre) => (
            <div
              key={genre.name}
              onClick={() => handleGenreClick(genre.name, genre.query)}
              style={{
                height: 90,
                background: genre.color,
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{
                position: 'absolute', top: -12, right: -12,
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
              }} />
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>{genre.name}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage;
