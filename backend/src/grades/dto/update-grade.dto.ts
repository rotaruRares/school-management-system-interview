import { ApiPropertyOptional } from '@nestjs/swagger';
import { Subject } from '@prisma/client';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { IsDateOnly, OptionalNotNull } from '../../common/validation/decorators.js';

export class UpdateGradeDto {
  @ApiPropertyOptional({ enum: Subject, enumName: 'Subject' })
  @OptionalNotNull()
  @IsEnum(Subject)
  subject?: Subject;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 10 })
  @OptionalNotNull()
  @IsInt()
  @Min(1)
  @Max(10)
  numericGrade?: number;

  @ApiPropertyOptional({ example: '2026-10-20', description: 'Date only, YYYY-MM-DD, not in the future' })
  @OptionalNotNull()
  @IsDateOnly({ notInFuture: true })
  date?: string;
}
