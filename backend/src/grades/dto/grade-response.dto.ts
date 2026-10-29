import { ApiProperty } from '@nestjs/swagger';
import { Subject } from '@prisma/client';
import { PersonRefDto } from '../../common/dto/refs.dto.js';

export class GradeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  studentId: number;

  @ApiProperty({ enum: Subject, enumName: 'Subject', example: Subject.MATHEMATICS })
  subject: Subject;

  @ApiProperty({ example: 9, minimum: 1, maximum: 10 })
  numericGrade: number;

  @ApiProperty({ example: '2026-10-20', description: 'Date only, YYYY-MM-DD' })
  date: string;

  @ApiProperty({ type: PersonRefDto })
  student: PersonRefDto;

  @ApiProperty({
    type: PersonRefDto,
    nullable: true,
    description: 'Null when the teacher who gave the grade has been deleted',
  })
  teacher: PersonRefDto | null;
}

export class GradeSummaryDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 9.33,
    description: 'Average of all grades rounded to two decimals, null when there are no grades',
  })
  average: number | null;

  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ type: [GradeResponseDto] })
  grades: GradeResponseDto[];
}
