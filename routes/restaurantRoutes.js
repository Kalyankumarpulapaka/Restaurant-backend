const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.post('/', protect, restaurantController.createRestaurant);
router.get('/', restaurantController.getRestaurants);
router.put('/:id', protect, restaurantController.updateRestaurant);
router.delete('/:id', protect, restaurantController.deleteRestaurant);
router.post('/proximity', restaurantController.getRestaurantsByProximity);
router.post('/range', restaurantController.getRestaurantsByDistanceRange);

module.exports = router;
