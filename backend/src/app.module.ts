import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { GuestsModule } from './guests/guests.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, EventsModule, GuestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
