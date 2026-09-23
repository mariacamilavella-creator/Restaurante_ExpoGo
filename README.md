# Proyecto Final — Restaurante App 🍽️

Aplicación de pedidos para restaurante con Login, Registro, y 3 módulos
adicionales, con soporte **offline (SQLite) + sincronización automática**
con la API cuando vuelve la conexión.

## Módulos entregados

1. **Login**
2. **Registro**
3. **Ver Menú y Hacer Pedido** (usuario) — funciona sin internet
4. **Gestión de Pedidos** (admin) — confirmar, poner en preparación, marcar entregado o cancelar
5. **Mis Pedidos — Cancelar pedido** (usuario, solo si está en estado "pendiente")

## Estructura del proyecto

```
proyecto-restaurante/
├── backend/     -> API REST (Node.js + Express + Sequelize + SQLite)
└── mobile/      -> App móvil (React Native + Expo)
```

---

## 1. Levantar el Backend (API)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Esto levanta el servidor en `http://localhost:3000`. Al iniciar, crea
automáticamente la base de datos `database.sqlite` con sus tablas.

### Crear un usuario administrador

Por defecto todo usuario se registra con rol `usuario`. Para crear un admin,
registra un usuario normal desde la app y luego, con cualquier cliente HTTP
(Postman, curl) o directo por consulta a la BD, cambia su `rol` a `admin`.
También puedes registrar directamente un admin llamando al endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Admin","email":"admin@restaurante.com","password":"123456","rol":"admin"}'
```

### Endpoints principales

| Método | Ruta                         | Descripción                          | Auth        |
|--------|------------------------------|---------------------------------------|-------------|
| POST   | /api/auth/registro           | Registro de usuario                   | No          |
| POST   | /api/auth/login              | Login                                 | No          |
| GET    | /api/menu                    | Listar platos disponibles             | Sí          |
| POST   | /api/menu                    | Crear plato                           | Sí (admin)  |
| POST   | /api/pedidos                 | Crear pedido                          | Sí          |
| POST   | /api/pedidos/sincronizar     | Sincronizar pedidos creados offline   | Sí          |
| GET    | /api/pedidos/mios            | Mis pedidos                           | Sí          |
| PUT    | /api/pedidos/:id/cancelar    | Cancelar mi pedido (solo "pendiente") | Sí          |
| GET    | /api/pedidos                 | Listar todos los pedidos              | Sí (admin)  |
| PUT    | /api/pedidos/:id/estado      | Cambiar estado de un pedido           | Sí (admin)  |

---

## 2. Levantar la App móvil (Expo Go)

### Paso importante: configurar la IP del backend

Tu celular (con Expo Go) y tu computador deben estar en la **misma red WiFi**.
Edita `mobile/src/services/api.js` y cambia:

```js
export const API_URL = 'http://192.168.1.15:3000/api';
```

por la IP local de tu computador (en Windows: `ipconfig`, en Mac/Linux:
`ifconfig` o `ip a`, busca algo como `192.168.x.x`).

### Instalar y correr

```bash
cd mobile
npm install
npx expo start
```

Escanea el QR con la app **Expo Go** (Android/iOS) y la app se abrirá en tu
celular.

---

## 3. Modo offline — cómo funciona

1. Cuando el usuario hace un pedido, **siempre** se guarda primero en una
   tabla local de SQLite (`pedidos_local`) en el celular, tenga o no internet.
2. Si hay internet en ese momento, se intenta sincronizar de inmediato contra
   `POST /api/pedidos/sincronizar`.
3. Si no hay internet, el pedido queda marcado como `sincronizado = 0`.
4. La app escucha los cambios de conectividad (`NetInfo`). Apenas detecta que
   volvió el internet, sincroniza automáticamente todos los pedidos
   pendientes.
5. Cada pedido creado en el celular lleva un `uuidCliente` único generado en
   el momento de crearlo. Esto evita que, si la sincronización se reintenta,
   se dupliquen pedidos en el servidor.

Puedes probarlo así:
- Activa el modo avión en el celular.
- Haz un pedido (verás el aviso "guardado sin conexión").
- Desactiva el modo avión.
- Entra a "Mis Pedidos": el pedido se sincroniza solo y aparece como
  "Pendiente" ya en el servidor.

---

## 4. Generar el APK (entregable final)

Se usa **EAS Build** (el servicio de Expo para compilar apps nativas en la
nube, sin necesidad de instalar Android Studio).

```bash
cd mobile
npm install -g eas-cli
eas login          # crea una cuenta gratis en expo.dev si no tienes
eas build:configure
eas build -p android --profile preview
```

Al terminar, la terminal te da un link para **descargar el archivo .apk**
directamente (también queda disponible en tu cuenta de expo.dev, en la
sección "Builds").

> ⚠️ Nota: para que el APK generado en la nube pueda hablar con tu backend,
> este debe estar accesible por internet (no solo en tu red local). Para la
> entrega/sustentación puedes:
> - Desplegar el backend gratis en Render, Railway o similar, y actualizar
>   `API_URL` en `api.js` con esa URL antes de compilar el APK, o
> - Sustentar en vivo conectando el celular a la misma red que tu compu
>   (funciona igual para la demo, aunque el APK "portable" solo funcionará
>   fuera de esa red si el backend está en internet).

---

## 5. Próximos pasos sugeridos (opcional, para mejorar la nota)

- Agregar pantalla de administración de menú (CRUD completo de platos).
- Agregar notificaciones push cuando el admin confirme un pedido.
- Agregar recuperación de contraseña.
- Subir el backend a un servicio gratuito (Render/Railway) para que el APK
  final funcione desde cualquier red.
