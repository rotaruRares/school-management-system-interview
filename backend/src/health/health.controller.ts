import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { ApiErrors } from '../common/errors/api-errors.decorator.js';
import { ServiceUnavailableError } from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Liveness and database check' })
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  @ApiErrors(503)
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableError(
        ErrorCode.DATABASE_UNAVAILABLE,
        'The database is unavailable',
      );
    }
    return { status: 'ok' };
  }
}
