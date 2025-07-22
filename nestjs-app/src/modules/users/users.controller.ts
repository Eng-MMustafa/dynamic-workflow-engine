import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserStatus } from './entities/user.entity'; // Adjust the import path as necessary

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
    managerId?: string;
    metadata?: any;
  }) {
    return await this.usersService.createUser(userData);
  }

  @Get()
  async findAllUsers(
    @Query('status') status?: UserStatus,
    @Query('department') department?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    
    return await this.usersService.findAll(status, department, limitNum, offsetNum);
  }

  @Get('statistics')
  async getUserStatistics() {
    return await this.usersService.getUserStatistics();
  }

  @Get('managers')
  async getManagers() {
    return await this.usersService.getManagers();
  }

  @Get(':id')
  async findUser(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return await this.usersService.updateUser(id, updateData);
  }

  @Put(':id/activate')
  async activateUser(@Param('id') id: string) {
    await this.usersService.activateUser(id);
    return { message: 'User activated successfully' };
  }

  @Put(':id/deactivate')
  async deactivateUser(@Param('id') id: string) {
    await this.usersService.deactivateUser(id);
    return { message: 'User deactivated successfully' };
  }

  @Get(':id/subordinates')
  async getSubordinates(@Param('id') id: string) {
    return await this.usersService.getSubordinates(id);
  }

  @Post(':userId/roles/:roleId')
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Body() body: { assignedBy?: string } = {},
  ) {
    return await this.usersService.assignRole(userId, roleId, body.assignedBy);
  }

  @Delete(':userId/roles/:roleId')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.usersService.removeRole(userId, roleId);
    return { message: 'Role removed successfully' };
  }

  @Get(':userId/permissions/:permission')
  async checkPermission(
    @Param('userId') userId: string,
    @Param('permission') permission: string,
  ) {
    const hasPermission = await this.usersService.hasPermission(userId, permission);
    return { hasPermission };
  }

  @Get(':userId/roles/:roleName')
  async checkRole(
    @Param('userId') userId: string,
    @Param('roleName') roleName: string,
  ) {
    const hasRole = await this.usersService.hasRole(userId, roleName);
    return { hasRole };
  }
}

@Controller('roles')
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createRole(@Body() roleData: {
    name: string;
    description?: string;
    permissions?: string[];
    metadata?: any;
  }) {
    return await this.usersService.createRole(roleData);
  }

  @Get()
  async findAllRoles(@Query('isActive') isActive?: string) {
    const isActiveBoolean = isActive ? isActive === 'true' : undefined;
    return await this.usersService.findAllRoles(isActiveBoolean);
  }

  @Get(':name')
  async findRoleByName(@Param('name') name: string) {
    return await this.usersService.findRoleByName(name);
  }

  @Get(':roleName/users')
  async getUsersByRole(@Param('roleName') roleName: string) {
    return await this.usersService.getUsersByRole(roleName);
  }

  @Post('initialize-defaults')
  async initializeDefaultRoles() {
    await this.usersService.initializeDefaultRoles();
    return { message: 'Default roles initialized successfully' };
  }
}
