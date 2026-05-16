import React, { useEffect, useState } from 'react';
import { Heart, Music2, Plus, Play, Trash2, Search as SearchIcon, Loader2, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { searchMusic, type SearchResult } from '../lib/api';

const LibraryPage: React.FC = () => {
  const { playTrack, currentTrack, playlists, deletePlaylist, removeFromPlaylist, addToPlaylist } = usePlayer();
  const [liked, setLiked] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'liked' | 'playlists'>('liked');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId) || null;
  const [isSearchingToAdd, setIsSearchingToAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchingResults, setIsSearchingResults] = useState(false);

  // Debounce search in Library
  useEffect(() => {
    if (!isSearchingToAdd || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingResults(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchMusic(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearchingResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, isSearchingToAdd]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('liked_songs') || '[]');
      setLiked(stored);
    } catch {
      setLiked([]);
    }
  }, []);

  const removeLiked = (id: string) => {
    const updated = liked.filter((s) => s.id !== id);
    setLiked(updated);
    localStorage.setItem('liked_songs', JSON.stringify(updated));
  };

  const TABS = [
    { key: 'liked', label: 'Liked Songs' },
    { key: 'playlists', label: 'Playlists' },
  ] as const;

  return (
    <div className="page-container fade-in">
      <h1 className="page-title">Library</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'liked' && (
        <>
          {/* Liked Songs Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)',
            marginBottom: 24,
            boxShadow: '0 6px 20px rgba(248,44,90,0.3)',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Heart size={26} fill="white" color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Liked Songs</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>{liked.length} song{liked.length !== 1 ? 's' : ''}</div>
            </div>
            {liked.length > 0 && (
              <button
                onClick={() => liked.length > 0 && playTrack(liked[0], liked)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Play size={18} fill="white" color="white" />
              </button>
            )}
          </div>

          {/* Song List */}
          {liked.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <Music2 size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No liked songs yet</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6, opacity: 0.7 }}>
                Search for a song and tap ♥ to save it here
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {liked.map((song) => (
                <div
                  key={song.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 8px',
                    borderRadius: 10,
                    background: currentTrack?.title === song.title ? 'rgba(248,44,90,0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => playTrack(song, liked)}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--bg-elevated)',
                  }}>
                    {song.thumbnail && (
                      <img src={song.thumbnail} alt={song.title} style={{ width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: currentTrack?.title === song.title ? 'var(--accent-primary)' : 'inherit',
                    }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {song.uploaderName}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeLiked(song.id); }}
                    style={{ color: 'var(--text-secondary)', padding: 6 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'playlists' && (
        <>
          {selectedPlaylistId && selectedPlaylist ? (
            /* --- PLAYLIST DETAIL VIEW --- */
            <div className="fade-in">
              <button 
                onClick={() => setSelectedPlaylistId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 20, padding: '8px 0', fontSize: 14 }}
              >
                ← Back to Playlists
              </button>

              <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'flex-end' }}>
                <div style={{ 
                  width: 120, height: 120, borderRadius: 16, 
                  background: 'linear-gradient(45deg, var(--bg-secondary), var(--accent-primary))',
                  overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  {selectedPlaylist.tracks.length > 0 ? (
                    <img src={selectedPlaylist.tracks[0].thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Music2 size={40} color="rgba(255,255,255,0.2)" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{selectedPlaylist.name}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{selectedPlaylist.tracks.length} songs</p>
                </div>
                <button 
                  onClick={() => setIsSearchingToAdd(true)}
                  style={{ padding: '12px', borderRadius: 12, background: 'var(--accent-primary)', color: 'white', boxShadow: '0 4px 12px rgba(248,44,90,0.3)' }}
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Full Screen Search Overlay for Adding Songs */}
              {isSearchingToAdd && (
                <div 
                  style={{ 
                    position: 'fixed', inset: 0, background: 'var(--bg-primary)', 
                    zIndex: 5000, display: 'flex', flexDirection: 'column',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--glass-border)' }}>
                    <button onClick={() => { setIsSearchingToAdd(false); setSearchQuery(''); setSearchResults([]); }} style={{ color: 'var(--text-secondary)' }}>
                      <X size={24} />
                    </button>
                    <h3 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Add to {selectedPlaylist.name}</h3>
                    <button 
                      onClick={() => { setIsSearchingToAdd(false); setSearchQuery(''); setSearchResults([]); }}
                      style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
                    >
                      Done
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div style={{ padding: '16px 24px' }}>
                    <div className="search-bar" style={{ background: 'var(--bg-elevated)', margin: 0, position: 'relative' }}>
                      <SearchIcon size={20} color="var(--text-secondary)" />
                      <input 
                        autoFocus
                        placeholder="Search for songs..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: 16 }}
                      />
                      {isSearchingResults && (
                        <Loader2 className="animate-spin" size={18} style={{ color: 'var(--accent-primary)', marginLeft: 8 }} />
                      )}
                    </div>
                  </div>

                  {/* Results */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 120px' }}>
                    {isSearchingResults && searchResults.length === 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                        <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 80 }}>
                        <SearchIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p>{searchQuery.length > 0 ? "No songs found" : "Search for songs to add"}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {searchResults.map(result => (
                          <div 
                            key={result.id} 
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 16, padding: '12px',
                              borderRadius: 12, background: 'rgba(255,255,255,0.03)'
                            }}
                          >
                            <img src={result.thumbnail} alt="" style={{ width: 48, height: 48, borderRadius: 8 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.title}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.uploaderName}</div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                addToPlaylist(selectedPlaylist.id, result);
                                // No need to manually refresh, selectedPlaylist is derived from playlists
                              }}
                              style={{ 
                                padding: '8px 16px', borderRadius: 20, 
                                background: selectedPlaylist.tracks.some(t => t.id === result.id) ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)', 
                                color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                              }}
                              disabled={selectedPlaylist.tracks.some(t => t.id === result.id)}
                            >
                              {selectedPlaylist.tracks.some(t => t.id === result.id) ? 'Added' : 'Add'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selectedPlaylist.tracks.map((track) => (
                  <div
                    key={track.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', borderRadius: 12,
                      background: currentTrack?.id === track.id ? 'rgba(248,44,90,0.1)' : 'transparent'
                    }}
                    onClick={() => {
                      const list: SearchResult[] = selectedPlaylist.tracks.map(t => ({
                        id: t.id, title: t.title, thumbnail: t.thumbnail, uploaderName: t.artist,
                        type: 'stream', url: '', streamUrl: ''
                      }));
                      playTrack(list.find(l => l.id === track.id)!, list);
                    }}
                  >
                    <img src={track.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 8 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: currentTrack?.id === track.id ? 'var(--accent-primary)' : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.artist}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromPlaylist(selectedPlaylist.id, track.id);
                      }}
                      style={{ padding: 8, color: 'var(--text-secondary)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {selectedPlaylist.tracks.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>No songs in this playlist yet.</p>
                )}
              </div>
            </div>
          ) : (
            /* --- PLAYLIST LIST VIEW --- */
            <>
              {/* Playlist List */}
              {playlists.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 40 }}>
                  <Music2 size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No playlists yet</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                      style={{
                        padding: 16,
                        borderRadius: 20,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        width: '100%', aspectRatio: '1', borderRadius: 12, 
                        background: 'linear-gradient(45deg, var(--bg-secondary), var(--accent-primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {playlist.tracks.length > 0 ? (
                          <img src={playlist.tracks[0].thumbnail} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Music2 size={32} color="rgba(255,255,255,0.3)" />
                        )}
                      </div>
                      
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {playlist.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {playlist.tracks.length} song{playlist.tracks.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: '50%' }}
                      >
                        <Trash2 size={14} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;
