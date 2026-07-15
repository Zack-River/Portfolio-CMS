import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://zack-river.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
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
