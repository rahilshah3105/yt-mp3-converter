import React, { useState } from 'react';
import axios from 'axios';
import { Download, Youtube, Music, Loader, Check, AlertCircle, Play } from 'lucide-react';
import './App.css';

// Get backend URL from environment variable or use localhost for development
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('mp3-320');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: input, 2: preview, 3: downloading, 4: complete

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setVideoInfo(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/video-info`, { url });
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

  const handleDownload = async () => {
    if (!videoInfo) return;

    setDownloading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        url,
        format: selectedFormat
      });

      if (response.data.success) {
        setDownloadInfo(response.data.data);
        setStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Download failed');
      setStep(2);
    } finally {
      setDownloading(false);
    }
  };

  const handleNewDownload = () => {
    setUrl('');
    setVideoInfo(null);
    setDownloadInfo(null);
    setError('');
    setStep(1);
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
                onClick={handleNewDownload}
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

          {step === 4 && downloadInfo && (
            <div className="download-section">
              <div className="success-message">
                <Check className="success-icon" />
                <h3>Conversion Complete!</h3>
              </div>

              <div className="download-info">
                <div className="file-info">
                  <span className="file-name">{downloadInfo.filename}</span>
                  <span className="file-size">{formatFileSize(downloadInfo.size)}</span>
                </div>

                <a 
                  href={`${API_BASE_URL}${downloadInfo.downloadUrl}`}
                  download={downloadInfo.filename}
                  className="download-btn success"
                >
                  <Download size={18} />
                  <span>Download MP3</span>
                </a>
              </div>

              <button 
                onClick={handleNewDownload}
                className="download-btn outline"
              >
                Convert another video
              </button>
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