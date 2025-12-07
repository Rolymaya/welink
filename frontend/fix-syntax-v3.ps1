# PowerShell Script to Fix Syntax Errors V3 (Direct String Replacement)
Write-Host "Starting Syntax Fix V3..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts"

$fixedCount = 0

foreach ($file in $files) {
    if (Test-Path $file.FullName) {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # FIX SPECIFIC EMPTY STRING CASE
        if ($content.Contains("fetch(buildApiUrl(''),")) {
            $content = $content.Replace("fetch(buildApiUrl(''),", "fetch(buildApiUrl('')),")
            Write-Host "Fixed empty string ' in $($file.Name)" -ForegroundColor Yellow
        }
        if ($content.Contains('fetch(buildApiUrl(""),')) {
            $content = $content.Replace('fetch(buildApiUrl(""),', 'fetch(buildApiUrl("")),')
            Write-Host "Fixed empty string "" in $($file.Name)" -ForegroundColor Yellow
        }
        
        # FIX DYNAMIC STRING CASES (Backticks)
        # Note: Previous script might have failed if regex didn't match perfectly.
        # Let's try aggressive regex again for backticks just in case
        
        # Fix: fetch(buildApiUrl(`...`), {
        $content = $content -replace 'fetch\(buildApiUrl\(`([^`]*)`\s*,', 'fetch(buildApiUrl(`$1`),'

        # FIX: fetch(buildApiUrl("..."), {
        $content = $content -replace 'fetch\(buildApiUrl\("([^"]*)"\s*,', 'fetch(buildApiUrl("$1"),'
        
        # FIX: fetch(buildApiUrl('...'), {
        $content = $content -replace "fetch\(buildApiUrl\('([^']*)'\s*,", "fetch(buildApiUrl('$1'),"

        if ($content -ne $originalContent) {
            Set-Content $file.FullName $content -NoNewline -Encoding UTF8
            $fixedCount++
        }
    }
}

Write-Host "`nFixed $fixedCount files." -ForegroundColor Cyan
