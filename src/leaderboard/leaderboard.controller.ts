import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('/:summonerName/:summonerRegion')
  async getUserRanks(
    @Param('summonerName') summonerName: string,
    @Param('summonerRegion') summonerRegion: string,
  ) {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard();

      if (
        !leaderboard.some(
          (user) =>
            user.summonerName === summonerName &&
            user.summonerRegion === summonerRegion,
        )
      ) {
        throw new NotFoundException('User not found in leaderboard');
      }

      const leaderboardByLeaguePoints = leaderboard.sort(
        (a, b) => a.leaguePoints - b.leaguePoints,
      );

      console.log({ leaderboardByLeaguePoints });

      const currentUserRankByLeaguePoints = leaderboardByLeaguePoints.findIndex(
        (user) =>
          user.summonerName === summonerName &&
          user.summonerRegion === summonerRegion,
      );

      const leaderboardByWinRate = leaderboard.sort(
        (a, b) => a.winRate - b.winRate,
      );

      const currentUserRankByWinRate = leaderboardByWinRate.findIndex(
        (user) =>
          user.summonerName === summonerName &&
          user.summonerRegion === summonerRegion,
      );

      console.log({ leaderboardByWinRate });

      return {
        leaguePoints: {
          top: currentUserRankByLeaguePoints + 1,
        },
        winRate: {
          top: currentUserRankByWinRate + 1,
        },
      };
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}
