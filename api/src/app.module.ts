/**
 * AppModule — wires config, the global CoreModule (domain service providers) and all
 * REST controllers that mirror the Next.js /api routes.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { HealthController } from './modules/health.controller';
import { RequisitionsController } from './modules/requisitions.controller';
import { JobsController } from './modules/jobs.controller';
import { MatchController } from './modules/match.controller';
import { SourceController } from './modules/source.controller';
import { PipelineController } from './modules/pipeline.controller';
import { ApplicationsController } from './modules/applications.controller';
import { OutreachController } from './modules/outreach.controller';
import { SeekerController } from './modules/seeker.controller';
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
    AtsController,
    AgentController,
    AuditController,
  ],
})
export class AppModule {}
