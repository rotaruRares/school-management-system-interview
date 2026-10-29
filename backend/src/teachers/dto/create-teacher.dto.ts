import { ApiProperty } from '@nestjs/swagger';
import { EmailField, PasswordField, PersonName } from '../../common/validation/decorators.js';

export class CreateTeacherDto {
  @ApiProperty({ example: 'ion.ionescu@school.com' })
  @EmailField()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 72 })
  @PasswordField()
  password: string;

  @ApiProperty({ example: 'Ion' })
  @PersonName()
  firstName: string;

  @ApiProperty({ example: 'Ionescu' })
  @PersonName()
  lastName: string;
}
