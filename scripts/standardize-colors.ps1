# ClubViz Color Standardization Script
# Updates all pages with new color scheme: bg #031313, cards #0e1f1f with glassmorphism

$ErrorActionPreference = "Continue"

# Define file patterns and replacements
$replacements = @(
    # Background colors
    @{Pattern = 'bg-\[#0a2e30\]'; Replacement = 'bg-[#031313]'},
    @{Pattern = 'bg-\[#1e2328\]'; Replacement = 'bg-[#031313]'},
    @{Pattern = 'bg-\[#0a1518\]'; Replacement = 'bg-[#031313]'},
    @{Pattern = 'from-\[#0d7377\]'; Replacement = 'from-[#031313]'},
    @{Pattern = 'to-\[#222831\]'; Replacement = 'to-[#031313]'},
    @{Pattern = 'from-\[#1a2f32\]'; Replacement = 'from-[#031313]'},
    @{Pattern = 'bg-gradient-to-b from-\[#0d7377\] to-\[#222831\]'; Replacement = 'bg-[#031313]'},
    
    # Card colors - replace with glassmorphism
    @{Pattern = 'bg-\[#222831\]'; Replacement = 'glassmorphism'},
    @{Pattern = 'bg-\[#1a2f32\]'; Replacement = 'glassmorphism'},
    @{Pattern = 'bg-\[#2d343a\]'; Replacement = 'glassmorphism'},
    @{Pattern = 'hover:bg-\[#2a2a38\]'; Replacement = 'hover:glassmorphism-strong'},
    
    # Border colors - update to teal
    @{Pattern = 'border-\[#0c898b\]'; Replacement = 'border-teal-500/30'},
    
    # Header gradients - standardize
    @{Pattern = 'bg-gradient-to-r from-teal-600 to-teal-500'; Replacement = 'header-gradient'},
    @{Pattern = 'bg-gradient-to-r from-teal-500 to-cyan-500'; Replacement = 'header-gradient'},
    
    # Border radius standardization
    @{Pattern = 'rounded-\[23px\]'; Replacement = 'rounded-[20px]'},
    @{Pattern = 'rounded-\[25px\]'; Replacement = 'rounded-xl'},
    @{Pattern = 'rounded-b-\[30px\]'; Replacement = 'rounded-b-[32px]'},
    @{Pattern = 'rounded-\[16px\]'; Replacement = 'rounded-2xl'},
    @{Pattern = 'rounded-\[20px\]'; Replacement = 'rounded-2xl'}
)

# Get all page.tsx files
$files = Get-ChildItem -Path "app" -Filter "page.tsx" -Recurse

Write-Host "Found $($files.Count) page files to update" -ForegroundColor Green

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
    
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($rep in $replacements) {
        $content = $content -replace [regex]::Escape($rep.Pattern), $rep.Replacement
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  [OK] Updated" -ForegroundColor Green
    } else {
        Write-Host "  [-] No changes needed" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Color standardization complete!" -ForegroundColor Green
