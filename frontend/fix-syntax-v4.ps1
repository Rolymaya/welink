# PowerShell Script to Fix Syntax Errors V4 (Revert Regression)
Write-Host "Starting Syntax Fix V4 (Reverting Regression)..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts"

$fixedCount = 0

foreach ($file in $files) {
    if (Test-Path $file.FullName) {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # The V3 script incorrectly turned:
        # fetch(buildApiUrl(''), {
        # into:
        # fetch(buildApiUrl('')), {
        
        # We need to revert this:
        # fetch(buildApiUrl('')), {  ->  fetch(buildApiUrl(''), {
        
        # Fix for single quotes
        if ($content.Contains("fetch(buildApiUrl('')),")) {
            $content = $content.Replace("fetch(buildApiUrl('')),", "fetch(buildApiUrl(''),")
            Write-Host "Fixed regression ' in $($file.Name)" -ForegroundColor Yellow
        }
        
        # Fix for double quotes
        if ($content.Contains('fetch(buildApiUrl("")),')) {
            $content = $content.Replace('fetch(buildApiUrl("")),', 'fetch(buildApiUrl(""),')
            Write-Host "Fixed regression "" in $($file.Name)" -ForegroundColor Yellow
        }
        
        # Fix for backticks
        if ($content.Contains('fetch(buildApiUrl(``)),')) {
            $content = $content.Replace('fetch(buildApiUrl(``)),', 'fetch(buildApiUrl(``),')
            Write-Host "Fixed regression `` in $($file.Name)" -ForegroundColor Yellow
        }
        
        if ($content -ne $originalContent) {
            Set-Content $file.FullName $content -NoNewline -Encoding UTF8
            $fixedCount++
        }
    }
}

Write-Host "`nFixed $fixedCount files." -ForegroundColor Cyan
