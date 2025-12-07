# PowerShell Script to Fix Hardcoded URLs
Write-Host "Starting URL replacement..." -ForegroundColor Cyan

$files = @(
    "src\hooks\useAuth.ts",
    "src\app\admin\subscriptions\page.tsx",
    "src\app\admin\packages\page.tsx",
    "src\app\admin\packages\[id]\edit\page.tsx",
    "src\app\admin\packages\create\page.tsx",
    "src\app\page.tsx",
    "src\app\packages\page.tsx",
    "src\app\company\billing\page.tsx",
    "src\app\company\billing\upgrade\page.tsx",
    "src\app\company\billing\transactions\page.tsx",
    "src\app\company\billing\subscribe\[packageId]\page.tsx",
    "src\app\auth\forgot-password\page.tsx",
    "src\app\auth\reset-password\page.tsx"
)

$importStatement = "import { buildApiUrl } from '@/lib/apiUrl';"
$updatedCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalContent = $content
        
        # Replace URLs
        $content = $content -replace "fetch\('http://localhost:3001", "fetch(buildApiUrl('"
        $content = $content -replace 'fetch\("http://localhost:3001', 'fetch(buildApiUrl("'
        $content = $content -replace 'fetch\(`http://localhost:3001', 'fetch(buildApiUrl(`"'
        $content = $content -replace 'href=\{`http://localhost:3001', 'href={buildApiUrl(`"'
        
        # Add import if needed
        if ($content -match "buildApiUrl" -and $content -notmatch "import.*buildApiUrl") {
            $content = $importStatement + "`r`n" + $content
        }
        
        if ($content -ne $originalContent) {
            Set-Content $file $content -NoNewline -Encoding UTF8
            Write-Host "  Updated" -ForegroundColor Green
            $updatedCount++
        }
    }
}

Write-Host "`nFiles updated: $updatedCount" -ForegroundColor Cyan
