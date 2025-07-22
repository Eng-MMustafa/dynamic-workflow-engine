import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowInstance } from './entities/workflow-instance.entity'; // Adjust the import path as necessary
import { WorkflowDefinition } from './entities/workflow-definition.entity'; // Adjust the import path as necessary
import { CamundaModule } from '../camunda/camunda.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowInstance, WorkflowDefinition]),
    CamundaModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
