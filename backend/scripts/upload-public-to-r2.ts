/**
 * Upload all static assets from frontend/public to Cloudflare R2
 * Run: npx ts-node scripts/upload-public-to-r2.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.error('❌ Missing R2 credentials in .env');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function getAllFiles(dir: string, baseDir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // skip .DS_Store etc
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (Object.keys(MIME_MAP).includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(localPath: string, r2Key: string): Promise<string> {
  const buffer = fs.readFileSync(localPath);
  const contentType = getMimeType(localPath);

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: r2Key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));

  return `${PUBLIC_URL}/${r2Key}`;
}

async function main() {
  const publicDir = path.resolve(__dirname, '../../frontend/public');

  if (!fs.existsSync(publicDir)) {
    console.error(`❌ Directory not found: ${publicDir}`);
    process.exit(1);
  }

  const files = getAllFiles(publicDir, publicDir);

  if (files.length === 0) {
    console.log('No image/audio files found.');
    return;
  }

  console.log(`\n📦 Found ${files.length} file(s) to upload to R2 bucket: ${BUCKET}\n`);

  const results: { local: string; r2Key: string; url: string }[] = [];

  for (const localPath of files) {
    const relativePath = path.relative(publicDir, localPath);
    const r2Key = `public/${relativePath.replace(/\\/g, '/')}`;

    const exists = await fileExistsInR2(r2Key);
    if (exists) {
      const url = `${PUBLIC_URL}/${r2Key}`;
      console.log(`⏭  Already exists: ${r2Key}`);
      results.push({ local: relativePath, r2Key, url });
      continue;
    }

    try {
      const url = await uploadFile(localPath, r2Key);
      console.log(`✅ Uploaded: ${r2Key}`);
      console.log(`   → ${url}`);
      results.push({ local: relativePath, r2Key, url });
    } catch (err: any) {
      console.error(`❌ Failed: ${r2Key} — ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 URL MAPPING (copy these into your frontend):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  for (const { local, url } of results) {
    console.log(`/${local.replace(/\\/g, '/')}`);
    console.log(`  → ${url}\n`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
