import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { JwtGuard } from '../auth/guards/jwt.guard';

function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new InternalServerErrorException('Cloudflare R2 is not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

@Controller('api/uploads')
export class UploadsController {
  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadFile(@UploadedFile() file: { originalname: string; mimetype: string; buffer: Buffer; size: number }) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!bucket) {
      throw new InternalServerErrorException('CLOUDFLARE_R2_BUCKET_NAME is not configured');
    }

    const extension = extname(file.originalname).toLowerCase();
    const baseName = file.originalname
      .replace(extname(file.originalname), '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'upload';

    const filename = `${Date.now()}-${baseName}${extension}`;

    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await client.send(command);
    } catch (err: any) {
      throw new InternalServerErrorException(`Upload failed: ${err.message}`);
    }

    // Use custom public domain if set, otherwise fall back to R2 public URL pattern
    const fileUrl = publicUrl
      ? `${publicUrl.replace(/\/$/, '')}/${filename}`
      : `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${filename}`;

    return {
      filename,
      url: fileUrl,
    };
  }
}
