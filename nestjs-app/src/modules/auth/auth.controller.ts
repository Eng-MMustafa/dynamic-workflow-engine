import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    return await this.authService.login(loginDto.username, loginDto.password);
  }

  @Post('register')
  async register(@Body() registerDto: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
  }) {
    return await this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.authService.getUserProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateData: {
      firstName?: string;
      lastName?: string;
      department?: string;
      position?: string;
      metadata?: any;
    },
  ) {
    return await this.authService.updateProfile(req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Request() req) {
    return await this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateToken(@Request() req) {
    return {
      valid: true,
      user: req.user,
    };
  }
}
