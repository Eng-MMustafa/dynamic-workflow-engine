import { UserRole } from '../../users/entities/user-role.entity';
import { User } from '../../users/entities/user.entity';

interface RoleDto {
  id: string;
  name: string;
  description: string;
}

export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  status: string;
  roles: RoleDto[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: Partial<User> & { roles?: UserRole[] }) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.department = user.department;
    this.position = user.position;
    this.status = user.status;
    this.lastLoginAt = user.lastLoginAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    
    // Handle roles safely
    if (user.roles && user.roles.length > 0) {
      this.roles = user.roles.map(userRole => ({
        id: userRole.role?.id || '',
        name: userRole.role?.name || '',
        description: userRole.role?.description || ''
      }));
    } else {
      this.roles = [];
    }
  }
}
