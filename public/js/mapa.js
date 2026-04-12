// ================= SECCIÓN: CONFIGURACIÓN DEL MAPA =================
const mapa = L.map('mapa', {
  center: [6.7, -75.5],
  zoom: 8,
  zoomControl: true,
  attributionControl: false
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19
}).addTo(mapa);

// ================= SECCIÓN: DATOS GEOGRÁFICOS =================
const CENTROS_SUBREGION = {
  uraba:     { lat: 7.88,  lng: -76.68, nombre: 'Urabá' },
  norte:     { lat: 7.17,  lng: -75.37, nombre: 'Norte' },
  nordeste:  { lat: 6.97,  lng: -74.88, nombre: 'Nordeste' },
  occidente: { lat: 6.53,  lng: -76.05, nombre: 'Occidente' },
  aburra:    { lat: 6.25,  lng: -75.57, nombre: 'Valle de Aburrá' },
  oriente:   { lat: 6.15,  lng: -75.08, nombre: 'Oriente' },
  suroeste:  { lat: 5.80,  lng: -75.85, nombre: 'Suroeste' },
  magdalena: { lat: 6.30,  lng: -74.55, nombre: 'Magdalena Medio' },
  bajocauca: { lat: 7.98,  lng: -75.18, nombre: 'Bajo Cauca' }
};

