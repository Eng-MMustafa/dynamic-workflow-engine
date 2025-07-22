import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CamundaModule } from './modules/camunda/camunda.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UsersModule } from './modules/users/users.module';
import { WorkflowController } from './modules/workflow/workflow.controller';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // ⚠️ فقط في development
      logging: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    }),
    AuthModule,
    UsersModule,
    WorkflowModule,
    CamundaModule,
    NotificationModule,
  ],
  controllers: [AppController, WorkflowController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}