import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './infrastructure/controllers/payment.controller'; // (Aún por crear)
import { NiubizAdapter } from './infrastructure/adapters/niubiz.adapter';
import { ProcessPaymentUseCase } from './application/services/use-cases/process-payment.usecase';

@Module({
  imports: [HttpModule], // Necesario para que Axios funcione en el Adapter
  controllers: [PaymentController],
  providers: [
    ProcessPaymentUseCase,
    {
      // Cuando alguien pida 'PAYMENT_GATEWAY'
      provide: 'PAYMENT_GATEWAY',
      // Entrégale una instancia de NiubizAdapter
      useClass: NiubizAdapter,
    },
  ],
})
export class PaymentModule {}
