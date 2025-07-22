import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Client } from 'camunda-external-task-client-js';

@Injectable()
export class ExternalTaskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExternalTaskService.name);
  private client: Client;
  private readonly baseUrl: string;
  private readonly workerId: string;
  private readonly maxTasks: number;
  private readonly interval: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('EXTERNAL_TASK_BASE_URL');
    this.workerId = this.configService.get<string>('EXTERNAL_TASK_WORKER_ID', 'nestjs-worker');
    this.maxTasks = this.configService.get<number>('EXTERNAL_TASK_MAX_TASKS', 10);
    this.interval = this.configService.get<number>('EXTERNAL_TASK_INTERVAL', 5000);
  }

  async onModuleInit() {
    await this.initializeClient();
    this.subscribeToTasks();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.stop();
      this.logger.log('External Task Client stopped');
    }
  }

  private async initializeClient() {
    try {
      // Dynamically import the ESM module
      const { Client: CamundaClient } = await import('camunda-external-task-client-js');
      this.client = new CamundaClient({
        baseUrl: this.baseUrl,
        workerId: this.workerId,
        maxTasks: this.maxTasks,
        interval: this.interval,
        lockDuration: 10000,
        autoPoll: false,
      });

      this.logger.log(`External Task Client initialized with base URL: ${this.baseUrl}`);
    } catch (error) {
      this.logger.error('Failed to initialize External Task Client', error);
      throw error;
    }
  }

  private subscribeToTasks() {
    // Subscribe to HR Notification Tasks
    this.client.subscribe('notify-hr', async ({ task, taskService }) => {
      this.logger.log(`Processing HR notification task: ${task.id}`);
      
      try {
        const variables = task.variables.getAll();
        
        // Process HR notification logic here
        await this.processHRNotification(variables);
        
        // Complete the task
        await taskService.complete(task);
        this.logger.log(`HR notification task completed: ${task.id}`);
        
      } catch (error) {
        this.logger.error(`Failed to process HR notification task: ${task.id}`, error);
        
        // Handle failure
        await taskService.handleFailure(task, {
          errorMessage: error.message,
          errorDetails: error.stack,
          retries: 3,
          retryTimeout: 5000,
        });
      }
    });

    // Subscribe to Employee Notification Tasks
    this.client.subscribe('notify-employee', async ({ task, taskService }) => {
      this.logger.log(`Processing employee notification task: ${task.id}`);
      
      try {
        const variables = task.variables.getAll();
        
        // Process employee notification logic here
        await this.processEmployeeNotification(variables);
        
        // Complete the task
        await taskService.complete(task);
        this.logger.log(`Employee notification task completed: ${task.id}`);
        
      } catch (error) {
        this.logger.error(`Failed to process employee notification task: ${task.id}`, error);
        
        // Handle failure
        await taskService.handleFailure(task, {
          errorMessage: error.message,
          errorDetails: error.stack,
          retries: 3,
          retryTimeout: 5000,
        });
      }
    });

    // Subscribe to General Automation Tasks
    this.client.subscribe('automation-task', async ({ task, taskService }) => {
      this.logger.log(`Processing automation task: ${task.id}`);
      
      try {
        const variables = task.variables.getAll();
        const taskType = variables.taskType?.value || 'unknown';
        
        // Route to appropriate automation handler
        await this.processAutomationTask(taskType, variables);
        
        // Complete the task
        await taskService.complete(task);
        this.logger.log(`Automation task completed: ${task.id}`);
        
      } catch (error) {
        this.logger.error(`Failed to process automation task: ${task.id}`, error);
        
        // Handle failure
        await taskService.handleFailure(task, {
          errorMessage: error.message,
          errorDetails: error.stack,
          retries: 3,
          retryTimeout: 5000,
        });
      }
    });

    // Start polling for tasks
    this.client.start();
    this.logger.log('External Task Client started and subscribed to tasks');
  }

  private async processHRNotification(variables: any) {
    this.logger.log('Processing HR notification with variables:', variables);
    
    // Example HR notification logic
    const employeeName = variables.employeeName?.value || 'Unknown Employee';
    const leaveType = variables.leaveType?.value || 'Leave';
    const startDate = variables.startDate?.value;
    const endDate = variables.endDate?.value;
    
    // Here you would integrate with your notification system
    // For example: send email, push notification, etc.
    
    this.logger.log(`HR Notification: ${employeeName} has been approved for ${leaveType} from ${startDate} to ${endDate}`);
    
    // Simulate notification processing
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async processEmployeeNotification(variables: any) {
    this.logger.log('Processing employee notification with variables:', variables);
    
    // Example employee notification logic
    const employeeName = variables.employeeName?.value || 'Unknown Employee';
    const leaveType = variables.leaveType?.value || 'Leave';
    const reason = variables.rejectionReason?.value || 'No reason provided';
    
    // Here you would integrate with your notification system
    this.logger.log(`Employee Notification: ${employeeName}, your ${leaveType} request has been rejected. Reason: ${reason}`);
    
    // Simulate notification processing
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async processAutomationTask(taskType: string, variables: any) {
    this.logger.log(`Processing automation task of type: ${taskType}`, variables);
    
    switch (taskType) {
      case 'calculate-leave-balance':
        await this.calculateLeaveBalance(variables);
        break;
      case 'update-calendar':
        await this.updateCalendar(variables);
        break;
      case 'send-reminder':
        await this.sendReminder(variables);
        break;
      default:
        this.logger.warn(`Unknown automation task type: ${taskType}`);
    }
  }

  private async calculateLeaveBalance(variables: any) {
    // Example leave balance calculation
    const employeeId = variables.employeeId?.value;
    const leaveDays = variables.leaveDays?.value || 0;
    
    this.logger.log(`Calculating leave balance for employee: ${employeeId}, days: ${leaveDays}`);
    
    // Simulate calculation
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async updateCalendar(variables: any) {
    // Example calendar update
    const employeeId = variables.employeeId?.value;
    const startDate = variables.startDate?.value;
    const endDate = variables.endDate?.value;
    
    this.logger.log(`Updating calendar for employee: ${employeeId} from ${startDate} to ${endDate}`);
    
    // Simulate calendar update
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async sendReminder(variables: any) {
    // Example reminder sending
    const recipientId = variables.recipientId?.value;
    const message = variables.message?.value;
    
    this.logger.log(`Sending reminder to: ${recipientId}, message: ${message}`);
    
    // Simulate reminder sending
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Method to manually trigger task polling (useful for testing)
  async startPolling() {
    if (this.client) {
      this.client.start();
      this.logger.log('Manual polling started');
    }
  }

  // Method to stop task polling
  async stopPolling() {
    if (this.client) {
      await this.client.stop();
      this.logger.log('Polling stopped');
    }
  }

  // Get client status
  getClientStatus() {
    return {
      isRunning: this.client ? true : false,
      baseUrl: this.baseUrl,
      workerId: this.workerId,
      maxTasks: this.maxTasks,
      interval: this.interval,
    };
  }
}
