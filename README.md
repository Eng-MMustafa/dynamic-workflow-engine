# Dynamic Workflow Engine

A powerful BPMN-based workflow engine built with Camunda and NestJS that supports dynamic rule management, automation, and role-based task assignments.

## 🚀 Features

- **Dynamic Workflow Management**: Create and modify workflows without code changes
- **BPMN 2.0 Support**: Full BPMN modeling with Camunda
- **Role-Based Access**: Dynamic role assignments and permissions
- **Automation**: Automated tasks and conditional logic
- **Real-time Notifications**: WebSocket-based notifications
- **REST API**: Complete API for workflow management

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BPMN Modeler  │    │  Camunda Engine │    │   NestJS API    │
│                 │───▶│                 │───▶│                 │
│  (Design UI)    │    │ (Process Engine)│    │ (Business Logic)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
dynamic-workflow-engine/
├── camunda/                 # Camunda Engine (Docker)
├── nestjs-app/             # NestJS Application
├── bpmn-models/            # BPMN Process Definitions
├── docker-compose.yml      # Docker services
└── README.md              # This file
```

## 🛠️ Tech Stack

- **BPMN Engine**: Camunda Platform 7
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull Queue
- **Containerization**: Docker

## 🚀 Quick Start

1. Clone the repository
2. Run `docker-compose up -d` to start Camunda and databases
3. Navigate to `nestjs-app` and run `npm install`
4. Run `npm run start:dev` to start the NestJS application
5. Access Camunda Cockpit at `http://localhost:8080/camunda`

## 📚 Documentation

- [Setup Guide](./docs/setup.md)
- [BPMN Modeling](./docs/bpmn-modeling.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./docs/examples.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
# dynamic-workflow-engine
