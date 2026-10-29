import { ApiProperty } from '@nestjs/swagger';
import { PersonRefDto } from '../../common/dto/refs.dto.js';

export class ClassResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '5A' })
  name: string;

  @ApiProperty({ type: PersonRefDto, nullable: true })
  teacher: PersonRefDto | null;

  @ApiProperty({ example: 24 })
  studentCount: number;
}

export class ClassStudentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'Popescu' })
  lastName: string;

  @ApiProperty({ example: 'ana.popescu@school.com' })
  email: string;

  @ApiProperty({ example: '2014-05-14', description: 'Date only, YYYY-MM-DD' })
  dateOfBirth: string;
}

export class ClassDetailResponseDto extends ClassResponseDto {
  @ApiProperty({ type: [ClassStudentDto] })
  students: ClassStudentDto[];
}
