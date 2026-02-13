$LogFile = "C:\openclaw\gridpass\scripts\test_log.txt"
$Date = Get-Date
"Hello World! The scheduled task ran successfully at $Date" | Out-File -FilePath $LogFile -Append
Write-Host "Logged to $LogFile"
