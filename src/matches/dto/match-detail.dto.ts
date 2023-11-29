import { IsString } from 'class-validator';

export class MatchDetailsDto {
  @IsString()
  matchId: string;

  @IsString()
  summonerRegion: string;
}
