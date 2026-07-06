// ================================================================================
// MAPA INTERACTIVO — Radar de Noticias · Gobernación de Antioquia
// ================================================================================
// Diseño visual: croquis regionales limpios + etiquetas de nombre, SIN marcadores
// y SIN recuadros blancos de tooltip (se reemplazan por tooltips oscuros sutiles).
//   Nivel 1 (Antioquia): 9 regiones sólidas con su color propio. Las divisiones
//                        municipales internas se hacen INVISIBLES pintando el
//                        borde de cada municipio del MISMO color que su relleno
//                        (truco robusto que no requiere fusionar geometría).
//                        Nombre de cada región en etiqueta blanca. Clic → Nivel 2.
//   Nivel 2 (Subregión): coropleta municipal (más noticias = más intenso) +
//                        etiqueta con el nombre de la subregión. Clic → Nivel 3.
//   Nivel 3 (Municipio): croquis oscuro del municipio, vecinos clarito, y
//                        titulito blanco con el nombre (ej: ANORÍ).
// API pública IDÉNTICA (window.MapaRadar.*): dashboard.js no requiere cambios.
// Fuente de datos: ÚNICO GeoJSON /data/municipios_antioquia.geojson
// (el archivo subregiones_antioquia.geojson YA NO se usa y puede eliminarse).
// ================================================================================

// ================= SECCIÓN: CONFIGURACIÓN DEL MAPA BASE =================
const mapa = L.map('mapa', {
  center: [6.9, -75.6],              // Centro aproximado de Antioquia
  zoom: 8,                           // Zoom inicial que muestra todo el departamento
  zoomControl: true,                 // Botones +/- visibles
  attributionControl: false          // Sin crédito (uso interno institucional)
});

// Capa base clara de CartoDB: resalta los polígonos de colores sin competir con ellos
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19                        // Zoom máximo permitido por el proveedor
}).addTo(mapa);

// ================= SECCIÓN: ESTILOS INYECTADOS (TOOLTIPS Y ETIQUETAS) =================
// Se inyecta una hoja de estilos desde JS para mantener el cambio en UN solo archivo.
// - .radar-tip: reemplaza el recuadro blanco por defecto de Leaflet por una
//   tarjeta oscura translúcida, discreta y legible sobre cualquier color.
// - .radar-label: etiqueta de nombre en blanco con sombra (tipo "ANORÍ").
(function inyectarEstilos() {
  const css = `
    .leaflet-tooltip.radar-tip {
      background: rgba(33, 33, 33, 0.88);      /* Fondo oscuro translúcido */
      color: #ffffff;                           /* Texto blanco */
      border: none;                             /* Sin borde gris de Leaflet */
      border-radius: 8px;                       /* Esquinas suaves */
      padding: 6px 10px;                        /* Respiración interna */
      font-size: 12px;                          /* Tamaño discreto */
      line-height: 1.35;                        /* Interlineado cómodo */
      box-shadow: 0 2px 10px rgba(0,0,0,0.25);  /* Sombra sutil */
    }
    .leaflet-tooltip.radar-tip::before { display: none; }  /* Sin flechita blanca */
    /* Al hacer CLIC en un polígono el navegador dibuja un recuadro negro de
       foco (outline de accesibilidad) alrededor de su caja: se elimina porque
       el mapa ya da feedback propio con hover, zoom y navegación. */
    .leaflet-container path.leaflet-interactive:focus { outline: none; }
    /* Leyenda de subregiones bajo el mapa (la llena mapa.js dinámicamente) */
    .leyenda-item {
      display: inline-flex;                     /* Punto y texto alineados */
      align-items: center;                      /* Centrado vertical */
      gap: 5px;                                 /* Aire entre punto y nombre */
      margin: 2px 10px 2px 0;                   /* Separación entre items */
      font-size: 12px;                          /* Texto discreto */
      color: #444;                              /* Gris oscuro legible */
    }
    .leyenda-item .dot {
      width: 10px; height: 10px;                /* Punto compacto */
      border-radius: 50%;                       /* Circular */
      display: inline-block;                    /* Ocupa su espacio */
    }
    .radar-label {
      color: #ffffff;                           /* Nombre en blanco */
      font-weight: 800;                         /* Grueso, tipo título */
      text-transform: uppercase;                /* ANORÍ, NORDESTE... */
      letter-spacing: 0.6px;                    /* Aire entre letras */
      text-shadow: 0 1px 3px rgba(0,0,0,0.65),  /* Legible sobre color claro u oscuro */
                   0 0 8px  rgba(0,0,0,0.35);
      white-space: nowrap;                      /* Nunca partir el nombre */
      pointer-events: none;                     /* No bloquea clics ni hover del polígono */
      text-align: center;                       /* Centrado en su ancla */
    }`;
  const tag = document.createElement('style');  // Crear nodo <style>
  tag.textContent = css;                        // Insertar las reglas
  document.head.appendChild(tag);               // Montarlo en el <head>
})();

