import Joi from 'joi'

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('user', 'admin').optional(),
  active: Joi.boolean().optional()
})

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('user', 'admin').optional(),
  active: Joi.boolean().optional()
}).min(1)