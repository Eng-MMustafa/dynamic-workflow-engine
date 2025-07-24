import { Body, Controller, Get, Param, Post, Put, Query, BadRequestException } from '@nestjs/common';
import { WorkflowInstanceStatus } from './entities/workflow-instance.entity';
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

  @Post('start-processing')
  async startTaskProcessing(@Body() body: {
    taskId: string;
    employeeId: string;
    processVariables?: Record<string, any>;
  }) {
    if (!body.taskId || !body.employeeId) {
      throw new BadRequestException('taskId and employeeId are required');
    }
    return await this.workflowService.startTaskProcessing(
      body.taskId,
      body.employeeId,
      body.processVariables,
    );
  }

  @Post('employ')
  async employEmployeeToTask(@Body() body: {
    employeeId: string;
    taskId: string;
    role?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    if (!body.employeeId || !body.taskId) {
      throw new BadRequestException('employeeId and taskId are required');
    }
    return await this.workflowService.employEmployeeToTask(
      body.employeeId,
      body.taskId,
      body.role,
      body.startDate,
      body.endDate,
    );
  }

  @Post('assign-task')
  async assignTaskToEmployee(@Body() body: {
    taskId: string;
    employeeId: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
  }) {
    if (!body.taskId || !body.employeeId) {
      throw new BadRequestException('taskId and employeeId are required');
    }
    return await this.workflowService.assignTaskToEmployee(
      body.taskId,
      body.employeeId,
      body.dueDate,
      body.priority,
      body.notes,
    );
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

  @Put('tasks/:taskId/status')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() body: {
      status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
      updatedBy: string;
      comments?: string;
    },
  ) {
    if (!body.status || !body.updatedBy) {
      throw new BadRequestException('status and updatedBy are required');
    }
    return await this.workflowService.updateTaskStatus(
      taskId,
      body.status,
      body.updatedBy,
      body.comments,
    );
  }

  @Get('employees/:employeeId/tasks')
  async getEmployeeTasks(
    @Param('employeeId') employeeId: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    // Validate employee exists
    try {
      await this.workflowService.validateEmployee(employeeId);
    } catch (error) {
      throw new BadRequestException(`Employee with ID ${employeeId} not found`);
    }
    
    return await this.workflowService.getTasksByEmployeeId(
      employeeId,
      status,
      fromDate,
      toDate,
    );
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
