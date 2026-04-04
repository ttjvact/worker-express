import express from '../../dist/index.js';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
