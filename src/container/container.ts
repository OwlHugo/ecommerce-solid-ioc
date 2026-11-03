import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from './types';
import { IProductRepository } from '../repositories/IProductRepository';
import { IOrderRepository } from '../repositories/IOrderRepository';
import { PrismaProductRepository } from '../repositories/PrismaProductRepository';
import { PrismaOrderRepository } from '../repositories/PrismaOrderRepository';
import { InMemoryOrderRepository } from '../repositories/InMemoryOrderRepository';
import { IMailProvider } from '../providers/IMailProvider';
import { EtherealMailProvider } from '../providers/EtherealMailProvider';
import { ConsoleMailProvider } from '../providers/ConsoleMailProvider';
import { IPaymentMethod } from '../payments/IPaymentMethod';
import { CreditCardPayment } from '../payments/CreditCardPayment';
import { DebitCardPayment } from '../payments/DebitCardPayment';
import { PixPayment } from '../payments/PixPayment';
import { PaymentMethodRegistry } from '../payments/PaymentMethodRegistry';
import { NotificationService } from '../services/NotificationService';
import { OrderService } from '../services/OrderService';
import { OrderController } from '../controllers/OrderController';

const APP_ENV = process.env.APP_ENV ?? 'dev';
if (APP_ENV !== 'dev' && APP_ENV !== 'test') {
  throw new Error(`APP_ENV inválido: "${APP_ENV}". Use dev ou test.`);
}

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
container.bind<IProductRepository>(TYPES.ProductRepository).to(PrismaProductRepository).inSingletonScope();

if (APP_ENV === 'test') {
  container.bind<IMailProvider>(TYPES.MailProvider).to(ConsoleMailProvider).inSingletonScope();
  container.bind<IOrderRepository>(TYPES.OrderRepository).to(InMemoryOrderRepository).inSingletonScope();
} else {
  container.bind<IMailProvider>(TYPES.MailProvider).to(EtherealMailProvider).inSingletonScope();
  container.bind<IOrderRepository>(TYPES.OrderRepository).to(PrismaOrderRepository).inSingletonScope();
}

container.bind<IPaymentMethod>(TYPES.PaymentMethod).to(CreditCardPayment);
container.bind<IPaymentMethod>(TYPES.PaymentMethod).to(DebitCardPayment);
container.bind<IPaymentMethod>(TYPES.PaymentMethod).to(PixPayment);
container.bind<PaymentMethodRegistry>(TYPES.PaymentMethodRegistry).to(PaymentMethodRegistry);

container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService);
container.bind<OrderService>(TYPES.OrderService).to(OrderService);
container.bind<OrderController>(TYPES.OrderController).to(OrderController);

export { container, APP_ENV };
