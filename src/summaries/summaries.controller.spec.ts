import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { QueueId } from '../matches/dto/matches-query.dto';
import { MatchesService } from '../matches/matches.service';
import { UserEntity } from '../models/user.entity';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

const DEFAULT_VALUES = {
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

describe('SummariesController', () => {
  let controller: SummariesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummariesController],
      providers: [MatchesService, ConfigService, SummariesService],
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [join(__dirname, '**', '*.entity.{ts,js}')],
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
        }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
    }).compile();

    controller = module.get<SummariesController>(SummariesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should fail if invalid/not exists summonerName', () => {
    expect(
      controller.getSumary('klasjdoaifp1i2309182309', 'NA1', {}),
    ).rejects.toThrow(
      'Cannot retrieve details from the summoner, please contact to support or try again later.',
    );
  });

  it('should fail if invalid/not exists summonerRegion', () => {
    expect(controller.getSumary('LegitKorea', 'NA', {})).rejects.toThrow(
      'Invalid region',
    );
    expect(controller.getSumary('LegitKorea', 'SAS', {})).rejects.toThrow(
      'Invalid region',
    );
  });

  it('should return default values if invalid filter', async () => {
    const res = await controller.getSumary('LegitKorea', 'NA1', {
      queueId: '101' as QueueId,
    });

    expect(res).toStrictEqual(DEFAULT_VALUES);
  });

  it('should ok if all valid', () => {
    expect(
      controller.getSumary('LegitKorea', 'NA1', {}),
    ).resolves.toBeDefined();
    expect(
      controller.getSumary('LegitKorea', 'NA1', {
        queueId: QueueId.RANKED_SOLO_5x5,
      }),
    ).resolves.toBeDefined();
    expect(
      controller.getSumary('LegitKorea', 'NA1', {
        queueId: QueueId.RANKED_FLEX_SR,
      }),
    ).resolves.toBeDefined();
  });
});
