import 'reflect-metadata';
import 'dotenv/config';
import app from './app';
import { APP_ENV } from './container/container';

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server rodando em http://localhost:${PORT} (APP_ENV=${APP_ENV})`);
});
