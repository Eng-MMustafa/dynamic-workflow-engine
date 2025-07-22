import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinition } from './entities/workflow-definition.entity'; // Adjust the import path as necessary
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { CamundaService } from '../camunda/camunda.service'; // Adjust the import path as necessary

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(WorkflowDefinition)
    private readonly workflowDefinitionRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstanceRepo: Repository<WorkflowInstance>,
    private readonly camundaService: CamundaService,
  ) {}

  // Deploy a new workflow definition
  async deployWorkflow(
    processDefinitionKey: string,
    name: string,
    bpmnXml: string,
    description?: string,
    metadata?: any,
  ): Promise<WorkflowDefinition> {
    try {
      // Deploy to Camunda first
      const deployment = await this.camundaService.deployProcess(name, bpmnXml);
      
      // Check if workflow definition already exists
      let workflowDefinition = await this.workflowDefinitionRepo.findOne({
        where: { processDefinitionKey },
      });

      if (workflowDefinition) {
        // Update existing definition
        workflowDefinition.name = name;
        workflowDefinition.description = description;
        workflowDefinition.bpmnXml = bpmnXml;
        workflowDefinition.version += 1;
        workflowDefinition.deploymentId = deployment.id;
        workflowDefinition.metadata = metadata;
        workflowDefinition.isActive = true;
      } else {
        // Create new definition
        workflowDefinition = this.workflowDefinitionRepo.create({
          processDefinitionKey,
          name,
          description,
          bpmnXml,
          version: 1,
          deploymentId: deployment.id,
          metadata,
          isActive: true,
        });
      }

      const savedDefinition = await this.workflowDefinitionRepo.save(workflowDefinition);
      this.logger.log(`Workflow deployed: ${processDefinitionKey} v${savedDefinition.version}`);
      
      return savedDefinition;
    } catch (error) {
      this.logger.error(`Failed to deploy workflow: ${processDefinitionKey}`, error);
      throw error;
    }
  }

  // Start a workflow instance
  async startWorkflow(
    processDefinitionKey: string,
    variables: any = {},
    businessKey?: string,
    initiatedBy?: string,
    metadata?: any,
  ): Promise<WorkflowInstance> {
    try {
      // Find workflow definition
      const workflowDefinition = await this.workflowDefinitionRepo.findOne({
        where: { processDefinitionKey, isActive: true },
      });

      if (!workflowDefinition) {
        throw new NotFoundException(`Workflow definition not found: ${processDefinitionKey}`);
      }

      // Start process in Camunda
      const processInstance = await this.camundaService.startProcess(processDefinitionKey, variables);

      // Create workflow instance record
      const workflowInstance = this.workflowInstanceRepo.create({
        processInstanceId: processInstance.id,
        workflowDefinitionId: workflowDefinition.id,
        status: WorkflowInstanceStatus.ACTIVE,
        initiatedBy,
        variables,
        metadata,
        businessKey,
        startedAt: new Date(),
      });

      const savedInstance = await this.workflowInstanceRepo.save(workflowInstance);
      this.logger.log(`Workflow started: ${processDefinitionKey}, Instance: ${processInstance.id}`);
      
      return savedInstance;
    } catch (error) {
      this.logger.error(`Failed to start workflow: ${processDefinitionKey}`, error);
      throw error;
    }
  }

  // Get workflow instance details
  async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance> {
    const instance = await this.workflowInstanceRepo.findOne({
      where: { id: instanceId },
      relations: ['workflowDefinition'],
    });

    if (!instance) {
      throw new NotFoundException(`Workflow instance not found: ${instanceId}`);
    }

    // Sync status with Camunda
    await this.syncInstanceStatus(instance);
    
    return instance;
  }

  // Get workflow instance by process instance ID
  async getWorkflowInstanceByProcessId(processInstanceId: string): Promise<WorkflowInstance> {
    const instance = await this.workflowInstanceRepo.findOne({
      where: { processInstanceId },
      relations: ['workflowDefinition'],
    });

    if (!instance) {
      throw new NotFoundException(`Workflow instance not found: ${processInstanceId}`);
    }

    // Sync status with Camunda
    await this.syncInstanceStatus(instance);
    
    return instance;
  }

  // Get all workflow instances
  async getWorkflowInstances(
    status?: WorkflowInstanceStatus,
    processDefinitionKey?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ instances: WorkflowInstance[]; total: number }> {
    const queryBuilder = this.workflowInstanceRepo
      .createQueryBuilder('instance')
      .leftJoinAndSelect('instance.workflowDefinition', 'definition')
      .orderBy('instance.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('instance.status = :status', { status });
    }

    if (processDefinitionKey) {
      queryBuilder.andWhere('definition.processDefinitionKey = :processDefinitionKey', {
        processDefinitionKey,
      });
    }

    const [instances, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { instances, total };
  }

  // Get workflow definitions
  async getWorkflowDefinitions(
    isActive?: boolean,
  ): Promise<WorkflowDefinition[]> {
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await this.workflowDefinitionRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // Get workflow definition by key
  async getWorkflowDefinition(processDefinitionKey: string): Promise<WorkflowDefinition> {
    const definition = await this.workflowDefinitionRepo.findOne({
      where: { processDefinitionKey },
      relations: ['instances'],
    });

    if (!definition) {
      throw new NotFoundException(`Workflow definition not found: ${processDefinitionKey}`);
    }

    return definition;
  }

  // Complete a user task
  async completeTask(taskId: string, variables: any = {}): Promise<void> {
    try {
      await this.camundaService.completeTask(taskId, variables);
      this.logger.log(`Task completed: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to complete task: ${taskId}`, error);
      throw error;
    }
  }

  // Get active tasks for a workflow instance
  async getActiveTasks(instanceId: string): Promise<any[]> {
    const instance = await this.getWorkflowInstance(instanceId);
    return await this.camundaService.getActiveTasks(instance.processInstanceId);
  }

  // Update workflow instance variables
  async updateInstanceVariables(instanceId: string, variables: any): Promise<void> {
    const instance = await this.getWorkflowInstance(instanceId);
    
    try {
      await this.camundaService.setProcessVariables(instance.processInstanceId, variables);
      
      // Update local record
      instance.variables = { ...instance.variables, ...variables };
      await this.workflowInstanceRepo.save(instance);
      
      this.logger.log(`Variables updated for instance: ${instanceId}`);
    } catch (error) {
      this.logger.error(`Failed to update variables for instance: ${instanceId}`, error);
      throw error;
    }
  }

  // Sync instance status with Camunda
  private async syncInstanceStatus(instance: WorkflowInstance): Promise<void> {
    try {
      const processInstance = await this.camundaService.getProcessInstance(instance.processInstanceId);
      
      let newStatus = instance.status;
      
      if (processInstance.ended) {
        newStatus = WorkflowInstanceStatus.COMPLETED;
        if (!instance.endedAt) {
          instance.endedAt = new Date();
        }
      } else if (processInstance.suspended) {
        newStatus = WorkflowInstanceStatus.SUSPENDED;
      } else {
        newStatus = WorkflowInstanceStatus.ACTIVE;
      }

      if (newStatus !== instance.status) {
        instance.status = newStatus;
        await this.workflowInstanceRepo.save(instance);
        this.logger.log(`Instance status updated: ${instance.id} -> ${newStatus}`);
      }
    } catch (error) {
      // If process instance not found in Camunda, it might be completed or terminated
      if (error.response?.status === 404) {
        instance.status = WorkflowInstanceStatus.COMPLETED;
        if (!instance.endedAt) {
          instance.endedAt = new Date();
        }
        await this.workflowInstanceRepo.save(instance);
      } else {
        this.logger.warn(`Failed to sync instance status: ${instance.id}`, error.message);
      }
    }
  }

  // Deactivate a workflow definition
  async deactivateWorkflow(processDefinitionKey: string): Promise<void> {
    const definition = await this.getWorkflowDefinition(processDefinitionKey);
    definition.isActive = false;
    await this.workflowDefinitionRepo.save(definition);
    this.logger.log(`Workflow deactivated: ${processDefinitionKey}`);
  }

  // Get workflow statistics
  async getWorkflowStatistics(): Promise<any> {
    const totalDefinitions = await this.workflowDefinitionRepo.count();
    const activeDefinitions = await this.workflowDefinitionRepo.count({ where: { isActive: true } });
    
    const instanceStats = await this.workflowInstanceRepo
      .createQueryBuilder('instance')
      .select('instance.status, COUNT(*) as count')
      .groupBy('instance.status')
      .getRawMany();

    const totalInstances = await this.workflowInstanceRepo.count();

    return {
      definitions: {
        total: totalDefinitions,
        active: activeDefinitions,
        inactive: totalDefinitions - activeDefinitions,
      },
      instances: {
        total: totalInstances,
        byStatus: instanceStats.reduce((acc, stat) => {
          acc[stat.instance_status] = parseInt(stat.count);
          return acc;
        }, {}),
      },
    };
  }
}
