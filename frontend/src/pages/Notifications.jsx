import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Noticications () {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));
    const avatar = user.avatar;

    useEffect(() => {
        getNotifications()
            .then(setNotifications)
            .finally(() => setLoading(false));
    }, []);

    const handleOpenNotification = async (n) => {
        if (!n.read) {
            await markNotificationAsRead(n._id);

            setNotifications((prev) =>
              prev.map((item) =>
                item._id === n._id ? { ...item, read: true } : item
              )
            );
            navigate(n.link);
        }
    }

    return (
        <main className="h-[85vh] bg-[#f6f2ff] px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <header className="mb-3">
                    <h1 className="text-center">Notificaciones</h1>
                    <p className="text-center">Todas tus notificaciones sobre tus trueques.</p>
                </header>
                <div className="flex flex-col gap-5">
                    {notifications.length === 0 && (
                        <p className="text-center text-gray-500 mt-3">
                            No tenés notificaciones todavía.
                        </p>
                    )}

                    {notifications.map((n) => (
                        <Link
                            className="borde"
                            onClick={() => handleOpenNotification(n)}
                            to={n.link}
                        >
                            <div key={n._id} className="bg-white p-4 justify-between items-start border border-[color:var(--c-mid-blue)]/50 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.25)] hover:bg-gray-100">
                                <div>
                                    <div className="w-full flex justify-between">
                                        <div className="flex gap-2">
                                            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                                                {avatar && (
                                                    <img
                                                      src={avatar}
                                                      alt="avatar"
                                                      className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <h3 className="font-semibold">{n.title}</h3>
                                        </div>
                                        {!n.read && (
                                            <div className="flex items-start text-xs sm:text-sm text-[color:var(--c-text)]">
                                                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[color:var(--c-brand)]/60 px-3 py-1">
                                                    <span className="h-2 w-2 rounded-full bg-[color:var(--c-brand)]" />
                                                    Nuevo
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2">{n.message}</p>
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