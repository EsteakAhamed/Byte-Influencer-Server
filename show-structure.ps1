# PowerShell script to display project structure
# Excludes: node_modules, .git, and other unnecessary files

$outputFile = "project-structure.txt"

# Define exclusions
$exclusions = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    "out",
    ".cache",
    ".vs",
    ".vscode",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".pnpm-debug.log*"
)

function Test-ExcludeItem {
    param([string]$Name)
    foreach ($pattern in $exclusions) {
        if ($Name -like $pattern) {
            return $true
        }
    }
    return $false
}

function Get-IndentString {
    param([int]$Level)
    $indent = ""
    for ($i = 0; $i -lt $Level; $i++) {
        $indent += "    "
    }
    return $indent
}

function Get-DirectoryTree {
    param(
        [string]$Path = ".",
        [int]$Level = 0,
        [bool[]]$IsLastStack = @()
    )
    
    $result = @()
    $items = Get-ChildItem -Path $Path -Force | Where-Object { -not (Test-ExcludeItem $_.Name) } | Sort-Object { -not $_.PSIsContainer }, Name
    
    $total = $items.Count
    for ($i = 0; $i -lt $total; $i++) {
        $isLast = ($i -eq $total - 1)
        $item = $items[$i]
        
        # Build prefix based on stack
        $prefix = ""
        for ($j = 0; $j -lt $Level; $j++) {
            if ($IsLastStack[$j]) {
                $prefix += "    "
            } else {
                $prefix += "|   "
            }
        }
        
        $connector = if ($isLast) { "`-- " } else { "|-- " }
        $name = if ($item.PSIsContainer) { "[$($item.Name)/]" } else { $item.Name }
        $result += "$prefix$connector$name"
        
        if ($item.PSIsContainer) {
            $newStack = $IsLastStack + $isLast
            $result += Get-DirectoryTree -Path $item.FullName -Level ($Level + 1) -IsLastStack $newStack
        }
    }
    
    return $result
}

Write-Host "Generating project structure..." -ForegroundColor Green

$output = @()
$output += "Project Structure"
$output += "================="
$output += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += ""
$output += "."
$output += Get-DirectoryTree

# Write to file
$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "Project structure saved to: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "Contents:" -ForegroundColor Cyan
$output | ForEach-Object { Write-Host $_ }
