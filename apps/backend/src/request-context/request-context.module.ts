import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { RequestContextInterceptor } from './request-context.interceptor';

@Module({
  imports: [ProjectsModule],
  providers: [RequestContextInterceptor],
  exports: [RequestContextInterceptor],
})
export class RequestContextModule {}
