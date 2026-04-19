param(
    [string]$BackupDir = "backups/nightly",
    [int]$RetentionDays = 14,
    [string]$DbUser = "shms_user",
    [string]$DbName = "shms",
    [string]$DbServiceName = "db"
)

$ErrorActionPreference = "Stop"

# Move to repository root (script lives under scripts/).
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Test-Path $BackupDir)) {
    New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$containerDumpPath = "/tmp/shms_${timestamp}.dump"
$hostDumpPath = Join-Path $BackupDir "shms_${timestamp}.dump"

Write-Host "[BACKUP] Starting nightly backup at $timestamp"

# 1) Create Postgres custom-format dump inside db container.
docker compose exec -T db pg_dump -U $DbUser -d $DbName -Fc -f $containerDumpPath
if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed inside db container."
}

# 2) Copy dump from container to host backup folder.
docker compose cp "${DbServiceName}:${containerDumpPath}" $hostDumpPath
if ($LASTEXITCODE -ne 0) {
    throw "Failed to copy dump from container to host."
}

# 3) Remove temporary dump from container.
docker compose exec -T db rm -f $containerDumpPath | Out-Null

# 4) Cleanup old dumps.
$cutoff = (Get-Date).AddDays(-1 * [Math]::Abs($RetentionDays))
Get-ChildItem -Path $BackupDir -Filter "*.dump" -File |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    Remove-Item -Force

$sizeMb = [Math]::Round((Get-Item $hostDumpPath).Length / 1MB, 2)
Write-Host "[BACKUP] Completed: $hostDumpPath (${sizeMb} MB)"
Write-Host "[BACKUP] Retention: $RetentionDays days"