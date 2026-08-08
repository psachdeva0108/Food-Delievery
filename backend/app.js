import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import cors from 'cors';

const app = express();

// Set up absolute directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirPath = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/meals', async (req, res) => {
  try {
    const mealsPath = path.join(dataDirPath, 'available-meals.json');
    const meals = await fs.readFile(mealsPath, 'utf8');
    res.json(JSON.parse(meals));
  } catch (error) {
    res.status(500).json({ message: 'Failed to load meals data.' });
  }
});

app.post('/orders', async (req, res) => {
  const orderData = req.body?.order;
  
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ message: 'Missing order data.' });
  }

  if (
    !orderData.customer?.email?.includes('@') ||
    !orderData.customer?.name?.trim() ||
    !orderData.customer?.street?.trim() ||
    !orderData.customer?.['postal-code']?.trim() ||
    !orderData.customer?.city?.trim()
  ) {
    return res.status(400).json({
      message: 'Missing customer details (email, name, street, postal code, or city).',
    });
  }

  const newOrder = {
    ...orderData,
    id: (Math.random() * 1000).toString(),
  };

  try {
    const ordersPath = path.join(dataDirPath, 'orders.json');
    const orders = await fs.readFile(ordersPath, 'utf8');
    const allOrders = JSON.parse(orders);
    allOrders.push(newOrder);
    await fs.writeFile(ordersPath, JSON.stringify(allOrders));
    res.status(201).json({ message: 'Order created!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save order.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Bind to process.env.PORT for Render hosting
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});