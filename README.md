# 🎵 YouTube to MP3 Converter

A modern, full-stack web application that allows users to convert YouTube videos to high-quality MP3 audio files. Built with React and Node.js, featuring a beautiful responsive UI and fast conversion capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)

## ✨ Features

- 🎬 **Easy Video Conversion** - Simply paste a YouTube URL and convert to MP3
- 🎨 **Modern UI** - Beautiful, responsive interface with smooth animations
- ⚡ **Fast Processing** - Efficient conversion using FFmpeg and yt-dlp
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🔊 **Multiple Quality Options** - Choose from different audio bitrates (128kbps, 192kbps, 320kbps)
- 📊 **Video Preview** - See video details, thumbnail, and metadata before downloading
- ✅ **No Registration** - Free to use without creating an account
- 🌐 **Cross-Platform** - Works on Windows, macOS, and Linux

## 🚀 Demo

### Application Workflow:
1. **Enter URL** - Paste any YouTube video URL
2. **Preview** - View video information and select audio quality
3. **Convert** - Process the video to MP3 format
4. **Download** - Get your high-quality MP3 file

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Next-generation frontend build tool
- **Axios** - HTTP client for API requests
- **Lucide React** - Beautiful icon library
- **CSS3** - Custom responsive styling with animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Fast web framework
- **ytdl-core** - YouTube video downloader
- **yt-dlp-exec** - Enhanced YouTube downloader wrapper
- **FFmpeg** - Audio/video processing
- **yt-search** - YouTube video search and metadata
- **UUID** - Unique file naming

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn** package manager
- **FFmpeg** (automatically installed via ffmpeg-static)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/youtube-to-mp3-converter.git
cd youtube-to-mp3-converter
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## 🎯 Usage

### Running the Application

#### Start Backend Server
```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```
The backend server will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Building for Production

#### Build Frontend
```bash
cd frontend
npm run build
```
The optimized production build will be in the `frontend/dist` directory.

## 📁 Project Structure

```
youtube-to-mp3-converter/
├── backend/
│   ├── downloads/          # Temporary storage for converted files
│   ├── server.js           # Express server and API routes
│   ├── package.json        # Backend dependencies
│   └── node_modules/
│
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── assets/        # Images, fonts, etc.
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Component styles
│   │   ├── index.css      # Global styles
│   │   └── main.jsx       # React entry point
│   ├── index.html         # HTML template
│   ├── vite.config.js     # Vite configuration
│   ├── package.json       # Frontend dependencies
│   └── node_modules/
│
└── README.md              # This file
```

## 🔌 API Endpoints

### POST `/api/video-info`
Get information about a YouTube video
```json
Request:
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}

Response:
{
  "success": true,
  "data": {
    "title": "Video Title",
    "author": "Channel Name",
    "duration": "Duration (MM:SS)",
    "thumbnail": "thumbnail_url",
    "formats": [
      { "id": "mp3-128", "label": "128 kbps" },
      { "id": "mp3-192", "label": "192 kbps" },
      { "id": "mp3-320", "label": "320 kbps" }
    ]
  }
}
```

### POST `/api/download`
Download and convert video to MP3
```json
Request:
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "format": "mp3-320"
}

Response:
{
  "success": true,
  "data": {
    "filename": "converted_file.mp3",
    "size": 5242880,
    "downloadUrl": "/downloads/file_id.mp3"
  }
}
```

## 🎨 Features in Detail

### Responsive Design
- **Mobile-first approach** with breakpoints at 480px, 768px, and 1024px
- **Touch-friendly** buttons and interface elements
- **Adaptive layouts** that reflow based on screen size

### UI/UX Enhancements
- **Smooth animations** - Fade-in, slide-in, and bounce effects
- **Loading states** - Visual feedback during processing
- **Error handling** - Clear error messages with suggestions
- **Progress indicators** - Know what's happening at each step

### Audio Quality Options
- **128 kbps** - Good quality, smaller file size
- **192 kbps** - High quality, balanced size
- **320 kbps** - Premium quality, larger file size

## ⚙️ Configuration

### Backend Port
Change the port in `backend/server.js`:
```javascript
const PORT = process.env.PORT || 5000;
```

### Frontend API URL
Update the API endpoint in `frontend/src/App.jsx` if your backend runs on a different port:
```javascript
const response = await axios.post('http://localhost:5000/api/download', { ... });
```

### CORS Settings
Modify allowed origins in `backend/server.js`:
```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
```

## 🐛 Troubleshooting

### Common Issues

**Issue: FFmpeg not found**
- Solution: The application uses `ffmpeg-static` which should install automatically. If issues persist, install FFmpeg manually on your system.

**Issue: Video download fails**
- Solution: Some videos may be restricted. Try a different video or check your internet connection.

**Issue: CORS errors**
- Solution: Ensure both frontend and backend are running and CORS origins are properly configured.

**Issue: Port already in use**
- Solution: Change the port number in the configuration or stop the process using the port.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This tool is for personal use only. Please respect copyright laws and YouTube's Terms of Service. Only download content you have the right to download.

## 👨‍💻 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ using React and Node.js