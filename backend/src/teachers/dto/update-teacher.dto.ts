import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmailField,
  OptionalNotNull,
  PasswordField,
  PersonName,
} from '../../common/validation/decorators.js';

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: 'ion.ionescu@school.com' })
  @OptionalNotNull()
  @EmailField()
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword1', minLength: 8, maxLength: 72 })
  @OptionalNotNull()
  @PasswordField()
  password?: string;

  @ApiPropertyOptional({ example: 'Ion' })
  @OptionalNotNull()
  @PersonName()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ionescu' })
  @OptionalNotNull()
  @PersonName()
  lastName?: string;
}
