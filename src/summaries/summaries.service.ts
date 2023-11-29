import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RANKS = {
  BRONZE: '101000-BRONZE.png',
  CHALLENGER: '101000-CHALLENGER.png',
  DIAMOND: '101000-DIAMOND.png',
  GOLD: '101000-GOLD.png',
  IRON: '101000-IRON.png',
  MASTER: '101000-MASTER.png',
  PLATINUM: '101000-PLATINUM.png',
  SILVER: '101000-SILVER.png',
  GRANDMASTER: '101000-GRANDMASTER.png',
  UNRANKED: '101000-UNRANKED.png',
};

@Injectable()
export class SummariesService {
  constructor(private configService: ConfigService) {}
  getRankImage(rank: string) {
    const rankImage =
      RANKS[rank.toUpperCase() as keyof typeof RANKS] || RANKS.UNRANKED;

    return this.configService.get('BUCKET_URL') + '/' + rankImage;
  }
}
