import { useState } from "react";
import { updateTradeStatus, rateTrade } from "../lib/api";
import StarRating from "./StarRating";

export default function TradeActions({ trade }) {
  const [loading, setLoading] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user.id;

  const isProposer = trade.proposerId._id === userId;
  const isReceiver = trade.receiverId._id === userId;

  const isRated = trade.ratings?.find(r => String(r.by) === String(userId));

  const partner = isProposer ? trade.receiverId : trade.proposerId;
  const who = partner?.username ?? "este usuario";


  async function doAction(action) {
    if (loading) return;

    try {
      setLoading(action);
      await updateTradeStatus(trade._id, action);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleSubmitRating() {
    if (!rating) return alert("Selecciona una valoracion de 1 a 5 estrellas.");

    try {
      setRatingLoading(true);
      await rateTrade(trade._id, rating)
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setRatingLoading(false);
    }
  }

  return (
    <div>
        {trade.status === "pending" && (
            <>
                {isReceiver && (
                    <>
                      <div className="block sm:flex mt-2 gap-2">
                        <button
                          className="flex justify-center items-center w-full sm:w-1/2 bg-green-600 hover:bg-green-500 text-white rounded-2xl py-2"
                          disabled={loading === "accept"}
                          onClick={() => doAction("accept")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                          {loading === "accept" ? "Aceptando..." : "Aceptar"}
                        </button>
                        <button
                          className="flex justify-center items-center w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white rounded-2xl py-2 mt-2 sm:m-0"
                          disabled={loading === "reject"}
                          onClick={() => doAction("reject")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                          {loading === "reject" ? "Rechazando..." : "Rechazar"}
                        </button>
                      </div>
                    </>
                )}

                {isProposer && (
                    <button
                      className="flex justify-center items-center w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white rounded-2xl py-2 mt-2"
                      disabled={loading === "cancel"}
                      onClick={() => doAction("cancel")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                      {loading === "cancel" ? "Cancelando..." : "Cancelar"}
                    </button>
                )}
            </>
        )}

      {trade.status === "accepted" && (
        <>
          <div className="block sm:flex mt-2 gap-2">
            {isReceiver && (
                <button
                  className="flex justify-center items-center w-full sm:w-1/2 bg-green-600 hover:bg-green-500 text-white rounded-2xl py-2"
                  disabled={loading === "finish"}
                  onClick={() => doAction("finish")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  {loading === "finish" ? "Finalizando..." : "Finalizar Trueque"}
                </button>
            )}

            <button
              className="flex justify-center items-center w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white rounded-2xl py-2 mt-2 sm:m-0"
              disabled={loading === "cancel"}
              onClick={() => doAction("cancel")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
              {loading === "cancel" ? "Cancelando..." : "Cancelar Trueque"}
            </button>
          </div>
        </>
      )}

      {trade.status === "finished" && (
        <>
          <div>
            {isRated ? (
              // YA CALIFICÓ → mostrar la calificación fija
              <div className="text-center">
                <p>Ya calificaste a {who}</p>
                <StarRating rating={isRated.value} onChange={() => {}} />
              </div>
            ) : (
              // NO CALIFICÓ → permitir calificar
              <div>
                <p className="text-center">Calificar a {who}</p>
                <StarRating rating={rating} onChange={setRating} />
                <div className="flex justify-center mt-2">
                  <button 
                    onClick={handleSubmitRating}
                    className="w-50 rounded-2xl py-2 bg-red-50"
                  >
                    {ratingLoading ? "Enviando..." : "Enviar calificación"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
