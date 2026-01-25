const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ytSearch = require('yt-search');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ytdlp = require('yt-dlp-exec');
const fsPromises = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log('FFmpeg path set:', ffmpegPath);
} else {
    console.log('FFmpeg static not found, using system ffmpeg');
}

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:5174',
        FRONTEND_URL
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Ensure directories exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
    console.log('Created downloads directory');
}

// Utility functions
const getVideoId = (url) => {
    try {
        return ytdl.getVideoID(url);
    } catch (error) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
};

const getVideoThumbnail = (videoId) => {
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
};

const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9\u0600-\u06FF\u4e00-\u9fff\u3400-\u4dbf\s_-]/g, '').trim();
};

// Enhanced download function using ytdl-core + ffmpeg
const downloadAudioWithYtdl = (youtubeUrl, outputPath, quality = '320') => {
    return new Promise((resolve, reject) => {
        console.log('Starting download with ytdl-core...');

        let audioStream;
        try {
            // Get audio stream
            audioStream = ytdl(youtubeUrl, {
                quality: 'highestaudio',
                filter: 'audioonly',
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                }
            });
        } catch (streamError) {
            return reject(new Error('Failed to create audio stream: ' + streamError.message));
        }

        // Set up ffmpeg conversion
        const command = ffmpeg(audioStream)
            .audioBitrate(parseInt(quality))
            .audioCodec('libmp3lame')
            .audioChannels(2)
            .format('mp3')
            .on('start', (commandLine) => {
                console.log('FFmpeg command started:', commandLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' + Math.round(progress.percent) + '% done');
            })
            .on('error', (error) => {
                console.error('FFmpeg error:', error);
                reject(new Error('Audio conversion failed: ' + error.message));
            })
            .on('end', () => {
                console.log('Conversion finished successfully');
                resolve();
            })
            .save(outputPath);

        // Handle stream errors
        audioStream.on('error', (error) => {
            console.error('YouTube stream error:', error);
            reject(new Error('YouTube stream error: ' + error.message));
        });

        // Handle download progress
        audioStream.on('progress', (chunkLength, downloaded, total) => {
            const percent = downloaded / total;
            console.log(`Download progress: ${(percent * 100).toFixed(2)}%`);
        });
    });
};

async function downloadAudioWithYtDlp(youtubeUrl, outputPath, quality = '320') {
    const tempPath = outputPath.replace('.mp3', '.temp.mp3');
    const audioQuality = quality === '320' ? '320K' : quality === '256' ? '256K' : '128K';

    await ytdlp(youtubeUrl, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: audioQuality,
        output: tempPath,
        ffmpegLocation: ffmpegPath,
    });

    // Only rename after ytdlp is done
    await fsPromises.rename(tempPath, outputPath);
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        ffmpeg: !!ffmpegPath
    });
});

app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }

        const videoId = getVideoId(url);
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Try to get info with ytdl-core first
        let videoInfo;
        try {
            const info = await ytdl.getInfo(url);
            videoInfo = {
                id: videoId,
                title: info.videoDetails.title,
                thumbnail: getVideoThumbnail(videoId),
                duration: info.videoDetails.lengthSeconds,
                author: info.videoDetails.author.name,
                views: info.videoDetails.viewCount,
                formats: [
                    { id: 'mp3-320', label: 'MP3 320kbps', quality: '320kbps', type: 'audio' },
                    { id: 'mp3-256', label: 'MP3 256kbps', quality: '256kbps', type: 'audio' },
                    { id: 'mp3-128', label: 'MP3 128kbps', quality: '128kbps', type: 'audio' }
                ]
            };
        } catch (ytdlError) {
            console.log('ytdl-core failed, using yt-search fallback...');
            // Fallback to yt-search
            const searchResult = await ytSearch({ videoId });
            if (!searchResult) {
                return res.status(404).json({ error: 'Video not found' });
            }

            videoInfo = {
                id: videoId,
                title: searchResult.title,
                thumbnail: getVideoThumbnail(videoId),
                duration: searchResult.duration.toString(),
                author: searchResult.author.name,
                views: searchResult.views,
                uploadDate: searchResult.uploadDate,
                formats: [
                    { id: 'mp3-320', label: 'MP3 320kbps', quality: '320kbps', type: 'audio' },
                    { id: 'mp3-256', label: 'MP3 256kbps', quality: '256kbps', type: 'audio' },
                    { id: 'mp3-128', label: 'MP3 128kbps', quality: '128kbps', type: 'audio' }
                ]
            };
        }

        res.json({
            success: true,
            data: videoInfo
        });

    } catch (error) {
        console.error('Video info error:', error);
        res.status(500).json({
            error: 'Failed to get video information',
            details: error.message
        });
    }
});

app.post('/api/download', async (req, res) => {
    console.log('Received download request:', req.body);

    try {
        const { url, format } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const videoId = getVideoId(url);
        if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

        const filename = `${uuidv4()}.mp3`;
        const outputPath = path.join(downloadsDir, filename);

        await downloadAudioWithYtDlp(url, outputPath, format.split('-')[1]);

        res.json({
            success: true,
            data: {
                downloadUrl: `/downloads/${filename}`,
                filename
            }
        });
    } catch (error) {
        console.error('Download process failed:', error);
        res.status(500).json({
            error: 'Download failed',
            details: error.stderr || error.message,
            suggestion: 'This might be due to YouTube restrictions or a temporary error. Please try a different video or try again later.'
        });
    }
});

// Cleanup function for old files
const cleanupOldFiles = () => {
    try {
        if (!fs.existsSync(downloadsDir)) return;

        const files = fs.readdirSync(downloadsDir);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(downloadsDir, file);
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > oneHour) {
                    fs.unlinkSync(filePath);
                    console.log('Cleaned up old file:', file);
                }
            } catch (err) {
                console.error('Error cleaning up file:', err);
            }
        });
    } catch (err) {
        console.error('Error reading downloads directory:', err);
    }
};

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: 'Please try again later'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`⬇️  Download endpoint: http://localhost:${PORT}/api/download`);
    cleanupOldFiles();

    // Schedule regular cleanup every 30 minutes
    setInterval(cleanupOldFiles, 30 * 60 * 1000);
});