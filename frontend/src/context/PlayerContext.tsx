import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { searchMusic, type SearchResult } from '../lib/api';

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  showVideo: boolean;
  setShowVideo: (v: boolean) => void;
  playTrack: (result: SearchResult, list?: SearchResult[]) => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  queue: Track[];
  sleepTimer: number | null; // minutes remaining
  setSleepTimer: (minutes: number | null) => void;
  isTransitioning: boolean;
  likedSongs: string[]; // IDs
  toggleLike: (track: Track | SearchResult) => void;
  volume: number;
  setVolume: (v: number) => void;
  playlists: Playlist[];
  createPlaylist: (name: string) => string; // Returns new ID
  addToPlaylist: (playlistId: string, track: Track | SearchResult) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addToQueueNext: (track: SearchResult) => void;
  addToQueueEnd: (track: SearchResult) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    MediaMetadata: any;
  }
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  // 1. States & Refs
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [volume, setVolumeState] = useState(100);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (ytPlayer.current?.setVolume) {
      ytPlayer.current.setVolume(Math.min(v, 100));
    }
  }, []);

  // Load liked songs from localStorage on init
  useEffect(() => {
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('liked_songs') || '[]');
      setLikedSongs(stored.map(s => s.id || s.videoId));

      const storedPlaylists: Playlist[] = JSON.parse(localStorage.getItem('playlists') || '[]');
      setPlaylists(storedPlaylists);
    } catch { 
      setLikedSongs([]); 
      setPlaylists([]);
    }
  }, []);

  const createPlaylist = useCallback((name: string) => {
    const newId = Date.now().toString();
    const newPlaylist: Playlist = { id: newId, name, tracks: [] };
    setPlaylists(prev => {
      const updated = [...prev, newPlaylist];
      localStorage.setItem('playlists', JSON.stringify(updated));
      return updated;
    });
    return newId;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('playlists', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToPlaylist = useCallback((playlistId: string, track: Track | SearchResult) => {
    const trackToSave: Track = {
      id: track.id,
      title: track.title,
      artist: 'artist' in track ? track.artist : track.uploaderName,
      thumbnail: track.thumbnail,
      videoId: 'videoId' in track ? track.videoId : track.id
    };

    setPlaylists(prev => {
      const updated = prev.map(p => {
        if (p.id === playlistId) {
          if (p.tracks.some(t => t.id === trackToSave.id)) return p;
          return { ...p, tracks: [...p.tracks, trackToSave] };
        }
        return p;
      });
      localStorage.setItem('playlists', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => {
      const updated = prev.map(p => {
        if (p.id === playlistId) {
          return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
        }
        return p;
      });
      localStorage.setItem('playlists', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isTransitioningRef = useRef(false);
  const ytPlayer = useRef<any>(null);
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingVideoId = useRef<string | null>(null);

  // 1. Core Track Loading Helpers
  const startProgressTimer = useCallback(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      if (ytPlayer.current?.getCurrentTime) {
        setProgress(ytPlayer.current.getCurrentTime());
        setDuration(ytPlayer.current.getDuration() || 0);
      }
    }, 500);
  }, []);

  const stopProgressTimer = useCallback(() => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  const loadTrackByIndex = useCallback((index: number) => {
    const track = queueRef.current[index];
    if (!track) return;

    setIsTransitioning(true);
    isTransitioningRef.current = true;
    setIsLoading(true);
    setProgress(0);
    setCurrentTrack(track);
    currentIndexRef.current = index;

    if (ytPlayer.current?.loadVideoById) {
      ytPlayer.current.loadVideoById(track.videoId);
      setIsPlaying(true);
      startProgressTimer();
    } else {
      pendingVideoId.current = track.videoId;
    }

    setTimeout(() => {
      setIsTransitioning(false);
      isTransitioningRef.current = false;
    }, 1000);
  }, [startProgressTimer]);

  // 2. Queue & Playlist Actions
  const addToQueueNext = useCallback((result: SearchResult) => {
    const track: Track = {
      id: result.id,
      title: result.title,
      artist: result.uploaderName,
      thumbnail: result.thumbnail,
      videoId: result.id
    };
    
    if (currentIndexRef.current === -1) {
      queueRef.current = [track];
      loadTrackByIndex(0);
    } else {
      const newQueue = [...queueRef.current];
      newQueue.splice(currentIndexRef.current + 1, 0, track);
      queueRef.current = newQueue;
    }
  }, [loadTrackByIndex]);

  const addToQueueEnd = useCallback((result: SearchResult) => {
    const track: Track = {
      id: result.id,
      title: result.title,
      artist: result.uploaderName,
      thumbnail: result.thumbnail,
      videoId: result.id
    };
    
    if (currentIndexRef.current === -1) {
      queueRef.current = [track];
      loadTrackByIndex(0);
    } else {
      queueRef.current = [...queueRef.current, track];
    }
  }, [loadTrackByIndex]);
  const toggleLike = useCallback((track: Track | SearchResult) => {
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('liked_songs') || '[]');
    const trackId = track.id;
      const isLiked = stored.some(s => (s.id || s.videoId) === trackId);
      
      let updated: any[];
      if (isLiked) {
        updated = stored.filter(s => (s.id || s.videoId) !== trackId);
      } else {
        const toSave = {
          id: trackId,
          title: track.title,
          uploaderName: 'uploaderName' in track ? track.uploaderName : track.artist,
          thumbnail: track.thumbnail
        };
        updated = [...stored, toSave];
      }
      
      localStorage.setItem('liked_songs', JSON.stringify(updated));
      setLikedSongs(updated.map(s => s.id || s.videoId));
    } catch (e) { console.error("Failed to toggle like", e); }
  }, []);

  // 3. Core Actions
  const playTrack = useCallback((result: SearchResult, list?: SearchResult[]) => {
    const track = {
      id: result.id,
      title: result.title,
      artist: result.uploaderName,
      thumbnail: result.thumbnail,
      videoId: result.id,
    };

    let newQueue: Track[] = [];
    let newIndex = 0;

    if (list && list.length > 0) {
      newQueue = list.map(item => ({
        id: item.id,
        title: item.title,
        artist: item.uploaderName,
        thumbnail: item.thumbnail,
        videoId: item.id,
      }));
      newIndex = newQueue.findIndex(t => t.id === track.id);
      if (newIndex === -1) {
        newQueue.unshift(track);
        newIndex = 0;
      }
    } else {
      newQueue = [track];
      newIndex = 0;
    }

    setQueue(newQueue);
    queueRef.current = newQueue;
    currentIndexRef.current = newIndex;
    setIsTransitioning(true);
    isTransitioningRef.current = true;
    setIsLoading(true);
    setProgress(0);
    setCurrentTrack(track);

    if (ytPlayer.current?.loadVideoById) {
      ytPlayer.current.loadVideoById(result.id);
    } else {
      pendingVideoId.current = result.id;
    }
  }, []);

  const playNext = useCallback(async () => {
    const q = queueRef.current;
    const i = currentIndexRef.current;
    
    if (q.length > 0 && i < q.length - 1) {
      // Normal next in queue
      loadTrackByIndex(i + 1);
    } else if (currentTrack) {
      // End of queue or single track mode: fetch related "radio" track
      setIsTransitioning(true);
      isTransitioningRef.current = true;
      try {
        const related = await searchMusic(`${currentTrack.artist} ${currentTrack.title} radio`);
        if (related.length > 0) {
          // Find a song that isn't the current one if possible
          const nextTrack = related.find(t => t.id !== currentTrack.id) || related[0];
          playTrack(nextTrack);
        }
      } catch (err) {
        console.error("Radio mode failed:", err);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }
  }, [loadTrackByIndex, currentTrack, playTrack]);

  const playPrevious = useCallback(() => {
    const q = queueRef.current;
    const i = currentIndexRef.current;
    if (q.length === 0 || i === -1) return;
    const prevIndex = (i - 1 + q.length) % q.length;
    loadTrackByIndex(prevIndex);
  }, [loadTrackByIndex]);

  const togglePlayPause = useCallback(() => {
    if (!ytPlayer.current) return;
    const state = ytPlayer.current.getPlayerState?.();
    if (state === window.YT?.PlayerState?.PLAYING) {
      ytPlayer.current.pauseVideo();
    } else {
      ytPlayer.current.playVideo();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (ytPlayer.current?.seekTo) {
      ytPlayer.current.seekTo(seconds, true);
    }
  }, []);


  // 4. Initialization
  const initPlayer = useCallback(() => {
    if (ytPlayer.current) return;

    ytPlayer.current = new window.YT.Player('yt-player-container', {
      height: '100%',
      width: '100%',
      videoId: '',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        cc_load_policy: 0,
        autohide: 1,
      },
      events: {
        onReady: () => {
          setIsLoading(false);
          if (pendingVideoId.current) {
            ytPlayer.current.loadVideoById(pendingVideoId.current);
            pendingVideoId.current = null;
          }
        },
        onStateChange: (event: any) => {
          const YT = window.YT.PlayerState;
          
          // Clear transition state as soon as video starts activity
          if (event.data === YT.PLAYING || event.data === YT.BUFFERING) {
            setIsTransitioning(false);
            isTransitioningRef.current = false;
          }

          if (event.data === YT.PLAYING) {
            setIsPlaying(true);
            setIsLoading(false);
            setDuration(ytPlayer.current.getDuration() || 0);
            startProgressTimer();
          } else if (event.data === YT.PAUSED) {
            setIsPlaying(false);
            stopProgressTimer();
          } else if (event.data === YT.ENDED) {
            setIsPlaying(false);
            stopProgressTimer();
            setProgress(0);
            playNext();
          } else if (event.data === YT.BUFFERING) {
            setIsLoading(true);
          }
        },
        onError: (event: any) => {
          console.error('YouTube Player Error:', event.data);
          setIsLoading(false);
          setIsPlaying(false);
          playNext();
        },
      },
    });
  }, [playNext, startProgressTimer, stopProgressTimer]);

  // 5. Effects
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }
    window.onYouTubeIframeAPIReady = initPlayer;
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, [initPlayer]);

  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      sleepInterval.current = setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null || prev <= 1) {
            if (ytPlayer.current?.pauseVideo) ytPlayer.current.pauseVideo();
            return null;
          }
          return prev - 1;
        });
      }, 60000);
    } else {
      if (sleepInterval.current) clearInterval(sleepInterval.current);
    }
    return () => { if (sleepInterval.current) clearInterval(sleepInterval.current); };
  }, [sleepTimer]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [
          { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '384x384', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', togglePlayPause);
      navigator.mediaSession.setActionHandler('pause', togglePlayPause);
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, [currentTrack, playNext, playPrevious, togglePlayPause, seek]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, isLoading, progress, duration,
      showVideo, setShowVideo,
      playTrack, togglePlayPause, seek,
      playNext, playPrevious, queue,
      sleepTimer, setSleepTimer, isTransitioning,
      likedSongs, toggleLike,
      volume, setVolume,
      playlists, createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist,
      addToQueueNext, addToQueueEnd
    }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: showVideo ? 1 : 0,
          zIndex: showVideo ? 550 : -1,
          pointerEvents: showVideo ? 'auto' : 'none',
          background: '#000',
          transition: 'opacity 0.3s ease',
          overflow: 'hidden',
          visibility: showVideo ? 'visible' : 'hidden'
        }}
      >
        <div 
          id="yt-player-container" 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(2.5)', 
          }} 
        />
      </div>
      {children}
    </PlayerContext.Provider>
  );
};
