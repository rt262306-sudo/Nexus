import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Search as SearchIcon, Library as LibraryIcon, Heart as HeartIcon, Info, Play, Pause, SkipForward, Loader2, ChevronDown, Video, Music, Clock, Volume2, Menu, Plus, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import './App.css';
import './index.css';

import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import AboutPage from './pages/AboutPage';
import { usePlayer } from './context/PlayerContext';

function App() {
  const {
    currentTrack, isPlaying, isLoading,
    togglePlayPause, progress, duration,
    seek, showVideo, setShowVideo,
    playNext, playPrevious, sleepTimer, setSleepTimer, isTransitioning,
    likedSongs, toggleLike, volume, setVolume,
    playlists, createPlaylist, addToPlaylist
  } = usePlayer();

  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [searchResetKey, setSearchResetKey] = useState(0);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    const isSwipeDown = distance > minSwipeDistance;
    if (isSwipeDown) {
      closePlayer();
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  // Sync showVideo with expanded state and mode
  useEffect(() => {
    setShowVideo(isPlayerExpanded && isVideoMode && !!currentTrack);
  }, [isPlayerExpanded, isVideoMode, currentTrack, setShowVideo]);

  const openPlayer = () => { if (currentTrack) setIsPlayerExpanded(true); };
  const closePlayer = () => { 
    setIsPlayerExpanded(false); 
    setIsMenuOpen(false);
    setShowPlaylistSelector(false);
    setIsCreatingPlaylist(false);
    setNewPlaylistName('');
  };

  return (
    <Router>
      <div className={`app-container${isPlayerExpanded ? ' player-open' : ''}`}>

        {/* ── Main scrollable content ── */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage key={searchResetKey} />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        {/* ── Mini Player Bar ── */}
        <div
          className="player-bar glass-panel fade-in"
          style={{ opacity: currentTrack ? 1 : 0.55, cursor: currentTrack ? 'pointer' : 'default' }}
          onClick={openPlayer}
        >
          {/* Thin progress indicator at top */}
          {currentTrack && duration > 0 && (
            <div className="player-progress-thin" style={{ width: `${progressPercent}%` }} />
          )}
          <div className="player-info">
            {currentTrack?.thumbnail
              ? <img src={currentTrack.thumbnail} className="placeholder-art" alt="Album Art" />
              : <div className="placeholder-art" />
            }
            <div className="player-text">
              <span className="track-title">{currentTrack ? currentTrack.title : 'Not Playing'}</span>
              <span className="track-artist">{currentTrack ? currentTrack.artist : 'Select a track to start'}</span>
            </div>
          </div>
          <div className="player-controls" onClick={(e) => e.stopPropagation()}>
            <button className="play-btn" onClick={togglePlayPause} disabled={!currentTrack}>
              {isLoading ? <Loader2 size={18} className="animate-spin" />
                : isPlaying ? <Pause size={18} fill="currentColor" />
                : <Play size={18} fill="currentColor" />}
            </button>
            <button className="skip-btn" onClick={playNext} disabled={!currentTrack}>
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* ── Full-Screen Player Overlay ── */}
        {/* The YouTube iframe sits at z-index 550 filling the screen when showVideo=true.
            This overlay (z-index 600) layers controls + UI on top of that video. */}
        <div
          className={`full-player-overlay${isPlayerExpanded ? ' expanded' : ''}${isVideoMode && !isTransitioning ? ' video-active' : ''}${isTransitioning ? ' transitioning' : ''}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Grab Handle */}
          <div className="grab-handle" />

          {/* Gradient scrim over the video so text is readable */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.85) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          {/* Header */}
          <div className="full-player-header" style={{ position: 'relative', zIndex: 1 }}>
            <button className="icon-btn" onClick={closePlayer}>
              <ChevronDown size={28} />
            </button>
            
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button 
                className={!isVideoMode ? 'active' : ''} 
                onClick={() => setIsVideoMode(false)}
              >
                <Music size={14} />
                <span>Audio</span>
              </button>
              <button 
                className={isVideoMode ? 'active' : ''} 
                onClick={() => setIsVideoMode(true)}
              >
                <Video size={14} />
                <span>Video</span>
              </button>
            </div>

            <button 
              className="icon-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(true);
              }}
            >
              <Menu size={28} />
            </button>
          </div>

          {/* --- BOTTOM SHEET SETTINGS --- */}
          {isMenuOpen && (
            <div className="bottom-sheet-overlay" onClick={() => setIsMenuOpen(false)}>
              <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="grab-handle" style={{ marginBottom: 24, background: 'rgba(255,255,255,0.1)' }} />
                
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
                  {showPlaylistSelector ? 'Select Playlist' : 'Player Settings'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {!showPlaylistSelector ? (
                    <>
                      {/* Pro Volume Slider */}
                      <div className="pro-slider-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Volume2 size={18} color={volume > 100 ? '#ffcc00' : 'var(--text-secondary)'} />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Volume Booster</span>
                          </div>
                          <span style={{ 
                            fontSize: 14, 
                            fontWeight: 700, 
                            color: volume > 100 ? '#ffcc00' : 'var(--accent-primary)' 
                          }}>
                            {volume}% {volume > 100 ? '⚡ BOOST' : ''}
                          </span>
                        </div>
                        
                        <div 
                          className="pro-slider-bar"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const v = Math.round(((e.clientX - rect.left) / rect.width) * 200);
                            setVolume(v);
                          }}
                        >
                          <div 
                            className={`pro-slider-fill ${volume > 100 ? 'boosted' : ''}`}
                            style={{ width: `${volume / 2}%` }}
                          />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                          * Boost mode amplifies audio beyond standard hardware limits.
                        </p>
                      </div>

                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

                      {/* Sleep Timer */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Clock size={18} color="var(--text-secondary)" />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Sleep Timer</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {[15, 30, 45, 60].map(m => (
                            <button
                              key={m}
                              onClick={() => setSleepTimer(sleepTimer === m ? null : m)}
                              style={{
                                flex: 1,
                                padding: '12px 0',
                                borderRadius: 16,
                                fontSize: 13,
                                fontWeight: 600,
                                background: sleepTimer === m ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                border: '1px solid var(--glass-border)',
                                color: '#fff'
                              }}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

                      {/* Playlist Actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button 
                          onClick={() => setIsCreatingPlaylist(true)}
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                            padding: '14px', borderRadius: 16, background: 'var(--bg-elevated)', 
                            border: '1px solid var(--glass-border)', fontSize: 14, fontWeight: 500, color: 'white'
                          }}
                        >
                          <Plus size={18} /> New Playlist
                        </button>
                        <button 
                          onClick={() => setShowPlaylistSelector(true)}
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                            padding: '14px', borderRadius: 16, background: 'var(--bg-elevated)', 
                            border: '1px solid var(--glass-border)', fontSize: 14, fontWeight: 500, color: 'white'
                          }}
                        >
                          <List size={18} /> Add to List
                        </button>
                      </div>

                      {/* --- Spotify-style Modal Overlay --- */}
                      {isCreatingPlaylist && (
                        <div style={{ 
                          position: 'fixed', inset: 0, zIndex: 3000,
                          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 24, animation: 'fadeIn 0.2s ease'
                        }} onClick={(e) => { e.stopPropagation(); setIsCreatingPlaylist(false); }}>
                          
                            <div 
                              style={{ 
                                width: '100%', maxWidth: 300, background: '#1c1c1e',
                                borderRadius: 24, padding: '28px 24px', textAlign: 'center',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>New Playlist</h2>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Give your playlist a name.</p>
                              
                              <input 
                                autoFocus
                                placeholder="My Playlist #1"
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                style={{ 
                                  width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', 
                                  color: 'white', fontSize: 15, padding: '14px', borderRadius: 12,
                                  outline: 'none', textAlign: 'center', marginBottom: 24
                                }}
                              />

                              <div style={{ display: 'flex', gap: 12 }}>
                                <button 
                                  onClick={() => { setIsCreatingPlaylist(false); setNewPlaylistName(''); }}
                                  style={{ flex: 1, padding: '14px', color: '#fff', fontSize: 14, fontWeight: 500, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => {
                                    if (newPlaylistName.trim()) {
                                      const playlistId = createPlaylist(newPlaylistName.trim());
                                      // AUTO-ADD current song if it exists
                                      if (currentTrack) {
                                        addToPlaylist(playlistId, currentTrack);
                                        showToast(`Added to ${newPlaylistName.trim()}`);
                                      } else {
                                        showToast(`Created ${newPlaylistName.trim()}`);
                                      }
                                      setIsCreatingPlaylist(false);
                                      setNewPlaylistName('');
                                    }
                                  }}
                                  style={{ 
                                    flex: 1, padding: '14px', borderRadius: 12, background: 'var(--accent-primary)',
                                    color: 'white', fontWeight: 700, fontSize: 14
                                  }}
                                >
                                  Create
                                </button>
                              </div>
                            </div>
                        </div>
                      )}

                      {/* --- Toast Notification --- */}
                      {toast.show && (
                        <div style={{
                          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                          background: 'rgba(255,255,255,0.95)', color: '#000', padding: '12px 24px',
                          borderRadius: 30, fontSize: 14, fontWeight: 600, zIndex: 5000,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease'
                        }}>
                          {toast.message}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Playlist Selector List */}
                      <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {playlists.length === 0 ? (
                          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>No playlists yet.</p>
                        ) : (
                          playlists.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                if (currentTrack) addToPlaylist(p.id, currentTrack);
                                setShowPlaylistSelector(false);
                                setIsMenuOpen(false);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                                borderRadius: 16, background: 'var(--bg-elevated)',
                                border: '1px solid var(--glass-border)', color: 'white'
                              }}
                            >
                              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Music size={20} />
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.tracks.length} songs</div>
                              </div>
                            </button>
                          ))
                        )}
                        <button 
                          onClick={() => setShowPlaylistSelector(false)}
                          style={{ marginTop: 8, padding: 12, color: 'var(--text-secondary)', fontSize: 14 }}
                        >
                          Back to Settings
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Album Art Fallback (when video is off) */}
          {!isVideoMode && (
            <div className="full-album-art-container">
              <img 
                src={currentTrack?.thumbnail.replace('mqdefault', 'maxresdefault')} 
                alt="Album Art" 
                className="full-album-art"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentTrack?.thumbnail || '';
                }}
              />
            </div>
          )}

          {/* Spacer — pushes info/controls to the bottom */}
          {isVideoMode && <div style={{ flex: 1 }} />}

          {/* Track info */}
          <div className="full-player-info" style={{ 
            position: 'relative', 
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 8
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="full-title">{currentTrack?.title || '—'}</h2>
              <p className="full-artist">{currentTrack?.artist || 'Select a song to play'}</p>
            </div>
            {currentTrack && (
              <button 
                onClick={() => toggleLike(currentTrack)}
                style={{ padding: 12, background: 'none', border: 'none', color: likedSongs.includes(currentTrack.id) ? 'var(--accent-primary)' : 'white' }}
              >
                <HeartIcon size={28} fill={likedSongs.includes(currentTrack.id) ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="full-player-progress" style={{ position: 'relative', zIndex: 1 }}>
            <div
              className="progress-bar-bg"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - rect.left) / rect.width) * duration);
              }}
            >
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="progress-times">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="full-player-main-controls" style={{ position: 'relative', zIndex: 1, paddingBottom: 40 }}>
            <button className="skip-btn" style={{ transform: 'scaleX(-1)' }} onClick={playPrevious} disabled={!currentTrack}>
              <SkipForward size={28} fill="currentColor" />
            </button>
            <button className="play-btn giant" onClick={togglePlayPause} disabled={!currentTrack}>
              {(isLoading || isTransitioning) ? <Loader2 size={32} className="animate-spin" />
                : isPlaying ? <Pause size={32} fill="currentColor" />
                : <Play size={32} fill="currentColor" />}
            </button>
            <button className="skip-btn" onClick={playNext} disabled={!currentTrack}>
              <SkipForward size={28} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* ── Bottom Navigation ── */}
        <nav className="bottom-nav glass-panel">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Home size={22} /><span>Home</span>
          </NavLink>
          <NavLink 
            to="/search" 
            onClick={() => setSearchResetKey(prev => prev + 1)}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <SearchIcon size={22} /><span>Search</span>
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LibraryIcon size={22} /><span>Library</span>
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <HeartIcon size={22} /><span>About</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
}

export default App;
