const express = require('express');
const Property = require('../models/Property');
const { upload } = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// create property (owner only)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if(req.user.role !== 'owner') return res.status(403).json({ message: 'Only owners can add properties' });
    const { name, location, rent, type, details, extras } = req.body;
    const extrasObj = extras ? JSON.parse(extras) : {};
    const imageUrl = req.file?.path || '';
    const prop = await Property.create({
      owner: req.user._id, name, location, rent, type, details, extras: extrasObj, imageUrl
    });
    res.status(201).json(prop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// public list with filters
router.get('/', async (req, res) => {
  try {
    const { location, type, budget, limit } = req.query;
    const q = {};
    if(location) q.location = new RegExp(location, 'i');
    if(type) q.type = type;
    if(budget) {
      if(budget === 'lt5000') q.rent = { $lt: 5000 };
      else if(budget === '5to20') q.rent = { $gte: 5000, $lte: 20000 };
      else if(budget === '20to50') q.rent = { $gte: 20000, $lte: 50000 };
      else if(budget === 'gt50000') q.rent = { $gt: 50000 };
    }
    const props = await Property.find(q).limit(parseInt(limit) || 20).sort({ createdAt: -1 });
    res.json(props);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// get mine
router.get('/mine', protect, async (req, res) => {
  try {
    const props = await Property.find({ owner: req.user._id });
    res.json(props);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// get by id
router.get('/:id', async (req, res) => {
  try {
    const prop = await Property.findById(req.params.id);
    if(!prop) return res.status(404).json({ message: 'Property not found' });
    res.json(prop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// update / delete (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const prop = await Property.findById(req.params.id);
    if(!prop) return res.status(404).json({ message: 'Not found' });
    if(String(prop.owner) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    Object.assign(prop, req.body);
    await prop.save();
    res.json(prop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const prop = await Property.findById(req.params.id);
    if(!prop) return res.status(404).json({ message: 'Not found' });
    if(String(prop.owner) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    await prop.remove();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
