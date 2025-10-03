import { useEffect, useState } from 'react';
import {io} from 'https://cdn.socket.io/4.7.1/socket.io.esm.min.js';

export default function Chat() {
    const HOST = 'http://localhost:4000/api';
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const userObj = JSON.parse(localStorage.getItem('user'));
    const user = userObj?.name || 'Anonymus';

    useEffect(() => {
        const newSocket = io('http://localhost:4000');
        setSocket(newSocket);

        newSocket.on('chat message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => newSocket.close();
    }, []);

    const sendMessage = async () => {
        if (socket && message) {
            const msg = { user, text: message };
            socket.emit('chat message', msg);

            try {
                await fetch(`${HOST}/chat/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(msg)
                });
            } catch (err) {
                console.error('Error guardando mensaje:', err);
            }

            setMessage('');
        }
    }

    async function getChat() {
        try {
            const response = await fetch(`${HOST}/chat/`, {
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()
            console.log(data);
            if (Array.isArray(data)) {
                setMessages(data);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error('Error al traer mensaje:', err)
        }
    }

    useEffect(() => {
        getChat();
    }, []);

    return (
        <main className='min-w-[30%] mx-auto mt-6'>
            <div className='flex flex-col border h-[90%]'>
                <h2 className='text-[1.5rem] border-b'>Chat</h2>
                <div className='flex-1 overflow-y-auto text-start p-2'>
                    {messages.map((msg, i) => (
                      <div key={i}><b>{msg.user}:</b> {msg.text}</div>
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
