import { IsNumber, IsString } from 'class-validator';

export class UserEntityDto {
  @IsString()
  summonerName: string;

  @IsString()
  summonerRegion: string;

  @IsString()
  summonerId: string;

  @IsNumber()
  leaguePoints: number;

  @IsNumber()
  winRate: number;
}
