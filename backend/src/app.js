import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import salesRoutes from './routes/sales.routes.js';
import purchasesRoutes from './routes/purchases.routes.js';
import customerRoutes from './routes/customer.routes.js';
import billsRoutes from './routes/bills.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import supplyRequestsRoutes from './routes/supply-requests.routes.js';
import activityLogsRoutes from './routes/activity-logs.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  })
);
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/supply-requests', supplyRequestsRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/suppliers', suppliersRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ success: false, message });
});

export default app;
