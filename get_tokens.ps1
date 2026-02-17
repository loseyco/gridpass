$appId = "1101567568207263"
$appSecret = "5eb61e59a82d331b286daf7d712170bc"
$shortToken = "EAAPp3qZBZAXZA8BQmpF3dNMphqO2OgogDxcdEX1ctubBH5AyAfijviPx89bKHuZCdYZBHjBaFrj2vJ9DyPAamMLtVrxgowq20VFXNnZAmbsN2xvx4BRUkgq5qLKzilzoaqIMiV8GZBtyXxpyvP79cRvRppZBsUaB9EE89tjGvFPyOh3Bw33Y90KGaHZA67nX7ETfz0TklZBAYTZBNr25xvxB4Hs2KHdDyeiT7XqdBRex9Jq5H5p4vZAPb1JCMAkbQ7tovoDfWbgY3R0XHid4L8ps2K2ZBVqs7tZBLUHKfmLTKmKIQZD"
$pageId = "555016541038233"

try {
    # Step 1: Exchange for Long-Lived User Token
    $uri1 = "https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$appId&client_secret=$appSecret&fb_exchange_token=$shortToken"
    $response1 = Invoke-RestMethod -Uri $uri1
    $longToken = $response1.access_token

    if (-not $longToken) {
        Write-Error "Failed to get long-lived user token. Response: $($response1 | ConvertTo-Json)"
        exit 1
    }

    Write-Host "Long-Lived User Token acquired."

    # Step 2: List accounts to find Page
    $uri2 = "https://graph.facebook.com/v22.0/me/accounts?access_token=$longToken"
    $response2 = Invoke-RestMethod -Uri $uri2

    if (-not $response2.data) {
        Write-Error "No accounts found for this user token."
        exit 1
    }

    $match = $response2.data | Where-Object { $_.id -eq $pageId }
    
    if ($match) {
        Write-Host "MATCH FOUND:"
        Write-Host "ID: $($match.id)"
        Write-Host "TOKEN_START"
        Write-Host "$($match.access_token)"
        Write-Host "TOKEN_END"
        $match.access_token | Out-File -FilePath "final_token.txt" -NoNewline -Encoding utf8
    }
    else {
        Write-Error "Page with ID $pageId not found in user accounts."
        Write-Host "Available Pages:"
        $response2.data | ForEach-Object { Write-Host "$($_.name) ($($_.id))" }
    }
}
catch {
    $e = $_.Exception
    if ($e.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($e.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Error "Error Response: $responseBody"
        }
        catch {
            Write-Error "Could not read error response stream."
        }
    }
    Write-Error "An error occurred: $_"
    exit 1
}
