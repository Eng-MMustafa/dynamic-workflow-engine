import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CamundaService } from './camunda.service';
import { CamundaController } from './camunda.controller';
import { ExternalTaskService } from './external-task.service';

@Module({
  imports: [ConfigModule],
  controllers: [CamundaController],
  providers: [CamundaService, ExternalTaskService],
  exports: [CamundaService, ExternalTaskService],
})
export class CamundaModule {}
