// src/services/user.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { CreateUserDto, LoginDto } from '../../api/dtos/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminConfigRepository } from '../repository/admin-config.repository';

@Injectable()
export class UserService {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @InjectRepository(AdminConfigRepository)
  private readonly adminConfigRepository: AdminConfigRepository;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    return this.userRepository.createUser(createUserDto.telegramId);
  }

  async getUserByTelegramId(telegramId: string) {
    return this.userRepository.getUserByTelegramId(telegramId);
  }

  async login(dto: LoginDto) {
    const payload = {
      wallet_address: dto.address,
    };
    const verified = this.verifySignature(
      this.getMessage(),
      dto.signature,
      dto.address,
    );
    if (!verified) {
      throw new UnauthorizedException('Invalid signature');
    }

    const listWhitelistAddress =
      await this.adminConfigRepository.getListAdmins();
    if (!listWhitelistAddress.includes(dto.address)) {
      throw new UnauthorizedException('You are not in the whitelist');
    }

    const secretKey = this.configService.get<string>('jwt.secret');
    return {
      access_token: this.jwtService.sign(payload, {
        secret: secretKey,
        expiresIn: '7d',
      }),
    };
  }

  protected recoverSignatureSolanaWithText(
    signature: string,
    text: string,
    address: string,
  ): string {
    const encodedMessage = new TextEncoder().encode(text);
    const signedMessage = Uint8Array.from(JSON.parse(signature));
    const _address = new PublicKey(address).toBytes();

    const verified = nacl.sign.detached.verify(
      encodedMessage, // the message
      signedMessage, // the signature
      _address, // public key
    );

    if (verified) {
      return address;
    } else {
      return '';
    }
  }

  verifySignature(
    message: string,
    signature: string,
    address: string,
  ): boolean {
    let recoverAddress: string;

    recoverAddress = this.recoverSignatureSolanaWithText(
      signature,
      message,
      address,
    );

    return recoverAddress.toLowerCase() === address.toLowerCase();
  }

  protected getMessage(): string {
    return 'Welcome. By signing this message you are verifying your digital identity. This is completely secure and does not cost anything!';
  }
}
