import {
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
  IsCurrency,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(1, { message: 'El monto mínimo es 1' })
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string; // Ejemplo: "PEN" o "USD"

  @IsString()
  @IsNotEmpty()
  cardToken: string; // El token que el frontend generó con Niubiz
}
