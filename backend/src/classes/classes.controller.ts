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
  Put,
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
import { ClassesService } from './classes.service.js';
import { AssignStudentsDto } from './dto/assign-students.dto.js';
import { AssignTeacherDto } from './dto/assign-teacher.dto.js';
import {
  ClassDetailResponseDto,
  ClassResponseDto,
  ClassStudentDto,
} from './dto/class-response.dto.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { UpdateClassDto } from './dto/update-class.dto.js';

const idPipe = new PositiveIntPipe();

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a class (admin)' })
  @ApiCreatedResponse({ type: ClassResponseDto })
  @ApiErrors(400, 401, 403, 409, 422)
  create(@Body() dto: CreateClassDto): Promise<ClassResponseDto> {
    return this.classesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List classes: all for an admin, the assigned classes for a teacher' })
  @ApiOkResponse({ type: [ClassResponseDto] })
  @ApiErrors(401, 403)
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<ClassResponseDto[]> {
    return this.classesService.findAll(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Class with its students (admin, or the class teacher)' })
  @ApiOkResponse({ type: ClassDetailResponseDto })
  @ApiErrors(400, 401, 403, 404)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClassDetailResponseDto> {
    return this.classesService.findOne(id, user);
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Students enrolled in a class (admin, or the class teacher)' })
  @ApiOkResponse({ type: [ClassStudentDto] })
  @ApiErrors(400, 401, 403, 404)
  findStudents(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClassStudentDto[]> {
    return this.classesService.findStudents(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update the name or the teacher of a class (admin)' })
  @ApiOkResponse({ type: ClassResponseDto })
  @ApiErrors(400, 401, 403, 404, 409, 422)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new NonEmptyBodyPipe()) dto: UpdateClassDto,
  ): Promise<ClassResponseDto> {
    return this.classesService.update(id, dto);
  }

  @Put(':id/teacher')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a teacher to a class, or null to unassign (admin)' })
  @ApiOkResponse({ type: ClassResponseDto })
  @ApiErrors(400, 401, 403, 404, 422)
  assignTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTeacherDto,
  ): Promise<ClassResponseDto> {
    return this.classesService.assignTeacher(id, dto.teacherId);
  }

  @Post(':id/students')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enrol students in a class (admin)' })
  @ApiOkResponse({ type: ClassDetailResponseDto })
  @ApiErrors(400, 401, 403, 404, 422)
  assignStudents(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignStudentsDto,
  ): Promise<ClassDetailResponseDto> {
    return this.classesService.assignStudents(id, dto);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a student from a class (admin)' })
  @ApiNoContentResponse({ description: 'Removed' })
  @ApiErrors(400, 401, 403, 404)
  removeStudent(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<void> {
    return this.classesService.removeStudent(id, studentId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a class (admin)',
    description: 'Its students are kept and become unassigned.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors(400, 401, 403, 404)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.classesService.remove(id);
  }
}
