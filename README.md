# 📡 Radar de Noticias — Antioquia

Sistema de monitoreo territorial que recolecta, clasifica y geolocaliza
automáticamente noticias de seguridad y orden público en los 125 municipios
de Antioquia, sin depender de APIs de IA de pago.

> Desarrollado para **CIACA — Desarrollo Cuantitativo**, Gobernación de Antioquia.

---

## Descripción General

**Radar de Noticias** monitorea decenas de fuentes de prensa colombiana en busca
de hechos relevantes de seguridad (homicidios, orden público, minería ilegal,
feminicidios, violencia política) y los organiza automáticamente en un dashboard
con mapa interactivo, filtros geográficos y clasificación temática.

**Propósito principal:** dar visibilidad territorial casi en tiempo real sin
scraping manual y **sin costos recurrentes de API de IA** — el motor de
clasificación y el detector geográfico funcionan con reglas y diccionarios locales.

---

## Tecnologías Utilizadas

| Categoría | Tecnología |
|---|---|
| Backend | Node.js + Express.js |
| Base de datos | SQLite (vía `sql.js`, sin servidor externo) |
| Recolección | `node-fetch`, `xml2js`, `node-cron` |
| Frontend | HTML5, CSS3, JavaScript (Vanilla, sin frameworks) |
| Mapas | Leaflet.js + GeoJSON |
| Gráficas | Chart.js |
| Seguridad | `express-rate-limit`, `dotenv`, `cors` |

---

## Arquitectura / Componentes Clave

- **API REST** (`src/`): expone endpoints para dashboard, búsqueda y administración.
- **Base de datos SQLite** (`data/radar.db`): archivo único, se genera automáticamente.
- **Servicio de recolección** (`services/`): cron cada 30 min que descarga RSS,
  clasifica y geolocaliza cada noticia.
- **Frontend estático** (`public/`): dashboard SPA servido directamente por Express.
- **Panel administrativo**: acceso oculto (5 clics en el logo o `Ctrl+Shift+Z`)
  para reclasificar o eliminar noticias manualmente.

Documentación técnica ampliada (modelado de datos, seguridad, Postman): ver
[`DOCUMENTACION.md`](./DOCUMENTACION.md).

---

## Requisitos Previos

- **Node.js** 18.x o superior
- **npm** 9.x o superior
- No requiere base de datos externa ni Docker

---

## Instalación y Configuración (Setup)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/radar-antioquia.git
cd radar-antioquia
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz (nunca se sube al repositorio):

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos (se crea automáticamente si no existe)
DB_PATH=./data/radar.db

# Recolección automática
CRON_INTERVALO_MINUTOS=30
DIAS_RETENCION=90

# CORS — orígenes permitidos separados por coma
CORS_ORIGINS=http://localhost:3000

# Panel administrativo
ADMIN_PASSWORD=cambia-esta-contraseña
```

> ⚠️ **Importante:** usa una contraseña robusta en `ADMIN_PASSWORD` y nunca
> compartas o subas el archivo `.env` a un repositorio.

### 4. Levantar el proyecto en local

```bash
# Producción
npm start

# Desarrollo (recarga automática)
npm run dev
```

Accede en tu navegador a: **http://localhost:3000**

Al primer arranque el sistema crea la base de datos, ejecuta una recolección
inicial y activa el cron automático.

---

## Estructura del Proyecto

```
radar-antioquia/
├── src/
│   ├── app.js                    # Punto de entrada del servidor
│   ├── controllers/               # Lógica de negocio de cada endpoint
│   ├── routes/                    # Definición de rutas REST
│   └── middlewares/                # Seguridad (rate limiting, headers)
├── config/
│   ├── database.js                # Conexión e inicialización de SQLite
│   ├── municipios.js              # Gazetteer y detector geográfico
│   └── fuentes.js                 # Catálogo de medios y credibilidad
├── services/
│   ├── recolector.js              # Descarga y parseo de feeds RSS
│   ├── clasificador.js            # Motor de clasificación por categoría
│   └── filtro.js                  # Deduplicación y filtro de ruido
├── models/
│   └── NoticiaModel.js            # Acceso a datos (queries SQL parametrizadas)
├── public/
│   ├── index.html                 # Interfaz del dashboard
│   ├── css/styles.css             # Estilos
│   ├── js/                        # dashboard.js, mapa.js, admin.js
│   └── data/                      # GeoJSON de los 125 municipios
├── data/                          # Base de datos SQLite (no versionada)
├── .env                           # Variables de entorno (no versionado)
├── .gitignore
└── package.json
```

---

## Guía de Uso

### Dashboard principal

1. Abre `http://localhost:3000`.
2. Navega el mapa: Antioquia → clic en subregión → clic en municipio.
3. Filtra por categoría haciendo clic en las tarjetas de métricas.
4. Usa los rangos rápidos **Hoy / Semana / Mes** o un rango de fechas manual.

### Búsqueda combinada (modo Antioquia)

Escribe directamente un municipio en el buscador — el sistema lo detecta
automáticamente (sin importar tildes o mayúsculas) y ajusta filtros y mapa:

```
itagüí capturas
```

### Búsqueda libre

Cambia a la pestaña **"Búsqueda libre"** para buscar cualquier término sin
restricción geográfica, directamente sobre Google News.

### Recolección manual

```bash
curl -X POST http://localhost:3000/api/noticias/recolectar
```

### Reclasificar noticias existentes

Necesario tras modificar `services/clasificador.js` o `config/municipios.js`:

```bash
curl -X POST http://localhost:3000/api/admin/reclasificar
```

### Acceso al panel administrativo

- 5 clics consecutivos en el logo **"Antioquia"** de la barra superior, o
- Atajo de teclado `Ctrl + Shift + Z`

---

## Endpoints Principales de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/dashboard` | Métricas, mapa y tendencia del período |
| `GET` | `/api/noticias/buscar` | Búsqueda combinada (texto + geografía + fechas) |
| `GET` | `/api/mapa/subregion/:id` | Detalle de una subregión |
| `GET` | `/api/mapa/municipio` | Detalle de un municipio |
| `POST` | `/api/noticias/recolectar` | Fuerza una recolección manual |
| `POST` | `/api/admin/login` | Autenticación del panel admin |
| `POST` | `/api/admin/reclasificar` | Reclasifica todas las noticias existentes |

Ejemplos completos de request/response en [`DOCUMENTACION.md`](./DOCUMENTACION.md#8-guía-técnica-para-postman).

---

## Seguridad

- Rate limiting por IP (general y específico para búsquedas).
- Sanitización y validación estricta de todos los parámetros de entrada.
- Consultas SQL 100% parametrizadas (sin concatenación de strings).
- Headers HTTP de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, etc.).
- Secretos y base de datos excluidos del control de versiones vía `.gitignore`.

Detalle completo en [`DOCUMENTACION.md` — Sección 7](./DOCUMENTACION.md#7-seguridad-implementada).

---

## Licencia y Uso

Proyecto interno de la **Gobernación de Antioquia**. Uso restringido a personal
autorizado de la entidad.

---

*Mantenido por el equipo de Desarrollo Cuantitativo — CIACA.*
