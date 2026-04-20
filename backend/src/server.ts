import dotenv from 'dotenv';

dotenv.config();

import { createApp } from './app.js';
import { env } from './shared/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