// ================= SECCIÓN: METADATOS DE SUBREGIONES =================
// Nombre bonito + color institucional distintivo por subregión.
// Los colores fueron elegidos para ser distinguibles entre sí y agradables
// sobre el mapa claro (paleta tipo "pastel saturado").
const SUBREGIONES_META = {
  uraba:     { nombre: 'Urabá',            color: '#26a69a' },  // Verde-azulado (mar/banano)
  norte:     { nombre: 'Norte',            color: '#5c6bc0' },  // Índigo
  nordeste:  { nombre: 'Nordeste',         color: '#8d6e63' },  // Marrón (minería)
  occidente: { nombre: 'Occidente',        color: '#ffa726' },  // Naranja
  aburra:    { nombre: 'Valle de Aburrá',  color: '#ef5350' },  // Rojo suave (urbano)
  oriente:   { nombre: 'Oriente',          color: '#66bb6a' },  // Verde
  suroeste:  { nombre: 'Suroeste',         color: '#ab47bc' },  // Púrpura (café)
  magdalena: { nombre: 'Magdalena Medio',  color: '#29b6f6' },  // Azul (río)
  bajocauca: { nombre: 'Bajo Cauca',       color: '#d4a017' }   // Dorado (oro)
};

// Mapeo del campo SUBREGION del GeoJSON (mayúsculas oficiales) → clave interna
const SUBREGION_GEOJSON_A_KEY = {
  'URABÁ': 'uraba',            'NORTE': 'norte',        'NORDESTE': 'nordeste',
  'OCCIDENTE': 'occidente',    'VALLE DE ABURRÁ': 'aburra', 'ORIENTE': 'oriente',
  'SUROESTE': 'suroeste',      'MAGDALENA MEDIO': 'magdalena', 'BAJO CAUCA': 'bajocauca'
};

// ================= SECCIÓN: LEYENDA DE REGIONES =================
// Llena el contenedor #leyenda-mapa (bajo el mapa) con un punto de color y el
// nombre de cada subregión, leyendo DIRECTAMENTE de SUBREGIONES_META: si un
// color cambia en el catálogo, la leyenda se actualiza sola (única fuente de verdad).
function pintarLeyendaRegiones() {
  const cont = document.getElementById('leyenda-mapa');  // Contenedor en index.html
  if (!cont) return;                                     // Seguridad: si no existe, salir
  cont.innerHTML = Object.values(SUBREGIONES_META)       // Recorrer el catálogo de regiones
    .map(m => `<span class="leyenda-item"><span class="dot" style="background:${m.color}"></span>${m.nombre}</span>`)
    .join('');                                           // Concatenar los 9 items
}
pintarLeyendaRegiones();                                 // Pintarla una vez al cargar el script

// ================= SECCIÓN: CONSTANTES DE COMPATIBILIDAD =================
// El diseño actual no usa marcadores por categoría, pero dashboard.js consulta
// colorPorTotal() de la API pública: este verde se conserva para no romperla.
const COLOR_GENERAL = '#43a047';       // Verde — valor de compatibilidad histórica

