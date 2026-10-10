import 'dotenv/config';
import { createServer } from './app.js';
import { connectDB } from './config/db.js';

const port = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before starting the server');
}

try {
    await connectDB();
    const app = createServer();
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
} catch (error) {
    console.error('Failed to start server:', error.message);
    process.exitCode = 1;
}
