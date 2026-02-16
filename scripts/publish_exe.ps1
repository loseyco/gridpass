$version = Get-Date -Format "yyyyMMdd-HHmmss"
$publicDir = "public" # Assume run from root
$zipPath = "$publicDir\GridPass_Client_v$version.zip"
$latestZip = "$publicDir\client.zip"
$versionPath = "$publicDir\version.txt"

# Ensure public dir exists
if (!(Test-Path -Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir | Out-Null
}

# Clean command
Write-Host "Cleaning previous builds..."
if (Test-Path "client\build") { Remove-Item "client\build" -Recurse -Force }
if (Test-Path "client\dist") { Remove-Item "client\dist" -Recurse -Force }
if (Test-Path "client\GridPass.spec") { Remove-Item "client\GridPass.spec" -Force }

# Run PyInstaller
Write-Host "Building EXE..."
Push-Location client

# Note: We use --onedir for faster startup and easier debugging
# --noconsole to hide the black window
# --name GridPass to name the exe
# --add-data to include config.py (though it's source, we might need it? actually config.py is imported, so invalid. 
# We need config_default behaviors. config.py is code.
# But we want config_local.py to NOT be bundled.
# PyInstaller bundles code in config.py.
# The issue is if we modify config.py externally? No, we modify config_local.py.
# So we don't need --add-data for config.py, it's code.

pyinstaller --clean --noconfirm --onedir --noconsole --name "GridPass" `
    --hidden-import "win32timezone" `
    "main.py"

if ($LASTEXITCODE -ne 0) {
    Write-Error "PyInstaller Failed!"
    Pop-Location
    exit 1
}

Pop-Location

# Verify build
$exePath = "client\dist\GridPass\GridPass.exe"
if (!(Test-Path $exePath)) {
    Write-Error "Build failed! GridPass.exe not found at $exePath"
    exit 1
}

# Copy icon if exists
if (Test-Path "$publicDir\icon.png") {
    Copy-Item "$publicDir\icon.png" "client\dist\GridPass\icon.png" -Force
}

# Zip
Write-Host "Zipping build..."
# We want the zip to contain the CONTENTS of the folder, not the folder itself?
# Standard behavior: Extract -> Folder.
# If onedir, we have a folder 'GridPass'.
# Let's zip the 'GridPass' folder so extracting gives you a folder.
Compress-Archive -Path "client\dist\GridPass" -DestinationPath $zipPath -Force

# Update latest links
Copy-Item $zipPath $latestZip -Force

# Write version
$version | Set-Content -Path $versionPath
Write-Host "Published EXE Version: $version" -ForegroundColor Green
Write-Host "Location: $zipPath"
