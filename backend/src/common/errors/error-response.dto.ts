import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldErrorDto {
  @ApiProperty({ example: 'email' })
  field: string;

  @ApiProperty({ example: 'isEmail', description: 'Name of the failed validation rule' })
  constraint: string;

  @ApiProperty({ example: 'email must be an email' })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    example: 'STUDENT_NOT_FOUND',
    description: 'Stable machine-readable code. Clients should translate this, not the message.',
  })
  code: string;

  @ApiProperty({ example: 'Student not found', description: 'English text for developers' })
  message: string;

  @ApiPropertyOptional({ type: [FieldErrorDto], description: 'Present for VALIDATION_FAILED' })
  errors?: FieldErrorDto[];
}
