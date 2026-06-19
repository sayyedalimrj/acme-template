/**
 * Server entrypoint.
 */
import { env } from './env';
import { createApp } from './http/app';

const app = createApp();
app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
