import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Subject } from '@prisma/client';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { IdField, IsDateOnly, OptionalNotNull } from '../../common/validation/decorators.js';

export class CreateGradeDto {
  @ApiProperty({ example: 1, description: 'Student receiving the grade' })
  @IdField()
  studentId: number;

  @ApiProperty({ enum: Subject, enumName: 'Subject', example: Subject.MATHEMATICS })
  @IsEnum(Subject)
  subject: Subject;

  @ApiProperty({ example: 9, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  numericGrade: number;

  @ApiPropertyOptional({
    example: '2026-10-20',
    description: 'Date only, YYYY-MM-DD, not in the future. Defaults to today.',
  })
  @OptionalNotNull()
  @IsDateOnly({ notInFuture: true })
  date?: string;
}
