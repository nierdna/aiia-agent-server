import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { TwitterService } from '../services/twitter.service';
import { PostTweetDto } from '../dtos';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTwitterUserDto } from '../dtos/create-twitter-user.dto';
import { CreateTwitterUserWithCookiesDto } from '../dtos/create-twitter-user-with-cookies.dto';

export default function handleResponse(
  data: any = {},
  status_code: number = HttpStatus.OK,
  msg: string = 'Success',
) {
  return { messages: msg, data, status_code };
}

@ApiTags('Twitter')
@Controller('twitter')
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}
}
