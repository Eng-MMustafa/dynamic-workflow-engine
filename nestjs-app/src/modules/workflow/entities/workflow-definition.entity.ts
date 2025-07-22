import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WorkflowInstance } from './workflow-instance.entity'; // Adjust the import path as necessary

@Entity('workflow_definitions')
export class WorkflowDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  processDefinitionKey: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  version: number;

  @Column('text')
  bpmnXml: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  deploymentId: string;

  @Column('json', { nullable: true })
  metadata: any;

  @OneToMany(() => WorkflowInstance, instance => instance.workflowDefinition)
  instances: WorkflowInstance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
