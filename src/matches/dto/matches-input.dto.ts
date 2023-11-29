import { IsString } from 'class-validator';
import { MatchesQueryDto } from './matches-query.dto';

export class RecentMatchesDto extends MatchesQueryDto {
  @IsString()
  puuid: string;

  @IsString()
  summonerRegion: string;
}
