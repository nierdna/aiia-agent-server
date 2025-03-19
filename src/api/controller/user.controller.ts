// src/controllers/user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from '../../database/services/user.service';
import { CreateUserDto, LoginDto } from '../dtos/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get(':telegramId')
  async getUser(@Param('telegramId') telegramId: string) {
    return this.userService.getUserByTelegramId(telegramId);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.userService.login(dto);
    return result;
  }
}
