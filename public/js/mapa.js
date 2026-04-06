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
  uraba:    [
    { nombre:'Turbo',                  lat:8.09,  lng:-76.73 },
    { nombre:'Apartadó',               lat:7.88,  lng:-76.63 },
    { nombre:'Necoclí',                lat:8.43,  lng:-76.78 },
    { nombre:'Chigorodó',              lat:7.67,  lng:-76.68 },
    { nombre:'Carepa',                 lat:7.76,  lng:-76.65 },
    { nombre:'Arboletes',              lat:8.85,  lng:-76.43 },
    { nombre:'San Juan de Urabá',      lat:8.76,  lng:-76.53 },
    { nombre:'Mutatá',                 lat:7.24,  lng:-76.43 },
    { nombre:'Vigía del Fuerte',       lat:6.59,  lng:-76.88 },
    { nombre:'Murindó',                lat:6.97,  lng:-76.74 },
    { nombre:'San Pedro de Urabá',     lat:8.28,  lng:-76.38 }
  ],
  norte:    [
    { nombre:'Ituango',                lat:7.17,  lng:-75.76 },
    { nombre:'Yarumal',                lat:7.36,  lng:-75.42 },
    { nombre:'Valdivia',               lat:7.13,  lng:-75.43 },
    { nombre:'Santa Rosa de Osos',     lat:6.64,  lng:-75.46 },
    { nombre:'Briceño',                lat:7.29,  lng:-75.56 },
    { nombre:'Campamento',             lat:6.97,  lng:-75.28 },
    { nombre:'Angostura',              lat:6.87,  lng:-75.33 },
    { nombre:'Don Matías',             lat:6.50,  lng:-75.40 },
    { nombre:'Entrerríos',             lat:6.56,  lng:-75.35 },
    { nombre:'Guadalupe',              lat:6.73,  lng:-75.22 },
    { nombre:'San Andrés de Cuerquia', lat:6.59,  lng:-75.54 },
    { nombre:'Toledo',                 lat:6.92,  lng:-75.36 }
  ],
  nordeste: [
    { nombre:'Segovia',                lat:7.08,  lng:-74.70 },
    { nombre:'Remedios',               lat:7.03,  lng:-74.69 },
    { nombre:'Amalfi',                 lat:6.91,  lng:-75.07 },
    { nombre:'Yolombó',                lat:6.60,  lng:-75.02 },
    { nombre:'Anorí',                  lat:7.07,  lng:-75.14 },
    { nombre:'Vegachí',                lat:6.77,  lng:-74.80 },
    { nombre:'Santo Domingo',          lat:6.47,  lng:-75.05 },
    { nombre:'San Roque',              lat:6.47,  lng:-74.97 },
    { nombre:'Cisneros',               lat:6.54,  lng:-75.09 },
    { nombre:'Yalí',                   lat:6.80,  lng:-74.88 }
  ],
  occidente:[
    { nombre:'Santa Fe de Antioquia',  lat:6.55,  lng:-75.83 },
    { nombre:'Dabeiba',                lat:7.00,  lng:-76.26 },
    { nombre:'Frontino',               lat:6.78,  lng:-76.13 },
    { nombre:'Buriticá',               lat:6.72,  lng:-75.92 },
    { nombre:'Cañasgordas',            lat:6.74,  lng:-76.02 },
    { nombre:'Anzá',                   lat:6.32,  lng:-75.87 },
    { nombre:'Ebéjico',                lat:6.32,  lng:-75.75 },
    { nombre:'Heliconia',              lat:6.20,  lng:-75.74 },
    { nombre:'Sopetrán',               lat:6.51,  lng:-75.74 },
    { nombre:'San Jerónimo',           lat:6.47,  lng:-75.72 }
  ],
  aburra:   [
    { nombre:'Medellín',               lat:6.25,  lng:-75.57 },
    { nombre:'Bello',                  lat:6.34,  lng:-75.56 },
    { nombre:'Itagüí',                 lat:6.18,  lng:-75.60 },
    { nombre:'Envigado',               lat:6.17,  lng:-75.59 },
    { nombre:'Sabaneta',               lat:6.15,  lng:-75.62 },
    { nombre:'La Estrella',            lat:6.16,  lng:-75.64 },
    { nombre:'Caldas',                 lat:6.09,  lng:-75.64 },
    { nombre:'Copacabana',             lat:6.35,  lng:-75.51 },
    { nombre:'Girardota',              lat:6.38,  lng:-75.45 },
    { nombre:'Barbosa',                lat:6.44,  lng:-75.33 }
  ],
  oriente:  [
    { nombre:'Rionegro',               lat:6.15,  lng:-75.37 },
    { nombre:'Marinilla',              lat:6.17,  lng:-75.34 },
    { nombre:'El Carmen de Viboral',   lat:6.07,  lng:-75.34 },
    { nombre:'La Ceja',                lat:6.03,  lng:-75.44 },
    { nombre:'Guarne',                 lat:6.28,  lng:-75.44 },
    { nombre:'Sonsón',                 lat:5.71,  lng:-75.31 },
    { nombre:'San Carlos',             lat:6.19,  lng:-74.99 },
    { nombre:'Cocorná',                lat:6.06,  lng:-75.19 },
    { nombre:'El Retiro',              lat:5.96,  lng:-75.50 },
    { nombre:'Guatapé',                lat:6.23,  lng:-75.16 },
    { nombre:'El Peñol',               lat:6.22,  lng:-75.24 },
    { nombre:'San Rafael',             lat:6.30,  lng:-75.03 }
  ],
  suroeste: [
    { nombre:'Andes',                  lat:5.66,  lng:-75.88 },
    { nombre:'Jardín',                 lat:5.60,  lng:-75.82 },
    { nombre:'Ciudad Bolívar',         lat:5.85,  lng:-76.02 },
    { nombre:'Urrao',                  lat:6.32,  lng:-76.15 },
    { nombre:'Salgar',                 lat:5.95,  lng:-75.97 },
    { nombre:'Concordia',              lat:6.04,  lng:-75.90 },
    { nombre:'Fredonia',               lat:5.93,  lng:-75.67 },
    { nombre:'Támesis',                lat:5.67,  lng:-75.71 },
    { nombre:'Jericó',                 lat:5.79,  lng:-75.78 }
  ],
  magdalena:[
    { nombre:'Puerto Berrío',          lat:6.49,  lng:-74.40 },
    { nombre:'Yondó',                  lat:6.82,  lng:-74.44 },
    { nombre:'Puerto Nare',            lat:6.20,  lng:-74.58 },
    { nombre:'Maceo',                  lat:6.55,  lng:-74.78 },
    { nombre:'Puerto Triunfo',         lat:5.88,  lng:-74.73 },
    { nombre:'Caracolí',               lat:6.44,  lng:-74.75 }
  ],
  bajocauca:[
    { nombre:'Caucasia',               lat:7.98,  lng:-75.20 },
    { nombre:'El Bagre',               lat:7.59,  lng:-74.81 },
    { nombre:'Tarazá',                 lat:7.87,  lng:-75.39 },
    { nombre:'Zaragoza',               lat:7.49,  lng:-74.86 },
    { nombre:'Nechí',                  lat:8.09,  lng:-74.77 },
    { nombre:'Cáceres',                lat:7.57,  lng:-75.35 }
  ]
};

