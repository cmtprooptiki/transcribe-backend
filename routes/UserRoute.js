import express from "express";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/Users.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

// Routes
router.get('/users', verifyUser, getUsers);
router.get('/users/:id', verifyUser, adminOnly, getUserById);

// Profile image upload routes
router.post('/users', createUser);
router.patch('/users/:id', verifyUser, adminOnly, updateUser);

router.delete('/users/:id', verifyUser, adminOnly, deleteUser);

export default router;
