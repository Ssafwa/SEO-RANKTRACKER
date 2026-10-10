import mongoose from 'mongoose';

export const connectDB = async () => {
    const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGODB_URL or MONGO_URI must be configured');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
};