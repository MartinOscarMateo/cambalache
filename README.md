Cambalache — instalación y ejecución
Qué vas a instalar

Git

Node.js 18.x o 20.x y npm ≥ 8

MongoDB (local con Community Server + Compass) o acceso a Atlas

Postman o cURL para probar la API

Estructura esperada del repo
cambalache/
  backend/
  frontend/


Corroborá que existan backend/ y frontend/, y que en:

backend/package.json haya un script start.

frontend/package.json haya un script dev.

Variables de entorno

Crear archivos .env sin subirlos al repo.

backend/.env

PORT=4000
MONGODB_URI=tu_mongodb_uri_aqui


frontend/.env

VITE_API_URL=http://localhost:4000

Pasos en una máquina nueva
1) Clonar
git clone https://github.com/MartinOscarMateo/cambalache.git
cd cambalache

2) Backend
cd backend
npm install
# crear backend/.env como arriba
npm start


API por defecto: http://localhost:4000

Healthcheck: http://localhost:4000/healthz

Si usás MongoDB local: asegurate de que el servicio esté iniciado o conectate a Atlas con tu cadena en MONGODB_URI.

3) Frontend

Abrí otra terminal:

cd cambalache/frontend
npm install
# crear frontend/.env como arriba
npm run dev


Front por defecto: http://localhost:5173

Comprobación rápida

API viva
GET http://localhost:4000/healthz → debe responder 200.

Endpoint base de posts
GET http://localhost:4000/api/posts → debe devolver JSON (lista vacía o datos).

UI
Abrí http://localhost:5173. La página debe cargar y poder “ver publicaciones”.

Puertos por defecto

Backend: 4000

Frontend: 5173

Problemas comunes y solución breve

.env faltante o mal configurado: la API no arranca o lanza error de conexión a MongoDB. Crear/ajustar .env.

MongoDB no corre: iniciar servicio local o usar Atlas con MONGODB_URI válido.

Puerto ocupado: cambiar PORT en backend/.env y actualizar VITE_API_URL en frontend/.env.

CORS / URL base: VITE_API_URL debe apuntar al backend real que estés usando.

Herramientas recomendadas

MongoDB Compass para ver colecciones.

Postman para requests a la API.