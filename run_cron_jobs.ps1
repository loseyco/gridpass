$cronSecret = "gp_news_2026_secure_key_x9A2"
$baseUrl = "http://localhost:3000"

function Run-CronJobData {
    param (
        [string]$Name,
        [string]$Path
    )

    Write-Host "Running $Name..."
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$Path" -Headers @{ "Authorization" = "Bearer $cronSecret" } -Method Get
        Write-Host "Success [$Name]:"
        $response | ConvertTo-Json -Depth 2 | Write-Host
    }
    catch {
        Write-Host "Error running $Name : $_"
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                Write-Host "Error Details: $body"
            }
        }
    }
    Write-Host "--------------------------------"
}

# 1. Run Daily News Scraper
Run-CronJobData -Name "Daily News Scraper" -Path "/api/cron/daily-news"

# 2. Run Facebook Publisher
Run-CronJobData -Name "Facebook Publisher" -Path "/api/cron/facebook-publisher"

# 3. Run Stewards Updates
Run-CronJobData -Name "Stewards Updates" -Path "/api/cron/stewards-updates"

# 4. Run Morning Recap
Run-CronJobData -Name "Morning Recap" -Path "/api/cron/morning-recap"

Write-Host "All local cron jobs triggered."
