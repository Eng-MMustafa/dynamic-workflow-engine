import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from './user-role.entity'; // Adjust the import path as necessary

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  managerId: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column('json', { nullable: true })
  metadata: any;

  @OneToMany(() => UserRole, userRole => userRole.user)
  roles: UserRole[];

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property to get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Virtual property to check if user is manager
  get isManager(): boolean {
    return this.roles?.some(role => role.role.name === 'manager') || false;
  }
}
