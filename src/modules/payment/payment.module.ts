import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './infrastructure/controllers/payment.controller';
import { NiubizAdapter } from './infrastructure/adapters/niubiz.adapter';
// 1. IMPORTANTE: Importar el nuevo caso de uso
import {
  ProcessPaymentUseCase,
  GetSessionTokenUseCase,
} from './application/services/use-cases/process-payment.usecase';

@Module({
  imports: [HttpModule],
  controllers: [PaymentController],
  providers: [
    ProcessPaymentUseCase,
    // 2. IMPORTANTE: Agregarlo a la lista de providers
    GetSessionTokenUseCase,
    {
      provide: 'PAYMENT_GATEWAY',
      useClass: NiubizAdapter,
    },
  ],
})
export class PaymentModule {}
