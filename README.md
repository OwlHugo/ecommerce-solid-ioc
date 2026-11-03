# E-commerce SOLID com InversifyJS (Projeto 2)

Aluno: Hugo Adriano de Oliveira (RGA 202316400027)

Ponto de partida: [maikonb/ecommerce-solid-inicial](https://github.com/maikonb/ecommerce-solid-inicial). A montagem feita na mão com `new` no `app.ts` foi trocada por um container de IoC (InversifyJS 7), e a aplicação ganhou um segundo modo de execução que roda sem internet.

## Como rodar

Requisitos: Node.js 20 ou mais novo e npm.

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

A API sobe em `http://localhost:3000` e mostra no console o modo em que subiu.

### Os dois modos

O modo é escolhido pela variável `APP_ENV` do arquivo `.env`. Para trocar, basta mudar essa linha e reiniciar o servidor.

| | `APP_ENV=dev` (padrão) | `APP_ENV=test` |
|---|---|---|
| E-mail | `EtherealMailProvider` (cria conta no Ethereal e devolve o link do e-mail) | `ConsoleMailProvider` (imprime o e-mail no console) |
| Pedidos | `PrismaOrderRepository` (grava no SQLite) | `InMemoryOrderRepository` (guarda num array, some ao reiniciar) |
| Internet | precisa, por causa do Ethereal | não precisa |

Modo dev, no `.env`:

```
APP_ENV=dev
```

Modo test, no `.env`:

```
APP_ENV=test
```

Também dá para passar a variável direto na linha de comando, sem editar o arquivo, porque o `dotenv` não sobrescreve o que já vem do ambiente:

```bash
APP_ENV=test npm run dev
```

Os produtos continuam vindo do SQLite nos dois modos, então o `prisma:migrate` e o `prisma:seed` precisam ser rodados uma vez antes. No modo test o campo `emailPreview` da resposta volta `null`, já que o e-mail só aparece no console.

### Testando

```bash
# Produto 1: livro físico, R$ 100 + R$ 10 de frete = 110
curl -X POST http://localhost:3000/orders \
-H "Content-Type: application/json" \
-d '{
  "customer": "cliente@ethereal.email",
  "items": [{ "productId": 1, "quantity": 1 }],
  "paymentMethod": "credit_card",
  "paymentDetails": { "cardNumber": "1234567812345678", "cvv": "123" }
}'

# Produto 2: e-book, R$ 50 sem frete = 50
curl -X POST http://localhost:3000/orders \
-H "Content-Type: application/json" \
-d '{
  "customer": "cliente@ethereal.email",
  "items": [{ "productId": 2, "quantity": 1 }],
  "paymentMethod": "pix"
}'
```

Formas de pagamento: `credit_card`, `debit_card` e `pix`. Qualquer outra devolve 400 com `Método de pagamento não suportado`.

Resultado nos dois modos: produto 1 dá total `110` e produto 2 dá total `50`.

## O que mudou em relação ao código inicial

- `tsconfig.json` com `experimentalDecorators` e `emitDecoratorMetadata`.
- `src/server.ts` importa `reflect-metadata` e `dotenv/config` antes de tudo.
- `src/container/types.ts`: um `Symbol` por dependência (`TYPES.MailProvider`, `TYPES.OrderRepository`, `TYPES.PaymentMethod`...).
- Toda classe que entra no container tem `@injectable()`, e todo parâmetro de construtor tem `@inject(TYPES.X)`, inclusive os de classe concreta (`OrderService`, `NotificationService`, `PaymentMethodRegistry`). O `tsx` não gera metadados de tipo, então sem isso o Inversify não resolve nada.
- As três formas de pagamento ficam registradas no mesmo identificador `TYPES.PaymentMethod` e chegam ao `PaymentMethodRegistry` por `@multiInject`. Uma forma nova de pagamento é só mais uma classe e uma linha de `bind`.
- Provider de e-mail e repositórios estão em `inSingletonScope()`. O `PrismaClient` é uma instância só (`toConstantValue`).
- Classes novas do modo test: `src/providers/ConsoleMailProvider.ts` e `src/repositories/InMemoryOrderRepository.ts`.
- `src/container/container.ts` é o único arquivo que importa classes concretas, lê o `APP_ENV` e decide o que injetar. O `app.ts` só pede o `OrderController` ao container e registra a rota.
- Nada em `services/` ou `controllers/` lê o `APP_ENV` nem importa Prisma, Nodemailer ou alguma implementação concreta de repositório, provider ou pagamento. Eles dependem só das interfaces e dos identificadores do `TYPES`.

## Estrutura

```
src/
├── container/     # types.ts (identificadores) e container.ts (toda a montagem)
├── domain/        # produtos, pedido e erros de negócio
├── repositories/  # interfaces, versões Prisma e InMemoryOrderRepository
├── providers/     # IMailProvider, EtherealMailProvider e ConsoleMailProvider
├── payments/      # IPaymentMethod, uma classe por forma de pagamento e o registro
├── services/      # OrderService e NotificationService
├── controllers/   # OrderController: só HTTP
├── app.ts         # pede o controller ao container e registra a rota
└── server.ts      # reflect-metadata, dotenv e o listen
```
