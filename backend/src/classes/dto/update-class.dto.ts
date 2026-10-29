import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClassName, NullableIdField, OptionalNotNull } from '../../common/validation/decorators.js';

export class UpdateClassDto {
  @ApiPropertyOptional({ example: '5B', maxLength: 50 })
  @OptionalNotNull()
  @ClassName()
  name?: string;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 1,
    description: 'Send null to leave the class without a teacher',
  })
  @NullableIdField()
  teacherId?: number | null;
}
