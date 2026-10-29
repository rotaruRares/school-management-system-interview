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
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role, Subject } from '@prisma/client';
import { ALL_ROLES, Roles } from '../auth/roles.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../common/authenticated-user.js';
import { ApiErrors } from '../common/errors/api-errors.decorator.js';
import { EnumQueryPipe } from '../common/validation/enum-query.pipe.js';
import { NonEmptyBodyPipe } from '../common/validation/non-empty-body.pipe.js';
import { PositiveIntPipe } from '../common/validation/positive-int.pipe.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { GradeResponseDto, GradeSummaryDto } from './dto/grade-response.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { GradesService } from './grades.service.js';

const idPipe = new PositiveIntPipe();
const optionalIdPipe = new PositiveIntPipe({ optional: true });
const subjectPipe = new EnumQueryPipe<Subject>(Object.values(Subject));

@ApiTags('Grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Add a grade (admin, or the teacher of the student's class)" })
  @ApiCreatedResponse({ type: GradeResponseDto })
  @ApiErrors(400, 401, 403, 422)
  create(
    @Body() dto: CreateGradeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GradeResponseDto> {
    return this.gradesService.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List grades: all for an admin, own classes only for a teacher' })
  @ApiQuery({ name: 'studentId', required: false, type: Number })
  @ApiQuery({ name: 'subject', required: false, enum: Subject, enumName: 'Subject' })
  @ApiOkResponse({ type: [GradeResponseDto] })
  @ApiErrors(400, 401, 403)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId', new ParseIntPipe({ optional: true })) studentId?: number,
    @Query('subject', subjectPipe) subject?: Subject,
  ): Promise<GradeResponseDto[]> {
    return this.gradesService.findAll(user, { studentId, subject });
  }

  @Get('subjects')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'The subjects a grade can be given for' })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'string', enum: Object.values(Subject) } } })
  @ApiErrors(401)
  listSubjects(): Subject[] {
    return this.gradesService.listSubjects();
  }

  @Get('me')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Own grades and average grade (student)' })
  @ApiOkResponse({ type: GradeSummaryDto })
  @ApiErrors(401, 403)
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<GradeSummaryDto> {
    return this.gradesService.findMine(user);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Grades and average of one student (admin, or the teacher of the student's class)" })
  @ApiOkResponse({ type: GradeSummaryDto })
  @ApiErrors(400, 401, 403, 404)
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GradeSummaryDto> {
    return this.gradesService.findByStudent(studentId, user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Grade details (admin, or the teacher of the student's class)" })
  @ApiOkResponse({ type: GradeResponseDto })
  @ApiErrors(400, 401, 403, 404)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GradeResponseDto> {
    return this.gradesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a grade (admin, or the teacher who gave it)' })
  @ApiOkResponse({ type: GradeResponseDto })
  @ApiErrors(400, 401, 403, 404)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new NonEmptyBodyPipe()) dto: UpdateGradeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GradeResponseDto> {
    return this.gradesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a grade (admin)' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors(400, 401, 403, 404)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.gradesService.remove(id);
  }
}
