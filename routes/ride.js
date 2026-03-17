import express from 'express';
import { createRide, updateRideStatus, acceptRide, getMyRides } from '../controllers/ride.js';

const router = express.Router();

router.post('/create', createRide);
router.patch('/accept/:rideId', acceptRide);
router.patch('/update/:rideId', updateRideStatus);
router.get('/rides', getMyRides);

export default router;
