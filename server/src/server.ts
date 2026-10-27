import app from './app.js';
import { ENV, validateSecurityConfig } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { seedDatabase } from './seeds/seedData.js';

async function startServer() {
  try {
    // Enforce production security invariants
    validateSecurityConfig();

    await connectDatabase();

    // Auto-seed ONLY in development if database is empty
    if (ENV.NODE_ENV !== 'production') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Server] Database is empty. Running initial development campus seed...');
        await seedDatabase();
      }
    } else {
      console.log('[Security] Production mode active: Automatic database seeding is strictly disabled.');
    }

    app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(` CampusFind API Server running on port ${ENV.PORT}`);
      console.log(` Environment: ${ENV.NODE_ENV}`);
      console.log(` Health: http://localhost:${ENV.PORT}/api/health`);
      console.log(` Client Origin: ${ENV.APP_ORIGIN}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('[Server] Critical startup error:', error);
    process.exit(1);
  }
}

startServer();