// ================= SECCIÓN: UTILIDADES =================
// Normaliza: minúsculas + sin tildes — idéntico al backend para que los slugs coincidan
const normalizar = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// "SAN PEDRO DE LOS MILAGROS" → "San Pedro de los Milagros" (para mostrar)
function nombreBonito(mayusculas) {
  const menores = new Set(['de', 'del', 'la', 'las', 'los', 'y']);  // Palabras que van en minúscula
  return mayusculas.toLowerCase().split(' ')
    .map((w, i) => (i > 0 && menores.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Oscurece un color hex multiplicando sus canales RGB (factor 0→sin cambio, 1→negro).
// Se usa para dibujar el croquis (borde) de cada municipio en un tono más oscuro
// que su relleno, generando el efecto "contorno marcado + interior clarito".
function oscurecer(hex, factor = 0.4) {
  const n = parseInt(hex.slice(1), 16);                // '#ab47bc' → entero
  const r = Math.round(((n >> 16) & 255) * (1 - factor)); // Canal rojo reducido
  const g = Math.round(((n >>  8) & 255) * (1 - factor)); // Canal verde reducido
  const b = Math.round(( n        & 255) * (1 - factor)); // Canal azul reducido
  return `rgb(${r},${g},${b})`;                        // Color CSS resultante
}

// Oscurece un color hexadecimal multiplicando sus canales RGB por un factor.
// factor 0.6 = 40% más oscuro. Se usa para los BORDES de los croquis municipales.
function oscurecerColor(hex, factor = 0.6) {
  const n = parseInt(hex.slice(1), 16);                // '#ab47bc' → entero
  const r = Math.round(((n >> 16) & 255) * factor);    // Canal rojo oscurecido
  const g = Math.round(((n >> 8)  & 255) * factor);    // Canal verde oscurecido
  const b = Math.round((n & 255) * factor);            // Canal azul oscurecido
  return `rgb(${r},${g},${b})`;                        // Color CSS resultante
}

// Crea una etiqueta de NOMBRE flotante (blanca, mayúsculas) anclada a un punto.
// No es interactiva: los clics y el hover atraviesan hacia el polígono de abajo.
function crearEtiqueta(texto, centro, fontSize = 13) {
  const icono = L.divIcon({
    className: '',                                   // Sin estilos por defecto de Leaflet
    iconSize: null,                                  // Tamaño automático según el texto
    html: `<div class="radar-label" style="font-size:${fontSize}px; transform: translate(-50%, -50%);">${texto}</div>`
  });
  const marker = L.marker(centro, { icon: icono, interactive: false, zIndexOffset: 500 }).addTo(mapa);
  marcadores.push(marker);                           // Registrar para limpiarla al cambiar de nivel
  return marker;
}

// Centro geográfico aproximado de una subregión: promedio de los centros de
// los polígonos de sus municipios (suficientemente preciso para una etiqueta).
function centroSubregion(id) {
  const slugs = slugsPorSubregion[id] || [];         // Municipios de la subregión
  if (!slugs.length) return null;                    // Seguridad: subregión vacía
  let latS = 0, lngS = 0;                            // Acumuladores de coordenadas
  slugs.forEach(s => {
    const c = L.geoJSON(featuresPorSlug[s]).getBounds().getCenter(); // Centro del municipio
    latS += c.lat; lngS += c.lng;                    // Sumar para promediar
  });
  return [latS / slugs.length, lngS / slugs.length]; // Promedio = centroide aproximado
}

// ================= SECCIÓN: ESTADO DEL MAPA =================
let geoData        = null;   // GeoJSON de 125 municipios (única fuente de geometría)
let featuresPorSlug = {};    // Índice: slug de municipio → feature
let slugsPorSubregion = {};  // Índice: subregión → [slugs]
let capaPoligonos  = null;   // Capa L.geoJSON activa en el mapa
let marcadores     = [];     // Etiquetas de nombre activas (para limpieza)
let nivelActual    = 'antioquia'; // Nivel de navegación actual
let subrActual     = null;   // Subregión activa en nivel 2/3
let datosSubregion = {};     // Últimos datos de nivel 1 (para "volver")
let noticiasSubregion = [];  // Últimas noticias de nivel 1
let _pendiente     = null;   // Llamada en espera mientras carga el GeoJSON

// ================= SECCIÓN: CARGA DEL GEOJSON =================
// Se descarga UNA sola vez al iniciar. Mientras llega, cualquier llamada a
// pintar se guarda en _pendiente y se ejecuta apenas los datos estén listos.
fetch('/data/municipios_antioquia.geojson')
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);    // Falla explícita, no silenciosa
    return r.json();                                   // Parsear JSON
  })
  .then(data => {
    geoData = data;                                    // Guardar GeoJSON en memoria
    // Construir índices de acceso rápido por slug y por subregión
    data.features.forEach(f => {
      const slug = normalizar(f.properties.MPIO_NOMBR);                    // Slug canónico
      const sub  = SUBREGION_GEOJSON_A_KEY[f.properties.SUBREGION] || 'general'; // Clave subregión
      f.properties._slug   = slug;                                         // Cachear en la feature
      f.properties._sub    = sub;
      f.properties._nombre = nombreBonito(f.properties.MPIO_NOMBR);        // Nombre para mostrar
      featuresPorSlug[slug] = f;                                           // Índice por slug
      if (!slugsPorSubregion[sub]) slugsPorSubregion[sub] = [];            // Inicializar lista
      slugsPorSubregion[sub].push(slug);                                   // Índice por subregión
    });
    console.log('[Mapa] GeoJSON cargado:', data.features.length, 'municipios');
    if (_pendiente) { const p = _pendiente; _pendiente = null; p(); }      // Ejecutar llamada en espera
  })
  .catch(err => console.error('[Mapa] Error cargando GeoJSON:', err));

