import User from '../models/User.js'
import Trade from '../models/Trade.js'

// GET perfil
export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    // garantizamos que siempre existan los arrays para evitar errores
    const followersArray = Array.isArray(user.followers) ? user.followers : []
    const followingArray = Array.isArray(user.following) ? user.following : []

    const followersCount = followersArray.length
    const followingCount = followingArray.length

    // si Trade no tiene documentos o el modelo no existe, devolvemos 0
    let tradesCount = 0
    try {
      tradesCount = await Trade.countDocuments({ $or: [{ from: user._id }, { to: user._id }] })
    } catch {
      tradesCount = 0
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      followersCount,
      followingCount,
      tradesCount
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT actualizar perfil
export async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

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