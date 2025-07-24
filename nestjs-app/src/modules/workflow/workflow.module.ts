import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowInstance } from './entities/workflow-instance.entity'; 
import { WorkflowDefinition } from './entities/workflow-definition.entity'; 
import { CamundaModule } from '../camunda/camunda.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowInstance, WorkflowDefinition]),
    CamundaModule,
    UsersModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
