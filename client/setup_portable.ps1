# Check for python
try {
    python --version
    Write-Host "Python is installed." -ForegroundColor Green
}
catch {
    Write-Host "Python not found. Downloading installer..." -ForegroundColor Yellow
    
    # Download Python 3.11 Installer
    $url = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
    $installer = "python_installer.exe"
    Invoke-WebRequest -Uri $url -OutFile $installer
    
    Write-Host "Installing Python (this may take a minute)..." -ForegroundColor Yellow
    Start-Process -FilePath $installer -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0" -Wait
    
    # Remove installer
    Remove-Item $installer
    
    Write-Host "Python installed! Please RE-RUN this script to continue setup." -ForegroundColor Green
    Read-Host "Press Enter to exit..."
    exit
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Create shortcut on Desktop?
$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\GridPass Client.lnk")
$Shortcut.TargetPath = "$PWD\run.bat"
$Shortcut.IconLocation = "$PWD\client\resources\icon.ico" # If exists
$Shortcut.Save()

Write-Host "Setup Complete! You can run 'GridPass Client' from your Desktop." -ForegroundColor Green
start run.bat
