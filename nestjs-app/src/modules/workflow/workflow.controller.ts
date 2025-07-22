import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { WorkflowInstanceStatus } from './entities/workflow-instance.entity'; // Adjust the import path as necessary
import { WorkflowService } from './workflow.service';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('deploy')
  async deployWorkflow(@Body() body: {
    processDefinitionKey: string;
    name: string;
    bpmnXml: string;
    description?: string;
    metadata?: any;
  }) {
    const { processDefinitionKey, name, bpmnXml, description, metadata } = body;
    return await this.workflowService.deployWorkflow(
      processDefinitionKey,
      name,
      bpmnXml,
      description,
      metadata,
    );
  }

  @Post('start')
  async startWorkflow(@Body() body: {
    processDefinitionKey: string;
    variables?: any;
    businessKey?: string;
    initiatedBy?: string;
    metadata?: any;
  }) {
    const { processDefinitionKey, variables, businessKey, initiatedBy, metadata } = body;
    return await this.workflowService.startWorkflow(
      processDefinitionKey,
      variables,
      businessKey,
      initiatedBy,
      metadata,
    );
  }

  @Get('definitions')
  async getWorkflowDefinitions(@Query('isActive') isActive?: string) {
    const isActiveBoolean = isActive ? isActive === 'true' : undefined;
    return await this.workflowService.getWorkflowDefinitions(isActiveBoolean);
  }

  @Get('definitions/:processDefinitionKey')
  async getWorkflowDefinition(@Param('processDefinitionKey') processDefinitionKey: string) {
    return await this.workflowService.getWorkflowDefinition(processDefinitionKey);
  }

  @Put('definitions/:processDefinitionKey/deactivate')
  async deactivateWorkflow(@Param('processDefinitionKey') processDefinitionKey: string) {
    await this.workflowService.deactivateWorkflow(processDefinitionKey);
    return { message: 'Workflow deactivated successfully' };
  }

  @Get('instances')
  async getWorkflowInstances(
    @Query('status') status?: WorkflowInstanceStatus,
    @Query('processDefinitionKey') processDefinitionKey?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    
    return await this.workflowService.getWorkflowInstances(
      status,
      processDefinitionKey,
      limitNum,
      offsetNum,
    );
  }

  @Get('instances/:instanceId')
  async getWorkflowInstance(@Param('instanceId') instanceId: string) {
    return await this.workflowService.getWorkflowInstance(instanceId);
  }

  @Get('instances/process/:processInstanceId')
  async getWorkflowInstanceByProcessId(@Param('processInstanceId') processInstanceId: string) {
    return await this.workflowService.getWorkflowInstanceByProcessId(processInstanceId);
  }

  @Get('instances/:instanceId/tasks')
  async getActiveTasks(@Param('instanceId') instanceId: string) {
    return await this.workflowService.getActiveTasks(instanceId);
  }

  @Put('instances/:instanceId/variables')
  async updateInstanceVariables(
    @Param('instanceId') instanceId: string,
    @Body() variables: any,
  ) {
    await this.workflowService.updateInstanceVariables(instanceId, variables);
    return { message: 'Variables updated successfully' };
  }

  @Post('tasks/:taskId/complete')
  async completeTask(
    @Param('taskId') taskId: string,
    @Body() variables: any = {},
  ) {
    await this.workflowService.completeTask(taskId, variables);
    return { message: 'Task completed successfully' };
  }

  @Get('statistics')
  async getWorkflowStatistics() {
    return await this.workflowService.getWorkflowStatistics();
  }
}
