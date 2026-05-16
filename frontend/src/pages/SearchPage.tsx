import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, History, X, MoreVertical } from 'lucide-react';
import { searchMusic, getSuggestions, type SearchResult } from '../lib/api';
import { usePlayer } from '../context/PlayerContext';

const CATEGORIES = [
  { name: 'Bollywood', color: '#f82c5a', emoji: '🎬' },
  { name: 'Hip-Hop', color: '#2c3ef8', emoji: '🎤' },
  { name: 'Pop', color: '#2cf896', emoji: '🎸' },
  { name: 'Workout', color: '#f89a2c', emoji: '💪' },
  { name: 'Lofi', color: '#9a2cf8', emoji: '☕' },
  { name: 'Sad', color: '#2c9af8', emoji: '💧' },
  { name: 'Party', color: '#f82c9a', emoji: '🥳' },
  { name: 'Classical', color: '#f8f82c', emoji: '🎻' },
];

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { playTrack, currentTrack } = usePlayer();

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 1) {
        getSuggestions(query).then(setSuggestions);
        // Also trigger search if focused and has enough length
        if (isFocused) {
          handleSearch(query);
        }
      } else {
        setSuggestions([]);
        if (query.length === 0) setResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const addToHistory = (term: string) => {
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const removeFromHistory = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(t => t !== term);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleSearch = async (searchTerm?: string) => {
    const finalQuery = searchTerm || query;
    if (!finalQuery.trim()) return;
    
    // Don't close focus immediately on auto-search unless it's an explicit search (like Enter or Suggestion)
    // But for "Search as you type", we keep focus but update results
    try {
      const data = await searchMusic(finalQuery);
      setResults(data);
      if (searchTerm) {
        setQuery(searchTerm); // Sync query if it came from suggestion
        setIsFocused(false); // Close overlay if suggestion picked
      }
      addToHistory(finalQuery);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Fixed Search Header (Visible when focused) */}
      {isFocused && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 110,
          background: 'var(--bg-primary)', zIndex: 2000,
          display: 'flex', alignItems: 'flex-end', padding: '0 24px 16px',
          borderBottom: '1px solid var(--glass-border)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <SearchIcon size={18} />
              </div>
              <input
                type="text" autoFocus placeholder="Songs, artists, albums…"
                value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14,
                  backgroundColor: 'var(--bg-elevated)', border: '1.5px solid var(--accent-primary)',
                  color: '#fff', fontSize: 16, outline: 'none'
                }}
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <X size={18} />
                </button>
              )}
            </div>
            <button onClick={() => { setIsFocused(false); setSuggestions([]); }} style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 15 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="page-container fade-in">
        <h1 className="page-title" style={{ opacity: isFocused ? 0 : 1, transition: 'opacity 0.2s', height: isFocused ? 0 : 'auto', overflow: 'hidden' }}>Search</h1>

        {/* Normal Sticky Search Bar (When NOT focused) */}
        {!isFocused && (
          <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-primary)', margin: '0 -24px 16px', padding: '12px 24px' }}>
            <div style={{ position: 'relative' }} onClick={() => setIsFocused(true)}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <SearchIcon size={18} />
              </div>
              <input readOnly type="text" placeholder="Songs, artists, albums…" value={query} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: 12, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: 15, outline: 'none', cursor: 'pointer' }} />
            </div>
          </div>
        )}

        {/* --- FOCUSED SEARCH OVERLAY --- */}
        {isFocused && (
          <div style={{ position: 'fixed', top: 110, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 1500, overflowY: 'auto', animation: 'fadeIn 0.3s ease' }}>
            {suggestions.length > 0 && query.length > 0 && (
              <div style={{ padding: '16px 24px' }}>
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => handleSearch(s)} style={{ padding: '18px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                    <SearchIcon size={18} color="var(--text-secondary)" />
                    <span style={{ fontSize: 16 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {recentSearches.length > 0 && query.length === 0 && (
              <div>
                <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#000', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Recent Searches</h2>
                  <button onClick={() => { setRecentSearches([]); localStorage.setItem('recent_searches', '[]'); }} style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 700 }}>Clear All</button>
                </div>
                <div style={{ padding: '8px 24px 120px', display: 'flex', flexDirection: 'column' }}>
                  {recentSearches.map((term) => (
                    <div key={term} onClick={() => handleSearch(term)} className="hover-item" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 12px', cursor: 'pointer', borderRadius: 16, margin: '2px -12px', transition: 'background 0.2s' }}>
                      <History size={18} color="var(--text-secondary)" />
                      <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{term}</span>
                      <button onClick={(e) => removeFromHistory(term, e)} style={{ padding: 8, color: 'var(--text-secondary)', opacity: 0.4 }}><X size={20} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {query.length === 0 && recentSearches.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--text-secondary)', padding: '0 40px' }}>
                <SearchIcon size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
                <p style={{ fontSize: 15, opacity: 0.6 }}>Search for your favorite music</p>
              </div>
            )}
          </div>
        )}

        {/* --- RESULTS AREA --- */}
        {results.length > 0 && !isFocused && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Search Results</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {results.map((result) => (
                <div key={result.id} className="hover-item" onClick={() => playTrack(result, results)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 12px', borderRadius: 16, margin: '0 -12px', cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={result.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: currentTrack?.id === result.id ? 'var(--accent-primary)' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.uploaderName}</div>
                  </div>
                  <button onClick={(e) => e.stopPropagation()} style={{ padding: 8, color: 'var(--text-secondary)' }}>
                    <MoreVertical size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {!isFocused && results.length === 0 && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Browse All</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {CATEGORIES.map((cat) => (
                <div key={cat.name} onClick={() => { setQuery(cat.name); handleSearch(cat.name); }} style={{ background: cat.color, height: 100, borderRadius: 16, padding: 16, position: 'relative', overflow: 'hidden', cursor: 'pointer' }} className="hover-scale">
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, marginLeft: 8 }}>{cat.name}</span>
                  <div style={{ position: 'absolute', top: -12, right: -12, width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
