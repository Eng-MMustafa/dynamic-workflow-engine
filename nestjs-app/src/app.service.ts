import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Returns a health check object
   */
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns app info (optional)
   */
  getAppInfo() {
    return {
      name: process.env.APP_NAME || 'Dynamic Workflow Engine',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
    };
  }
}