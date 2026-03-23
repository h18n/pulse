const express = require('express');
const app = express();
const port = 3005;

// Simulate some work
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get('/checkout', async (req, res) => {
  await sleep(Math.random() * 200 + 50); // 50-250ms latency
  
  if (Math.random() < 0.2) { // 20% error rate
    res.status(500).json({ error: 'Database connection failed' });
    return;
  }
  
  res.json({ status: 'success', orderId: Math.floor(Math.random() * 10000) });
});

app.listen(port, () => {
  console.log(`Instrumented API listening on port ${port}`);
  console.log('Try calling GET /checkout to generate traces!');
});
