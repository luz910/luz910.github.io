# BIOQUNS — Sitio web institucional, científico y educativo

Aplicación web completa para BIOQUNS: sitio público (Inicio, Artículos de interés, Cursos, Publicaciones, Congresos, Quiénes somos), panel de administración para editores, base de datos persistente, carga de imágenes y PDF, y newsletter con envío real de correos.

---

## 1. Arquitectura (y por qué)

| Pieza | Servicio | Para qué |
|---|---|---|
| Sitio y panel | **React + TypeScript + Vite + Tailwind** | Interfaz rápida, responsive y accesible. |
| Base de datos, usuarios y archivos | **Supabase** (PostgreSQL + Auth + Storage) | Guarda todo el contenido de forma permanente. La seguridad está en la base de datos (reglas RLS): aunque alguien modifique el navegador, no puede escribir sin ser editor. |
| Lógica privada | **Supabase Edge Functions** (`newsletter`, `admin`) | Suscripciones, envíos de correo, creación de editores. Las claves secretas viven solo acá. |
| Correo | **Resend** | Envío real de confirmaciones, avisos automáticos y campañas. |
| Publicación | **Cloudflare Pages** (+ Pages Functions) | Hosting del sitio, dominio propio, y metadatos para Google y redes sociales (vistas previas en WhatsApp, LinkedIn, etc.), `sitemap.xml` y `robots.txt` dinámicos. |
| Código | **GitHub** | Versionado; cada cambio en el repositorio se publica solo. |

Cuando un editor guarda algo en el panel, se escribe en la base de datos y el sitio público lo muestra al instante. **No hace falta volver a desplegar.**

### Costos (verificalos antes de decidir: cambian seguido)

| Servicio | Plan gratuito | Cuándo podrías necesitar pagar |
|---|---|---|
| Supabase | 500 MB de base de datos, 1 GB de archivos, 5 GB de tráfico/mes, 2 proyectos. **El proyecto se pausa tras 1 semana sin actividad** (se reactiva desde el panel de Supabase). Sin copias de seguridad automáticas descargables. | Plan Pro: US$ 25/mes (8 GB de base, 100 GB de archivos, copias diarias, sin pausa). Conviene cuando haya muchos PDF/fotos o tráfico constante. |
| Resend | 3.000 correos/mes y **100 por día**, 1 dominio… | Con más de ~100 suscriptores, un aviso no entra en un día: el sistema lo deja "interrumpido" y **lo retoma solo** al día siguiente sin repetir destinatarios. Para envíos masivos sin espera: plan Pro US$ 20/mes. |
| Cloudflare Pages | Tráfico estático ilimitado; 100.000 ejecuciones de funciones por día. | Raramente para un sitio de este tamaño. |
| Dominio propio | — | Lo comprás en un registrador (por ej. NIC Argentina para `.com.ar`). Es necesario para enviar correos a suscriptores. |

---

## 2. Requisitos

