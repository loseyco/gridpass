$env = @{
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cG1xc2R5a3VtdGZ1c2ZsaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjA5MDQsImV4cCI6MjA4NTI5NjkwNH0.VLnkH0cYZMQHuqUo8ZuBT3-0a30PM8evtfRXT8Tre40"
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" = "sb_publishable_ZnE5mpfMFlN7-vskwrrUYA_hqDJYhfk"
    "NEXT_PUBLIC_SUPABASE_URL"             = "https://bwpmqsdykumtfusflhri.supabase.co"
    "POSTGRES_DATABASE"                    = "postgres"
    "POSTGRES_HOST"                        = "db.bwpmqsdykumtfusflhri.supabase.co"
    "POSTGRES_PASSWORD"                    = "FrYAJk07BlHG4vPj"
    "POSTGRES_PRISMA_URL"                  = "postgres://postgres.bwpmqsdykumtfusflhri:FrYAJk07BlHG4vPj@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
    "POSTGRES_URL"                         = "postgres://postgres.bwpmqsdykumtfusflhri:FrYAJk07BlHG4vPj@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
    "POSTGRES_URL_NON_POOLING"             = "postgres://postgres.bwpmqsdykumtfusflhri:FrYAJk07BlHG4vPj@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
    "POSTGRES_USER"                        = "postgres"
    "SUPABASE_ANON_KEY"                    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cG1xc2R5a3VtdGZ1c2ZsaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjA5MDQsImV4cCI6MjA4NTI5NjkwNH0.VLnkH0cYZMQHuqUo8ZuBT3-0a30PM8evtfRXT8Tre40"
    "SUPABASE_JWT_SECRET"                  = "5qc+TycUe5MrSPaU11FVPIq3SZoh1VIcQ8kK4Y/yt03enL7L6AHsn/x42JoPHDOPLVC3Nh8qUx1iUC7ck3x94w=="
    "SUPABASE_PUBLISHABLE_KEY"             = "sb_publishable_ZnE5mpfMFlN7-vskwrrUYA_hqDJYhfk"
    "SUPABASE_SECRET_KEY"                  = "sb_secret_1Lp-0RT1pRDDcFyJTNfLCw_qcnaX9gx"
    "SUPABASE_SERVICE_ROLE_KEY"            = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cG1xc2R5a3VtdGZ1c2ZsaHJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTcyMDkwNCwiZXhwIjoyMDg1Mjk2OTA0fQ.6TjsEzSU5DZBV68h11oxbsOxoCLhBNa5F2oT146D_ow"
    "SUPABASE_URL"                         = "https://bwpmqsdykumtfusflhri.supabase.co"
}

foreach ($key in $env.Keys) {
    Write-Host "Updating $key for ALL ENVIRONMENTS..."
    
    # Remove existing key
    cmd /c "npx vercel env rm $key --yes 2>NUL"
    
    # Add new key for each environment
    $val = $env[$key]
    $targets = "production", "preview", "development"
    foreach ($target in $targets) {
        Write-Host "  Adding to $target..."
        $val | npx vercel env add $key $target
    }
}
