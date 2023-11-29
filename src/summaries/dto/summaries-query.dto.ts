import { IsEnum, IsNumberString, IsOptional } from 'class-validator';
import { QueueId } from '../../matches/dto/matches-query.dto';

export class GetSummariesQueryDto {
  @IsEnum(QueueId)
  @IsNumberString()
  @IsOptional()
  queueId?: QueueId;
}
