import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgvectorRepository } from './repository/pgvector.repository';
import { Crawl } from './crawl/crawl';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: PgvectorRepository,
      useFactory: () => {
        return new PgvectorRepository();
      },
      inject: [],
    },
    Crawl,
    PgvectorRepository,
  ],
  exports: [PgvectorRepository, Crawl],
})
export class PgvectorDbModule {}
