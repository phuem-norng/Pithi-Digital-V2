/**
 * Upload all files from backend/uploads/ to Cloudflare R2
 * Run: npx ts-node scripts/upload-uploads-to-r2.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
};

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const uploadsDir = path.resolve(__dirname, '../uploads');

  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads directory found.');
    return;
  }

  const files = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'));

  if (files.length === 0) {
    console.log('No files found in uploads/');
    return;
  }

  console.log(`\n📦 Uploading ${files.length} files from uploads/ to R2 bucket: ${BUCKET}\n`);

  const results: { file: string; url: string }[] = [];

  for (const file of files) {
    const localPath = path.join(uploadsDir, file);
    const ext = path.extname(file).toLowerCase();
    const key = `uploads/${file}`;
    const mime = MIME_MAP[ext] || 'application/octet-stream';

    const exists = await fileExistsInR2(key);
    if (exists) {
      const url = `${PUBLIC_URL}/${key}`;
      console.log(`⏭  Already exists: ${file}`);
      results.push({ file, url });
      continue;
    }

    try {
      const buffer = fs.readFileSync(localPath);
      await client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mime,
        CacheControl: 'public, max-age=31536000',
      }));
      const url = `${PUBLIC_URL}/${key}`;
      console.log(`✅ Uploaded: ${file}`);
      console.log(`   → ${url}`);
      results.push({ file, url });
    } catch (err: any) {
      console.error(`❌ Failed: ${file} — ${err.message}`);
    }
  }

  console.log(`\n✅ Done: ${results.length}/${files.length} files uploaded to R2`);
  console.log(`\nYou can now safely delete the uploads/ folder.\n`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
