import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EmailField } from '../../common/validation/decorators.js';

export class LoginDto {
  @ApiProperty({ example: 'admin@school.com' })
  @EmailField()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
