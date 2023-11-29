import { IsNumber, IsOptional } from 'class-validator';

export class GameDurationDto {
  @IsNumber()
  gameCreation: number;

  @IsNumber()
  gameDuration: number;

  @IsNumber()
  @IsOptional()
  gameEndTimestamp?: number;
}
