import express from 'express';
import Product from '../models/Product.js';
import { protect, authorize } from '../middlewares/auth.js';
import { upload, handleMulterError } from '../middlewares/upload.js';
import { resolveProductImage } from '../utils/cloudinaryUpload.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('admin'), upload.single('image'), handleMulterError, async (req, res) => {
  try {
    const { name, description, category, price, stock } = req.body;

    if (!name || !description || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const image = await resolveProductImage(req);
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Product image is required (upload file or provide imageUrl)',
      });
    }
    const product = await Product.create({ name, description, category, price: Number(price), stock: Number(stock), image, createdBy: req.user._id, });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
);

router.put('/:id', protect, authorize('admin'), upload.single('image'), handleMulterError, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, category, price, stock } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);

    if (req.file || req.body.imageUrl) {
      const image = await resolveProductImage(req);
      if (image) product.image = image;
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
);

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