const MUNICIPIOS_COORDS = {
  bajocauca: [
    { nombre:'Cáceres',               lat:7.57,  lng:-75.35 },
    { nombre:'Caucasia',              lat:7.98,  lng:-75.20 },
    { nombre:'El Bagre',              lat:7.59,  lng:-74.81 },
    { nombre:'Nechí',                 lat:8.09,  lng:-74.77 },
    { nombre:'Tarazá',                lat:7.87,  lng:-75.39 },
    { nombre:'Zaragoza',              lat:7.49,  lng:-74.86 }
  ],
  magdalena: [
    { nombre:'Caracolí',              lat:6.44,  lng:-74.75 },
    { nombre:'Maceo',                 lat:6.55,  lng:-74.78 },
    { nombre:'Puerto Berrío',         lat:6.49,  lng:-74.40 },
    { nombre:'Puerto Nare',           lat:6.20,  lng:-74.58 },
    { nombre:'Puerto Triunfo',        lat:5.88,  lng:-74.73 },
    { nombre:'Yondó',                 lat:6.82,  lng:-74.44 }
  ],
  nordeste: [
    { nombre:'Amalfi',                lat:6.91,  lng:-75.07 },
    { nombre:'Anorí',                 lat:7.07,  lng:-75.14 },
    { nombre:'Cisneros',              lat:6.54,  lng:-75.09 },
    { nombre:'Remedios',              lat:7.03,  lng:-74.69 },
    { nombre:'San Roque',             lat:6.47,  lng:-74.97 },
    { nombre:'Santo Domingo',         lat:6.47,  lng:-75.05 },
    { nombre:'Segovia',               lat:7.08,  lng:-74.70 },
    { nombre:'Vegachí',               lat:6.77,  lng:-74.80 },
    { nombre:'Yalí',                  lat:6.80,  lng:-74.88 },
    { nombre:'Yolombó',               lat:6.60,  lng:-75.02 }
  ],
  norte: [
    { nombre:'Angostura',             lat:6.87,  lng:-75.33 },
    { nombre:'Belmira',               lat:6.61,  lng:-75.66 },
    { nombre:'Briceño',               lat:7.29,  lng:-75.56 },
    { nombre:'Campamento',            lat:6.97,  lng:-75.28 },
    { nombre:'Carolina del Príncipe', lat:6.75,  lng:-75.32 },
    { nombre:'Don Matías',            lat:6.50,  lng:-75.40 },
    { nombre:'Entrerríos',            lat:6.56,  lng:-75.35 },
    { nombre:'Gómez Plata',           lat:6.66,  lng:-75.20 },
    { nombre:'Guadalupe',             lat:6.73,  lng:-75.22 },
    { nombre:'Ituango',               lat:7.17,  lng:-75.76 },
    { nombre:'San Andrés de Cuerquia',lat:6.59,  lng:-75.54 },
    { nombre:'San José de la Montaña',lat:6.84,  lng:-75.68 },
    { nombre:'San Pedro de los Milagros',lat:6.46,lng:-75.57 },
    { nombre:'Santa Rosa de Osos',    lat:6.64,  lng:-75.46 },
    { nombre:'Toledo',                lat:6.92,  lng:-75.36 },
    { nombre:'Valdivia',              lat:7.13,  lng:-75.43 },
    { nombre:'Yarumal',               lat:7.36,  lng:-75.42 }
  ],
  occidente: [
    { nombre:'Abriaquí',              lat:6.65,  lng:-76.27 },
    { nombre:'Santa Fe de Antioquia', lat:6.55,  lng:-75.83 },
    { nombre:'Anzá',                  lat:6.32,  lng:-75.87 },
    { nombre:'Armenia',               lat:6.48,  lng:-75.87 },
    { nombre:'Buriticá',              lat:6.72,  lng:-75.92 },
    { nombre:'Caicedo',               lat:6.40,  lng:-76.00 },
    { nombre:'Cañasgordas',           lat:6.74,  lng:-76.02 },
    { nombre:'Dabeiba',               lat:7.00,  lng:-76.26 },
    { nombre:'Ebéjico',               lat:6.32,  lng:-75.75 },
    { nombre:'Frontino',              lat:6.78,  lng:-76.13 },
    { nombre:'Giraldo',               lat:6.58,  lng:-75.93 },
    { nombre:'Heliconia',             lat:6.20,  lng:-75.74 },
    { nombre:'Liborina',              lat:6.69,  lng:-75.86 },
    { nombre:'Olaya',                 lat:6.59,  lng:-75.78 },
    { nombre:'Peque',                 lat:6.90,  lng:-76.00 },
    { nombre:'Sabanalarga',           lat:6.88,  lng:-75.97 },
    { nombre:'San Jerónimo',          lat:6.47,  lng:-75.72 },
    { nombre:'Sopetrán',              lat:6.51,  lng:-75.74 },
    { nombre:'Uramita',               lat:6.92,  lng:-76.17 }
  ],
  oriente: [
    { nombre:'Abejorral',             lat:5.79,  lng:-75.43 },
    { nombre:'Alejandría',            lat:6.36,  lng:-75.09 },
    { nombre:'Argelia',               lat:5.74,  lng:-75.15 },
    { nombre:'El Carmen de Viboral',  lat:6.07,  lng:-75.34 },
    { nombre:'Cocorná',               lat:6.06,  lng:-75.19 },
    { nombre:'Concepción',            lat:6.39,  lng:-75.27 },
    { nombre:'Granada',               lat:6.15,  lng:-74.99 },
    { nombre:'Guarne',                lat:6.28,  lng:-75.44 },
    { nombre:'Guatapé',               lat:6.23,  lng:-75.16 },
    { nombre:'La Ceja',               lat:6.03,  lng:-75.44 },
    { nombre:'La Unión',              lat:5.98,  lng:-75.37 },
    { nombre:'Marinilla',             lat:6.17,  lng:-75.34 },
    { nombre:'Nariño',                lat:5.84,  lng:-75.17 },
    { nombre:'El Peñol',              lat:6.22,  lng:-75.24 },
    { nombre:'El Retiro',             lat:5.96,  lng:-75.50 },
    { nombre:'Rionegro',              lat:6.15,  lng:-75.37 },
    { nombre:'San Carlos',            lat:6.19,  lng:-74.99 },
    { nombre:'San Francisco',         lat:6.00,  lng:-75.10 },
    { nombre:'San Luis',              lat:6.04,  lng:-74.97 },
    { nombre:'San Rafael',            lat:6.30,  lng:-75.03 },
    { nombre:'San Vicente Ferrer',    lat:6.30,  lng:-75.33 },
    { nombre:'El Santuario',          lat:6.14,  lng:-75.27 },
    { nombre:'Sonsón',                lat:5.71,  lng:-75.31 }
  ],
  suroeste: [
    { nombre:'Amagá',                 lat:6.03,  lng:-75.71 },
    { nombre:'Andes',                 lat:5.66,  lng:-75.88 },
    { nombre:'Angelópolis',           lat:6.10,  lng:-75.71 },
    { nombre:'Betania',               lat:5.77,  lng:-75.97 },
    { nombre:'Betulia',               lat:6.11,  lng:-75.98 },
    { nombre:'Ciudad Bolívar',        lat:5.85,  lng:-76.02 },
    { nombre:'Caramanta',             lat:5.56,  lng:-75.64 },
    { nombre:'Concordia',             lat:6.04,  lng:-75.90 },
    { nombre:'Fredonia',              lat:5.93,  lng:-75.67 },
    { nombre:'Hispania',              lat:5.82,  lng:-75.92 },
    { nombre:'Jardín',                lat:5.60,  lng:-75.82 },
    { nombre:'Jericó',                lat:5.79,  lng:-75.78 },
    { nombre:'La Pintada',            lat:5.75,  lng:-75.61 },
    { nombre:'Montebello',            lat:5.94,  lng:-75.50 },
    { nombre:'Pueblorrico',           lat:5.72,  lng:-75.93 },
    { nombre:'Salgar',                lat:5.95,  lng:-75.97 },
    { nombre:'Santa Bárbara',         lat:5.87,  lng:-75.57 },
    { nombre:'Támesis',               lat:5.67,  lng:-75.71 },
    { nombre:'Tarso',                 lat:5.81,  lng:-75.82 },
    { nombre:'Titiribí',              lat:6.07,  lng:-75.79 },
    { nombre:'Urrao',                 lat:6.32,  lng:-76.15 },
    { nombre:'Valparaíso',            lat:5.73,  lng:-75.65 },
    { nombre:'Venecia',               lat:5.96,  lng:-75.77 }
  ],
  uraba: [
    { nombre:'Apartadó',              lat:7.88,  lng:-76.63 },
    { nombre:'Arboletes',             lat:8.85,  lng:-76.43 },
    { nombre:'Carepa',                lat:7.76,  lng:-76.65 },
    { nombre:'Chigorodó',             lat:7.67,  lng:-76.68 },
    { nombre:'Murindó',               lat:6.97,  lng:-76.74 },
    { nombre:'Mutatá',                lat:7.24,  lng:-76.43 },
    { nombre:'Necoclí',               lat:8.43,  lng:-76.78 },
    { nombre:'San Juan de Urabá',     lat:8.76,  lng:-76.53 },
    { nombre:'San Pedro de Urabá',    lat:8.28,  lng:-76.38 },
    { nombre:'Turbo',                 lat:8.09,  lng:-76.73 },
    { nombre:'Vigía del Fuerte',      lat:6.59,  lng:-76.88 }
  ],
  aburra: [
    { nombre:'Medellín',              lat:6.25,  lng:-75.57 },
    { nombre:'Barbosa',               lat:6.44,  lng:-75.33 },
    { nombre:'Bello',                 lat:6.34,  lng:-75.56 },
    { nombre:'Caldas',                lat:6.09,  lng:-75.64 },
    { nombre:'Copacabana',            lat:6.35,  lng:-75.51 },
    { nombre:'Envigado',              lat:6.17,  lng:-75.59 },
    { nombre:'Girardota',             lat:6.38,  lng:-75.45 },
    { nombre:'Itagüí',                lat:6.18,  lng:-75.60 },
    { nombre:'La Estrella',           lat:6.16,  lng:-75.64 },
    { nombre:'Sabaneta',              lat:6.15,  lng:-75.62 }
  ]
};

