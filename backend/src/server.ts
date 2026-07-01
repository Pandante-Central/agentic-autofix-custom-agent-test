import { createApp } from './app';
import { initDb } from './db';

const PORT = process.env.PORT ?? 4000;

initDb()
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Retirement Planner API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
