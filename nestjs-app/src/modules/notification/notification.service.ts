import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway'; // Adjust the import path as necessary

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // Create a new notification
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
    actionUrl?: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      status: NotificationStatus.UNREAD,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Send real-time notification via WebSocket
    this.notificationGateway.sendNotificationToUser(data.userId, savedNotification);

    this.logger.log(`Notification created for user ${data.userId}: ${data.title}`);
    return savedNotification;
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    status?: NotificationStatus,
    type?: NotificationType,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    const [notifications, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });

    return { notifications, total, unreadCount };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { status: NotificationStatus.READ, readAt: new Date() },
    );

    this.logger.log(`Notification marked as read: ${notificationId}`);
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );

    this.logger.log(`All notifications marked as read for user: ${userId}`);
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
    this.logger.log(`Notification deleted: ${notificationId}`);
  }

  // Delete all notifications for a user
  async deleteAllNotifications(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
    this.logger.log(`All notifications deleted for user: ${userId}`);
  }

  // Workflow-specific notification methods
  async notifyWorkflowStarted(data: {
    userId: string;
    workflowName: string;
    processInstanceId: string;
    businessKey?: string;
  }): Promise<void> {
    await this.createNotification({
      userId: data.userId,
      type: NotificationType.WORKFLOW_STARTED,
      title: 'Workflow Started',
      message: `Your ${data.workflowName} workflow has been started successfully.`,
      metadata: {
        processInstanceId: data.processInstanceId,
        businessKey: data.businessKey,
      },
      actionUrl: `/workflow/instances/${data.processInstanceId}`,
    });
  }

  async notifyWorkflowCompleted(data: {
    userId: string;
    workflowName: string;
    processInstanceId: string;
    result?: string;
  }): Promise<void> {
    await this.createNotification({
      userId: data.userId,
      type: NotificationType.WORKFLOW_COMPLETED,
      title: 'Workflow Completed',
      message: `Your ${data.workflowName} workflow has been completed${data.result ? ` with result: ${data.result}` : ''}.`,
      metadata: {
        processInstanceId: data.processInstanceId,
        result: data.result,
      },
      actionUrl: `/workflow/instances/${data.processInstanceId}`,
    });
  }

  async notifyTaskAssigned(data: {
    userId: string;
    taskName: string;
    taskId: string;
    workflowName: string;
    assignedBy?: string;
  }): Promise<void> {
    await this.createNotification({
      userId: data.userId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${data.taskName} in ${data.workflowName} workflow.`,
      metadata: {
        taskId: data.taskId,
        assignedBy: data.assignedBy,
      },
      actionUrl: `/tasks/${data.taskId}`,
    });
  }

  async notifyTaskCompleted(data: {
    userId: string;
    taskName: string;
    taskId: string;
    completedBy: string;
  }): Promise<void> {
    await this.createNotification({
      userId: data.userId,
      type: NotificationType.TASK_COMPLETED,
      title: 'Task Completed',
      message: `Task "${data.taskName}" has been completed by ${data.completedBy}.`,
      metadata: {
        taskId: data.taskId,
        completedBy: data.completedBy,
      },
    });
  }

  async notifyApprovalRequired(data: {
    userId: string;
    requestType: string;
    requestId: string;
    requesterName: string;
    taskId: string;
  }): Promise<void> {
    await this.createNotification({
      userId: data.userId,
      type: NotificationType.APPROVAL_REQUIRED,
      title: 'Approval Required',
      message: `${data.requesterName} has submitted a ${data.requestType} request that requires your approval.`,
      metadata: {
        requestId: data.requestId,
        requesterName: data.requesterName,
        taskId: data.taskId,
      },
      actionUrl: `/tasks/${data.taskId}`,
    });
  }

  async notifyApprovalResult(data: {
    userId: string;
    requestType: string;
    approved: boolean;
    approverName: string;
    comments?: string;
  }): Promise<void> {
    const status = data.approved ? 'approved' : 'rejected';
    await this.createNotification({
      userId: data.userId,
      type: data.approved ? NotificationType.APPROVAL_APPROVED : NotificationType.APPROVAL_REJECTED,
      title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your ${data.requestType} request has been ${status} by ${data.approverName}.${data.comments ? ` Comments: ${data.comments}` : ''}`,
      metadata: {
        approved: data.approved,
        approverName: data.approverName,
        comments: data.comments,
      },
    });
  }

  async notifySystemAlert(data: {
    userId: string;
    alertType: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
  }): Promise<void> {
    await this.createNotification({
      userId: data.userId,
      type: NotificationType.SYSTEM_ALERT,
      title: `System Alert: ${data.alertType}`,
      message: data.message,
      metadata: {
        alertType: data.alertType,
        severity: data.severity,
        ...data.metadata,
      },
    });
  }

  // Bulk notification methods
  async notifyMultipleUsers(
    userIds: string[],
    notificationData: {
      type: NotificationType;
      title: string;
      message: string;
      metadata?: any;
      actionUrl?: string;
    },
  ): Promise<void> {
    const notifications = userIds.map(userId =>
      this.notificationRepository.create({
        userId,
        ...notificationData,
        status: NotificationStatus.UNREAD,
      }),
    );

    const savedNotifications = await this.notificationRepository.save(notifications);

    // Send real-time notifications
    savedNotifications.forEach(notification => {
      this.notificationGateway.sendNotificationToUser(notification.userId, notification);
    });

    this.logger.log(`Bulk notification sent to ${userIds.length} users: ${notificationData.title}`);
  }

  async notifyUsersByRole(
    roleName: string,
    notificationData: {
      type: NotificationType;
      title: string;
      message: string;
      metadata?: any;
      actionUrl?: string;
    },
  ): Promise<void> {
    // This would require integration with UsersService to get users by role
    // For now, we'll log the intent
    this.logger.log(`Notification intended for role "${roleName}": ${notificationData.title}`);
  }

  // Get notification statistics
  async getNotificationStatistics(userId: string): Promise<any> {
    const total = await this.notificationRepository.count({ where: { userId } });
    const unread = await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
    const read = await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.READ },
    });

    const typeStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type, COUNT(*) as count')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    return {
      total,
      unread,
      read,
      byType: typeStats.reduce((acc, stat) => {
        acc[stat.notification_type] = parseInt(stat.count);
        return acc;
      }, {}),
    };
  }

  // Clean up old notifications
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('status = :status', { status: NotificationStatus.READ })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old notifications`);
    return result.affected || 0;
  }
}
