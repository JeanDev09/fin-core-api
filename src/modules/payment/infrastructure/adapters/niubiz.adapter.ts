import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IPaymentGateway } from '../../domain/interfaces/payment-gateway.interface';
import { Transaction } from '../../domain/entities/transaction.entity';

@Injectable()
export class NiubizAdapter implements IPaymentGateway {
  private readonly merchantId = '456879852';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * PASO 1: Obtener el "Access Token" de seguridad.
   * Este token es temporal y se requiere para llamar a cualquier otra API de Niubiz.
   * Autenticación: Basic Auth (credenciales del .env)
   */
  private async getAccessToken(): Promise<string> {
    const url = 'https://apisandbox.vnforappstest.com/api.security/v1/security';
    const authKey = this.configService.get<string>('NIUBIZ_AUTH_KEY');

    if (!authKey) {
      throw new InternalServerErrorException('Falta NIUBIZ_AUTH_KEY en .env');
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          url,
          {},
          {
            headers: {
              Authorization: authKey, // Aquí SÍ va el Basic Auth
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return data; // Retorna el string del token
    } catch (error) {
      this.handleNiubizError(error, 'getAccessToken (Security)');
      throw new InternalServerErrorException('Error autenticando con Niubiz');
    }
  }

  /**
   * PASO 2: Obtener el "Session Key" para el formulario.
   * Autenticación: Access Token (obtenido en el paso 1)
   */
  async getSessionToken(): Promise<string> {
    try {
      // 1. Primero obtenemos el token de seguridad
      const accessToken = await this.getAccessToken();

      // 2. Llamamos al endpoint de sesión v2
      const url = `https://apisandbox.vnforappstest.com/api.ecommerce/v2/ecommerce/token/session/${this.merchantId}`;

      const body = {
        channel: 'web',
        amount: 100.0,
        antifraud: {
          clientIp: '127.0.0.1',
          merchantDefineData: {
            MDD4: 'test@test.com',
            MDD32: 'test@test.com',
            MDD75: 'Invitado',
            MDD77: 1,
          },
        },
      };

      console.log('Solicitando Session Key a Niubiz...');

      const { data } = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: {
            Authorization: accessToken, // Aquí va el Access Token, NO el Basic
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );

      console.log('Session Key obtenida correctamente.');
      return data.sessionKey;
    } catch (error) {
      if (error.response) {
        console.error(
          'Detalle Error Session:',
          JSON.stringify(error.response.data),
        );
      }
      this.handleNiubizError(error, 'getSessionToken');
      throw new InternalServerErrorException(
        'No se pudo iniciar la sesión de pago.',
      );
    }
  }

  /**
   * PASO 3: Procesar el pago (Autorización).
   * Autenticación: Access Token (obtenido en el paso 1)
   */
  async processPayment(
    amount: number,
    currency: string,
    cardToken: string,
  ): Promise<Transaction> {
    try {
      // 1. Necesitamos el token de seguridad nuevamente
      const accessToken = await this.getAccessToken();

      // URL de Autorización (Corregida según documentación proporcionada)
      const url = `https://apisandbox.vnforappstest.com/api.authorization/v3/authorization/ecommerce/${this.merchantId}`;

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

      const { data } = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: accessToken, // Aquí va el Access Token
            'Content-Type': 'application/json',
          },
        }),
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
      this.handleNiubizError(error, 'processPayment');
      throw new InternalServerErrorException(
        'Error procesando el cobro con Niubiz.',
      );
    }
  }

  private handleNiubizError(error: any, context: string) {
    if (error.code === 'ENOTFOUND') {
      console.error(
        `🚨 ERROR RED (${context}): No se resuelve el dominio. Verifica DNS/Internet.`,
      );
    } else {
      console.error(
        `Error Niubiz (${context}):`,
        error.response?.data || error.message,
      );
    }
  }
}
