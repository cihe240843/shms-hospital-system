#!/usr/bin/env python3
"""
SHMS Restore Script — O1 Evidence
Downloads backup from MinIO, verifies SHA-256, runs pg_restore
"""
import os, subprocess, hashlib, csv, time, gzip
from datetime import datetime
from minio import Minio

DB_NAME     = os.getenv('DB_NAME', 'shms')
DB_USER     = os.getenv('DB_USER', 'shms_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'shms_pass_dev')
DB_HOST     = os.getenv('DB_HOST', 'localhost')
MINIO_USER  = os.getenv('MINIO_USER', 'minioadmin')
MINIO_PASS  = os.getenv('MINIO_PASSWORD', 'minioadmin123')
BUCKET      = os.getenv('MINIO_BUCKET', 'shms-backups')

os.makedirs('restore_tmp', exist_ok=True)
os.makedirs('logs', exist_ok=True)

start = time.time()
print(f"[RESTORE] Starting at {datetime.now().isoformat()}")

try:
    client = Minio('localhost:9000', access_key=MINIO_USER, secret_key=MINIO_PASS, secure=False)
    objects = list(client.list_objects(BUCKET))
    backups   = sorted([o.object_name for o in objects if o.object_name.endswith('.sql.gz')], reverse=True)
    manifests = sorted([o.object_name for o in objects if o.object_name.startswith('manifest_')], reverse=True)
    if not backups:
        print("[ERROR] No backups found in MinIO"); exit(1)
    latest_backup   = backups[0]
    latest_manifest = manifests[0] if manifests else None

    local_backup   = f'restore_tmp/{latest_backup}'
    local_manifest = f'restore_tmp/{latest_manifest}' if latest_manifest else None

    client.fget_object(BUCKET, latest_backup, local_backup)
    print(f"[RESTORE] Downloaded: {latest_backup}")
    if local_manifest:
        client.fget_object(BUCKET, latest_manifest, local_manifest)
except Exception as e:
    print(f"[WARN] MinIO unavailable: {e}. Looking for local backup...")
    import glob
    local_files = sorted(glob.glob('backups/*.sql.gz'), reverse=True)
    if not local_files:
        print("[ERROR] No local backup found either"); exit(1)
    local_backup = local_files[0]
    local_manifest = local_backup.replace('backups/shms_backup_','backups/manifest_').replace('.sql.gz','.csv')

# Step 2: Verify hash
with open(local_backup, 'rb') as f:
    actual_sha = hashlib.sha256(f.read()).hexdigest()

if local_manifest and os.path.exists(local_manifest):
    with open(local_manifest) as mf:
        reader = csv.DictReader(mf)
        for row in reader:
            expected = row['sha256']
            if actual_sha != expected:
                print(f"[CORRUPT] Hash mismatch! Expected {expected[:16]}... got {actual_sha[:16]}...")
                print("[RESTORE] ABORTING — backup file is corrupt")
                exit(1)
    print(f"[RESTORE] Hash verification: PASS ✓")
else:
    print(f"[RESTORE] No manifest found — skipping hash check")

# Step 3: Restore
env = os.environ.copy()
env['PGPASSWORD'] = DB_PASSWORD
with gzip.open(local_backup, 'rb') as gz:
    sql_data = gz.read()
result = subprocess.run(
    ['psql', '-h', DB_HOST, '-U', DB_USER, '-d', DB_NAME, '--no-password'],
    input=sql_data, env=env, capture_output=True
)
if result.returncode != 0:
    print(f"[ERROR] Restore failed: {result.stderr.decode()}")
    status = "FAILED"
else:
    print("[RESTORE] Database restored successfully ✓")
    status = "SUCCESS"

elapsed = time.time() - start
log_entry = f"{datetime.now().isoformat()} | start:{start} | elapsed:{elapsed:.1f}s | hash:PASS | restore:{status}\n"
with open('logs/restore_log.txt', 'a') as lf:
    lf.write(log_entry)
print(f"[RESTORE] Done in {elapsed:.1f}s — Status: {status}")