// ================= SECCIÓN: LIMPIEZA DE CAPAS =================
function limpiarCapas() {
  if (capaPoligonos) { mapa.removeLayer(capaPoligonos); capaPoligonos = null; } // Quitar polígonos
  marcadores.forEach(m => mapa.removeLayer(m));                                 // Quitar etiquetas
  marcadores = [];                                                              // Vaciar registro
}

// ================= SECCIÓN: NIVEL 1 — ANTIOQUIA COMPLETA =================
// datos:    { subregion: totalNoticias }
// noticias: array completo (se guarda para poder "volver" desde otros niveles)
function pintarSubregiones(datos, noticias) {
  // Si el GeoJSON aún no llegó, encolar esta llamada y salir
  if (!geoData) { _pendiente = () => pintarSubregiones(datos, noticias); return; }

  limpiarCapas();                                      // Borrar lo anterior
  nivelActual = 'antioquia';                           // Actualizar nivel
  subrActual  = null;                                  // Sin subregión activa
  datosSubregion    = datos;                           // Guardar para "volver"
  noticiasSubregion = noticias || [];

  actualizarBreadcrumb([{ label: 'Antioquia', activo: true }]); // Migas de pan

  // ── Polígonos: croquis regionales SÓLIDOS (divisiones internas invisibles) ─
  // TRUCO: cada municipio se pinta con el borde del MISMO color que su relleno.
  // Entre municipios de la misma región el borde "desaparece" y la región se ve
  // como un croquis continuo; entre regiones distintas el cambio de color marca
  // el límite de forma natural. Robusto: no requiere fusionar geometría.
  const capasPorSub = {};                              // Índice: subregión → [capas Leaflet]
  capaPoligonos = L.geoJSON(geoData, {
    style: f => {
      const meta = SUBREGIONES_META[f.properties._sub];          // Color de la región
      const col  = meta ? meta.color : '#cccccc';                // Fallback gris
      return {
        color: col,                                              // Borde = relleno (invisible)
        weight: 1.2,                                             // Sella micro-huecos entre polígonos
        opacity: 1,                                              // Borde totalmente opaco
        fillColor: col,                                          // Relleno: color propio de la región
        fillOpacity: 0.75                                        // Sólido y UNIFORME (identidad visual)
      };
    },
    onEachFeature: (f, layer) => {
      const sub   = f.properties._sub;                           // Clave de la subregión
      const meta  = SUBREGIONES_META[sub];                       // Metadatos
      const total = datos[sub] || 0;                             // Total de noticias de la región
      if (!capasPorSub[sub]) capasPorSub[sub] = [];              // Inicializar grupo de la región
      capasPorSub[sub].push(layer);                              // Registrar capa en su región
      layer.bindTooltip(                                         // Tooltip OSCURO discreto
        `<b>${meta ? meta.nombre : sub}</b> · ${total} noticias`,
        { sticky: true, direction: 'top', className: 'radar-tip', offset: [0, -6] }
      );
      // Hover: se ilumina LA REGIÓN COMPLETA (todas sus capas a la vez),
      // no el municipio individual — el usuario percibe una sola pieza.
      layer.on('mouseover', () =>
        (capasPorSub[sub] || []).forEach(l => l.setStyle({ fillOpacity: 0.92 })));
      layer.on('mouseout',  () =>
        (capasPorSub[sub] || []).forEach(l => capaPoligonos && capaPoligonos.resetStyle(l)));
      // Clic en cualquier punto de la región → entrar a sus municipios (nivel 2)
      layer.on('click', () => { if (window.onSubregionClick) window.onSubregionClick(sub); });
    }
  }).addTo(mapa);

  // ── Etiquetas: nombre de cada región en blanco sobre su croquis ───────────
  Object.entries(SUBREGIONES_META).forEach(([id, meta]) => {
    const centro = centroSubregion(id);                          // Centro geográfico
    if (centro) crearEtiqueta(meta.nombre, centro, 12);          // Etiqueta discreta
  });

  // ── Encuadre: SOLO Antioquia, cercano y centrado ──────────────────────────
  // invalidateSize(): Leaflet CACHEA el tamaño del contenedor; si el layout
  // cambió (columnas, alturas), calcula el zoom con medidas viejas y el mapa
  // queda lejísimos. Se fuerza la re-medición ANTES de encuadrar.
  mapa.invalidateSize();
  mapa.flyToBounds(capaPoligonos.getBounds(), { padding: [8, 8], duration: 0.8 });
}

