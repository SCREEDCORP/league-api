import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesModule } from '../matches/matches.module';
import { MatchesService } from '../matches/matches.service';
import { UserEntity } from '../models/user.entity';

import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

@Module({
  imports: [MatchesModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [SummariesService, MatchesService],
  controllers: [SummariesController],
})
export class SummariesModule {}
