import { useEffect, useState } from 'react';
import {io} from 'https://cdn.socket.io/4.7.1/socket.io.esm.min.js';

export default function Chat() {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const newSocket = io('http://localhost:4000');
        setSocket(newSocket);

        newSocket.on('chat message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => newSocket.close();
    }, []);

    const sendMessage = () => {
        if (socket && message) {
            socket.emit('chat message', message);
            setMessage('');
        }
    }

    return (
        <main className='min-w-[30%] mx-auto mt-6'>
            <div className='flex flex-col border h-[90%]'>
                <h2 className='text-[1.5rem] border-b'>Chat</h2>
                <div className='flex-1 overflow-y-auto text-start p-2'>
                    {messages.map((msg, idx) => (
                      <div key={idx}>{msg}</div>
                    ))}
                </div>
                <div className='flex height-[48px] py-2 px-2 gap-2 border-t'>
                    <input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Escribe un mensaje"
                        className='flex-1'
                    />
                    <button onClick={sendMessage} className='border rounded-[10px] px-3 py-1'>Enviar</button>
                </div>
            </div>
        </main>
    )
}
