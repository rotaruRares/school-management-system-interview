import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class SessionUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'teacher@school.com' })
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ type: String, nullable: true, example: 'Ion' })
  firstName: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Ionescu' })
  lastName: string | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Set when the user is a teacher' })
  teacherId: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Set when the user is a student' })
  studentId: number | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT, sent as "Authorization: Bearer <token>"' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 900, description: 'Access token lifetime in seconds' })
  expiresIn: number;

  @ApiProperty({ type: SessionUserDto })
  user: SessionUserDto;
}
