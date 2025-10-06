import express from 'express'
import { getUserById, updateUser, deleteUser } from '../controllers/userController.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.get('/:id', getUserById)
router.put('/:id', auth, updateUser)
router.delete('/:id', auth, deleteUser)

export default router