import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets = new Map<string, Socket[]>(); // userId -> Socket[]

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from handshake auth
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store user-socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client);

      // Join user to their personal room
      client.join(`user_${userId}`);
      
      // Store userId in socket data for later use
      client.data.userId = userId;

      this.logger.log(`User ${userId} connected to notifications`);
      
      // Send connection confirmation
      client.emit('connected', { message: 'Connected to notifications', userId });
      
    } catch (error) {
      this.logger.error('Authentication failed for WebSocket connection', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    
    if (userId) {
      // Remove socket from user's socket list
      const userSocketList = this.userSockets.get(userId);
      if (userSocketList) {
        const index = userSocketList.indexOf(client);
        if (index > -1) {
          userSocketList.splice(index, 1);
        }
        
        // If no more sockets for this user, remove the entry
        if (userSocketList.length === 0) {
          this.userSockets.delete(userId);
        }
      }
      
      this.logger.log(`User ${userId} disconnected from notifications`);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    client.join(data.room);
    client.emit('joined_room', { room: data.room });
    this.logger.log(`Client joined room: ${data.room}`);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    client.leave(data.room);
    client.emit('left_room', { room: data.room });
    this.logger.log(`Client left room: ${data.room}`);
  }

  @SubscribeMessage('mark_as_read')
  handleMarkAsRead(@ConnectedSocket() client: Socket, @MessageBody() data: { notificationId: string }) {
    // This would typically call the notification service to mark as read
    // For now, we'll just acknowledge
    client.emit('notification_read', { notificationId: data.notificationId });
    this.logger.log(`Notification marked as read: ${data.notificationId}`);
  }

  // Send notification to a specific user
  sendNotificationToUser(userId: string, notification: Notification) {
    this.server.to(`user_${userId}`).emit('new_notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      metadata: notification.metadata,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    });

    this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds: string[], notification: Partial<Notification>) {
    userIds.forEach(userId => {
      this.server.to(`user_${userId}`).emit('new_notification', notification);
    });

    this.logger.log(`Notification sent to ${userIds.length} users: ${notification.title}`);
  }

  // Send notification to a room
  sendNotificationToRoom(room: string, notification: Partial<Notification>) {
    this.server.to(room).emit('new_notification', notification);
    this.logger.log(`Notification sent to room ${room}: ${notification.title}`);
  }

  // Broadcast notification to all connected users
  broadcastNotification(notification: Partial<Notification>) {
    this.server.emit('broadcast_notification', notification);
    this.logger.log(`Broadcast notification sent: ${notification.title}`);
  }

  // Send system alert
  sendSystemAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info') {
    this.server.emit('system_alert', {
      message,
      severity,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`System alert sent: ${message}`);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Get connected users
  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.length > 0;
  }

  // Send typing indicator
  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string; isTyping: boolean }) {
    const userId = client.data?.userId;
    if (userId) {
      client.to(data.room).emit('user_typing', {
        userId,
        isTyping: data.isTyping,
      });
    }
  }

  // Handle ping/pong for connection health
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }
}
