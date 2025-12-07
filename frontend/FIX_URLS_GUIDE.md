# Script to Replace Hardcoded URLs with Environment Variables

## PowerShell Script

Save this as `fix-urls.ps1` in the frontend directory and run it:

```powershell
# List of files with hardcoded URLs
$files = @(
    "src/hooks/useAuth.ts",
    "src/app/admin/subscriptions/page.tsx",
    "src/app/admin/packages/page.tsx",
    "src/app/admin/packages/[id]/edit/page.tsx",
    "src/app/admin/packages/create/page.tsx",
    "src/app/page.tsx",
    "src/app/packages/page.tsx",
    "src/app/company/billing/page.tsx",
    "src/app/company/billing/upgrade/page.tsx",
    "src/app/company/billing/transactions/page.tsx",
    "src/app/company/billing/subscribe/[packageId]/page.tsx",
    "src/app/auth/forgot-password/page.tsx",
    "src/app/auth/reset-password/page.tsx"
)

# Import the helper
$importStatement = "import { buildApiUrl } from '@/lib/apiUrl';"

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Replace fetch URLs
        $content = $content -replace "fetch\('http://localhost:3001([^']+)'", "fetch(buildApiUrl('`$1')"
        $content = $content -replace 'fetch\("http://localhost:3001([^"]+)"', 'fetch(buildApiUrl("`$1")'
        $content = $content -replace 'fetch\(`http://localhost:3001([^`]+)`', 'fetch(buildApiUrl(`"`$1"`)'
        
        # Replace href URLs
        $content = $content -replace 'href=\{`http://localhost:3001\$\{([^}]+)\}`\}', 'href={buildApiUrl(`/${`$1}`)'
        
        # Add import if not present
        if ($content -notmatch "buildApiUrl") {
            # Add after first import
            $content = $content -replace "(import .+ from .+;)", "`$1`n$importStatement"
        }
        
        Set-Content $file $content -NoNewline
        Write-Host "Updated: $file" -ForegroundColor Green
    }
}

Write-Host "`nDone! Please review the changes." -ForegroundColor Cyan
```

## Manual Instructions (VS Code)

If you prefer manual replacement:

1. Open VS Code
2. Press `Ctrl+Shift+H` (Find and Replace in Files)
3. Enable regex mode (click `.*` button)
4. Find: `fetch\('http://localhost:3001([^']+)'`
5. Replace: `fetch(buildApiUrl('$1')`
6. Click "Replace All"

Then add the import to each modified file:
```typescript
import { buildApiUrl } from '@/lib/apiUrl';
```

## Files to Update

- src/hooks/useAuth.ts (1 occurrence)
- src/app/admin/subscriptions/page.tsx (4 occurrences)
- src/app/admin/packages/page.tsx (2 occurrences)
- src/app/admin/packages/[id]/edit/page.tsx (2 occurrences)
- src/app/admin/packages/create/page.tsx (1 occurrence)
- src/app/page.tsx (1 occurrence)
- src/app/packages/page.tsx (1 occurrence)
- src/app/company/billing/page.tsx (2 occurrences)
- src/app/company/billing/upgrade/page.tsx (1 occurrence)
- src/app/company/billing/transactions/page.tsx (1 occurrence)
- src/app/company/billing/subscribe/[packageId]/page.tsx (3 occurrences)
- src/app/auth/forgot-password/page.tsx (1 occurrence)
- src/app/auth/reset-password/page.tsx (1 occurrence)
