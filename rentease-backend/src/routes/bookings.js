const express = require('express');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// create booking (renter)
router.post('/', protect, async (req, res) => {
  try {
    if(req.user.role !== 'renter') return res.status(403).json({ message: 'Only renters can book' });
    const { property: propertyId, name, phone, message } = req.body;
    const property = await Property.findById(propertyId);
    if(!property) return res.status(404).json({ message: 'Property not found' });
    const booking = await Booking.create({ property: propertyId, renter: req.user._id, name, phone, message });
    res.status(201).json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// renter's bookings
router.get('/mine', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id }).populate('property');
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
