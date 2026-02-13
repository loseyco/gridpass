# Test Scheduled Task Script
# This runs the Gemini Agent with a "Hello World" prompt.

$LogFile = "C:\openclaw\gridpass\scripts\morning_routine_log.txt"
$Date = Get-Date

"[$Date] Starting Hello World Test..." | Out-File -FilePath $LogFile -Append

$gcloudPath = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

if (Test-Path $gcloudPath) {
    "[$Date] Triggering Agent with Hello World prompt..." | Out-File -FilePath $LogFile -Append
    
    # Run the agent command
    & $gcloudPath gemini code-assist agents execute "gridpass" --prompt "Hello World! This is a test from the scheduled task." | Out-File -FilePath $LogFile -Append
}
else {
    "[$Date] gcloud not found at $gcloudPath" | Out-File -FilePath $LogFile -Append
}

"[$Date] Done." | Out-File -FilePath $LogFile -Append
