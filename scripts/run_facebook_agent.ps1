# Facebook Message Agent - Automated Scheduler
# Runs the Node.js agent script and logs output

$LogFile = "C:\openclaw\gridpass\scripts\facebook_scheduler_log.txt"
$Date = Get-Date

"[$Date] Starting scheduled Facebook message check..." | Out-File -FilePath $LogFile -Append

# Navigate to project directory and run the agent
Set-Location "C:\openclaw\gridpass"

try {
    # Run the agent (headless mode for scheduled runs)
    $env:PUPPETEER_HEADLESS = "true"
    node scripts/facebook_message_agent.js | Out-File -FilePath $LogFile -Append
    
    "[$Date] Agent completed. Check facebook_agent_log.txt for details." | Out-File -FilePath $LogFile -Append
}
catch {
    "[$Date] Error running agent: $_" | Out-File -FilePath $LogFile -Append
}
