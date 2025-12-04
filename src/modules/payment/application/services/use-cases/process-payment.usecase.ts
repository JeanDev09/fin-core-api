import { Inject, Injectable } from '@nestjs/common';
import type { IPaymentGateway } from 'src/modules/payment/domain/interfaces/payment-gateway.interface';
import { Transaction } from 'src/modules/payment/domain/entities/transaction.entity';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    // INYECCIÓN DE DEPENDENCIAS:
    // Aquí pedimos la INTERFAZ, no la clase concreta (Niubiz).
    // Esto permite cambiar Niubiz por Stripe sin tocar este archivo.
    @Inject('PAYMENT_GATEWAY')
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(
    amount: number,
    currency: string,
    cardToken: string,
  ): Promise<Transaction> {
    // Aquí podrías agregar validaciones de negocio extra antes de pagar
    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    return await this.paymentGateway.processPayment(
      amount,
      currency,
      cardToken,
    );
  }
}

@Injectable()
export class GetSessionTokenUseCase {
  constructor(
    @Inject('PAYMENT_GATEWAY')
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(): Promise<string> {
    // Aquí podríamos agregar lógica, como guardar logs de quién pidió el token
    return await this.paymentGateway.getSessionToken(1000);
  }
}
