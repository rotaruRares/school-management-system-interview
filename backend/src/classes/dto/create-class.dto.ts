import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassName, IdField, OptionalNotNull } from '../../common/validation/decorators.js';

export class CreateClassDto {
  @ApiProperty({ example: '5A', maxLength: 50 })
  @ClassName()
  name: string;

  @ApiPropertyOptional({ example: 1, description: 'Teacher responsible for the class' })
  @OptionalNotNull()
  @IdField()
  teacherId?: number;
}
