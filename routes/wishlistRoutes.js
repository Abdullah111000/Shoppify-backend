import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();

    const updated = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, wishlist: updated.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
    await user.save();

    const updated = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, wishlist: updated.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    const orderCount = await Order.countDocuments({ user: req.user._id });

    res.json({ success: true, stats: { totalOrders: orderCount, wishlistItems: user.wishlist.length, }, });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
