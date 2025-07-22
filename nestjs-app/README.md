# Dynamic Workflow Engine - NestJS API

This is the NestJS backend API for the Dynamic Workflow Engine that integrates with Camunda BPMN Engine.

## 🚀 Features

- **Camunda Integration**: Full integration with Camunda BPMN Engine
- **External Task Processing**: Automated handling of external tasks
- **User Management**: Complete user and role management system
- **Authentication**: JWT-based authentication with role-based access control
- **Real-time Notifications**: WebSocket-based notification system
- **Workflow Management**: Dynamic workflow deployment and management
- **REST API**: Comprehensive REST API for all operations

## 🛠️ Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **Cache/Queue**: Redis + Bull
- **WebSockets**: Socket.IO
- **BPMN Engine**: Camunda Platform 7

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration

4. Start the development server:
```bash
npm run start:dev
```

## 🐳 Docker Setup

Make sure Docker services are running:
```bash
# From the root directory
docker-compose up -d
```

This will start:
- Camunda Engine (http://localhost:8080)
- PostgreSQL (port 5432 for Camunda, 5433 for NestJS)
- Redis (port 6379)

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Workflow Management
- `POST /api/workflow/deploy` - Deploy BPMN workflow
- `POST /api/workflow/start` - Start workflow instance
- `GET /api/workflow/definitions` - Get workflow definitions
- `GET /api/workflow/instances` - Get workflow instances
- `GET /api/workflow/instances/:id` - Get specific workflow instance
- `POST /api/workflow/tasks/:taskId/complete` - Complete user task

### Camunda Integration
- `GET /api/camunda/health` - Check Camunda health
- `GET /api/camunda/process-definitions` - Get process definitions
- `POST /api/camunda/process/:processKey/start` - Start process
- `GET /api/camunda/process-instance/:id` - Get process instance
- `POST /api/camunda/task/:id/complete` - Complete task

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `POST /api/users/:userId/roles/:roleId` - Assign role to user

### Roles Management
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `GET /api/roles/:name` - Get role by name
- `POST /api/roles/initialize-defaults` - Initialize default roles

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔌 WebSocket Events

Connect to `/notifications` namespace:

### Client Events
- `join_room` - Join a notification room
- `leave_room` - Leave a notification room
- `mark_as_read` - Mark notification as read
- `ping` - Health check ping

### Server Events
- `connected` - Connection confirmation
- `new_notification` - New notification received
- `broadcast_notification` - System-wide notification
- `system_alert` - System alert message
- `pong` - Health check response

## 🏗️ Project Structure

```
src/
├── modules/
│   ├── auth/              # Authentication module
│   ├── camunda/           # Camunda integration
│   ├── notification/      # Notification system
│   ├── users/             # User management
│   └── workflow/          # Workflow management
├── app.controller.ts      # Main app controller
├── app.module.ts          # Main app module
├── app.service.ts         # Main app service
└── main.ts               # Application entry point
```

## 🔧 Configuration

Key environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=nestjs
DB_PASSWORD=nestjs123
DB_DATABASE=workflow_app

# Camunda
CAMUNDA_BASE_URL=http://localhost:8080/engine-rest

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🚀 Development

### Running the app
```bash
# Development
npm run start:dev

# Production
npm run start:prod

# Debug mode
npm run start:debug
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code formatting
```bash
# Format code
npm run format

# Lint code
npm run lint
```

## 📋 Default Roles

The system comes with these default roles:

- **admin**: System administrator with all permissions
- **manager**: Can approve workflows and manage users
- **employee**: Can start workflows and complete tasks
- **hr**: Human resources with user management permissions

Initialize default roles:
```bash
POST /api/roles/initialize-defaults
```

## 🔄 Workflow Example

1. **Deploy a workflow**:
```bash
POST /api/workflow/deploy
{
  "processDefinitionKey": "leave-request-process",
  "name": "Leave Request Process",
  "bpmnXml": "<?xml version=\"1.0\"...>"
}
```

2. **Start workflow instance**:
```bash
POST /api/workflow/start
{
  "processDefinitionKey": "leave-request-process",
  "variables": {
    "employeeName": "John Doe",
    "leaveType": "Annual Leave",
    "startDate": "2024-01-15",
    "endDate": "2024-01-20"
  }
}
```

3. **Complete user tasks**:
```bash
POST /api/workflow/tasks/{taskId}/complete
{
  "approved": true,
  "comments": "Approved for annual leave"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check if PostgreSQL is running
   - Verify database credentials in `.env`

2. **Camunda connection failed**
   - Ensure Camunda is running on port 8080
   - Check `CAMUNDA_BASE_URL` in `.env`

3. **Redis connection failed**
   - Verify Redis is running on port 6379
   - Check Redis configuration

### Logs

Application logs are available in the console during development. For production, configure appropriate logging levels.

## 📄 License

This project is licensed under the MIT License.
