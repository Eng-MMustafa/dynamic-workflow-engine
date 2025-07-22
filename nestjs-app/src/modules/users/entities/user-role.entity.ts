import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity'; // Adjust the import path as necessary
import { Role } from './role.entity'; // Adjust the import path as necessary

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  roleId: string;

  @ManyToOne(() => User, user => user.roles)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  assignedBy: string;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  assignedAt: Date;
}
