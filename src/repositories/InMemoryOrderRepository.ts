import { injectable } from 'inversify';
import { Order, OrderLine } from '../domain/Order';
import { IOrderRepository } from './IOrderRepository';

@injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  async create(customer: string, items: OrderLine[], total: number): Promise<Order> {
    const order: Order = { id: this.orders.length + 1, customer, items, total, status: 'confirmed' };
    this.orders.push(order);
    return order;
  }
}