// ================= SECCIÓN: NIVEL 2 — SUBREGIÓN (COROPLETA MUNICIPAL) =================
// id: clave de subregión · munis: { slugMunicipio: total } · noticias: array
function pintarMunicipios(id, munis, nombreSubr, noticias) {
  if (!geoData) { _pendiente = () => pintarMunicipios(id, munis, nombreSubr, noticias); return; }

  limpiarCapas();                                      // Borrar capas anteriores
  nivelActual = 'subregion';                           // Nivel 2 activo
  subrActual  = id;                                    // Subregión actual

  const meta = SUBREGIONES_META[id] || { nombre: id, color: '#888' }; // Metadatos

  actualizarBreadcrumb([                               // Migas: Antioquia › Subregión
    { label: 'Antioquia', activo: false, onclick: 'window.volverAntioquia()' },
    { label: nombreSubr || meta.nombre, activo: true }
  ]);

  // Máximo de noticias en un municipio (para escalar la intensidad de la coropleta)
  const maxTotal = Math.max(1, ...Object.values(munis || {}));

  // Borde oscuro compartido por todos los municipios de la subregión activa:
  // el "croquis" de cada municipio se dibuja en una versión 45% más oscura
  // del color regional, y el relleno queda clarito — como pidió el usuario.
  const bordeOscuro = oscurecerColor(meta.color, 0.55);

  // ── Polígonos: croquis oscuro por municipio + relleno clarito ─────────────
  capaPoligonos = L.geoJSON(geoData, {
    style: f => {
      const esActiva = f.properties._sub === id;       // ¿Pertenece a la subregión?
      if (!esActiva) return {                          // Municipios de OTRAS subregiones
        color: '#ffffff', weight: 0.5,
        fillColor: '#b0bec5', fillOpacity: 0.12        // Gris muy tenue (contexto)
      };
      const total = (munis || {})[f.properties._slug] || 0;      // Noticias del municipio
      // Relleno CLARITO con coropleta suave: sin noticias 0.15 → máximo 0.45
      const intensidad = total > 0 ? 0.22 + 0.23 * (total / maxTotal) : 0.15;
      return {
        color: bordeOscuro,                            // CROQUIS oscuro del municipio
        weight: 1.8,                                   // Trazo visible pero fino
        opacity: 1,                                    // Borde totalmente opaco
        fillColor: meta.color,                         // Color de la subregión
        fillOpacity: intensidad                        // Relleno clarito (más noticias = un poco más)
      };
    },
    onEachFeature: (f, layer) => {
      if (f.properties._sub !== id) return;            // Interactividad solo en la activa
      const total = (munis || {})[f.properties._slug] || 0;      // Total del municipio
      layer.bindTooltip(                               // Tooltip OSCURO discreto
        `<b>${f.properties._nombre}</b> · ${total} noticias`,
        { sticky: true, direction: 'top', className: 'radar-tip', offset: [0, -6] }
      );
      layer.on('mouseover', () => layer.setStyle({ weight: 2.8, fillOpacity: 0.6 })); // Hover
      layer.on('mouseout',  () => capaPoligonos && capaPoligonos.resetStyle(layer)); // Restaurar
      layer.on('click', () => {                        // Clic → nivel 3 (municipio)
        if (window.onMunicipioClick) window.onMunicipioClick(f.properties._nombre, id);
      });
    }
  }).addTo(mapa);

  // ── Etiqueta: nombre de la subregión sobre su territorio ──────────────────
  const centro = centroSubregion(id);                  // Centro geográfico de la región
  if (centro) crearEtiqueta(meta.nombre, centro, 16);  // Título mediano (ej: NORDESTE)

  // Zoom a los límites reales de la subregión (unión de sus municipios)
  const capaSubr = L.geoJSON({                          // GeoJSON temporal solo con la subregión
    type: 'FeatureCollection',
    features: (slugsPorSubregion[id] || []).map(s => featuresPorSlug[s])
  });
  mapa.invalidateSize();                               // Re-medir contenedor (ver nivel 1)
  mapa.flyToBounds(capaSubr.getBounds(), { padding: [24, 24], duration: 0.9 });
}

