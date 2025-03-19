import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsString } from 'class-validator';

export class CreateTwitterUserWithCookiesDto {
  @ApiProperty({ example: 'username' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'v1%3A173285629857869202' })
  @IsNotEmpty()
  @IsString()
  guest_id: string;

  @ApiProperty({ example: 'Bwq8yWo77K66TGITV09lYGzGkeE7gq2aszcIVyzc' })
  @IsNotEmpty()
  @IsString()
  kdt: string;

  @ApiProperty({ example: 'u%3D1705608465534902272' })
  @IsNotEmpty()
  @IsString()
  twid: string;

  @ApiProperty({
    example:
      '9b79be64b2355eca9512124c2f2a8af13d6880309f94e8c78484724488b8edc941bdca62608c5155700ff6afd355be08ea841aa22d5c5d84316f5151f86e50382f2116bbf336d6a02583e0d8734489f2',
  })
  @IsNotEmpty()
  @IsString()
  ct0: string;

  @ApiProperty({ example: '66b49ec1370d9a0deb33d2a1484b94805e858007' })
  @IsNotEmpty()
  @IsString()
  auth_token: string;
}
