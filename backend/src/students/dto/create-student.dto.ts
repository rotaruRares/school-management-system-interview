import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmailField,
  IdField,
  IsDateOnly,
  OptionalNotNull,
  PasswordField,
  PersonName,
} from '../../common/validation/decorators.js';

export class CreateStudentDto {
  @ApiProperty({ example: 'ana.popescu@school.com' })
  @EmailField()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 72 })
  @PasswordField()
  password: string;

  @ApiProperty({ example: 'Ana' })
  @PersonName()
  firstName: string;

  @ApiProperty({ example: 'Popescu' })
  @PersonName()
  lastName: string;

  @ApiProperty({ example: '2014-05-14', description: 'Date only, YYYY-MM-DD' })
  @IsDateOnly({ notInFuture: true, minAgeYears: 3, maxAgeYears: 100 })
  dateOfBirth: string;

  @ApiPropertyOptional({ example: 1, description: 'Class to enrol the student in' })
  @OptionalNotNull()
  @IdField()
  classId?: number;
}
