import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../common/authenticated-user.js';
import { ApiErrors } from '../common/errors/api-errors.decorator.js';
import { getConfig } from '../config/app-config.js';
import { AuthService } from './auth.service.js';
import { parseCookies } from './cookies.util.js';
import { AuthResponseDto, SessionUserDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';
import { ALL_ROLES, Roles } from './roles.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly config = getConfig();

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Returns a short-lived access token and sets an httpOnly refresh cookie. Five failed attempts per IP and email are throttled.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrors(400, 401, 429)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { session, refreshToken } = await this.authService.login(dto, request.ip ?? 'unknown');
    this.setRefreshCookie(response, refreshToken);
    return session;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Exchange the refresh cookie for a new access token',
    description: 'The refresh token is rotated: the previous one stops working.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiErrors(401)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const rawToken = parseCookies(request.headers.cookie)[this.config.refreshToken.cookieName];
    try {
      const { session, refreshToken } = await this.authService.refresh(rawToken);
      this.setRefreshCookie(response, refreshToken);
      return session;
    } catch (error) {
      this.clearRefreshCookie(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the refresh token and clear the cookie' })
  @ApiNoContentResponse({ description: 'Logged out' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const rawToken = parseCookies(request.headers.cookie)[this.config.refreshToken.cookieName];
    await this.authService.logout(rawToken);
    this.clearRefreshCookie(response);
  }

  @Get('me')
  @Roles(...ALL_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'The logged-in user' })
  @ApiOkResponse({ type: SessionUserDto })
  @ApiErrors(401)
  me(@CurrentUser() user: AuthenticatedUser): Promise<SessionUserDto> {
    return this.authService.me(user.userId);
  }

  private setRefreshCookie(response: Response, token: string): void {
    const { cookieName, cookiePath, secureCookie, ttlSeconds } = this.config.refreshToken;
    response.cookie(cookieName, token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'strict',
      path: cookiePath,
      maxAge: ttlSeconds * 1000,
    });
  }

  private clearRefreshCookie(response: Response): void {
    const { cookieName, cookiePath, secureCookie } = this.config.refreshToken;
    response.clearCookie(cookieName, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'strict',
      path: cookiePath,
    });
  }
}
