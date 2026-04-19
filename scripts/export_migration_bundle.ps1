param(
    [string]$OutputZip,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Run-Step {
    param(
        [string]$Title,
        [scriptblock]$Action
    )

    Write-Host "==> $Title"
    if ($DryRun) {
        Write-Host "    [dry-run] skipped"
        return
    }
    & $Action
}

if (-not (Test-Path "docker-compose.yml")) {
    throw "Run this script from the repository root (where docker-compose.yml exists)."
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if (-not $OutputZip) {
    $OutputZip = "shms_migration_bundle_$timestamp.zip"
}

$tempDir = Join-Path (Get-Location) ".migration_bundle_$timestamp"
$dumpPath = Join-Path $tempDir "shms_backup.sql"
$envPath = Join-Path $tempDir ".env"
$metaPath = Join-Path $tempDir "bundle_info.txt"

Run-Step "Create temporary bundle directory" {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

Run-Step "Export PostgreSQL database from db container" {
    $dump = docker-compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
    [System.IO.File]::WriteAllText($dumpPath, $dump)
}

Run-Step "Copy .env into bundle" {
    if (-not (Test-Path ".env")) {
        throw ".env not found in repository root."
    }
    Copy-Item ".env" $envPath -Force
}

Run-Step "Write bundle metadata" {
    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    $commit = (git rev-parse HEAD).Trim()
    $created = (Get-Date).ToString("s")

    @(
        "created_at=$created"
        "git_branch=$branch"
        "git_commit=$commit"
        "notes=Bundle contains shms_backup.sql and .env"
    ) | Set-Content $metaPath
}

Run-Step "Create zip archive" {
    if (Test-Path $OutputZip) {
        Remove-Item $OutputZip -Force
    }
    Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $OutputZip
}

Run-Step "Clean temporary directory" {
    Remove-Item $tempDir -Recurse -Force
}

Write-Host ""
Write-Host "Migration bundle created: $OutputZip"
Write-Host "Copy this zip file to your laptop and run scripts/import_migration_bundle.ps1 there."
