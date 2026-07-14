import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import routes
import adminRoutes from './routes/admin.routes';
import apiRoutes from './routes/api';
import contentRoutes from './routes/content.routes';

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/content', contentRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
