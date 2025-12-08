import express from 'express';
import logger from './config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import authRouter from './routes/auth.routes.js';
import securityMiddleware from './middleware/security.middleware.js';
import userRouter from './routes/users.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(bodyParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.use(securityMiddleware);

app.get('/', (req, res) => {
  logger.info('Hello From acquisitions');
  res.status(200).send('Hello From acquisitions');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Aquisitions API is running fine' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

export default app;
