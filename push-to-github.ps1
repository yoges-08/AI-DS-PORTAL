# One-click script to commit and push all updates to GitHub repository
param (
    [string]$Message = "Update: Department Student Information System enhancements"
)

Write-Host ">>> Synchronizing with GitHub repository: https://github.com/yoges-08/AI-SA-PORTAL.git <<<" -ForegroundColor Cyan

# Stage all tracked and new files
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    $commitMsg = "$Message - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Creating commit: $commitMsg" -ForegroundColor Yellow
    git commit -m $commitMsg
    
    Write-Host "Pushing to origin main..." -ForegroundColor Yellow
    git push origin main
    Write-Host ">>> Successfully pushed all updates to GitHub! <<<" -ForegroundColor Green
} else {
    Write-Host "Working tree is clean. Everything is already up to date on GitHub!" -ForegroundColor Green
}
