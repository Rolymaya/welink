# PowerShell Script to Fix Syntax Errors V2
Write-Host "Starting Syntax Fix V2..." -ForegroundColor Cyan

# Get all TSX/TS files in src
$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts"

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # ---------------------------------------------------------
    # 1. Fix 'use client' position
    # ---------------------------------------------------------
    if ($content -match "['`"]use client['`"]") {
        # Remove existing 'use client'
        $contentWithoutUseClient = $content -replace "['`"]use client['`"];?\s*", ""
        
        # Add it to the very top
        $content = "'use client';`n" + $contentWithoutUseClient
        
        # Clean up potential double imports if any (imports that were pushed down)
        # (This is tricky to do perfectly with regex but ensuring 'use client' is first is the main goal)
    }

    # ---------------------------------------------------------
    # 2. Fix fetch(buildApiUrl(... missing closing paren
    # ---------------------------------------------------------
    
    # CASE A: fetch(buildApiUrl('...'), {
    # Regex explains:
    # fetch\(buildApiUrl\(   : matches literal
    # (['"`])                : capture quote type in group 1
    # (.*?)                  : capture content non-greedy in group 2
    # \1                     : match same quote type
    # \s*,                   : match comma
    # Replacement: fetch(buildApiUrl($1$2$1),
    
    # We essentially want to insert a ) before the comma if strictly missing.
    # But regex replace is easier if we match the whole signature.
    
    # Pattern: fetch(buildApiUrl('PATH',
    # We want: fetch(buildApiUrl('PATH'),
    
    # We use a lookahead or just distinct patterns.
    # Note: The previous script missed cases with empty strings '' because of + quantifier. Use * instead.
    
    $content = $content -replace "fetch\(buildApiUrl\('([^']*)'\s*,", "fetch(buildApiUrl('$1'),"
    $content = $content -replace 'fetch\(buildApiUrl\("([^"]*)"\s*,', 'fetch(buildApiUrl("$1"),'
    $content = $content -replace 'fetch\(buildApiUrl\(`([^`]*)`\s*,', 'fetch(buildApiUrl(`$1`),'

    # ---------------------------------------------------------
    # 3. Fix fetch(buildApiUrl(...)) double closing paren issue if we over-fixed before?
    # ---------------------------------------------------------
    # If we accidentally created fetch(buildApiUrl('path')),, we should fix it.
    # Or fetch(buildApiUrl('path')), { ...
    # This regex `fetch\(buildApiUrl\('([^']*)'\s*,` matches `fetch(buildApiUrl('path',`
    # It does NOT match `fetch(buildApiUrl('path'),` because of the `(` literal in regex.
    # Wait: `fetch\(buildApiUrl\(` matches `fetch(buildApiUrl(`.
    # If the text is `fetch(buildApiUrl('path'),`, the regex `fetch\(buildApiUrl\('([^']*)'\s*,` will MATCH it?
    # No, because `buildApiUrl\(` expects `(` immediately.
    # But `fetch(buildApiUrl('path'),` contains `buildApiUrl(`.
    # Ah, the regex `fetch\(buildApiUrl\` consumes `fetch(buildApiUrl`.
    # Then `\('` consumes `('`.
    # Then path.
    # Then `'`.
    # Then `,`.
    # So `fetch(buildApiUrl('a',` -> MATCHES.
    # `fetch(buildApiUrl('a'),` -> Does NOT match because of the extra `)`.
    # The regex does NOT expect `)`.
    # So this is safe to run repeatedly.
    
    # ---------------------------------------------------------
    # 4. Fix href={buildApiUrl(...) missing closing paren
    # ---------------------------------------------------------
    # Case: href={buildApiUrl(`...`}
    # Should be: href={buildApiUrl(`...`)}
    
    $content = $content -replace 'href=\{buildApiUrl\(`([^`]*)`\}', 'href={buildApiUrl(`$1`)}'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline -Encoding UTF8
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "`nFixed $fixedCount files." -ForegroundColor Cyan
