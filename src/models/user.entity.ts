import { PrimaryColumn, Column, Entity } from 'typeorm';

@Entity({ name: 'user' })
export abstract class UserEntity {
  // hash summoner id
  @PrimaryColumn({ type: 'varchar' })
  summonerName: string;

  @PrimaryColumn({ type: 'varchar' })
  summonerRegion: string;

  @Column({ type: 'varchar' })
  summonerId: string;

  @Column({ type: 'int' })
  leaguePoints: number;

  @Column({ type: 'int' })
  winRate: number;
}
