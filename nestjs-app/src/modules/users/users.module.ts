import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController, RolesController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity'; // Adjust the import path as necessary

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserRole])],
  controllers: [UsersController, RolesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
