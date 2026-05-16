// We are switching from Piped (YouTube) to the Saavn Unofficial API (saavn.dev)
// because public YouTube scrapers constantly face 502 Bad Gateway and CORS bans.
// This API is built specifically for music, is highly stable, and gives 320kbps streams!

// We are now using our custom Node.js backend (running on port 4000).
// This guarantees we get FULL songs from YouTube without any Cloudflare blocks,
// 30-second limitations, or CORS errors, because it's running locally!

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  thumbnail: string;
  uploaderName: string;
  url: string;
  streamUrl: string;
}

export const searchMusic = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const results = await response.json();
    
    if (results && Array.isArray(results)) {
      return results.map((song: any) => ({
        id: song.id,
        title: song.title,
        type: 'stream',
        thumbnail: song.thumbnail,
        uploaderName: song.uploaderName,
        url: `https://www.youtube.com/watch?v=${song.id}`,
        // Point the streamUrl to our backend proxy endpoint!
        streamUrl: `${BACKEND_URL}/stream?id=${song.id}`
      }));
    }
    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

export const getSuggestions = async (query: string): Promise<string[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/suggestions?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
};

export const getStreamData = async (_videoId: string): Promise<any> => {
  return null; 
};

export const extractVideoId = (url: string) => url;



