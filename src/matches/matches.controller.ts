import {
  Controller,
  Get,
  Param,
  NotFoundException,
  BadGatewayException,
  Query,
} from '@nestjs/common';

import { MatchesService } from './matches.service';
import { MatchesQueryDto, QueueId } from './dto/matches-query.dto';

@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get('/:summonerName/:summonerRegion')
  async getMatches(
    @Param('summonerName') summonerName: string,
    @Param('summonerRegion') summonerRegion: string,
    @Query() query: MatchesQueryDto,
  ) {
    try {
      if (!this.matchesService.isValidRegion(summonerRegion)) {
        throw new BadGatewayException('Invalid region');
      }

      const summonerDetails = await this.matchesService.getSummonerDetails({
        summonerName,
        summonerRegion,
      });

      if (!summonerDetails.success) {
        throw new NotFoundException(
          'Cannot retrieve details from the summoner, please contact to support or try again later.',
        );
      }

      const { limit, page, queueId } = query;

      const matchIds = await this.matchesService.getRecentMatches({
        puuid: summonerDetails.data.puuid,
        summonerRegion,
        limit,
        page,
        queueId,
      });

      if (!matchIds.success) {
        throw new BadGatewayException(
          'Cannot retrieve matches from the summoner, please contact to support or try again later.',
        );
      }

      const matches = (
        await Promise.all(
          matchIds.data.map(async (matchId) => {
            const match = await this.matchesService.getMatchDetails({
              matchId,
              summonerRegion,
            });

            if (!match.success) return null;

            const summonerInGame = match.data.info.participants.find(
              (p) => p.puuid === summonerDetails.data.puuid,
            );

            if (!summonerInGame) return null;

            const gameDuration = this.matchesService.getGameDuration({
              gameCreation: match.data.info.gameCreation,
              gameDuration: match.data.info.gameDuration,
              gameEndTimestamp: match.data.info.gameEndTimestamp,
            });

            return {
              championUsed: summonerInGame.championName,
              win: summonerInGame.win,
              kda: `${summonerInGame.kills}/${summonerInGame.deaths}/${summonerInGame.assists}`,
              csPerMinute: Number(
                (summonerInGame.totalMinionsKilled / gameDuration).toFixed(2),
              ),
              kills: summonerInGame.kills,
              assists: summonerInGame.assists,
              firstSpellUsage: summonerInGame.spell1Casts,
              secondSpellUsage: summonerInGame.spell2Casts,
              thirdSpellUsage: summonerInGame.spell3Casts,
              fourthSpellUsage: summonerInGame.spell4Casts,
              runes: this.matchesService.getRunes(summonerInGame.perks.styles),
            };
          }),
        )
      ).filter(Boolean);

      const summary = await this.matchesService.getSummonerSummary({
        summonerId: summonerDetails.data.id,
        summonerRegion,
      });

      if (!summary.success) {
        return matches;
      }

      const filteredSummary = summary.data.find(
        (s) => QueueId[s.queueType] === queueId,
      );

      if (!filteredSummary) {
        return matches;
      }

      await this.matchesService.saveForLeaderboard({
        summonerId: summonerDetails.data.id,
        summonerRegion,
        leaguePoints: filteredSummary.leaguePoints,
        summonerName: summonerDetails.data.name,
        winRate: Math.floor(
          Number(
            (
              filteredSummary.wins /
              (filteredSummary.wins + filteredSummary.losses)
            ).toFixed(2),
          ) * 100,
        ),
      });

      return matches;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}
