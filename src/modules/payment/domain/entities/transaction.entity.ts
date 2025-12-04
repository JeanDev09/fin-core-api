export class Transaction {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: 'PENDING' | 'COMPLETED' | 'FAILED',
    public readonly providerId?: string, // ID que nos devuelve Niubiz
  ) {}
}
