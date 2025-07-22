import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationType, NotificationStatus } from './entities/notification.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(
    @Request() req,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    
    return await this.notificationService.getUserNotifications(
      req.user.id,
      status,
      type,
      limitNum,
      offsetNum,
    );
  }

  @Get('statistics')
  async getNotificationStatistics(@Request() req) {
    return await this.notificationService.getNotificationStatistics(req.user.id);
  }

  @Post()
  async createNotification(
    @Request() req,
    @Body() notificationData: {
      type: NotificationType;
      title: string;
      message: string;
      metadata?: any;
      actionUrl?: string;
    },
  ) {
    return await this.notificationService.createNotification({
      userId: req.user.id,
      ...notificationData,
    });
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.notificationService.markAsRead(id, req.user.id);
    return { message: 'Notification marked as read' };
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.notificationService.deleteNotification(id, req.user.id);
    return { message: 'Notification deleted' };
  }

  @Delete()
  async deleteAllNotifications(@Request() req) {
    await this.notificationService.deleteAllNotifications(req.user.id);
    return { message: 'All notifications deleted' };
  }

  // Admin endpoints for sending notifications
  @Post('send-to-users')
  async sendToMultipleUsers(
    @Body() data: {
      userIds: string[];
      type: NotificationType;
      title: string;
      message: string;
      metadata?: any;
      actionUrl?: string;
    },
  ) {
    await this.notificationService.notifyMultipleUsers(data.userIds, {
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      actionUrl: data.actionUrl,
    });
    return { message: 'Notifications sent successfully' };
  }

  @Post('send-to-role')
  async sendToRole(
    @Body() data: {
      roleName: string;
      type: NotificationType;
      title: string;
      message: string;
      metadata?: any;
      actionUrl?: string;
    },
  ) {
    await this.notificationService.notifyUsersByRole(data.roleName, {
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      actionUrl: data.actionUrl,
    });
    return { message: 'Notifications sent to role successfully' };
  }
}
