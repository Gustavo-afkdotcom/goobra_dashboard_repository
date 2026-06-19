# Poner Carcassonne online

El servidor Express sirve también el cliente ya compilado, así que todo vive en
**una sola URL** — la compartes y la otra persona entra, sin cuenta.

## Opción recomendada: Render (gratis)

1. Entra a https://render.com y crea una cuenta (puedes usar tu GitHub).
2. **New +** → **Blueprint**.
3. Conecta el repo `goobra_dashboard_repository`. Render detecta `render.yaml`.
4. Antes de crear, te pedirá las variables de entorno (porque están como
   `sync: false`). Pega:
   - `SUPABASE_URL` = `https://TU-PROYECTO.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = tu service role key
5. **Apply / Create**. Espera el build (~2-3 min).
6. Te da una URL tipo `https://carcassonne-xxxx.onrender.com`. Esa es la que
   compartes.

Notas del plan gratis:
- El servicio se "duerme" tras 15 min sin uso; la primera visita tarda ~30s en
  despertar. Después va normal.
- El estado de las partidas en curso vive en memoria del servidor: si Render
  reinicia el proceso, las partidas activas se pierden (los datos ya guardados
  en Supabase no).

## Cómo se construye

- `npm install && npm run build` → compila el cliente a `client/dist`.
- `npm start` → arranca el servidor, que sirve `client/dist` + API + WebSocket.
- El cliente habla con el mismo origen (`/api`, `/socket.io`), así que no hay
  nada que configurar entre front y back.

## Persistencia de datos para análisis

Las tablas se llenan solas mientras se juega: `games` al crear, `moves` en cada
ficha, y `users`/ELO al terminar. Si en Supabase no aparecen filas, revisa los
logs del servicio en Render — un error de Supabase no rompe el juego (es
no-bloqueante) pero sí se registra en consola.
