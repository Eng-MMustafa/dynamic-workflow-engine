import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NotificationType {
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  APPROVAL_APPROVED = 'APPROVAL_APPROVED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  GENERAL = 'GENERAL',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
