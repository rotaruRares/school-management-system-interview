import { ApiProperty } from '@nestjs/swagger';
import { ClassRefDto, PersonRefDto } from '../../common/dto/refs.dto.js';

export class StudentResponseDto {
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

  @ApiProperty({ type: ClassRefDto, nullable: true })
  class: ClassRefDto | null;
}

export class StudentClassDto extends ClassRefDto {
  @ApiProperty({ type: PersonRefDto, nullable: true })
  teacher: PersonRefDto | null;
}

export class StudentDetailResponseDto {
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

  @ApiProperty({ type: StudentClassDto, nullable: true })
  class: StudentClassDto | null;
}
