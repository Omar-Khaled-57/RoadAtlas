import { createApp } from './app';
import { env } from './config/env';
import { connectDb } from './db/connect';

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[server] RoadAtlas API on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('[server] fatal', err);
  process.exit(1);
});
