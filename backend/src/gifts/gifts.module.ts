import { Module } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GiftsService],
  controllers: [GiftsController],
  exports: [GiftsService],
})
export class GiftsModule {}
