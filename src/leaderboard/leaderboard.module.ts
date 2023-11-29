import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../models/user.entity';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
  imports: [TypeOrmModule.forFeature([UserEntity])],
})
export class LeaderboardModule {}
