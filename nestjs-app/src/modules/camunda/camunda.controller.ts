import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CamundaService } from './camunda.service';
import { ExternalTaskService } from './external-task.service';

@Controller('camunda')
export class CamundaController {
  constructor(
    private readonly camundaService: CamundaService,
    private readonly externalTaskService: ExternalTaskService,
  ) {}

  @Get('health')
  async getHealth() {
    const isHealthy = await this.camundaService.healthCheck();
    const taskClientStatus = this.externalTaskService.getClientStatus();
    
    return {
      camunda: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      },
      externalTaskClient: taskClientStatus,
    };
  }

  @Get('process-definitions')
  async getProcessDefinitions() {
    return await this.camundaService.getProcessDefinitions();
  }

  @Post('process/:processKey/start')
  async startProcess(
    @Param('processKey') processKey: string,
    @Body() variables: any,
  ) {
    return await this.camundaService.startProcess(processKey, variables);
  }

  @Get('process-instance/:id')
  async getProcessInstance(@Param('id') id: string) {
    return await this.camundaService.getProcessInstance(id);
  }

  @Get('process-instance/:id/tasks')
  async getActiveTasks(@Param('id') id: string) {
    return await this.camundaService.getActiveTasks(id);
  }

  @Get('process-instance/:id/variables')
  async getProcessVariables(@Param('id') id: string) {
    return await this.camundaService.getProcessVariables(id);
  }

  @Post('process-instance/:id/variables')
  async setProcessVariables(
    @Param('id') id: string,
    @Body() variables: any,
  ) {
    return await this.camundaService.setProcessVariables(id, variables);
  }

  @Get('task/:id')
  async getTask(@Param('id') id: string) {
    return await this.camundaService.getTask(id);
  }

  @Post('task/:id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body() variables: any = {},
  ) {
    return await this.camundaService.completeTask(id, variables);
  }

  @Post('deploy')
  async deployProcess(
    @Body() body: { processName: string; bpmnXml: string },
  ) {
    const { processName, bpmnXml } = body;
    return await this.camundaService.deployProcess(processName, bpmnXml);
  }

  @Post('external-tasks/start-polling')
  async startPolling() {
    await this.externalTaskService.startPolling();
    return { message: 'External task polling started' };
  }

  @Post('external-tasks/stop-polling')
  async stopPolling() {
    await this.externalTaskService.stopPolling();
    return { message: 'External task polling stopped' };
  }
}
