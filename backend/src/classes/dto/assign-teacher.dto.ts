import { ApiProperty } from '@nestjs/swagger';
import { RequiredNullableIdField } from '../../common/validation/decorators.js';

export class AssignTeacherDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1,
    description: 'Teacher id, or null to unassign the current teacher',
  })
  @RequiredNullableIdField()
  teacherId: number | null;
}
