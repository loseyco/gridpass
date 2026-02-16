$headers = @{
    "Authorization" = "Bearer f21010"
    "Content-Type"  = "application/json"
}
$body = @{
    subsession_id   = 999999
    track           = @{
        track_name        = "Test Track"
        track_config_name = "Grand Prix"
    }
    start_time      = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    session_results = @(
        @{
            simsession_name = "RACE"
            results         = @(
                @{
                    cust_id           = 12345
                    display_name      = "Test Driver"
                    finish_position   = 0
                    starting_position = 0
                    laps_complete     = 10
                    best_lap_time     = 600000
                    average_lap_time  = 610000
                    incidents         = 0
                    old_irating       = 1500
                }
            )
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/league/ingest" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    $response | ConvertTo-Json | Out-File "test-result.txt"
}
catch {
    $_.Exception.Message | Out-File "test-error.txt"
    $_.ErrorDetails | Out-File -Append "test-error.txt"
}
