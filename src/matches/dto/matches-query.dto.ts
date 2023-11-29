import { IsEnum, IsNumberString, IsOptional } from 'class-validator';

export enum QueueId {
  'RANKED_SOLO_5x5' = '420',
  'RANKED_FLEX_SR' = '440',
  'NORMAL_BLIND_PICK' = '430',
  'NORMAL_DRAFT_PICK' = '400',
  'ARAM' = '450',
  'ALL' = '0',
}

export class MatchesQueryDto {
  @IsNumberString()
  @IsOptional()
  limit?: number;

  @IsNumberString()
  @IsOptional()
  page?: number;

  @IsEnum(QueueId)
  @IsNumberString()
  @IsOptional()
  queueId?: QueueId;
}
