import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from '../projects/projects.module';
import { UsageEvent, UsageEventSchema } from './schemas/usage-event.schema';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsageEvent.name, schema: UsageEventSchema },
    ]),
    ProjectsModule,
  ],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
