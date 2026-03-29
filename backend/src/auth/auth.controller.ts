import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Response,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Response as ExpressResponse } from 'express';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    return this.authService.register(registerDto, response);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @Post('login')
  async login(
    @Request() req,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @Post('refresh')
  async refresh(
    @Request() req,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    return this.authService.refresh(refreshToken, response);
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @Post('logout')
  async logout(
    @Request() req,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    return this.authService.logout(response, refreshToken);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the user profile' })
  @Get('profile')
  async getProfile(@CurrentUser() user) {
    return this.authService.getProfile(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user data' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user information',
  })
  @Get('me')
  async getCurrentUser(@CurrentUser() user) {
    const profile = await this.authService.getProfile(user.id);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        profileId: profile?.profileId,
        tenantId: profile?.tenantId,
      },
    };
  }

  // Protected routes with role-based access
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin-only')
  adminOnly() {
    return { message: 'This is an admin-only endpoint' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('teacher-admin')
  teacherAdmin() {
    return { message: 'This endpoint is for teachers and admins' };
  }

  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @Get('all-users')
  allUsers() {
    return { message: 'This endpoint is for all authenticated users' };
  }
}
