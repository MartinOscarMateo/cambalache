import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../lib/api";
import { Link } from "react-router-dom";

export default function Noticications () {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getNotifications()
            .then(setNotifications)
            .finally(() => setLoading(false));
    }, []);

    const markAsRead = async (id) => {
        await markNotificationAsRead(id);
        setNotifications(prev =>
            prev.map(n => n._id === id ? { ...n, read: true } : n)
        );
    };

    return (
        <main className="h-[85vh] bg-[#f6f2ff] px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <header className="mb-3">
                    <h1 className="text-center">Notificaciones</h1>
                    <p className="text-center">Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eius, officiis?</p>
                </header>
                <div>
                    {notifications.length === 0 && (
                        <p className="text-center text-gray-500">
                            No tenés notificaciones todavía.
                        </p>
                    )}

                    {notifications.map((n) => (
                        <Link
                            className="borde"
                            to={n.link}
                        >
                            <div key={n._id} className="flex bg-white p-4 justify-between items-start border border-[color:var(--c-mid-blue)]/50 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.25)] hover:bg-gray-100">
                                <div>
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        {proposer.avatar && (
                                            <img
                                              src={proposer.avatar}
                                              alt="avatar"
                                              className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <h3 className="font-semibold">{n.title}</h3>
                                    <p className="text-sm text-gray-700">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            
        </main>

    );
}