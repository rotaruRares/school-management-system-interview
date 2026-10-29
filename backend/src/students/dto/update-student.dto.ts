import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmailField,
  IsDateOnly,
  NullableIdField,
  OptionalNotNull,
  PasswordField,
  PersonName,
} from '../../common/validation/decorators.js';

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'ana.popescu@school.com' })
  @OptionalNotNull()
  @EmailField()
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword1', minLength: 8, maxLength: 72 })
  @OptionalNotNull()
  @PasswordField()
  password?: string;

  @ApiPropertyOptional({ example: 'Ana' })
  @OptionalNotNull()
  @PersonName()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Popescu' })
  @OptionalNotNull()
  @PersonName()
  lastName?: string;

  @ApiPropertyOptional({ example: '2014-05-14', description: 'Date only, YYYY-MM-DD' })
  @OptionalNotNull()
  @IsDateOnly({ notInFuture: true, minAgeYears: 3, maxAgeYears: 100 })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 1,
    description: 'Class to move the student to. Send null to remove them from their class.',
  })
  @NullableIdField()
  classId?: number | null;
}
