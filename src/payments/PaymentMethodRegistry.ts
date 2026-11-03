import { injectable, multiInject } from 'inversify';
import { TYPES } from '../container/types';
import { IPaymentMethod } from './IPaymentMethod';

@injectable()
export class PaymentMethodRegistry {
  constructor(@multiInject(TYPES.PaymentMethod) private methods: IPaymentMethod[]) {}

  get(name: string): IPaymentMethod | undefined {
    return this.methods.find((method) => method.name === name);
  }
}
