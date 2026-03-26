import express from '../../src/index.js';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