// ================= SECCIÓN: ESTADO DEL MAPA =================
let nivelActual    = 'antioquia';
let subrActual     = null;
let marcadores     = [];
let datosSubregion = {};

// ================= SECCIÓN: COLOR POR TOTAL =================
function colorPorTotal(total) {
  if (total > 15) return '#e53935';
  if (total > 4)  return '#fb8c00';
  if (total > 0)  return '#43a047';
  return '#bdbdbd';
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
function pintarSubregiones(datos) {
  limpiarMarcadores();
  nivelActual = 'antioquia';
  subrActual  = null;

  mapa.flyTo([6.7, -75.5], 8, { duration: 0.8 });

  actualizarBreadcrumb([{ label: 'Antioquia', activo: true }]);

  Object.entries(CENTROS_SUBREGION).forEach(([id, info]) => {
    const total  = datos[id] || 0;
    const color  = colorPorTotal(total);
    const icono  = crearIcono(total, color, 36);

    const marker = L.marker([info.lat, info.lng], { icon: icono })
      .addTo(mapa)
      .bindTooltip(`<b>${info.nombre}</b><br>${total} noticias`, {
        permanent: false, direction: 'top'
      })
      .on('click', () => {
        // Llamamos al dashboard para que haga el drill-down
        if (window.onSubregionClick) window.onSubregionClick(id);
      });

    marcadores.push(marker);
  });

  datosSubregion = datos;
}

// ================= SECCIÓN: NIVEL 2 — MUNICIPIOS =================
function pintarMunicipios(id, munis, nombreSubr) {
  limpiarMarcadores();
  nivelActual = 'subregion';
  subrActual  = id;

  const centro = CENTROS_SUBREGION[id];
  mapa.flyTo([centro.lat, centro.lng], 10, { duration: 1.0 });

  // Breadcrumb con botón funcional de regreso
  actualizarBreadcrumb([
    { label: 'Antioquia', activo: false, onclick: 'window.volverAntioquia()' },
    { label: nombreSubr || centro.nombre, activo: true }
  ]);

  const coords = MUNICIPIOS_COORDS[id] || [];

  coords.forEach(muni => {
    // Normalizamos el nombre para buscar en el objeto de conteos
    const key   = muni.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const total = munis[key] || munis[muni.nombre.toLowerCase()] || 0;
    const color = colorPorTotal(total);
    const icono = crearIcono(total, color, 28);

    const marker = L.marker([muni.lat, muni.lng], { icon: icono })
      .addTo(mapa)
      .bindTooltip(`<b>${muni.nombre}</b><br>${total} noticias`, {
        permanent: false, direction: 'top'
      })
      .on('click', () => {
        if (window.onMunicipioClick) window.onMunicipioClick(muni.nombre, id);
      });

    marcadores.push(marker);
  });
}

// ================= SECCIÓN: NIVEL 3 — NOTICIAS INDIVIDUALES =================
// Pinta un punto por cada noticia individual en un municipio
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

  // Un solo marcador grande con el total — limpio y legible
  const total = noticias.length;
  const color = total > 15 ? '#e53935' : total > 4 ? '#fb8c00' : '#43a047';

  const icono = L.divIcon({
    className: '',
    iconSize:  [52, 52],
    iconAnchor:[26, 26],
    html: `<div style="
      width:52px;height:52px;
      background:${color};
      border:3px solid white;
      border-radius:50%;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      cursor:pointer;
    ">
      <span style="font-size:16px;font-weight:700;color:white;line-height:1">${total}</span>
      <span style="font-size:9px;color:rgba(255,255,255,0.85);line-height:1;margin-top:2px">noticias</span>
    </div>`
  });

  // Agrupamos categorías para el tooltip
  const cats = {};
  noticias.forEach(n => { cats[n.categoria] = (cats[n.categoria]||0)+1; });
  const resumenCats = Object.entries(cats)
    .sort((a,b) => b[1]-a[1])
    .slice(0,3)
    .map(([c,n]) => `${c}: ${n}`)
    .join(' · ');

  const marker = L.marker([lat, lng], { icon: icono })
    .addTo(mapa)
    .bindTooltip(`
      <b>${municipio}</b> — ${total} noticias<br>
      <span style="font-size:11px;color:#666">${resumenCats}</span>
    `, { permanent:false, direction:'top', maxWidth:220 });

  marcadores.push(marker);
}

// ================= SECCIÓN: COLOR POR CATEGORÍA =================
function colorPorCategoria(cat) {
  const colores = {
    homicidio:     '#c62828',
    feminicidio:   '#880e4f',
    orden_publico: '#e53935',
    desplazamiento:'#d84315',
    mineria:       '#e65100',
    clima:         '#1565c0',
    salud:         '#2e7d32',
    general:       '#757575'
  };
  return colores[cat] || '#757575';
}

// ================= SECCIÓN: BREADCRUMB =================
function actualizarBreadcrumb(items) {
  const html = items.map((item, i) => {
    const sep = i > 0 ? '<span class="bc-sep">›</span>' : '';
    if (item.activo) {
      return `${sep}<span class="bc-item activo">${item.label}</span>`;
    }
    return `${sep}<span class="bc-item" onclick="${item.onclick}" style="cursor:pointer">${item.label}</span>`;
  }).join('');
  document.getElementById('breadcrumb').innerHTML = html;
}

// ================= SECCIÓN: FUNCIONES PÚBLICAS =================
window.volverAntioquia = function() {
  if (Object.keys(datosSubregion).length > 0) {
    pintarSubregiones(datosSubregion);
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
  colorPorTotal
};
