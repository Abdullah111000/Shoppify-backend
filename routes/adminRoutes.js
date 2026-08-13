import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalCustomers, totalAdmins, totalProducts, totalOrders, orders] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'customer' }),
        User.countDocuments({ role: 'admin' }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      ]);

    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);

    res.json({ success: true, stats: { totalUsers, totalCustomers, totalAdmins, totalProducts, totalOrders, totalRevenue, recentOrders: orders, recentUsers, }, });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
