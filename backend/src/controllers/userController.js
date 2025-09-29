import User from '../models/User.js'

// GET perfil
export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT actualizar perfil
export async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    // Actualizar solo campos enviados
    if (req.body.name) user.name = req.body.name
    if (req.body.email) user.email = req.body.email
    if (req.body.password) user.password = req.body.password
    if (req.body.avatar) user.avatar = req.body.avatar

    await user.save()
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE eliminar usuario
export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    await user.deleteOne()
    res.json({ message: 'Usuario eliminado' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}