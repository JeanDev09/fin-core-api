import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config'; // <--- Importante
import { firstValueFrom } from 'rxjs';
import { IPaymentGateway } from '../../domain/interfaces/payment-gateway.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { map } from 'rxjs/operators';

@Injectable()
export class NiubizAdapter implements IPaymentGateway {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService, // <--- Inyectamos configuración
  ) {}

  async getSessionToken(): Promise<string> {
    // URL Específica de seguridad de Niubiz (Sandbox)
    const url = 'https://apisandbox.vnforapps.com/api.security/v1/security';
    const authKey = this.configService.get<string>('NIUBIZ_AUTH_KEY');

    try {
      // Niubiz pide Auth Basic en el header para darte este token
      const headers = {
        Authorization: authKey,
        'Content-Type': 'application/json', // A veces Niubiz exige esto aunque el body esté vacío
      };

      const { data } = await firstValueFrom(
        this.httpService.post(url, {}, { headers }),
      );

      // Niubiz devuelve solo el string del token, lo retornamos directo
      return data;
    } catch (error) {
      console.error(
        'Error obteniendo token de sesión:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'No se pudo iniciar la sesión con la pasarela de pagos.',
      );
    }
  }

  async processPayment(
    amount: number,
    currency: string,
    cardToken: string,
  ): Promise<Transaction> {
    // Leemos del .env
    const url = this.configService.get<string>('NIUBIZ_API_URL');
    const authKey = this.configService.get<string>('NIUBIZ_AUTH_KEY');

    if (!url || !authKey) {
      throw new InternalServerErrorException(
        'Missing Niubiz configuration variables',
      );
    }

    try {
      const payload = {
        channel: 'web',
        captureType: 'manual',
        countable: true,
        order: {
          tokenId: cardToken,
          purchaseNumber: Math.floor(Math.random() * 100000),
          amount: amount,
          currency: currency,
        },
      };

      const headers = {
        Authorization: authKey, // Usamos la variable segura
        'Content-Type': 'application/json',
      };

      // Nota: Si no tienes credenciales reales de Niubiz Sandbox,
      // esta llamada fallará. Para probar sin credenciales, comenta este bloque
      // y retorna una transacción simulada ("mock").

      const { data } = await firstValueFrom(
        this.httpService.post(url, payload, { headers }),
      );

      const status =
        data.ACTION_DESCRIPTION === 'Authorized' ? 'COMPLETED' : 'FAILED';

      return new Transaction(
        'tx_' + Date.now(),
        amount,
        currency,
        status,
        data.TRANSACTION_ID,
      );
    } catch (error) {
      console.error('Error en Niubiz:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        'Error de comunicación con la pasarela',
      );
    }
  }
}