// ================= SECCIÓN: NIVEL 3 — MUNICIPIO INDIVIDUAL =================
function pintarNoticiasIndividuales(noticias, municipio, subregion) {
  if (!geoData) { _pendiente = () => pintarNoticiasIndividuales(noticias, municipio, subregion); return; }

  limpiarCapas();                                      // Borrar capas anteriores
  nivelActual = 'municipio';                           // Nivel 3 activo

  const meta = SUBREGIONES_META[subregion] || { nombre: subregion, color: '#888' };
  const slug = normalizar(municipio);                  // Slug del municipio pedido
  const f    = featuresPorSlug[slug];                  // Su feature (puede no existir)

  actualizarBreadcrumb([                               // Migas: Antioquia › Subregión › Municipio
    { label: 'Antioquia',  activo: false, onclick: 'window.volverAntioquia()' },
    { label: meta.nombre,  activo: false, onclick: `window.volverSubregion('${subregion}')` },
    { label: f ? f.properties._nombre : municipio, activo: true }
  ]);

  // ── Polígonos: municipio OSCURO protagonista, vecinos clarito ─────────────
  capaPoligonos = L.geoJSON(geoData, {
    style: ft => {
      if (ft.properties._slug === slug) return {       // El municipio protagonista
        color: meta.color, weight: 3,                  // Borde grueso de su color
        fillColor: meta.color, fillOpacity: 0.55       // Relleno oscuro destacado
      };
      if (ft.properties._sub === subregion) return {   // Vecinos de la misma subregión
        color: '#ffffff', weight: 1,
        fillColor: meta.color, fillOpacity: 0.10       // Clarito (contexto de la región)
      };
      return { color:'#ffffff', weight:0.5, fillColor:'#b0bec5', fillOpacity:0.08 }; // Resto del depto
    },
    onEachFeature: (ft, layer) => {
      // Permitir saltar a un municipio vecino haciendo clic en él
      if (ft.properties._sub === subregion && ft.properties._slug !== slug) {
        layer.bindTooltip(`<b>${ft.properties._nombre}</b>`,       // Tooltip oscuro discreto
          { sticky: true, direction: 'top', className: 'radar-tip', offset: [0, -6] });
        layer.on('click', () => { if (window.onMunicipioClick) window.onMunicipioClick(ft.properties._nombre, subregion); });
      }
    }
  }).addTo(mapa);

  // ── Titulito blanco con el nombre del municipio (ej: ANORÍ) ───────────────
  if (f) {
    const centro = L.geoJSON(f).getBounds().getCenter();           // Centro del polígono real
    crearEtiqueta(f.properties._nombre, [centro.lat, centro.lng], 18); // Título grande
  }

  // ── Zoom al municipio (o a la subregión si no se halló el polígono) ───────
  if (f) {
    mapa.invalidateSize();                             // Re-medir contenedor (ver nivel 1)
    mapa.flyToBounds(L.geoJSON(f).getBounds(), { padding: [40, 40], duration: 0.8 });
  }

  if (!noticias || noticias.length === 0) return;      // Sin noticias → solo el croquis

  // ── Tooltip de resumen anclado al polígono protagonista ───────────────────
  const total = noticias.length;                       // Total de noticias
  const cats  = {};                                    // Conteo por categoría
  noticias.forEach(n => { cats[n.categoria] = (cats[n.categoria] || 0) + 1; });

  // Top 3 categorías para el resumen informativo
  const resumenCats = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0,3)
    .map(([c,n]) => `${c}: ${n}`).join(' · ');

  // Al pasar el mouse sobre el municipio se ve el total + top 3 categorías
  capaPoligonos.eachLayer(layer => {
    if (layer.feature && layer.feature.properties._slug === slug) {
      layer.bindTooltip(
        `<b>${f ? f.properties._nombre : municipio}</b> · ${total} noticias<br>
         <span style="opacity:0.8">${resumenCats}</span>`,
        { sticky: true, direction: 'top', className: 'radar-tip', maxWidth: 240, offset: [0, -6] }
      );
    }
  });
}

