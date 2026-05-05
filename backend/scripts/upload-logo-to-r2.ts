import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET || !PUBLIC_URL) {
  console.error('Missing Cloudflare R2 credentials or public URL in .env');
  process.exit(1);
}

const sourcePath = process.argv[2];
const targetKey = process.argv[3] || 'public/logo-pithi-digital.png';

if (!sourcePath) {
  console.error('Usage: npx ts-node scripts/upload-logo-to-r2.ts <source-file> [target-key]');
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

const ext = path.extname(sourcePath).toLowerCase();
const contentTypeMap: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

async function main() {
  const body = fs.readFileSync(sourcePath);
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: targetKey,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    }),
  );

  const publicAssetUrl = `${PUBLIC_URL}/${targetKey}`;
  console.log(publicAssetUrl);
}

main().catch((error) => {
  console.error('Upload failed:', error);
  process.exit(1);
});
