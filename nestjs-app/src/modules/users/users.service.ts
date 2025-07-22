import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity'; // Adjust the import path as necessary
import { UserRole } from './entities/user-role.entity';
import { User, UserStatus } from './entities/user.entity'; // Adjust the import path as necessary

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  // Create a new user
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
    managerId?: string;
    metadata?: any;
  }): Promise<User> {
    // Check if username or email already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: userData.username },
        { email: userData.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created: ${savedUser.username}`);

    return savedUser;
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.role'],
    });
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.role'],
    });
  }

  // Find a user by ID with their roles
  async findOneWithRoles(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role']
    });
  }

  // Find a user by ID
  async findOne(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Find user by ID
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    return user;
  }

  // Get all users
  async findAll(
    status?: UserStatus,
    department?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ users: User[]; total: number }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .orderBy('user.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    const [users, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  // Update user
  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);
    
    this.logger.log(`User updated: ${updatedUser.username}`);
    return updatedUser;
  }

  // Validate user password
  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  // Update last login
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  // Create a role
  async createRole(roleData: {
    name: string;
    description?: string;
    permissions?: string[];
    metadata?: any;
  }): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleData.name },
    });

    if (existingRole) {
      throw new ConflictException('Role already exists');
    }

    const role = this.roleRepository.create(roleData);
    const savedRole = await this.roleRepository.save(role);
    
    this.logger.log(`Role created: ${savedRole.name}`);
    return savedRole;
  }

  // Get all roles
  async findAllRoles(isActive?: boolean): Promise<Role[]> {
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await this.roleRepository.find({
      where,
      relations: ['users', 'users.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Find role by name
  async findRoleByName(name: string): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { name },
      relations: ['users', 'users.user'],
    });
  }

  // Assign role to user
  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    const user = await this.findById(userId);
    const role = await this.roleRepository.findOne({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    // Check if user already has this role
    const existingUserRole = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (existingUserRole) {
      throw new ConflictException('User already has this role');
    }

    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      assignedBy,
    });

    const savedUserRole = await this.userRoleRepository.save(userRole);
    this.logger.log(`Role assigned: ${role.name} to ${user.username}`);

    return savedUserRole;
  }

  // Remove role from user
  async removeRole(userId: string, roleId: string): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (!userRole) {
      throw new NotFoundException('User role assignment not found');
    }

    await this.userRoleRepository.remove(userRole);
    this.logger.log(`Role removed from user: ${userId}`);
  }

  // Get users by role
  async getUsersByRole(roleName: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('role.name = :roleName', { roleName })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .getMany();
  }

  // Get managers
  async getManagers(): Promise<User[]> {
    return await this.getUsersByRole('manager');
  }

  // Get user's subordinates (if user is a manager)
  async getSubordinates(managerId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { managerId, status: UserStatus.ACTIVE },
      relations: ['roles', 'roles.role'],
    });
  }

  // Check if user has permission
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.findById(userId);
    
    for (const userRole of user.roles) {
      if (userRole.role.permissions?.includes(permission)) {
        return true;
      }
    }
    
    return false;
  }

  // Check if user has role
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user.roles.some(userRole => userRole.role.name === roleName);
  }

  // Deactivate user
  async deactivateUser(id: string): Promise<void> {
    await this.userRepository.update(id, { status: UserStatus.INACTIVE });
    this.logger.log(`User deactivated: ${id}`);
  }

  // Activate user
  async activateUser(id: string): Promise<void> {
    await this.userRepository.update(id, { status: UserStatus.ACTIVE });
    this.logger.log(`User activated: ${id}`);
  }

  // Get user statistics
  async getUserStatistics(): Promise<any> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const inactiveUsers = await this.userRepository.count({ where: { status: UserStatus.INACTIVE } });
    
    const departmentStats = await this.userRepository
      .createQueryBuilder('user')
      .select('user.department, COUNT(*) as count')
      .where('user.department IS NOT NULL')
      .groupBy('user.department')
      .getRawMany();

    const roleStats = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoin('role.users', 'userRole')
      .select('role.name, COUNT(userRole.id) as count')
      .groupBy('role.id')
      .getRawMany();

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: totalUsers - activeUsers - inactiveUsers,
      },
      departments: departmentStats.reduce((acc, stat) => {
        acc[stat.user_department] = parseInt(stat.count);
        return acc;
      }, {}),
      roles: roleStats.reduce((acc, stat) => {
        acc[stat.role_name] = parseInt(stat.count);
        return acc;
      }, {}),
    };
  }

  // Initialize default roles
  async initializeDefaultRoles(): Promise<void> {
    const defaultRoles = [
      {
        name: 'admin',
        description: 'System Administrator',
        permissions: ['*'], // All permissions
      },
      {
        name: 'manager',
        description: 'Manager',
        permissions: ['workflow.start', 'workflow.approve', 'user.view', 'task.assign'],
      },
      {
        name: 'employee',
        description: 'Employee',
        permissions: ['workflow.start', 'task.complete', 'profile.view'],
      },
      {
        name: 'hr',
        description: 'Human Resources',
        permissions: ['user.manage', 'workflow.view', 'report.generate'],
      },
    ];

    for (const roleData of defaultRoles) {
      const existingRole = await this.findRoleByName(roleData.name);
      if (!existingRole) {
        await this.createRole(roleData);
      }
    }

    this.logger.log('Default roles initialized');
  }
}
