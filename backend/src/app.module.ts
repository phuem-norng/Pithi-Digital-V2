import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { GuestsModule } from './guests/guests.module';
import { GiftsModule } from './gifts/gifts.module';
import { UploadsModule } from './uploads/uploads.module';
import { EventTypesModule } from './event-types/event-types.module';
import { TemplatesModule } from './templates/templates.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    GuestsModule,
    GiftsModule,
    UploadsModule,
    EventTypesModule,
    TemplatesModule,
    ExpensesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
