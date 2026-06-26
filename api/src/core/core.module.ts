/**
 * CoreModule — global module that provides and exports the domain services so any
 * controller can inject them without re-importing.
 */
import { Global, Module } from '@nestjs/common';
import { RepoService } from './repo.service';
import { MatchingService } from './matching.service';
import { SourcingService } from './sourcing.service';
import { AgentsService } from './agents.service';
import { AuthService } from './auth.service';

@Global()
@Module({
  providers: [RepoService, MatchingService, SourcingService, AgentsService, AuthService],
  exports: [RepoService, MatchingService, SourcingService, AgentsService, AuthService],
})
export class CoreModule {}