// ================= SECCIÓN: ESTADO DEL MAPA =================
let nivelActual    = 'antioquia';
let subrActual     = null;
let marcadores     = [];
let datosSubregion = {};
let noticiasSubregion = {};

// ================= SECCIÓN: COLORES POR CATEGORÍA =================
const COLOR_HOMICIDIO    = '#e57373';
const COLOR_ORDEN        = '#c62828';
const COLOR_GENERAL      = '#81c784';
const COLOR_SIN_NOTICIAS = '#bdbdbd';
const COLOR_SIN_UBICAR   = '#78909c';

function colorPorCategorias(cats) {
  if (!cats || Object.keys(cats).length === 0) return COLOR_SIN_NOTICIAS;
  if ((cats.homicidio || 0) > 0 || (cats.feminicidio || 0) > 0) return COLOR_HOMICIDIO;
  if ((cats.orden_publico || 0) > 0 || (cats.desplazamiento || 0) > 0) return COLOR_ORDEN;
  const total = Object.values(cats).reduce((s, v) => s + v, 0);
  if (total > 0) return COLOR_GENERAL;
  return COLOR_SIN_NOTICIAS;
}

// ================= SECCIÓN: CREAR ÍCONO =================
function crearIcono(total, color, tamanio = 32) {
  const fontSize = tamanio < 28 ? '10' : '12';
  return L.divIcon({
    className: '',
    iconSize:  [tamanio, tamanio],
    iconAnchor:[tamanio/2, tamanio/2],
    html: `<div style="
      width:${tamanio}px;height:${tamanio}px;
      background:${color};border:2px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}px;font-weight:700;color:white;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;
    ">${total}</div>`
  });
}

