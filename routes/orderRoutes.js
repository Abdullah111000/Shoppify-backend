import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { orderItems, shippingInfo } = req.body;

    if (!orderItems?.length || !shippingInfo) {
      return res.status(400).json({ success: false, message: 'Order items and shipping info required' });
    }

    let totalAmount = 0;
    const items = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) { return res.status(404).json({ success: false, message: `Product not found: ${item.product}` }); }
      if (product.stock < item.quantity) { return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}`, }); }

      items.push({ product: product._id, name: product.name, image: product.image, price: product.price, quantity: item.quantity, });

      totalAmount += product.price * item.quantity;
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({ user: req.user._id, orderItems: items, shippingInfo, totalAmount, });

    const populated = await Order.findById(order._id).populate('user', 'name email').populate('orderItems.product', 'name image price');

    res.status(201).json({ success: true, order: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('orderItems.product', 'name image price category');
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('orderItems.product', 'name image price category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email').populate('orderItems.product', 'name image price');
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) { return res.status(400).json({ success: false, message: 'Invalid status' }); }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).populate('user', 'name email').populate('orderItems.product', 'name image price');

    if (!order) { return res.status(404).json({ success: false, message: 'Order not found' }); }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
