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
import { ApiErrors } from '../common/errors/api-errors.decorator.js';
import { NonEmptyBodyPipe } from '../common/validation/non-empty-body.pipe.js';
import { PositiveIntPipe } from '../common/validation/positive-int.pipe.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { TeacherResponseDto } from './dto/teacher-response.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { TeachersService } from './teachers.service.js';

const idPipe = new PositiveIntPipe();

@ApiTags('Teachers')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a teacher and their login account (admin)' })
  @ApiCreatedResponse({ type: TeacherResponseDto })
  @ApiErrors(400, 401, 403, 409)
  create(@Body() dto: CreateTeacherDto): Promise<TeacherResponseDto> {
    return this.teachersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all teachers (admin)' })
  @ApiOkResponse({ type: [TeacherResponseDto] })
  @ApiErrors(401, 403)
  findAll(): Promise<TeacherResponseDto[]> {
    return this.teachersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Teacher details (admin)' })
  @ApiOkResponse({ type: TeacherResponseDto })
  @ApiErrors(400, 401, 403, 404)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TeacherResponseDto> {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a teacher (admin)' })
  @ApiOkResponse({ type: TeacherResponseDto })
  @ApiErrors(400, 401, 403, 404, 409)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new NonEmptyBodyPipe()) dto: UpdateTeacherDto,
  ): Promise<TeacherResponseDto> {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a teacher (admin)',
    description:
      'The teacher\'s classes become unassigned and the grades they gave are kept without an author.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiErrors(400, 401, 403, 404)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.teachersService.remove(id);
  }
}
