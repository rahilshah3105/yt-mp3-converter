import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, Youtube, Music, Loader, AlertCircle, Play } from 'lucide-react';
import './App.css';

// Get backend URL from environment variable or use localhost for development
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// YouTube URL validation regex
const isYouTubeURL = (url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

function App() {
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('mp3-320');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: input, 2: preview, 3: downloading
  const debounceTimer = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const fetchVideoInfo = async (videoUrl) => {
    if (!videoUrl || !isYouTubeURL(videoUrl)) return;

    setLoading(true);
    setError('');
    setVideoInfo(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/video-info`, { url: videoUrl });
      if (response.data.success) {
        setVideoInfo(response.data.data);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get video information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    
    if (isYouTubeURL(pastedText)) {
      // Clear any existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      // Set a small delay to allow the paste to complete
      debounceTimer.current = setTimeout(() => {
        fetchVideoInfo(pastedText);
      }, 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    fetchVideoInfo(url);
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setDownloading(true);
    setError('');
    setStep(3);

    try {
      // Initiate download with video title
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        url,
        format: selectedFormat,
        title: videoInfo.title
      });

      if (response.data.success && response.data.data.jobId) {
        const jobId = response.data.data.jobId;
        
        // Poll for status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/download/status/${jobId}`);
            
            if (statusResponse.data.success) {
              const jobData = statusResponse.data.data;
              
              if (jobData.status === 'completed') {
                clearInterval(pollInterval);
                
                // Fetch and download file as blob to avoid navigation
                try {
                  const downloadUrl = `${API_BASE_URL}${jobData.downloadUrl}`;
                  const response = await fetch(downloadUrl);
                  const blob = await response.blob();
                  
                  // Create blob URL and trigger download
                  const blobUrl = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = jobData.filename;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  // Clean up blob URL
                  window.URL.revokeObjectURL(blobUrl);
                  
                  console.log('✅ Download started:', jobData.filename);
                } catch (downloadError) {
                  console.error('Download error:', downloadError);
                }
                
                // Reset to initial state
                setDownloading(false);
                setUrl('');
                setVideoInfo(null);
                setStep(1);
                setError('');
                
              } else if (jobData.status === 'failed') {
                clearInterval(pollInterval);
                setError(jobData.error || 'Download failed');
                setDownloading(false);
                setStep(2);
              }
              // If still processing, keep polling
            }
          } catch (pollError) {
            console.error('Status poll error:', pollError);
          }
        }, 2000); // Poll every 2 seconds

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (downloading) {
            setError('Download timeout - please try again');
            setDownloading(false);
            setStep(2);
          }
        }, 300000);
      }
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.error || err.message || 'Download failed');
      setDownloading(false);
      setStep(2);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div className="logo">
            <Youtube className="logo-icon" />
            <span>YouTube to MP3</span>
          </div>
          <div className="tagline">Download high-quality audio from YouTube</div>
        </div>

        <div className="main-content">
          {step === 1 && (
            <div className="input-section">
              <form onSubmit={handleSubmit} className="url-form">
                <div className="input-group">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Paste YouTube URL here..."
                    className="url-input"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="submit-btn"
                  >
                    {loading ? <Loader className="spin" /> : 'Continue'}
                  </button>
                </div>
              </form>
              
              {error && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="features">
                <div className="feature">
                  <Music size={20} />
                  <span>High Quality MP3</span>
                </div>
                <div className="feature">
                  <Download size={20} />
                  <span>Fast Download</span>
                </div>
                <div className="feature">
                  <Play size={20} />
                  <span>No Registration</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && videoInfo && (
            <div className="preview-section">
              <div className="video-preview">
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="thumbnail"
                />
                <div className="video-details">
                  <h3 className="video-title">{videoInfo.title}</h3>
                  <div className="video-meta">
                    <span>By: {videoInfo.author}</span>
                    <span>
                      Duration: {
                        // Extract the part in parentheses, e.g., (11:47)
                        videoInfo.duration.match(/\(([^)]+)\)/)
                          ? videoInfo.duration.match(/\(([^)]+)\)/)[1]
                          : videoInfo.duration
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="format-selection">
                <h4>Select Format:</h4>
                <div className="format-options">
                  {videoInfo.formats.map((format) => (
                    <label key={format.id} className="format-option">
                      <input
                        type="radio"
                        name="format"
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                      />
                      <span>{format.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="download-btn primary"
              >
                {downloading ? (
                  <div className="disabled-btn">
                    <Loader className="spin" />
                    <span>Preparing download...</span>
                  </div>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Convert to MP3</span>
                  </>
                )}
              </button>

              <button 
                onClick={() => {
                  setUrl('');
                  setVideoInfo(null);
                  setError('');
                  setStep(1);
                }}
                className="back-btn"
              >
                Convert another video
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="loading-section">
              <Loader className="spin large" />
              <h3>Converting your video...</h3>
              <p>This may take a few moments</p>
            </div>
          )}
        </div>

        <div className="footer">
          <p>© 2025 YouTube to MP3 Converter. Free online tool.</p>
        </div>
      </div>
    </div>
  );
}

export default App;