import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity'; // Adjust the import path as necessary

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  permissions: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column('json', { nullable: true })
  metadata: any;

  @OneToMany(() => UserRole, userRole => userRole.role)
  users: UserRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
