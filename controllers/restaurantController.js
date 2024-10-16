const Restaurant = require('../models/Restaurant');
const { calculateHaversineDistance } = require('../utils/geolocationUtils');


exports.createRestaurant = async (req, res) => {
    const { name, description, location, ratings } = req.body; // Updated to include location separately
  
    try {
      const restaurant = new Restaurant({
        name,
        description,
        location: {
          type: "Point", // GeoJSON type
          coordinates: [location.longitude, location.latitude], // Longitude first, then latitude
        },
        ratings, // Use the ratings directly from request body
      });
  
      await restaurant.save();
  
      res.status(201).json({
        message: 'Restaurant created successfully',
        restaurant,
      });
    } catch (error) {
      res.status(400).json({ message: 'Error creating restaurant: ' + error.message });
    }
  };
  

// Get all restaurants (with pagination)
exports.getRestaurants = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const restaurants = await Restaurant.find().skip(skip).limit(limit);
    res.json({
      message: 'Restaurants retrieved successfully',
      totalPages: Math.ceil(await Restaurant.countDocuments() / limit),
      currentPage: page,
      restaurants,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving restaurants: ' + error.message });
  }
};

// Update a restaurant
exports.updateRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ message: 'Restaurant updated successfully', restaurant: updatedRestaurant });
  } catch (error) {
    res.status(400).json({ message: 'Error updating restaurant: ' + error.message });
  }
};

// Delete a restaurant
exports.deleteRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(id);
    if (!deletedRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting restaurant: ' + error.message });
  }
};

// Get restaurants by proximity (within radius)
exports.getRestaurantsByProximity = async (req, res) => {
  const { latitude, longitude, radius } = req.body;

  try {
    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ message: 'Invalid input data. Please provide latitude, longitude, and radius.' });
    }

    const restaurants = await Restaurant.find({
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radius / 6378100],
        },
      },
    });

    res.json({ message: 'Restaurants retrieved by proximity successfully', restaurants });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving restaurants by proximity: ' + error.message });
  }
};



exports.getRestaurantsByDistanceRange = async (req, res) => {
    const { latitude, longitude, minimumDistance, maximumDistance } = req.body;

    try {
      if (!latitude || !longitude || minimumDistance === undefined || maximumDistance === undefined) {
        return res.status(400).json({ message: 'Invalid input data. Please provide latitude, longitude, minimumDistance, and maximumDistance.' });
      }

      // Retrieve all restaurants
      const restaurants = await Restaurant.find();

      const userLocation = { latitude, longitude };

      // Filter restaurants based on distance range
      const filteredRestaurants = restaurants.filter(restaurant => {
        const restaurantLocation = {
          latitude: restaurant.location.coordinates[1],
          longitude: restaurant.location.coordinates[0]
        };

        // Use the imported Haversine distance function
        const distance = calculateHaversineDistance(userLocation, restaurantLocation);

        return distance >= minimumDistance && distance <= maximumDistance;
      });

      if (filteredRestaurants.length === 0) {
        return res.status(404).json({ message: 'No restaurants found within the specified range.' });
      }

      res.json({
        message: 'Restaurants retrieved successfully',
        restaurants: filteredRestaurants
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving restaurants: ' + error.message });
    }
};

  