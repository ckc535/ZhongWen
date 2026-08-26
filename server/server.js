import express from 'express';
import cors from 'cors';
import { apiRouter } from './apiRouter.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(apiRouter);

app.listen(PORT, () => {
  console.log(`ZhongWen API Server is running on http://localhost:${PORT}`);
});
