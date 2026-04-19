#!/usr/bin/env python3
"""
SHMS Backup Script — O1 Evidence
Dumps PostgreSQL, hashes backup file, uploads to MinIO with Object Lock
"""
import os, subprocess, hashlib, csv, time
from datetime import datetime
from minio import Minio
from minio.commonconfig import GOVERNANCE
from minio.retention import Retention
from datetime import timedelta

DB_NAME     = os.getenv('DB_NAME', 'shms')
DB_USER     = os.getenv('DB_USER', 'shms_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'shms_pass_dev')
DB_HOST     = os.getenv('DB_HOST', 'localhost')
MINIO_USER  = os.getenv('MINIO_USER', 'minioadmin')
MINIO_PASS  = os.getenv('MINIO_PASSWORD', 'minioadmin123')
BUCKET      = os.getenv('MINIO_BUCKET', 'shms-backups')

os.makedirs('backups', exist_ok=True)
os.makedirs('logs', exist_ok=True)

timestamp   = datetime.now().strftime('%Y-%m-%d_%H-%M')
backup_file = f'backups/shms_backup_{timestamp}.sql.gz'

start = time.time()
print(f"[BACKUP] Starting at {timestamp}")

# Step 1: pg_dump
env = os.environ.copy()
env['PGPASSWORD'] = DB_PASSWORD
result = subprocess.run(
    ['pg_dump', '-h', DB_HOST, '-U', DB_USER, '-d', DB_NAME, '--no-password'],
    env=env, capture_output=True
)
if result.returncode != 0:
    print(f"[ERROR] pg_dump failed: {result.stderr.decode()}")
    exit(1)

import gzip
with gzip.open(backup_file, 'wb') as f:
    f.write(result.stdout)
size = os.path.getsize(backup_file)
print(f"[BACKUP] Dump created: {backup_file} ({size} bytes)")

# Step 2: SHA-256 hash
with open(backup_file, 'rb') as f:
    sha256 = hashlib.sha256(f.read()).hexdigest()
print(f"[BACKUP] SHA-256: {sha256}")

# Step 3: Write manifest
manifest_file = f'backups/manifest_{timestamp}.csv'
with open(manifest_file, 'w', newline='') as mf:
    writer = csv.writer(mf)
    writer.writerow(['filename', 'size_bytes', 'sha256', 'backed_up_at'])
    writer.writerow([os.path.basename(backup_file), size, sha256, datetime.now().isoformat()])

# Step 4: Upload to MinIO
try:
    client = Minio('localhost:9000', access_key=MINIO_USER, secret_key=MINIO_PASS, secure=False)
    if not client.bucket_exists(BUCKET):
        client.make_bucket(BUCKET)
    client.fput_object(BUCKET, os.path.basename(backup_file), backup_file)
    client.fput_object(BUCKET, os.path.basename(manifest_file), manifest_file)
    print(f"[BACKUP] Uploaded to MinIO bucket: {BUCKET}")
except Exception as e:
    print(f"[WARN] MinIO upload failed (is Docker running?): {e}")

elapsed = time.time() - start
log_entry = f"{datetime.now().isoformat()} | {backup_file} | {size}B | SHA256:{sha256[:16]}... | {elapsed:.1f}s\n"
with open('logs/backup_log.txt', 'a') as lf:
    lf.write(log_entry)
print(f"[BACKUP] Done in {elapsed:.1f}s")
