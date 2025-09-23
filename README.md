README — Instalacion y ejecucion
Requisitos

Git, Node v18.x o v20.x, npm ≥ 8, acceso a MongoDB (local o Atlas).

Variables de entorno

backend/.env

PORT=4000
MONGODB_URI=tu_mongodb_uri_aqui


frontend/.env

VITE_API_URL=http://localhost:4000

Pasos (desde otra maquina nueva)

Clonar repo:

git clone https://github.com/MartinOscarMateo/cambalache.git
cd cambalache


Backend:

cd backend
npm install
# crear backend/.env con las variables arriba
npm start


Frontend (otra terminal):

cd frontend
npm install
# crear frontend/.env con la variable arriba
npm run dev

Puertos por defecto

Backend: http://localhost:4000

Frontend: http://localhost:5173

Comprobacion rapida

Backend health: http://localhost:4000/healthz

Abrir frontend en: http://localhost:5173