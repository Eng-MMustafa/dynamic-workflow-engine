import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity'; // Adjust the import path as necessary
import { UsersService } from '../users/users.service'; // Adjust the import path as necessary
import { UserResponseDto } from './dto/user-response.dto';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
  user: UserResponseDto;
  expires_in: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findByUsername(username);
      
      if (!user) {
        return null;
      }

      const isPasswordValid = await this.usersService.validatePassword(user, password);
      
      if (!isPasswordValid) {
        return null;
      }

      // Update last login
      await this.usersService.updateLastLogin(user.id);
      
      this.logger.log(`User authenticated: ${username}`);
      return user;
    } catch (error) {
      this.logger.error(`Authentication failed for user: ${username}`, error);
      return null;
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure we have the user with roles
    const userWithRoles = await this.usersService.findOneWithRoles(user.id);
    if (!userWithRoles) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: userWithRoles.id,
      username: userWithRoles.username,
      email: userWithRoles.email,
      roles: userWithRoles.roles?.map(userRole => userRole.role?.name).filter(Boolean) || [],
    };

    const expiresIn = 3600; // 1 hour
    const access_token = this.jwtService.sign(payload, { expiresIn });

    // Update last login
    await this.usersService.updateLastLogin(userWithRoles.id);

    return {
      access_token,
      user: new UserResponseDto(userWithRoles),
      expires_in: expiresIn,
    };
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
  }): Promise<LoginResponse> {
    try {
      // Create user with default employee role
      const user = await this.usersService.createUser(userData);
      
      // Assign default employee role
      const employeeRole = await this.usersService.findRoleByName('employee');
      if (employeeRole) {
        await this.usersService.assignRole(user.id, employeeRole.id);
      }

      // Fetch user with roles for login
      const userWithRoles = await this.usersService.findById(user.id);
      
      // Generate JWT token
      const payload: JwtPayload = {
        sub: userWithRoles.id,
        username: userWithRoles.username,
        email: userWithRoles.email,
        roles: userWithRoles.roles?.map(userRole => userRole.role.name) || [],
      };

      const access_token = this.jwtService.sign(payload);
      const decoded = this.jwtService.decode(access_token) as any;
      const expires_in = decoded.exp - decoded.iat;

      this.logger.log(`User registered and logged in: ${userData.username}`);

      return {
        access_token,
        user: new UserResponseDto(userWithRoles),
        expires_in,
      };
    } catch (error) {
      this.logger.error(`Registration failed for user: ${userData.username}`, error);
      throw error;
    }
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshToken(user: User): Promise<LoginResponse> {
    const userWithRoles = await this.usersService.findOneWithRoles(user.id);
    if (!userWithRoles) {
      throw new UnauthorizedException('User not found');
    }
    
    const payload: JwtPayload = {
      sub: userWithRoles.id,
      username: userWithRoles.username,
      email: userWithRoles.email,
      roles: userWithRoles.roles?.map(userRole => userRole.role?.name).filter(Boolean) || [],
    };

    const expiresIn = 3600; // 1 hour
    const access_token = this.jwtService.sign(payload, { expiresIn });

    return {
      access_token,
      user: new UserResponseDto(userWithRoles),
      expires_in: expiresIn,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    
    const isCurrentPasswordValid = await this.usersService.validatePassword(user, currentPassword);
    
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.updateUser(userId, { password: newPassword });
    this.logger.log(`Password changed for user: ${user.username}`);
  }

  async getUserProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOneWithRoles(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return new UserResponseDto(user);
  }

  async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      department?: string;
      position?: string;
      metadata?: any;
    },
  ): Promise<UserResponseDto> {
    await this.usersService.updateUser(userId, updateData);
    return await this.getUserProfile(userId);
  }
}