- Node.js 20 o superior (https://nodejs.org).
- Cuentas gratuitas en **Supabase**, **Resend**, **Cloudflare** y **GitHub**.
- (Opcional, para pruebas y despliegue por terminal) Supabase CLI: `npm i -g supabase` y Deno.

## 3. Instalación local

```bash
npm install
cp .env.example .env.local   # completá los valores (ver sección 5)
npm run dev                  # abre http://localhost:5173
```

---

## 4. Configuración de Supabase (paso a paso)

1. Entrá a https://supabase.com → **New project**. Elegí región **São Paulo** (la más cercana) y guardá la contraseña de la base en un lugar seguro.
2. **Crear las tablas:** menú **SQL Editor → New query**, pegá todo el contenido de `supabase/migrations/20261021000000_esquema_inicial.sql` y presioná **Run**. Esto crea tablas, reglas de seguridad, el almacenamiento de archivos (`media`) y los textos iniciales.
3. **Claves para el sitio:** **Project Settings → API**. Copiá:
   - *Project URL* → `VITE_SUPABASE_URL`
   - clave *anon public* (o *publishable*) → `VITE_SUPABASE_ANON_KEY`
   Estas dos son públicas por diseño. **Nunca** uses la clave `service_role` / `secret` en el sitio.
4. **Autenticación:** **Authentication → Sign In / Providers** → dejá activado *Email* y **desactivá "Allow new users to sign up"** (así nadie puede crearse una cuenta por su cuenta). En **Authentication → URL Configuration** poné en *Site URL* la dirección del sitio (y agregá `http://localhost:5173` en *Redirect URLs* para pruebas).

### 4.1 Crear el usuario administrador (contraseña inicial)

La contraseña **no está en el código**: se carga directamente en Supabase.

1. **Authentication → Users → Add user → Create new user**.
2. Correo: el tuyo. Contraseña: `25/10/01`. Marcá **Auto Confirm User**.
3. **SQL Editor**, ejecutá (cambiando el correo):
   ```sql
   insert into public.editors (user_id, email, role)
   select id, email, 'admin' from auth.users where email = 'TU-CORREO@ejemplo.com';
   ```
4. Entrá al sitio → pie de página → **Acceso editores** → ingresá. Si completaste `VITE_EDITOR_EMAIL`, solo se pide la contraseña.

> **Importante:** `25/10/01` es una contraseña corta y adivinable. Usala solo para el primer ingreso y cambiala en **Panel → tu correo (abajo a la izquierda) → Cambiar contraseña**. Además de la contraseña, la app usa sesiones seguras de Supabase, verifica el rol de editor en el servidor en cada operación y bloquea intentos repetidos de inicio de sesión.

Más editores: **Panel → Editores**. Un administrador puede crear accesos individuales, asignar rol y revocarlos. Cada persona cambia su contraseña desde su cuenta, o con "Olvidé mi contraseña" en la pantalla de acceso.

---

## 5. Variables de entorno

| Dónde | Variable | Valor |
|---|---|---|
| Sitio (`.env.local` y Cloudflare) | `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| Sitio | `VITE_SUPABASE_ANON_KEY` | Clave pública anon/publishable |
| Sitio (opcional) | `VITE_EDITOR_EMAIL` | Correo del editor principal (para que el acceso pida solo la contraseña) |
| Secretos de Edge Functions (Supabase) | `RESEND_API_KEY` | Clave de Resend |
| Secretos de Edge Functions | `MAIL_FROM` | Remitente, ej.: `BIOQUNS <novedades@tudominio.com.ar>` |
| Secretos de Edge Functions (opcional) | `MAIL_REPLY_TO` | Correo donde llegan las respuestas |
| Secretos de Edge Functions | `SITE_URL` | `https://www.tudominio.com.ar` (también se puede cargar en el panel) |
| Secretos de Edge Functions | `CRON_SECRET` | Una cadena larga al azar (ver 6.3) |

Los secretos se cargan en **Supabase → Edge Functions → Secrets** (o con `supabase secrets set NOMBRE=valor`). Nunca se suben al repositorio (`.gitignore` ya excluye los `.env`).

---

## 6. Correo electrónico (Resend)

### 6.1 Cuenta y dominio
1. Creá una cuenta en https://resend.com.
2. **Domains → Add Domain** → tu dominio (ej. `bioquns.com.ar`).
3. Resend te muestra 3–4 registros DNS (**MX, TXT de SPF y TXT de DKIM**). Cargalos tal cual en el panel DNS de tu dominio (si el dominio está en Cloudflare: **DNS → Records → Add record**). Recomendado: agregar también un registro **DMARC** (`_dmarc`, TXT, `v=DMARC1; p=none;`).
4. Esperá a que el dominio figure como **Verified** (de minutos a algunas horas).
5. **API Keys → Create API Key** con permiso *Sending access* → guardala como secreto `RESEND_API_KEY`.

Sin dominio verificado, Resend solo permite enviar a tu propio correo (útil para probar). El panel avisa si falta algo.

### 6.2 Desplegar las funciones
```bash
supabase login
supabase link --project-ref TU-PROYECTO
supabase secrets set RESEND_API_KEY=re_xxx MAIL_FROM="BIOQUNS <novedades@tudominio.com.ar>" SITE_URL=https://www.tudominio.com.ar CRON_SECRET=$(openssl rand -hex 24)
supabase functions deploy newsletter --no-verify-jwt
supabase functions deploy admin --no-verify-jwt
```
(`--no-verify-jwt` es correcto: la función `newsletter` la usan visitantes sin cuenta, y `admin` verifica el usuario y su rol de editor por dentro.)

### 6.3 Revisión automática cada 10 minutos (publicaciones programadas)
Abrí `supabase/sql/programar_envios_automaticos.sql`, reemplazá `TU-PROYECTO` y `TU-CRON-SECRET` (el mismo valor del secreto `CRON_SECRET`) y ejecutalo en el **SQL Editor**.

### 6.4 Cómo funciona
- **Suscripción con doble confirmación:** el visitante deja su correo y acepta el consentimiento (queda registrado el texto aceptado y la fecha). Recibe un correo con un enlace; recién al confirmarlo pasa a "activo". No hay duplicados (el correo es único, sin importar mayúsculas).
- **Bajas:** cada correo incluye "Cancelar suscripción" y el encabezado de baja en un clic que usan Gmail/Outlook. También desde `/newsletter/baja`.
- **Avisos automáticos:** al publicar un curso, artículo (o publicación, si lo activás) se envía un aviso con logo, título, imagen, descripción, botón y enlace de baja. Los borradores nunca generan correos. Se activa/desactiva por tipo en **Panel → Newsletter → Envíos automáticos**.
- **Sin duplicados:** cada contenido se puede avisar una sola vez (restricción en la base de datos), cada tanda de 100 correos lleva una clave de idempotencia y el progreso se guarda: si un envío se corta, se retoma desde el último destinatario.
- **Campañas manuales:** **Panel → Newsletter → Campañas** (con envío de prueba a tu correo).
- Si el correo no está configurado, el panel lo dice claramente y **no** informa envíos falsos.

---

## 7. Publicación en Cloudflare Pages

1. Subí el proyecto a GitHub:
   ```bash
   git init && git add . && git commit -m "Sitio BIOQUNS"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/bioquns-web.git
   git push -u origin main
   ```
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → elegí el repositorio.
3. Configuración de compilación: *Framework preset*: **Vite** · *Build command*: `npm run build` · *Output directory*: `dist`.
4. **Environment variables** (Production y Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y, si querés, `VITE_EDITOR_EMAIL`. Las usan tanto el sitio como las funciones de SEO.
5. **Save and Deploy**. Vas a obtener una dirección `https://bioquns-web.pages.dev`.
6. **Dominio propio:** en el proyecto de Pages → **Custom domains → Set up a domain**. Luego cargá esa dirección en el secreto `SITE_URL` y en Supabase → Authentication → URL Configuration.
7. Registrá el sitio en **Google Search Console** y enviá `https://tudominio/sitemap.xml`.

Cada `git push` vuelve a publicar el código. El **contenido** se actualiza desde el panel, sin desplegar nada.

---

## 8. Uso del panel (resumen)

Pie de página → **Acceso editores**. Menú:
Resumen general · Editar portada (textos, imagen, botones, orden y visibilidad de secciones) · Artículos · Cursos (con duplicar) · Publicaciones · Congresos · Disertaciones · Pósteres (al subir el PDF se genera la miniatura sola) · Galería (subida múltiple, orden, texto alternativo) · Quiénes somos · Integrantes · Newsletter y suscriptores (exportar CSV) · Pie de página y contacto · Configuración general (SEO, **logos de las tarjetas de cursos**: UNS, símbolo ADN y DirEaD se reemplazan individualmente; editores).

En cada contenido: **Guardar borrador**, **Publicar** (ahora o en una fecha futura), **Vista previa**, destacar en portada (estrella), ordenar, archivar o eliminar (con confirmación). Los textos largos admiten formato (subtítulos, negritas, listas, enlaces e imágenes) con la barra de herramientas y la pestaña "Vista previa".

---

## 9. Pruebas

```bash
npm run build            # compila y verifica tipos
npm run test:db          # esquema + reglas de seguridad en un PostgreSQL real (PGlite)
npm run test:funciones   # lógica de envío por tandas/reanudación y plantillas (requiere Deno)
npm run typecheck:cf     # funciones de Cloudflare
```

`test:db` comprueba, entre otras cosas, que un visitante solo vea lo publicado, que un usuario sin rol de editor no pueda crear/editar/borrar ni subir archivos, que nadie pueda darse permisos a sí mismo, que la lista de suscriptores no sea pública y que no haya correos duplicados.

**Lista de verificación después de publicar** (con las cuentas reales):
1. Crear un artículo en borrador → no aparece en el sitio; con "Vista previa" sí.
2. Publicarlo → aparece en Artículos y en Inicio. Recargar y abrirlo desde otro dispositivo.
3. Cerrar sesión y abrir `/admin` → redirige al acceso.
4. Subir un póster PDF → se ve la miniatura, se abre el visor y se descarga.
5. Suscribirse con un correo propio → llega la confirmación → confirmar.
6. Publicar un curso → llega el aviso (puede tardar hasta 10 minutos si se programó a futuro).
7. Usar "Cancelar suscripción" → el estado pasa a "Baja" y no llegan más correos.
8. Revisar en un celular el menú, las tarjetas y el formulario.

---

## 10. Mantenimiento

- **Contenidos:** todo desde el panel.
- **Proyecto gratuito de Supabase pausado:** si nadie visita el sitio por una semana, entrá a supabase.com y presioná *Restore*. Con visitas regulares o el cron activo esto no suele pasar; para tranquilidad total, plan Pro.
- **Espacio:** las imágenes se reducen automáticamente al subirlas (máx. 2000 px). Revisá el uso en Supabase → Storage. Límite por archivo: 25 MB.
- **Actualizar dependencias** cada tanto: `npm update` y `npm run build`.
- **Seguridad:** cambiá la contraseña inicial, revocá accesos de quien ya no edite, y nunca compartas la clave `service_role`/`secret`.

## 11. Copias de seguridad

- **Base de datos (gratis):** periódicamente (ej. una vez por mes),
  ```bash
  supabase db dump --linked -f backups/estructura.sql
  supabase db dump --linked --data-only -f backups/datos-$(date +%F).sql
  ```
  Guardá esos archivos fuera de GitHub (Drive, disco externo). Restaurar: ejecutarlos en el SQL Editor de un proyecto nuevo.
- **Suscriptores:** Panel → Newsletter → *Exportar activos (CSV)*.
- **Archivos (imágenes y PDF):** Supabase → Storage → `media` permite descargarlos; o con la CLI `supabase storage cp -r ss:///media ./backups/media --experimental`.
- **Plan Pro de Supabase:** copias diarias automáticas.
- El código ya queda respaldado en GitHub.

---

## 12. Qué falta para que todo quede activo

Todo está implementado; solo depende de cuentas y configuraciones que no se pueden hacer desde el código:

1. Crear el proyecto de Supabase, ejecutar la migración y crear el usuario administrador (sección 4).
2. Cuenta de Resend + dominio propio verificado con sus registros DNS (sección 6.1). **Sin esto no se envían correos** (el panel lo advierte).
3. Desplegar las dos Edge Functions y cargar sus secretos (6.2) y programar la revisión automática (6.3).
4. Publicar en Cloudflare Pages con las variables de entorno (sección 7).
5. Cargar los contenidos reales: textos de Quiénes somos, perfiles de las dos personas responsables, datos de contacto y redes, y el aviso de privacidad (los textos iniciales están marcados para reemplazar; no se inventó ningún dato).

## Estructura del proyecto

```
src/            sitio público (pages/, components/) y panel (admin/)
public/brand/   logo original, wordmark y símbolo de ADN recortado (sin redibujar)
public/logos/   logos de UNS y DirEaD (reemplazables desde el panel)
supabase/       migración SQL, programación de envíos, Edge Functions y sus pruebas
functions/      Cloudflare Pages Functions (metadatos SEO, sitemap, robots)
cf/             utilidades de esas funciones
tests/          pruebas de base de datos y seguridad
```
