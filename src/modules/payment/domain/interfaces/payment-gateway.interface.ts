import { Transaction } from '../entities/transaction.entity';

export interface IPaymentGateway {
  getSessionToken(amount: number): Promise<string>;
  processPayment(
    amount: number,
    currency: string,
    cardToken: string,
  ): Promise<Transaction>;
}
