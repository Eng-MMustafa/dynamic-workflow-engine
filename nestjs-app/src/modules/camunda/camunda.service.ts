import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CamundaService {
  private readonly logger = new Logger(CamundaService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly engineName: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('CAMUNDA_BASE_URL');
    this.engineName = this.configService.get<string>('CAMUNDA_ENGINE_NAME', 'default');
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Camunda Service initialized with base URL: ${this.baseUrl}`);
  }

  // Deploy BPMN Process
  async deployProcess(processName: string, bpmnXml: string) {
    try {
      const formData = new FormData();
      formData.append('deployment-name', processName);
      formData.append('enable-duplicate-filtering', 'true');
      formData.append('deploy-changed-only', 'true');
      formData.append('deployment-source', 'nestjs-app');
      
      const blob = new Blob([bpmnXml], { type: 'application/xml' });
      formData.append(`${processName}.bpmn`, blob, `${processName}.bpmn`);

      const response = await this.httpClient.post('/deployment/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      this.logger.log(`Process deployed successfully: ${processName}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to deploy process: ${processName}`, error.message);
      throw error;
    }
  }

  // Start Process Instance
  async startProcess(processDefinitionKey: string, variables: any = {}) {
    try {
      const response = await this.httpClient.post(
        `/process-definition/key/${processDefinitionKey}/start`,
        {
          variables: this.formatVariables(variables),
        },
      );

      this.logger.log(`Process started: ${processDefinitionKey}, Instance ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to start process: ${processDefinitionKey}`, error.message);
      throw error;
    }
  }

  // Get Process Instance
  async getProcessInstance(processInstanceId: string) {
    try {
      const response = await this.httpClient.get(`/process-instance/${processInstanceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get process instance: ${processInstanceId}`, error.message);
      throw error;
    }
  }

  // Get Active Tasks for Process Instance
  async getActiveTasks(processInstanceId: string) {
    try {
      const response = await this.httpClient.get('/task', {
        params: {
          processInstanceId,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get active tasks for process: ${processInstanceId}`, error.message);
      throw error;
    }
  }

  // Complete User Task
  async completeTask(taskId: string, variables: any = {}) {
    try {
      const response = await this.httpClient.post(`/task/${taskId}/complete`, {
        variables: this.formatVariables(variables),
      });

      this.logger.log(`Task completed: ${taskId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to complete task: ${taskId}`, error.message);
      throw error;
    }
  }

  // Get Task Details
  async getTask(taskId: string) {
    try {
      const response = await this.httpClient.get(`/task/${taskId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get task: ${taskId}`, error.message);
      throw error;
    }
  }

  // Get Process Definitions
  async getProcessDefinitions() {
    try {
      const response = await this.httpClient.get('/process-definition', {
        params: {
          latestVersion: true,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get process definitions', error.message);
      throw error;
    }
  }

  // Get Process Variables
  async getProcessVariables(processInstanceId: string) {
    try {
      const response = await this.httpClient.get(`/process-instance/${processInstanceId}/variables`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get process variables: ${processInstanceId}`, error.message);
      throw error;
    }
  }

  // Set Process Variables
  async setProcessVariables(processInstanceId: string, variables: any) {
    try {
      const response = await this.httpClient.post(
        `/process-instance/${processInstanceId}/variables`,
        this.formatVariables(variables),
      );

      this.logger.log(`Variables set for process: ${processInstanceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to set process variables: ${processInstanceId}`, error.message);
      throw error;
    }
  }

  // Helper method to format variables for Camunda
  private formatVariables(variables: any): any {
    const formatted = {};
    
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        formatted[key] = { value, type: 'String' };
      } else if (typeof value === 'number') {
        formatted[key] = { value, type: Number.isInteger(value) ? 'Integer' : 'Double' };
      } else if (typeof value === 'boolean') {
        formatted[key] = { value, type: 'Boolean' };
      } else if (value instanceof Date) {
        formatted[key] = { value: value.toISOString(), type: 'Date' };
      } else {
        formatted[key] = { value: JSON.stringify(value), type: 'Json' };
      }
    }
    
    return formatted;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/engine');
      return response.status === 200;
    } catch (error) {
      this.logger.error('Camunda health check failed', error.message);
      return false;
    }
  }
}
