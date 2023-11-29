import { IsString } from 'class-validator';

export class GetSummonerSummaryDto {
  @IsString()
  summonerId: string;

  @IsString()
  summonerRegion: string;
}