// ================= SECCIÓN: LIMPIAR MARCADORES =================
function limpiarMarcadores() {
  marcadores.forEach(m => mapa.removeLayer(m));
  marcadores = [];
}

// ================= SECCIÓN: NIVEL 1 — SUBREGIONES =================
function pintarSubregiones(datos, noticias) {
  limpiarMarcadores();
  nivelActual = 'antioquia';
  subrActual  = null;

  mapa.flyTo([6.7, -75.5], 8, { duration: 0.8 });
  actualizarBreadcrumb([{ label: 'Antioquia', activo: true }]);

  const catsPorSubregion = {};
  if (noticias && noticias.length > 0) {
    noticias.forEach(n => {
      if (!n.subregion || n.subregion === 'general') return;
      if (!catsPorSubregion[n.subregion]) catsPorSubregion[n.subregion] = {};
      catsPorSubregion[n.subregion][n.categoria] =
        (catsPorSubregion[n.subregion][n.categoria] || 0) + 1;
    });
  }

  Object.entries(CENTROS_SUBREGION).forEach(([id, info]) => {
    const total = datos[id] || 0;
    const cats  = catsPorSubregion[id] || {};
    const color = total > 0 ? colorPorCategorias(cats) : COLOR_SIN_NOTICIAS;
    const icono = crearIcono(total, color, 36);

    const marker = L.marker([info.lat, info.lng], { icon: icono })
      .addTo(mapa)
      .bindTooltip(`<b>${info.nombre}</b><br>${total} noticias`, { permanent:false, direction:'top' })
      .on('click', () => { if (window.onSubregionClick) window.onSubregionClick(id); });

    marcadores.push(marker);
  });

  datosSubregion    = datos;
  noticiasSubregion = noticias || [];
}

// ================= SECCIÓN: NIVEL 2 — MUNICIPIOS =================
function pintarMunicipios(id, munis, nombreSubr, noticias) {
  limpiarMarcadores();
  nivelActual = 'subregion';
  subrActual  = id;

  const centro = CENTROS_SUBREGION[id];
  mapa.flyTo([centro.lat, centro.lng], 10, { duration: 1.0 });

  actualizarBreadcrumb([
    { label: 'Antioquia', activo: false, onclick: 'window.volverAntioquia()' },
    { label: nombreSubr || centro.nombre, activo: true }
  ]);

  const coords = MUNICIPIOS_COORDS[id] || [];
  const norm   = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

  const catsPorMuni = {};
  if (noticias && noticias.length > 0) {
    noticias.forEach(n => {
      if (!n.municipio) return;
      const key = norm(n.municipio);
      if (!catsPorMuni[key]) catsPorMuni[key] = {};
      catsPorMuni[key][n.categoria] = (catsPorMuni[key][n.categoria] || 0) + 1;
    });
  }

  coords.forEach(muni => {
    const munNorm = norm(muni.nombre);
    let total = munis[munNorm] || munis[muni.nombre.toLowerCase()] || 0;
    if (!total) {
      const entrada = Object.entries(munis).find(([k]) => norm(k) === munNorm);
      if (entrada) total = entrada[1];
    }
    const cats  = catsPorMuni[munNorm] || {};
    const color = total > 0 ? colorPorCategorias(cats) : COLOR_SIN_NOTICIAS;
    const icono = crearIcono(total, color, 28);

    const marker = L.marker([muni.lat, muni.lng], { icon: icono })
      .addTo(mapa)
      .bindTooltip(`<b>${muni.nombre}</b><br>${total} noticias`, { permanent:false, direction:'top' })
      .on('click', () => { if (window.onMunicipioClick) window.onMunicipioClick(muni.nombre, id); });

    marcadores.push(marker);
  });
}

