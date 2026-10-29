import { ApiProperty } from '@nestjs/swagger';

export class ClassRefDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '5A' })
  name: string;
}

export class PersonRefDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ion' })
  firstName: string;

  @ApiProperty({ example: 'Ionescu' })
  lastName: string;
}
