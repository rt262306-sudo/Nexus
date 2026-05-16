const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const searchResults = await yts(query);
    const videos = searchResults.videos.slice(0, 20);

    const results = videos.map(v => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      uploaderName: v.author?.name || 'Unknown',
      duration: v.timestamp
    }));

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

const playdl = require('play-dl');

// Stream endpoint
app.get('/api/stream', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing video id' });

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    
    // Get stream from play-dl
    const stream = await playdl.stream(videoUrl);

    // stream.type is usually 'webm/opus'
    res.header('Content-Type', stream.type === 'opus' ? 'audio/webm; codecs=opus' : `audio/${stream.type}`);
    res.header('Accept-Ranges', 'bytes');

    // Pipe the audio stream directly to the client
    stream.stream.pipe(res);

    stream.stream.on('error', (err) => {
      console.error('Streaming error:', err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

  } catch (error) {
    console.error('Stream setup error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream' });
    }
  }
});

// Suggestions endpoint
const https = require('https');

app.get('/api/suggestions', (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
  
  https.get(url, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json[1] || []);
      } catch (e) {
        res.json([]);
      }
    });
  }).on('error', (err) => {
    console.error('Suggestions API error:', err);
    res.json([]);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend streaming server running on http://localhost:${PORT}`);
});
