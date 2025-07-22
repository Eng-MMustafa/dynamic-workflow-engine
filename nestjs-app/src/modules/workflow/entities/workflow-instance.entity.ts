import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkflowDefinition } from './workflow-definition.entity'; // Adjust the import path as necessary

export enum WorkflowInstanceStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  FAILED = 'FAILED',
}

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  processInstanceId: string;

  @Column()
  workflowDefinitionId: string;

  @ManyToOne(() => WorkflowDefinition, definition => definition.instances)
  @JoinColumn({ name: 'workflowDefinitionId' })
  workflowDefinition: WorkflowDefinition;

  @Column({
    type: 'enum',
    enum: WorkflowInstanceStatus,
    default: WorkflowInstanceStatus.ACTIVE,
  })
  status: WorkflowInstanceStatus;

  @Column({ nullable: true })
  initiatedBy: string;

  @Column('json', { nullable: true })
  variables: any;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  businessKey: string;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
