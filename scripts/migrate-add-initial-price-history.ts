// scripts/migrate-add-initial-price-history.ts
// Run this script once to add an initial priceHistory entry to all products that are missing it.

import mongoose from 'mongoose';
import Product from '../models/Product';
import { dbConnect } from '../lib/mongodb';

async function migrate() {
  await dbConnect();
  const products = await Product.find({ $or: [ { priceHistory: { $exists: false } }, { priceHistory: { $size: 0 } } ] });
  let updated = 0;
  for (const product of products) {
    if (typeof product.price === 'number') {
      product.priceHistory = [{ price: product.price, date: product.updatedAt || product.createdAt || new Date() }];
      await product.save();
      updated++;
    }
  }
  console.log(`Migrated ${updated} products.`);
  mongoose.connection.close();
}

migrate().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
