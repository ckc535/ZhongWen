import express from 'express';
import cors from 'cors';
import { apiRouter } from '../server/apiRouter.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(apiRouter);

export default app;
