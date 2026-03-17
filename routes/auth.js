import express from 'express';
import { refreshToken, auth, requestOtp, verifyOtp, bootstrapAdmin } from '../controllers/auth.js';

const router = express.Router();

router.post('/refresh-token', refreshToken);
router.post('/signin', auth);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/bootstrap-admin', bootstrapAdmin);

export default router;
