import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class AssignStudentsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'Students to enrol. A student belongs to one class, so this moves them.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  studentIds: number[];
}
