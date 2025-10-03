import mongoose from 'mongoose'

const Schema = mongoose.Schema;
const ChatSchema = new Schema({
    user: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('chats', ChatSchema);

export default Chat;