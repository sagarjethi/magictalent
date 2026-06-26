/**
 * AppModule — wires config, the global CoreModule (domain service providers) and all
 * REST controllers that mirror the Next.js /api routes.
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { AuthGuard } from './common/auth.guard';
import { HealthController } from './modules/health.controller';
import { RequisitionsController } from './modules/requisitions.controller';
import { JobsController } from './modules/jobs.controller';
import { MatchController } from './modules/match.controller';
import { SourceController } from './modules/source.controller';
import { PipelineController } from './modules/pipeline.controller';
import { ApplicationsController } from './modules/applications.controller';
import { OutreachController } from './modules/outreach.controller';
import { SeekerController } from './modules/seeker.controller';
import { SeekerInterestController } from './modules/seeker-interest.controller';
import { SeekerInterviewsController } from './modules/seeker-interviews.controller';
import { InterviewController } from './modules/interview.controller';
import { AtsController } from './modules/ats.controller';
import { AgentController } from './modules/agent.controller';
import { AuditController } from './modules/audit.controller';
import { AuthController } from './modules/auth.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CoreModule],
  controllers: [
    AuthController,
    HealthController,
    RequisitionsController,
    JobsController,
    MatchController,
    SourceController,
    PipelineController,
    ApplicationsController,
    OutreachController,
    SeekerController,
    SeekerInterestController,
    SeekerInterviewsController,
    InterviewController,
    AtsController,
    AgentController,
    AuditController,
  ],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
