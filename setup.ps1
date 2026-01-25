# Quick Setup Script for Windows PowerShell
# Run this from the project root directory

Write-Host "🚀 YouTube to MP3 Converter - Setup Script" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Install Backend Dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed successfully`n" -ForegroundColor Green
} else {
    Write-Host "❌ Backend installation failed`n" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Install Frontend Dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully`n" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend installation failed`n" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "🎉 Setup complete! You can now run the application:`n" -ForegroundColor Green
Write-Host "Backend:  cd backend && npm start" -ForegroundColor Cyan
Write-Host "Frontend: cd frontend && npm run dev`n" -ForegroundColor Cyan
Write-Host "The frontend will be available at http://localhost:5173" -ForegroundColor Yellow
Write-Host "The backend will be available at http://localhost:5000`n" -ForegroundColor Yellow