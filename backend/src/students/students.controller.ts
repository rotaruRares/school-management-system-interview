import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../common/authenticated-user.js';
import { ApiErrors } from '../common/errors/api-errors.decorator.js';
import { NonEmptyBodyPipe } from '../common/validation/non-empty-body.pipe.js';
import { PositiveIntPipe } from '../common/validation/positive-int.pipe.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { StudentDetailResponseDto, StudentResponseDto } from './dto/student-response.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { StudentsService } from './students.service.js';

const idPipe = new PositiveIntPipe();

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a student and their login account (admin)' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  @ApiErrors(400, 401, 403, 409, 422)
  create(@Body() dto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.studentsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all students (admin)' })
  @ApiOkResponse({ type: [StudentResponseDto] })
  @ApiErrors(401, 403)
  findAll(): Promise<StudentResponseDto[]> {
    return this.studentsService.findAll();
  }

  @Get('me')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Own profile and class (student)' })
  @ApiOkResponse({ type: StudentDetailResponseDto })
  @ApiErrors(401, 403)
  findMe(@CurrentUser() user: AuthenticatedUser): Promise<StudentDetailResponseDto> {
    return this.studentsService.findMe(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Student details (admin, or the teacher of the student's class)" })
  @ApiOkResponse({ type: StudentDetailResponseDto })
  @ApiErrors(400, 401, 403, 404)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentDetailResponseDto> {
    return this.studentsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a student, including class assignment (admin)' })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiErrors(400, 401, 403, 404, 409, 422)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new NonEmptyBodyPipe()) dto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student and their grades (admin)' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors(400, 401, 403, 404)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.studentsService.remove(id);
  }
}
