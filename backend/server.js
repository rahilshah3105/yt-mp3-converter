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

// Download jobs tracking
const downloadJobs = new Map();
const recentJobByVideo = new Map();
const JOB_REUSE_WINDOW_MS = 20 * 1000;

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎵 YouTube to MP3 Converter API',
        status: 'running',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            videoInfo: 'POST /api/video-info',
            download: 'POST /api/download'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

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

const getQualityFromFormat = (format) => {
    if (typeof format !== 'string') return '320';
    const quality = format.split('-')[1];
    if (!quality) return '320';
    return ['128', '256', '320'].includes(quality) ? quality : '320';
};

const getAvailableFilename = async (baseTitle) => {
    const safeBaseTitle = baseTitle || 'audio';
    let candidate = `${safeBaseTitle}.mp3`;
    let candidatePath = path.join(downloadsDir, candidate);
    let duplicateIndex = 1;

    while (true) {
        try {
            await fsPromises.access(candidatePath);
            candidate = `${safeBaseTitle} (${duplicateIndex}).mp3`;
            candidatePath = path.join(downloadsDir, candidate);
            duplicateIndex += 1;
        } catch {
            return {
                filename: candidate,
                outputPath: candidatePath
            };
        }
    }
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
    console.log('🎵 Starting yt-dlp download...');
    console.log('   URL:', youtubeUrl);
    console.log('   Output:', outputPath);
    console.log('   Quality:', quality);
    
    const audioBitrate = quality === '320' ? '320' : quality === '256' ? '256' : '128';

    try {
        console.log('📥 Executing yt-dlp with advanced options...');
        await ytdlp(youtubeUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            postprocessorArgs: `ffmpeg:-b:a ${audioBitrate}k`,
            format: 'bestaudio/best',
            output: outputPath,
            ffmpegLocation: ffmpegPath,
            noPlaylist: true,
            preferFreeFormats: true,
            concurrentFragments: 4,
            socketTimeout: 30,
            retries: 2,
            fragmentRetries: 2,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language:en-us,en;q=0.5',
                'Sec-Fetch-Mode:navigate'
            ],
            noCheckCertificates: true,
            noCallHome: true,
        });

        console.log('✅ yt-dlp download complete');
        console.log('✅ File ready:', outputPath);
        
        // Verify file exists
        const exists = await fsPromises.access(outputPath).then(() => true).catch(() => false);
        if (!exists) {
            throw new Error('File was not created by yt-dlp');
        }
        
    } catch (error) {
        console.error('❌ yt-dlp download failed:', error.message);
        console.error('   Full error:', error);
        
        // Clean up partial files
        try {
            await fsPromises.unlink(outputPath);
        } catch (unlinkError) {
            console.error('Error during cleanup of partial file:', outputPath);
        }
        
        throw error;
    }
}

