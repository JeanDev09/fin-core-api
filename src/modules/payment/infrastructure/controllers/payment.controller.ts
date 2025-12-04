import { Body, Controller, Post, Res, HttpStatus, Get } from '@nestjs/common';
import {
  GetSessionTokenUseCase,
  ProcessPaymentUseCase,
} from '../../application/services/use-cases/process-payment.usecase';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import type { Response } from 'express';

@Controller('payments') // La ruta será http://localhost:3000/payments
export class PaymentController {
  constructor(
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly getSessionTokenUseCase: GetSessionTokenUseCase, // <--- INYECTARLO
  ) {}

  @Get('session-token')
  async getSessionToken(@Res() res: Response) {
    try {
      const token = await this.getSessionTokenUseCase.execute();

      return res.status(HttpStatus.OK).json({
        message: 'Token de sesión generado',
        token: token,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error generando token',
      });
    }
  }

  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Res() res: Response,
  ) {
    try {
      const { amount, currency, cardToken } = createPaymentDto;

      // Llamamos al caso de uso
      const transaction = await this.processPaymentUseCase.execute(
        amount,
        currency,
        cardToken,
      );

      // Respondemos al cliente
      return res.status(HttpStatus.CREATED).json({
        message: 'Pago procesado correctamente',
        data: transaction,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Error procesando el pago',
        error: error.message,
      });
    }
  }
}