// ================= SECCIÓN: BREADCRUMB =================
function actualizarBreadcrumb(items) {
  const html = items.map((item, i) => {
    const sep = i > 0 ? '<span class="bc-sep">›</span>' : '';        // Separador entre migas
    if (item.activo) return `${sep}<span class="bc-item activo">${item.label}</span>`; // Actual
    return `${sep}<span class="bc-item" onclick="${item.onclick}" style="cursor:pointer">${item.label}</span>`; // Navegable
  }).join('');
  document.getElementById('breadcrumb').innerHTML = html;            // Render en el DOM
}

// ================= SECCIÓN: FUNCIONES DE BÚSQUEDA (compatibilidad) =================
// Con resultados de búsqueda se pinta igual que el nivel 1 (mismo formato de datos)
function pintarSubregionesPorCategoria(conteo, noticias) {
  pintarSubregiones(conteo, noticias);
}

// Guarda las noticias sin ubicar para el modal correspondiente
function pintarSinUbicar(total, noticias) {
  window._noticiassinUbicar = noticias;
}

// ================= SECCIÓN: NAVEGACIÓN GLOBAL =================
window.volverAntioquia = function() {
  if (Object.keys(datosSubregion).length > 0) {        // Solo si hay datos guardados
    pintarSubregiones(datosSubregion, noticiasSubregion); // Repintar nivel 1
    if (window.onVolverAntioquia) window.onVolverAntioquia(); // Notificar al dashboard
  }
};

window.volverSubregion = function(id) {
  if (window.onSubregionClick) window.onSubregionClick(id); // Delegar al dashboard
};

// ================= SECCIÓN: API PÚBLICA =================
window.MapaRadar = {
  pintarSubregiones,             // Nivel 1: departamento completo
  pintarMunicipios,              // Nivel 2: subregión con coropleta
  pintarNoticiasIndividuales,    // Nivel 3: municipio con titulito y resumen
  pintarSubregionesPorCategoria, // Resultados de búsqueda en el mapa
  pintarSinUbicar,               // Registro de noticias sin municipio
  colorPorTotal: () => COLOR_GENERAL // Compatibilidad con la API anterior
};
