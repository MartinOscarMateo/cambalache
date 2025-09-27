import mongoose from 'mongoose';

export default async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI no definida en .env');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}