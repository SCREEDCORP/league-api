import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { UserEntity } from '../models/user.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { ConfigService } from '@nestjs/config';

describe('MatchesController', () => {
  let controller: MatchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [MatchesService, ConfigService],
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

    controller = module.get<MatchesController>(MatchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should fail if summoner not exists', () => {
    expect(
      controller.getMatches('asdfkajsd1p2oi3poas', 'NA1', {}),
    ).rejects.toThrow(
      'Cannot retrieve details from the summoner, please contact to support or try again later.',
    );
  });

  it('should fail if invalid region', () => {
    expect(controller.getMatches('LegitKorea', 'SA1', {})).rejects.toThrow(
      'Invalid region',
    );
    expect(controller.getMatches('LegitKorea', 'NE2', {})).rejects.toThrow(
      'Invalid region',
    );
  });

  it('should ok if all valid', () => {
    expect(
      controller.getMatches('LegitKorea', 'NA1', {}),
    ).resolves.toBeDefined();
  });

  it('limit query should work', async () => {
    const res = await controller.getMatches('LegitKorea', 'NA1', { limit: 5 });
    expect(res.length).toBe(5);
  });
});
