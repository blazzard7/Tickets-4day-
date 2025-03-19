import express from 'express';
import sequelize from './config/database.js'; // Import Sequelize instance
import organizationRoutes from './routes/organizationRoutes.js'; // Import routes
import eventRoutes from './routes/eventRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import logger from './middleware/logger.js';

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(logger); // Apply request logging middleware

// Routes
app.use('/organizations', organizationRoutes);
app.use('/events', eventRoutes);
app.use('/tickets', ticketRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Organization, Event, and Ticket API is running!');
});

(async () => {
    try {
        await sequelize.sync({ force: false }); // Use force: true with caution
        console.log('Database synchronized');
    } catch (error) {
        console.error('Unable to synchronize the database:', error);
    }
})();

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});