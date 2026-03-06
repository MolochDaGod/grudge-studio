import express from 'express';
import { puter } from './puterClient.js';

const app = express();
app.use(express.json());

const COUNTER_KEY = 'testCounter';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

app.get('/counter', async (_req, res) => {
  try {
    const value = await puter.kv.get<number>(COUNTER_KEY);
    res.json({ value: value || 0 });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/counter/increment', async (_req, res) => {
  try {
    const value = await puter.kv.incr(COUNTER_KEY, 1);
    res.json({ value });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Puter counter service listening on port ${port}`);
});
