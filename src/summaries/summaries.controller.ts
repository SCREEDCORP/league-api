import {
  BadGatewayException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { MatchesService } from '../matches/matches.service';
import { GetSummariesQueryDto } from './dto/summaries-query.dto';
import { SummariesService } from './summaries.service';
import { QueueId } from '../matches/dto/matches-query.dto';

@Controller('summaries')
export class SummariesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly summariesService: SummariesService,
  ) {}

  @Get('/:summonerName/:summonerRegion')
  async getSumary(
    @Param('summonerName') summonerName: string,
    @Param('summonerRegion') summonerRegion: string,
    @Query() query: GetSummariesQueryDto,
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

      const queueId = query.queueId || QueueId.RANKED_SOLO_5x5;

      const summary = await this.matchesService.getSummonerSummary({
        summonerId: summonerDetails.data.id,
        summonerRegion,
      });

      if (!summary.success) {
        throw new BadGatewayException(
          'Cannot retrieve summary, please contact to support or try again later.',
        );
      }

      const filteredSummary = summary.data.find(
        (s) => QueueId[s.queueType] === queueId,
      );

      if (!filteredSummary) {
        return {
          rankName: 'Unranked',
          rankImage: '',
          leaguePoints: 0,
          wins: 0,
          losses: 0,
          kills: 0,
          assists: 0,
          deaths: 0,
          visionScore: 0,
          csPerMinute: 0,
        };
      }

      const lastestMatchIds = await this.matchesService.getRecentMatches({
        puuid: summonerDetails.data.puuid,
        summonerRegion,
        queueId,
      });

      if (!lastestMatchIds.success) {
        throw new BadGatewayException(
          'Cannot retrieve matches, please contact to support or try again later.',
        );
      }

      const moreSummaryData = {
        kills: 0,
        assists: 0,
        deaths: 0,
        visionScore: 0,
        csPerMinute: 0,
      };

      await Promise.all(
        lastestMatchIds.data.map(async (matchId) => {
          const match = await this.matchesService.getMatchDetails({
            matchId,
            summonerRegion,
          });

          if (!match.success) {
            return null;
          }

          const summonerInGame = match.data.info.participants.find(
            (p) => p.puuid === summonerDetails.data.puuid,
          );

          if (!summonerInGame) {
            return null;
          }

          const gameDuration = this.matchesService.getGameDuration({
            gameCreation: match.data.info.gameCreation,
            gameDuration: match.data.info.gameDuration,
            gameEndTimestamp: match.data.info.gameEndTimestamp,
          });

          moreSummaryData.kills += summonerInGame.kills;
          moreSummaryData.assists += summonerInGame.assists;
          moreSummaryData.deaths += summonerInGame.deaths;
          moreSummaryData.visionScore += summonerInGame.visionScore;
          moreSummaryData.csPerMinute += Number(
            (summonerInGame.totalMinionsKilled / gameDuration).toFixed(2),
          );

          return null;
        }),
      );

      await this.matchesService.saveForLeaderboard({
        summonerId: summonerDetails.data.id,
        summonerRegion,
        leaguePoints: filteredSummary.leaguePoints,
        summonerName: summonerDetails.data.name,
        winRate:
          Number(
            (
              filteredSummary.wins /
              (filteredSummary.wins + filteredSummary.losses)
            ).toFixed(2),
          ) * 100,
      });

      return {
        rankName: filteredSummary.tier + ' ' + filteredSummary.rank,
        rankImage: this.summariesService.getRankImage(filteredSummary.tier),
        leaguePoints: filteredSummary.leaguePoints,
        wins: filteredSummary.wins,
        losses: filteredSummary.losses,
        kills: moreSummaryData.kills / 10,
        assists: moreSummaryData.assists / 10,
        deaths: moreSummaryData.deaths / 10,
        visionScore: moreSummaryData.visionScore / 10,
        csPerMinute: Number((moreSummaryData.csPerMinute / 10).toFixed(2)),
        kda: Number(
          (
            (moreSummaryData.kills + moreSummaryData.assists) /
            moreSummaryData.deaths
          ).toFixed(2),
        ),
      };
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}
