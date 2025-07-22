import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /api
   * Root endpoint
   */
  @Get()
  getHello(): string {
    return 'Welcome to Dynamic Workflow Engine API';
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  /**
   * GET /api/info
   * App info endpoint (اختياري)
   */
  @Get('info')
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}