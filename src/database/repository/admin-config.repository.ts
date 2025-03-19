import { Repository, DataSource } from 'typeorm';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { AdminConfigEntity } from '../entities/admin-config.entity';
import { OnApplicationBootstrap } from '@nestjs/common';

export class AdminConfigRepository
  extends Repository<AdminConfigEntity>
  implements OnApplicationBootstrap
{
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(AdminConfigEntity, dataSource.createEntityManager());
  }

  async onApplicationBootstrap() {
    //insert key list_whitelist_address
    const list_whitelist_address = await this.findOne({
      where: { key: 'list_whitelist_address' },
    });
    if (!list_whitelist_address) {
      await this.save({
        key: 'list_whitelist_address',
        data: {
          list_whitelist_address: [],
        },
        value: '1',
      });
    }

    if (
      !(await this.exist({
        where: { key: 'twitter-client-cookies' },
      }))
    ) {
      await this.save({
        key: 'twitter-client-cookies',
        values: '1',
        data: {
          username: '_agenttrading',
          guest_id: 'v1%3A173673792653375916',
          kdt: 'hLmFVSmiTtQhqvsNqMwfDSheyqdj4RySDeIKWUvl',
          twid: 'u%3D1777628634897158144',
          ct0: '337744e1a0272efc0e5b57d05317526aeaea0d0f4094963e55fb820e0bea91f6105d37ecd084001d46da12195d8e9bc17401bd7ad60fabb8d1d73ac97107680fb8ce5e883ab8140ac9a4b4d6c9f8f96d',
          auth_token: 'b31a00d4853f0e4ef37e5ecda6e2aff235613934',
        } as any,
      });
    }

    if (
      !(await this.exist({
        where: { key: 'last-checked-tweet' },
      }))
    ) {
      await this.save({
        key: 'last-checked-tweet',
        value: '0',
      });
    }

    if (
      !(await this.exist({
        where: { key: 'handle-twitter-interactions' },
      }))
    ) {
      await this.save({
        key: 'handle-twitter-interactions',
        value: '0',
        data: {
          handles: ['henry0xx'],
        },
      });
    }
  }

  async getListAdmins() {
    const list_address_admins = await this.findOne({
      where: { key: 'list_whitelist_address' },
      select: ['data'],
    });

    return list_address_admins?.data?.list_whitelist_address || [];
  }

  async findOneByKey(key: string): Promise<AdminConfigEntity> {
    return this.createQueryBuilder('admin-configs')
      .where('admin-configs.key = :key', { key })
      .limit(1)
      .getOne();
  }
}
