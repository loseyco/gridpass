$version = Get-Date -Format "yyyyMMdd-HHmmss"
$publicDir = "public"
$clientDir = "client"
$zipPath = "$publicDir\GridPass_Client.zip"
$versionPath = "$publicDir\version.txt"

# Ensure public dir exists
if (!(Test-Path -Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir | Out-Null
}

# Remove old zip
if (Test-Path -Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}

# Create temp dist structure
$tempDist = "$env:TEMP\gridpass_build"
if (Test-Path $tempDist) { Remove-Item $tempDist -Recurse -Force }
New-Item -ItemType Directory -Path "$tempDist\system" | Out-Null

Write-Host "Copying files to temp dist..."
Copy-Item -Path "$clientDir\*" -Destination "$tempDist\system" -Recurse

# Remove excluded items from temp dist
$exclude = @("auth_token.json", "device.json", "__pycache__", ".git", ".gitignore", "config_local.py")
foreach ($ex in $exclude) {
    if (Test-Path "$tempDist\system\$ex") {
        Remove-Item "$tempDist\system\$ex" -Recurse -Force
    }
    Get-ChildItem -Path "$tempDist\system" -Recurse -Filter $ex | Remove-Item -Recurse -Force
}

# Move Entry Points to Root
if (Test-Path "$tempDist\system\GridPass_Setup.bat") {
    Move-Item "$tempDist\system\GridPass_Setup.bat" "$tempDist\GridPass_Setup.bat"
}
if (Test-Path "$tempDist\system\set_env.bat") {
    Move-Item "$tempDist\system\set_env.bat" "$tempDist\set_env.bat"
}
if (Test-Path "$tempDist\system\README.txt") {
    Move-Item "$tempDist\system\README.txt" "$tempDist\README.txt"
}

Write-Host "Zipping build..."
Compress-Archive -Path "$tempDist\*" -DestinationPath $zipPath -Force

# Cleanup
Remove-Item $tempDist -Recurse -Force

# Write version
$version | Set-Content -Path $versionPath
Write-Host "Published Client Version: $version"
Copy-Item "$zipPath" "$publicDir\client.zip" -Force