// Routes
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
    console.log('========================================');
    console.log('📥 NEW DOWNLOAD REQUEST');
    console.log('========================================');
    console.log('Request body:', req.body);

    try {
        const { url, format, title } = req.body;
        
        console.log('🔍 Validating request...');
        if (!url) {
            console.log('❌ No URL provided');
            return res.status(400).json({ error: 'URL is required' });
        }

        const videoId = getVideoId(url);
        console.log('🎬 Video ID:', videoId);
        
        if (!videoId) {
            console.log('❌ Invalid YouTube URL');
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const selectedQuality = getQualityFromFormat(format);
        const dedupeKey = `${videoId}:${selectedQuality}`;
        const now = Date.now();

        const existingRequest = recentJobByVideo.get(dedupeKey);
        if (existingRequest && now - existingRequest.createdAtMs <= JOB_REUSE_WINDOW_MS) {
            const existingJob = downloadJobs.get(existingRequest.jobId);
            if (existingJob && (existingJob.status === 'processing' || existingJob.status === 'completed')) {
                console.log('♻️ Reusing existing job:', existingRequest.jobId);
                return res.json({
                    success: true,
                    data: {
                        jobId: existingRequest.jobId,
                        status: existingJob.status,
                        reused: true
                    }
                });
            }
        }

        // Use provided title or fallback to a safe default
        const sanitizedTitle = title ? sanitizeFilename(title) : '';
        const videoTitle = sanitizedTitle || 'audio';
        console.log('📝 Video Title:', videoTitle);

        const jobId = uuidv4();
        const { filename, outputPath } = await getAvailableFilename(videoTitle);
        
        console.log('💾 File details:');
        console.log('   Job ID:', jobId);
        console.log('   Video Title:', videoTitle);
        console.log('   Filename:', filename);
        console.log('   Format:', format);
        console.log('   Quality:', selectedQuality);

        // Create job entry
        downloadJobs.set(jobId, {
            status: 'processing',
            progress: 0,
            filename,
            videoTitle,
            quality: selectedQuality,
            createdAt: new Date().toISOString(),
            error: null
        });

        recentJobByVideo.set(dedupeKey, {
            jobId,
            createdAtMs: now
        });

        // Respond immediately
        console.log('✅ Job created, responding immediately');
        res.json({
            success: true,
            data: {
                jobId,
                status: 'processing'
            }
        });

        // Start download in background
        console.log('⏳ Starting background download...');
        const startTime = Date.now();

        (async () => {
            let timeoutHandle;
            try {
                await Promise.race([
                    (async () => {
                        await downloadAudioWithYtDlp(url, outputPath, selectedQuality);
                    })(),
                    new Promise((_, reject) => {
                        timeoutHandle = setTimeout(() => {
                            reject(new Error('Download timeout after 5 minutes'));
                        }, 300000);
                    })
                ]);

                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`✅ Download completed in ${duration}s`);
                console.log('🔍 Verifying file...');

                const stats = await fsPromises.stat(outputPath);
                console.log('📊 File stats:');
                console.log('   Size:', stats.size, 'bytes');
                console.log('   Size (MB):', (stats.size / 1024 / 1024).toFixed(2), 'MB');

                downloadJobs.set(jobId, {
                    status: 'completed',
                    progress: 100,
                    filename,
                    videoTitle,
                    quality: selectedQuality,
                    downloadUrl: `/downloads/${encodeURIComponent(filename)}`,
                    size: stats.size,
                    completedAt: new Date().toISOString(),
                    error: null
                });

                console.log('✅ Job completed successfully:', jobId);
            } catch (error) {
                console.error('❌ Download failed:', error.message);
                console.error('   Stack:', error.stack);

                downloadJobs.set(jobId, {
                    status: 'failed',
                    progress: 0,
                    filename,
                    videoTitle,
                    quality: selectedQuality,
                    failedAt: new Date().toISOString(),
                    error: error.message
                });

                console.log('❌ Job failed:', jobId);

                const dedupeEntry = recentJobByVideo.get(dedupeKey);
                if (dedupeEntry && dedupeEntry.jobId === jobId) {
                    recentJobByVideo.delete(dedupeKey);
                }

                try {
                    await fsPromises.unlink(outputPath);
                } catch (unlinkError) {
                    console.error('Error during cleanup of partial file:', outputPath);
                }
            } finally {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
            }
        })();

    } catch (error) {
        console.error('========================================');
        console.error('❌ REQUEST FAILED');
        console.error('========================================');
        console.error('Error message:', error.message);
        console.error('========================================');

        if (res.headersSent) {
            return;
        }

        res.status(500).json({
            error: 'Request failed',
            details: error.message
        });
    }
});

// Status endpoint to check download progress
app.get('/api/download/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    
    console.log('📊 Status check for job:', jobId);
    const job = downloadJobs.get(jobId);
    
    if (!job) {
        console.log('❌ Job not found:', jobId);
        return res.status(404).json({ error: 'Job not found' });
    }
    
    console.log('📊 Job status:', job.status);
    res.json({
        success: true,
        data: job
    });
});

// Cleanup function for old files and jobs
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

        // Clean up old job entries (older than 1 hour)
        for (const [jobId, job] of downloadJobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed') {
                downloadJobs.delete(jobId);
            }
        }

        // Clean up stale dedupe entries
        for (const [key, value] of recentJobByVideo.entries()) {
            if (now - value.createdAtMs > JOB_REUSE_WINDOW_MS * 3) {
                recentJobByVideo.delete(key);
            }
        }
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