// ================= SECCIÓN: NIVEL 3 — NOTICIAS INDIVIDUALES =================
function pintarNoticiasIndividuales(noticias, municipio, subregion) {
  limpiarMarcadores();

  const centro    = CENTROS_SUBREGION[subregion];
  const coordsMun = (MUNICIPIOS_COORDS[subregion] || [])
    .find(m => m.nombre.toLowerCase() === municipio.toLowerCase());

  const lat = coordsMun ? coordsMun.lat : centro.lat;
  const lng = coordsMun ? coordsMun.lng : centro.lng;

  mapa.flyTo([lat, lng], 13, { duration: 0.8 });

  actualizarBreadcrumb([
    { label:'Antioquia',   activo:false, onclick:'window.volverAntioquia()' },
    { label:centro.nombre, activo:false, onclick:`window.volverSubregion('${subregion}')` },
    { label:municipio,     activo:true }
  ]);

  if (noticias.length === 0) return;

  const total = noticias.length;
  const cats  = {};
  noticias.forEach(n => { cats[n.categoria] = (cats[n.categoria] || 0) + 1; });
  const color = colorPorCategorias(cats);

  const icono = L.divIcon({
    className:'', iconSize:[52,52], iconAnchor:[26,26],
    html:`<div style="width:52px;height:52px;background:${color};border:3px solid white;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);cursor:pointer;">
      <span style="font-size:16px;font-weight:700;color:white;line-height:1">${total}</span>
      <span style="font-size:9px;color:rgba(255,255,255,0.85);line-height:1;margin-top:2px">noticias</span>
    </div>`
  });

  const resumenCats = Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,n])=>`${c}: ${n}`).join(' · ');

  const marker = L.marker([lat,lng],{icon:icono}).addTo(mapa)
    .bindTooltip(`<b>${municipio}</b> — ${total} noticias<br><span style="font-size:11px;color:#666">${resumenCats}</span>`,
    {permanent:false,direction:'top',maxWidth:220});

  marcadores.push(marker);
}

// ================= SECCIÓN: BREADCRUMB =================
function actualizarBreadcrumb(items) {
  const html = items.map((item, i) => {
    const sep = i > 0 ? '<span class="bc-sep">›</span>' : '';
    if (item.activo) return `${sep}<span class="bc-item activo">${item.label}</span>`;
    return `${sep}<span class="bc-item" onclick="${item.onclick}" style="cursor:pointer">${item.label}</span>`;
  }).join('');
  document.getElementById('breadcrumb').innerHTML = html;
}

// ================= SECCIÓN: FUNCIONES BÚSQUEDA =================
function pintarSubregionesPorCategoria(conteo, noticias) {
  pintarSubregiones(conteo, noticias);
}

function pintarSinUbicar(total, noticias) {
  window._noticiassinUbicar = noticias;
}

// ================= SECCIÓN: FUNCIONES PÚBLICAS =================
window.volverAntioquia = function() {
  if (Object.keys(datosSubregion).length > 0) {
    pintarSubregiones(datosSubregion, noticiasSubregion);
    if (window.onVolverAntioquia) window.onVolverAntioquia();
  }
};

window.volverSubregion = function(id) {
  if (window.onSubregionClick) window.onSubregionClick(id);
};

window.MapaRadar = {
  pintarSubregiones,
  pintarMunicipios,
  pintarNoticiasIndividuales,
  pintarSubregionesPorCategoria,
  pintarSinUbicar,
  colorPorTotal: () => COLOR_GENERAL
};