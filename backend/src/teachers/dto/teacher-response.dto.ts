import { ApiProperty } from '@nestjs/swagger';
import { ClassRefDto } from '../../common/dto/refs.dto.js';

export class TeacherResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ion' })
  firstName: string;

  @ApiProperty({ example: 'Ionescu' })
  lastName: string;

  @ApiProperty({ example: 'ion.ionescu@school.com' })
  email: string;

  @ApiProperty({ type: [ClassRefDto], description: 'Classes this teacher is responsible for' })
  classes: ClassRefDto[];
}
