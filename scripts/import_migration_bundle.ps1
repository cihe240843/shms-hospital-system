param(
    [Parameter(Mandatory = $true)]
    [string]$BundleZip,
    [switch]$KeepExistingEnv,
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

if (-not $DryRun -and -not (Test-Path $BundleZip)) {
    throw "Bundle zip not found: $BundleZip"
}

$extractDir = Join-Path (Get-Location) ".migration_import_tmp"
$resolvedZip = if ($DryRun) { $BundleZip } else { (Resolve-Path $BundleZip).Path }
$dumpPath = Join-Path $extractDir "shms_backup.sql"
$envPath = Join-Path $extractDir ".env"

Run-Step "Prepare temporary import directory" {
    if (Test-Path $extractDir) {
        Remove-Item $extractDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $extractDir | Out-Null
}

Run-Step "Extract migration bundle" {
    Expand-Archive -Path $resolvedZip -DestinationPath $extractDir -Force
}

Run-Step "Validate extracted files" {
    if (-not (Test-Path $dumpPath)) {
        throw "shms_backup.sql not found in bundle."
    }
    if (-not (Test-Path $envPath)) {
        throw ".env not found in bundle."
    }
}

Run-Step "Apply .env from bundle" {
    if (-not $KeepExistingEnv) {
        if (Test-Path ".env") {
            Copy-Item ".env" ".env.backup_before_import" -Force
        }
        Copy-Item $envPath ".env" -Force
    }
}

Run-Step "Start database service" {
    docker-compose up -d db | Out-Null
}

Run-Step "Wait for PostgreSQL readiness" {
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $null = docker-compose exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
            $ready = $true
            break
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    if (-not $ready) {
        throw "PostgreSQL did not become ready in time."
    }
}

Run-Step "Copy SQL dump into db container" {
    $containerId = (docker-compose ps -q db).Trim()
    if (-not $containerId) {
        throw "Could not resolve db container ID."
    }
    docker cp $dumpPath "${containerId}:/tmp/shms_backup.sql" | Out-Null
}

Run-Step "Reset public schema" {
    docker-compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"' | Out-Null
}

Run-Step "Restore SQL dump" {
    docker-compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/shms_backup.sql' | Out-Null
}

Run-Step "Start full stack" {
    docker-compose up -d | Out-Null
}

Run-Step "Run Django migrations for safety" {
    docker-compose exec -T backend python manage.py migrate | Out-Null
}

Run-Step "Clean temporary import directory" {
    Remove-Item $extractDir -Recurse -Force
}

Write-Host ""
Write-Host "Import complete."
Write-Host "- Database restored from: $BundleZip"
if ($KeepExistingEnv) {
    Write-Host "- Kept existing .env on laptop"
} else {
    Write-Host "- Applied .env from bundle (previous .env backed up if it existed)"
}
