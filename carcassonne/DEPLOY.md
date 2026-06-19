# Poner Carcassonne online

El servidor Express sirve también el cliente ya compilado, así que todo vive en
**una sola URL** — la compartes y la otra persona entra, sin cuenta.

## Opción recomendada: Railway

1. Entra a https://railway.app y conéctalo a tu cuenta de GitHub.
2. **New Project** → **Deploy from GitHub repo** → elige `goobra_dashboard_repository`.
3. Cuando te pregunte por el **Root Directory**, escribe `carcassonne`.
   Railway detecta el `railway.toml` y sabe qué hacer.
4. Agrega las variables de entorno en la pestaña **Variables**:
   - `SUPABASE_URL` = `https://TU-PROYECTO.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = tu service role key
5. **Deploy**. El build tarda ~2-3 min.
6. Te da una URL tipo `https://carcassonne-production.up.railway.app`. Esa es la
   que compartes.

Ventajas:
- **No se duerme** — siempre responde al instante.
- Deploy automático cada vez que hagas push al repo.
- Cada partida que se juegue online queda guardada en Supabase.

## Alternativa: Render (gratis, se duerme)

1. Entra a https://render.com y crea una cuenta con GitHub.
2. **New +** → **Blueprint** → conecta `goobra_dashboard_repository`.
   Render detecta `render.yaml`.
3. Te pedirá las variables de entorno:
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
4. **Apply / Create**. URL tipo `https://carcassonne-xxxx.onrender.com`.

Nota: el plan gratis de Render "duerme" el servicio tras 15 min sin uso;
la primera visita tarda ~30s en despertar.

## Cómo se construye

- `npm install && npm run build` → compila el cliente a `client/dist`.
- `npm start` → arranca el servidor, que sirve `client/dist` + API + WebSocket.
- El cliente habla con el mismo origen (`/api`, `/socket.io`), así que no hay
  nada que configurar entre front y back.

## Persistencia de datos para análisis

Las tablas se llenan solas mientras se juega: `games` al crear, `moves` en cada
ficha, y `users`/ELO al terminar. Si en Supabase no aparecen filas, revisa los
logs del servicio en Railway/Render — un error de Supabase no rompe el juego
(es no-bloqueante) pero sí se registra en consola.
