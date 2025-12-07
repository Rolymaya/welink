# PowerShell Script to Fix Syntax Errors (Closing Parentheses)
Write-Host "Starting Syntax Fix..." -ForegroundColor Cyan

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

$fixedCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalContent = $content
        
        # NOTE: The previous script changed:
        # fetch('http://...  ->  fetch(buildApiUrl('...
        # We need to add the closing ) for buildApiUrl
        
        # Fix 1: fetch calls WITH options (followed by comma)
        # fetch(buildApiUrl('path', -> fetch(buildApiUrl('path'),
        $content = $content -replace "fetch\(buildApiUrl\('([^']+)'\s*,", "fetch(buildApiUrl('$1'),"
        $content = $content -replace 'fetch\(buildApiUrl\("([^"]+)"\s*,', 'fetch(buildApiUrl("$1"),'
        $content = $content -replace 'fetch\(buildApiUrl\(`([^`]+)`\s*,', 'fetch(buildApiUrl(`$1`),'

        # Fix 2: fetch calls WITHOUT options (followed by closing paren of fetch)
        # fetch(buildApiUrl('path') -> fetch(buildApiUrl('path'))
        # But regex needs to be careful not to match the one we just fixed if they look similar?
        # The previous fix added a comma. This looks for )
        $content = $content -replace "fetch\(buildApiUrl\('([^']+)'\s*\)", "fetch(buildApiUrl('$1'))"
        $content = $content -replace 'fetch\(buildApiUrl\("([^"]+)"\s*\)', 'fetch(buildApiUrl("$1"))'
        $content = $content -replace 'fetch\(buildApiUrl\(`([^`]+)`\s*\)', 'fetch(buildApiUrl(`$1`))'

        # Fix 3: href attributes
        # href={buildApiUrl(`...` -> href={buildApiUrl(`...`)}
        # Look for: href={buildApiUrl(`...`}
        $content = $content -replace 'href=\{buildApiUrl\(`([^`]+)`\}', 'href={buildApiUrl(`$1`)}'

        # Another case: if there was interpolation inside the backticks, regex might fail with [^`]+ if it's greedy/non-greedy?
        # Let's try to be specific for the href case seen in errors if possible?
        # Actually simplest is just replacing the `} at the end of these specific lines if we can identify them.
        # But regex replace above handles simple cases. 
        # For complex cases with ${}, `([^`]+)` handles it as long as it doesn't contain backticks inside.
        
        if ($content -ne $originalContent) {
            Set-Content $file $content -NoNewline -Encoding UTF8
            Write-Host "Fixed: $file" -ForegroundColor Green
            $fixedCount++
        }
    }
}

Write-Host "`nFixed $fixedCount files." -ForegroundColor Cyan
