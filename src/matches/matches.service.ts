import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { perksData } from '../data/perks';
import { GameDurationDto } from './dto/game-duration.dto';
import { MatchDetailsDto } from './dto/match-detail.dto';
import { RecentMatchesDto } from './dto/matches-input.dto';
import { SummonerDetailsDto } from './dto/summoner-details.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { UserEntityDto } from '../models/user.dto';
import { GetSummonerSummaryDto } from '../summaries/dto/summoner-summary.dto';
import { QueueId } from './dto/matches-query.dto';

type SuccessResponse<D> = {
  success: true;
  data: D;
};
type FailedResponse = {
  success: false;
  data: RiotError;
};
export type Response<D> = SuccessResponse<D> | FailedResponse;

export type RiotError = {
  status: {
    message: string;
    status_code: number;
  };
};

export type SummonerInfo = {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
};

type V5Region = 'americas' | 'europe' | 'asia';

type Perk = {
  statPerks: object;
  styles: {
    description: string;
    style: number;
    selections: {
      /** perk id */
      perk: number;
    }[];
  }[];
};
// only necessary fields
type MathDetailParticipant = {
  puuid: string;
  assists: number;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  totalMinionsKilled: number;
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  perks: Perk;
  visionScore: number;
};
// only necessary fields
type MatchDetail = {
  metadata: any;
  info: {
    gameDuration: number;
    gameCreation: number;
    gameEndTimestamp: number;
    participants: MathDetailParticipant[];
  };
};

type SummonerSummary = {
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  queueType: keyof typeof QueueId;
  tier: string;
};

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}
  // new matches v5 only supports americas, europe and asia regions
  private parseV5Region(region: string): V5Region | null {
    const europe = ['euw1', 'eun1', 'ru', 'oc1', 'tr1'];
    const americas = ['na1', 'la1', 'la2'];
    const asia = ['kr', 'br1', 'jp1'];

    const lowerCased = region.toLowerCase();

    if (europe.includes(lowerCased)) {
      return 'europe';
    } else if (americas.includes(lowerCased)) {
      return 'americas';
    } else if (asia.includes(lowerCased)) {
      return 'asia';
    }

    return null;
  }
  isValidRegion(region: string) {
    const validRegions = [
      'euw1',
      'eun1',
      'ru',
      'oc1',
      'tr1',
      'na1',
      'la1',
      'la2',
      'kr',
      'br1',
      'jp1',
    ];
    const lowerCased = region.toLowerCase();

    return validRegions.includes(lowerCased);
  }

  async getSummonerDetails({
    summonerName,
    summonerRegion,
  }: SummonerDetailsDto): Promise<Response<SummonerInfo>> {
    const data = await fetch(
      `https://${summonerRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
      {
        headers: {
          'X-Riot-Token': this.configService.get('RIOT_API_KEY'),
        },
      },
    );

    if (!data.ok) {
      return {
        success: false,
        data: (await data.json()) as RiotError,
      };
    }

    return {
      success: true,
      data: (await data.json()) as SummonerInfo,
    };
  }

  /**
   * @throws Error if region not supported
   */
  async getRecentMatches({
    queueId,
    limit = 10,
    page = 1,
    puuid,
    summonerRegion,
  }: RecentMatchesDto): Promise<Response<string[]>> {
    const region = this.parseV5Region(summonerRegion);

    if (!region) {
      throw new Error('');
    }

    const params = new URLSearchParams();
    if (queueId) {
      params.append('queue', queueId.toString());
    }
    params.append('count', limit.toString());
    params.append('start', ((page - 1) * limit).toString());

    const data = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`,
      {
        headers: {
          'X-Riot-Token': this.configService.get('RIOT_API_KEY'),
        },
      },
    );

    if (!data.ok) {
      const res = (await data.json()) as RiotError;

      console.error('Riot recent matches error: ', JSON.stringify(res));

      return {
        success: false,
        data: res as RiotError,
      };
    }

    return {
      success: true,
      data: await data.json(),
    };
  }

  async getMatchDetails({
    matchId,
    summonerRegion,
  }: MatchDetailsDto): Promise<Response<MatchDetail>> {
    const region = this.parseV5Region(summonerRegion);

    if (!region) {
      throw new Error('');
    }

    const data = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          'X-Riot-Token': this.configService.get('RIOT_API_KEY'),
        },
      },
    );

    if (!data.ok) {
      const res = (await data.json()) as RiotError;
      console.error(
        `Riot match detail error with id -> ${matchId}: `,
        JSON.stringify(res),
      );
      return {
        success: false,
        data: res as RiotError,
      };
    }

    return {
      success: true,
      data: (await data.json()) as MatchDetail,
    };
  }

  /**
   * @description https://developer.riotgames.com/apis#match-v5/GET_getMatch
   * @returns Game duration in minutes
   */
  getGameDuration({
    gameCreation,
    gameDuration,
    gameEndTimestamp,
  }: GameDurationDto) {
    if (!gameEndTimestamp) {
      // Gets game duration in milliseconds
      return Math.floor(gameDuration / 3600);
    } else {
      // Manually calculate the game duration
      return Math.floor((gameEndTimestamp - gameCreation) / 3600);
    }
  }

  getRunes(perks: Perk['styles']) {
    const perksMap: Record<number, { style: number; count: number }> = {};

    perks.forEach((style) =>
      style.selections.forEach((selections) => {
        if (perksMap[selections.perk]) {
          perksMap[selections.perk].count++;
        } else {
          perksMap[selections.perk] = {
            style: style.style,
            count: 1,
          };
        }
      }),
    );

    return Object.entries(perksMap).map(([id, { style, count }]) => {
      let perkName: string = '';

      perksData.find((perk) => {
        if (perk.id === style) {
          perk.slots.forEach((slot) => {
            const rune = slot.runes.find((rune) => rune.id === Number(id));

            if (!rune) return;

            perkName = rune.name;
          });
        }
      });

      return {
        perkName,
        count,
      };
    });
  }

  async getSummonerSummary({
    summonerId,
    summonerRegion,
  }: GetSummonerSummaryDto): Promise<Response<SummonerSummary[]>> {
    const data = await fetch(
      `https://${summonerRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: {
          'X-Riot-Token': this.configService.get('RIOT_API_KEY'),
        },
      },
    );

    if (!data.ok) {
      return {
        success: false,
        data: (await data.json()) as RiotError,
      };
    }

    return {
      success: true,
      data: (await data.json()) as SummonerSummary[],
    };
  }

  async saveForLeaderboard(user: UserEntityDto) {
    // const currentUser = await this.userRepository.findOne({
    //   where: {
    //     summonerRegion: user.summonerRegion,
    //     summonerName: user.summonerName,
    //   },
    // });

    // if (!currentUser) {
    //   const newUser = this.userRepository.create(user);

    //   await this.userRepository.save(newUser);

    //   console.log({ newUser });
    //   return;
    // }

    await this.userRepository.save(user);
  }
}
