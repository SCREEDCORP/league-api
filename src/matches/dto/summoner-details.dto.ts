import { IsString } from 'class-validator';

export class SummonerDetailsDto {
  @IsString()
  summonerName: string;

  @IsString()
  summonerRegion: string;
}
