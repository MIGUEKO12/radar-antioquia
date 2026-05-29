// ================= SECCIÓN: ESTADO GLOBAL =================
const Estado = {
  modo:'antioquia', periodo:'hoy', diasTendencia:7,
  paginaActual:1, totalPaginas:1, noticiasLibre:[],
  subregionActual:null, datosSubregion:null,
  noticiasFiltradasMapa:null, terminoBusqueda:null,
  todasNoticiasPanel:[], noticiasPanel:[],
  paginaPanel:0, filtroCatPanel:'orden_publico',
};

const ITEMS_PANEL      = 16;
const ITEMS_POR_PAGINA = 20;
const $ = id => document.getElementById(id);

// ================= SECCIÓN: INICIALIZACIÓN =================
document.addEventListener('DOMContentLoaded', () => {
  $('fecha-actual').textContent = new Date().toLocaleDateString('es-CO', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  });
  window.onSubregionClick  = entrarSubregion;
  window.onMunicipioClick  = entrarMunicipio;
  window.onVolverAntioquia = () => {
    Estado.subregionActual = null;
    Estado.noticiasFiltradasMapa = null;
    Estado.terminoBusqueda = null;
    ocultarAviso();
    cerrarModal();
    cargarDashboard();
    cargarTendenciaIndep();
  };
  iniciarTooltipOP();
  actualizarSelectMunicipio(''); // Poblar municipios al inicio
  cargarDashboard();
  cargarTendenciaIndep();
  // Verificar noticias nuevas cada 5 minutos SIN recargar la página
  setInterval(verificarNoticiasNuevas, 5 * 60 * 1000);
  const qLibre = $('q-libre');
  if (qLibre) qLibre.addEventListener('keypress', e => { if(e.key==='Enter') ejecutarBusquedaLibre(); });
});

// ================= SECCIÓN: UTILIDADES =================
function mostrarSpinner(visible) { $('spinner').classList.toggle('oculto', !visible); }

function contarCategoriasLocal(noticias) {
  const conteo = {};
  noticias.forEach(n => { conteo[n.categoria] = (conteo[n.categoria]||0)+1; });
  return Object.entries(conteo).map(([categoria,total]) => ({categoria,total})).sort((a,b) => b.total-a.total);
}

// ================= SECCIÓN: TOOLTIP ORDEN PÚBLICO =================
function iniciarTooltipOP() {}
function mostrarTooltipOP(el) {
  const tt = $('tooltip-op'); if (!tt) return;
  const rect = el.getBoundingClientRect();
  tt.style.top  = (rect.bottom + 8) + 'px';
  tt.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
  tt.classList.add('visible');
}
function ocultarTooltipOP() { const tt = $('tooltip-op'); if (tt) tt.classList.remove('visible'); }
window.mostrarTooltipOP = mostrarTooltipOP;
window.ocultarTooltipOP = ocultarTooltipOP;

// ================= SECCIÓN: CARGA DASHBOARD =================
async function cargarDashboard() {
  mostrarSpinner(true);
  try {
    const params = new URLSearchParams({ periodo: Estado.periodo });
    const desde = $('fecha-desde').value;
    const hasta = $('fecha-hasta').value;
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const res  = await fetch(`/api/dashboard?${params}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    actualizarMetricas(data.resumen.porCategoria);
    actualizarMapa(data.mapa, data.recientes, data.resumen.total);
    actualizarClasificacion(data.resumen.porCategoria, data.resumen.total);
    Estado.todasNoticiasPanel = data.recientes;
    Estado._todasSinFiltro    = null; // Resetear copia al cargar datos nuevos
    Estado.paginaPanel        = 0;
    Estado.filtroCatPanel     = 'orden_publico';
    // Activar botón de orden público al cargar
    document.querySelectorAll('.filtro-cat-btn').forEach(b => b.classList.remove('activo'));
    const btnOP = document.querySelector('.filtro-cat-btn[onclick*="orden_publico"]');
    if (btnOP) btnOP.classList.add('activo');
    renderNoticiasPanel();
    $('ultima-actualizacion').textContent =
      'Actualizado: ' + new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    _ultimoTotal = data.resumen.total; // Guardar total para comparar luego
  } catch (err) {
    console.error('[Dashboard]', err);
  } finally {
    mostrarSpinner(false);
  }
}

// ================= SECCIÓN: ACTUALIZACIÓN SILENCIOSA =================
// Actualiza métricas y noticias en el fondo sin tocar filtros ni paginación
let _ultimoTotal = 0;
let _ultimoId    = 0; // ID más reciente que tenemos

async function verificarNoticiasNuevas() {
  if (Estado.modo !== 'antioquia' || Estado.subregionActual) return;
  try {
    const params = new URLSearchParams({ periodo: Estado.periodo });
    const desde = $('fecha-desde').value;
    const hasta = $('fecha-hasta').value;
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const res  = await fetch(`/api/dashboard?${params}`);
    const data = await res.json();
    if (!data.ok) return;

    // Primera carga — solo guardar referencia
    if (_ultimoTotal === 0) {
      _ultimoTotal = data.resumen.total;
      _ultimoId    = data.recientes[0]?.id || 0;
      return;
    }

    const nuevoTotal = data.resumen.total;
    if (nuevoTotal <= _ultimoTotal) return; // Sin cambios

    // Hay noticias nuevas — actualizar silenciosamente
    const nuevas = data.recientes.filter(n => n.id > _ultimoId);

    // 1. Actualizar métricas y clasificación sin tocar filtros
    actualizarMetricas(data.resumen.porCategoria);
    actualizarClasificacion(data.resumen.porCategoria, data.resumen.total);
    actualizarMapa(data.mapa, data.recientes, data.resumen.total);

    // 2. Agregar noticias nuevas al panel sin resetear filtros ni página
    if (nuevas.length > 0) {
      Estado.todasNoticiasPanel = data.recientes;
      // Solo re-renderizar si estamos en página 0 para no interrumpir navegación
      if (Estado.paginaPanel === 0) renderNoticiasPanel();
    }

    // 3. Actualizar hora y referencia
    $('ultima-actualizacion').textContent =
      'Actualizado: ' + new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
    _ultimoTotal = nuevoTotal;
    _ultimoId    = data.recientes[0]?.id || _ultimoId;

    console.log(`[Auto] ${nuevas.length} noticias nuevas agregadas silenciosamente`);
  } catch(e) { console.error('[Verificar]', e); }
}

// ================= SECCIÓN: MAPA =================
function actualizarMapa(subregiones, noticias, total) {
  const datosParaMapa = {};
  subregiones.forEach(s => { datosParaMapa[s.subregion] = s.total; });
  window._totalNoticias = total || 0;
  window.MapaRadar.pintarSubregiones(datosParaMapa, noticias || []);
  const conSubregion = subregiones.reduce((s, m) => s + m.total, 0);
  const sinUbicar    = (total || 0) - conSubregion;
  const btnSin       = $('btn-sin-ubicar');
  if (btnSin) {
    if (sinUbicar > 0) {
      const cont = $('contador-sin-ubicar');
      if (cont) cont.textContent = sinUbicar;
      btnSin.style.display = 'block';
    } else {
      btnSin.style.display = 'none';
    }
  }
}

// ================= SECCIÓN: MÉTRICAS =================
function actualizarMetricas(categorias) {
  const mapa = {};
  categorias.forEach(c => { mapa[c.categoria] = c.total; });
  const total = categorias.reduce((s,c) => s+c.total, 0);
  const conTarjeta = ['orden_publico','desplazamiento','homicidio','feminicidio','mineria','violencia_politica'];
  const totalGeneral = categorias.filter(c => !conTarjeta.includes(c.categoria)).reduce((s,c) => s+c.total, 0);
  if ($('m-total')) $('m-total').textContent = total;
  if ($('m-gen'))   $('m-gen').textContent   = totalGeneral;
  if ($('m-op'))    $('m-op').textContent    = (mapa.orden_publico||0)+(mapa.desplazamiento||0);
  if ($('m-hom'))   $('m-hom').textContent   = mapa.homicidio         || 0;
  if ($('m-fem'))   $('m-fem').textContent   = mapa.feminicidio        || 0;
  if ($('m-min'))   $('m-min').textContent   = mapa.mineria            || 0;
  if ($('m-vp'))    $('m-vp').textContent    = mapa.violencia_politica || 0;
}

// ================= SECCIÓN: CLASIFICACIÓN =================
function actualizarClasificacion(categorias, totalGeneral, contexto = null) {
  if ($('clasificacion-titulo'))
    $('clasificacion-titulo').textContent = contexto ? `Clasificación — ${contexto}` : 'Clasificación de noticias';
  const config = [
    { key:'general',            nombre:'General',            color:'#757575' },
    { key:'orden_publico',      nombre:'Orden público',      color:'#e53935', infoBtn:true },
    { key:'homicidio',          nombre:'Homicidio',          color:'#c62828' },
    { key:'feminicidio',        nombre:'Feminicidio',        color:'#880e4f' },
    { key:'mineria',            nombre:'Minería',            color:'#e65100' },
    { key:'violencia_politica', nombre:'Violencia política', color:'#6a1b9a' },
  ];
  const catMap = {};
  categorias.forEach(c => { catMap[c.categoria] = c.total; });
  catMap.orden_publico = (catMap.orden_publico||0) + (catMap.desplazamiento||0);
  catMap.general = (catMap.general||0) + (catMap.salud||0) + (catMap.infraestructura||0);
  const maxTotal = Math.max(...config.map(c => catMap[c.key]||0), 1);
  if ($('clasificacion-lista')) {
    $('clasificacion-lista').innerHTML = config.map(c => {
      const total = catMap[c.key] || 0;
      const pct   = Math.round((total / maxTotal) * 100);
      const info  = c.infoBtn
        ? `<button class="btn-info-cat" onclick="event.stopPropagation();abrirModalSubcategorias()">i</button>`
        : '';
      return `<div class="clas-row">
        <span class="clas-nombre">${c.nombre}${info}</span>
        <div class="clas-barra-w"><div class="clas-barra" style="width:${pct}%;background:${c.color}"></div></div>
        <span class="clas-count">${total}</span>
      </div>`;
    }).join('');
  }
}

// ================= SECCIÓN: FILTROS PANEL =================
function filtrarPorCategoria(cat) {
  Estado.filtroCatPanel = cat;
  Estado.paginaPanel    = 0;
  document.querySelectorAll('.metrica-card').forEach(c => c.classList.remove('activa-filtro'));
  const idx = ['todas','general','orden_publico','homicidio','feminicidio','mineria','clima','violencia_politica'];
  const i   = idx.indexOf(cat);
  if (i >= 0) { const cards = document.querySelectorAll('.metrica-card'); if (cards[i]) cards[i].classList.add('activa-filtro'); }
  document.querySelectorAll('.filtro-cat-btn').forEach(b => {
    const onc = b.getAttribute('onclick') || '';
    b.classList.toggle('activo', onc.includes(`'${cat}'`));
  });
  renderNoticiasPanel();
}

function filtrarNoticiasPanel(cat, btn) {
  Estado.filtroCatPanel = cat;
  Estado.paginaPanel    = 0;
  document.querySelectorAll('.filtro-cat-btn').forEach(b => b.classList.remove('activo'));
  if (btn) btn.classList.add('activo');
  renderNoticiasPanel();
}

function resetFiltrosBotones() {
  document.querySelectorAll('.filtro-cat-btn').forEach(b => b.classList.remove('activo'));
  const primera = document.querySelector('.filtro-cat-btn');
  if (primera) primera.classList.add('activo');
  Estado.filtroCatPanel = 'todas';
}

// ================= SECCIÓN: PANEL NOTICIAS =================
const BADGES    = { homicidio:'badge-rojo',feminicidio:'badge-rosa',orden_publico:'badge-rojo',desplazamiento:'badge-rojo',mineria:'badge-amber',clima:'badge-azul',salud:'badge-verde',violencia_politica:'badge-morado',general:'badge-gris' };
const NOMBRES_C = { homicidio:'Homicidio',feminicidio:'Feminicidio',orden_publico:'Orden público',desplazamiento:'Desplaz.',mineria:'Minería',clima:'Clima',salud:'Salud',violencia_politica:'Viol. política',general:'General' };

function renderNoticiasPanel() {
  const fuente = Estado.todasNoticiasPanel;
  if (Estado.filtroCatPanel === 'todas') {
    Estado.noticiasPanel = fuente;
  } else if (Estado.filtroCatPanel === 'orden_publico') {
    Estado.noticiasPanel = fuente.filter(n => n.categoria === 'orden_publico' || n.categoria === 'desplazamiento');
  } else {
    Estado.noticiasPanel = fuente.filter(n => n.categoria === Estado.filtroCatPanel);
  }
  const total  = Estado.noticiasPanel.length;
  const inicio = Estado.paginaPanel * ITEMS_PANEL;
  const fin    = Math.min(inicio + ITEMS_PANEL, total);
  const pagina = Estado.noticiasPanel.slice(inicio, fin);
  const maxPag = Math.max(0, Math.ceil(total / ITEMS_PANEL) - 1);
  if ($('not-nav-info')) $('not-nav-info').textContent = total > 0 ? `${inicio+1}–${fin} de ${total}` : 'Sin noticias';
  if ($('btn-not-ant')) $('btn-not-ant').disabled = Estado.paginaPanel <= 0;
  if ($('btn-not-sig')) $('btn-not-sig').disabled = Estado.paginaPanel >= maxPag;
  renderListaNoticias(pagina, $('noticias-lista'));
  renderPaginacionPanel(maxPag);
}

function renderPaginacionPanel(maxPag) {
  const cont = $('noticias-paginacion');
  if (!cont) return;
  if (maxPag <= 0) { cont.innerHTML = ''; return; }
  const p = Estado.paginaPanel;
  let html = `<button class="pag-btn" onclick="event.preventDefault();this.blur();navegarNoticias(-1)" ${p===0?'disabled':''}>← Ant</button>`;
  const ini = Math.max(0, p-2), fin = Math.min(maxPag, p+2);
  if (ini > 0) html += `<button class="pag-btn" onclick="event.preventDefault();this.blur();irPaginaPanel(0)">1</button><span class="pag-sep">…</span>`;
  for (let i=ini; i<=fin; i++) html += `<button class="pag-btn ${i===p?'activo':''}" onclick="event.preventDefault();this.blur();irPaginaPanel(${i})">${i+1}</button>`;
  if (fin < maxPag) html += `<span class="pag-sep">…</span><button class="pag-btn" onclick="event.preventDefault();this.blur();irPaginaPanel(${maxPag})">${maxPag+1}</button>`;
  html += `<button class="pag-btn" onclick="event.preventDefault();this.blur();navegarNoticias(1)" ${p===maxPag?'disabled':''}>Sig →</button>`;
  cont.innerHTML = html;
}

function irPaginaPanel(n) {
  const scrollY = window.scrollY;
  Estado.paginaPanel = n;
  renderNoticiasPanel();
  window.scrollTo({ top: scrollY, behavior: 'instant' });
}
window.irPaginaPanel = irPaginaPanel;

function navegarNoticias(dir) {
  const total  = Estado.noticiasPanel.length;
  const maxPag = Math.max(0, Math.ceil(total / ITEMS_PANEL) - 1);
  const nueva  = Estado.paginaPanel + dir;
  if (nueva < 0 || nueva > maxPag) return;
  const scrollY = window.scrollY;
  Estado.paginaPanel = nueva;
  renderNoticiasPanel();
  window.scrollTo({ top: scrollY, behavior: 'instant' });
}

// ================= SECCIÓN: RENDER LISTA NOTICIAS =================
function renderListaNoticias(noticias, contenedor) {
  if (!contenedor) return;
  if (!noticias || noticias.length === 0) {
    contenedor.innerHTML = '<p style="color:#9e9e9e;font-size:12px;padding:12px 0;grid-column:span 2">Sin noticias para este filtro.</p>';
    return;
  }
  const COLORES_BORDE = {
    homicidio:'#c62828', feminicidio:'#880e4f', orden_publico:'#e53935',
    desplazamiento:'#e53935', mineria:'#e65100', clima:'#1565c0',
    violencia_politica:'#6a1b9a', salud:'#2e7d32', general:'#9e9e9e'
  };
  contenedor.innerHTML = noticias.map(n => {
    const badge   = BADGES[n.categoria]    || 'badge-gris';
    const catNom  = NOMBRES_C[n.categoria] || n.categoria;
    const fecha   = new Date(n.fecha).toLocaleDateString('es-CO', { day:'numeric',month:'short',hour:'2-digit',minute:'2-digit' });
    const muni    = n.municipio ? `<span class="noticia-mun">${n.municipio}</span>` : '';
    const color   = COLORES_BORDE[n.categoria] || '#9e9e9e';
    const score       = n.score || 1;
    const borderWidth = score >= 100 ? '4px' : score >= 50 ? '3px' : '2px';
    // Botón de editar — solo visible en modo admin
    const btnAdmin = window.AdminState?.activo
      ? `<button onclick="event.preventDefault();event.stopPropagation();abrirAdminEditar(${JSON.stringify(n).replace(/"/g,'&quot;')})" style="position:absolute;top:6px;right:6px;background:#1b5e20;color:white;border:none;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer;opacity:0.8;">✏️</button>`
      : '';
    return `<div class="noticia-item" style="border-left-color:${color};border-left-width:${borderWidth};position:relative;">
      ${btnAdmin}
      <div class="noticia-titulo"><a href="${n.link}" target="_blank" rel="noopener">${n.titulo}</a></div>
      <div class="noticia-meta">
        <div class="noticia-meta-izq"><span class="badge ${badge}">${catNom}</span>${muni}</div>
        <span class="noticia-fecha">${fecha}</span>
      </div>
    </div>`;
  }).join('');
}

function actualizarNoticias(noticias, titulo = 'Noticias recientes') {
  if ($('noticias-titulo')) $('noticias-titulo').textContent = titulo;
  Estado.todasNoticiasPanel = noticias;
  Estado.paginaPanel        = 0;
  Estado.filtroCatPanel     = 'todas';
  resetFiltrosBotones();
  renderNoticiasPanel();
}

// ================= SECCIÓN: CAMBIO DE FECHA =================
function onFechaChange() {
  if (Estado.modo === 'antioquia') {
    if (Estado.terminoBusqueda && $('q-antioquia')) {
      $('q-antioquia').value = Estado.terminoBusqueda;
      buscarEnAntioquia();
    } else { cargarDashboard(); }
  } else {
    if ($('q-libre').value.trim()) ejecutarBusquedaLibre();
  }
}

// ================= SECCIÓN: DRILL-DOWN SUBREGIÓN =================
async function entrarSubregion(id) {
  mostrarSpinner(true);
  Estado.subregionActual = id;
  try {
    if (Estado.noticiasFiltradasMapa && Estado.noticiasFiltradasMapa.length > 0) {
      const noticiasSubr = Estado.noticiasFiltradasMapa.filter(n => n.subregion === id);
      const muniMapa = {};
      noticiasSubr.forEach(n => {
        if (n.municipio) {
          const key = n.municipio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
          muniMapa[key] = (muniMapa[key]||0)+1;
        }
      });
      const nombreSubr = id.charAt(0).toUpperCase()+id.slice(1);
      window.MapaRadar.pintarMunicipios(id, muniMapa, nombreSubr, noticiasSubr);
      actualizarNoticias(noticiasSubr, `${nombreSubr} — "${Estado.terminoBusqueda}"`);
      actualizarClasificacion(contarCategoriasLocal(noticiasSubr), noticiasSubr.length, nombreSubr);
      actualizarMetricas(contarCategoriasLocal(noticiasSubr));
      mostrarSpinner(false);
      return;
    }
    const params = new URLSearchParams({ periodo:Estado.periodo });
    const desde  = $('fecha-desde').value;
    const hasta  = $('fecha-hasta').value;
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const res  = await fetch(`/api/mapa/subregion/${id}?${params}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    const muniMapa = {};
    data.municipios.forEach(m => {
      if (m.municipio) {
        const key = m.municipio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        muniMapa[key] = m.total;
      }
    });
    const nombreSubr = data.nombre || id;
    window.MapaRadar.pintarMunicipios(id, muniMapa, nombreSubr, data.noticias);
    actualizarNoticias(data.noticias, `Noticias — ${nombreSubr}`);
    actualizarClasificacion(data.categorias, data.total, nombreSubr);
    actualizarMetricas(data.categorias);
  } catch(err) { console.error('[Subregion]', err); }
  finally { mostrarSpinner(false); }
}

// ================= SECCIÓN: DRILL-DOWN MUNICIPIO =================
async function entrarMunicipio(nombre, subregion) {
  mostrarSpinner(true);
  try {
    let noticias = [];
    if (Estado.noticiasFiltradasMapa && Estado.noticiasFiltradasMapa.length > 0) {
      const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
      noticias = Estado.noticiasFiltradasMapa.filter(n => norm(n.municipio) === norm(nombre) || norm(n.titulo).includes(norm(nombre)));
    } else {
      const params = new URLSearchParams({ municipio:nombre, periodo:Estado.periodo });
      const desde  = $('fecha-desde').value;
      const hasta  = $('fecha-hasta').value;
      if (desde) params.append('desde', desde);
      if (hasta) params.append('hasta', hasta);
      const res  = await fetch(`/api/mapa/municipio?${params}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      noticias = data.noticias;
    }
    window.MapaRadar.pintarNoticiasIndividuales(noticias, nombre, subregion);
    actualizarNoticias(noticias, `Noticias — ${nombre} (${noticias.length})`);
    actualizarClasificacion(contarCategoriasLocal(noticias), noticias.length, nombre);
  } catch(err) { console.error('[Municipio]', err); }
  finally { mostrarSpinner(false); }
}

// ================= SECCIÓN: NORMALIZACIÓN Y BÚSQUEDA INTELIGENTE =================
// Normaliza texto eliminando tildes y poniendo en minúsculas
const normTexto = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Filtra noticias que contengan TODAS las palabras buscadas
// "jericó atentado" = noticias con ambas palabras (sin importar tildes)
function filtrarPorPalabras(noticias, q) {
  if (!q || !q.trim()) return noticias;
  const palabras = normTexto(q).split(/\s+/).filter(p => p.length > 1);
  if (!palabras.length) return noticias;

  // Contar cuántas palabras aparecen en la noticia
  // Busca en título + municipio + subregión para cubrir "tusi medellín"
  const contarHits = n => {
    const texto = normTexto(n.titulo) + ' ' +
                  normTexto(n.municipio  || '') + ' ' +
                  normTexto(n.subregion  || '');
    return palabras.filter(p => texto.includes(p)).length;
  };

  // Intento 1: todas las palabras presentes
  const todas = noticias.filter(n => contarHits(n) === palabras.length);
  if (todas.length > 0) return todas;

  // Intento 2: al menos una palabra, ordenadas por relevancia
  return noticias
    .map(n => ({ n, hits: contarHits(n) }))
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(({ n }) => n);
}

// ================= SECCIÓN: BÚSQUEDA EN ANTIOQUIA =================
async function buscarEnAntioquia() {
  const q          = ($('q-antioquia').value || '').trim();
  const subregion  = ($('filtro-subregion')?.value  || '').toLowerCase();
  const municipio  = ($('filtro-municipio')?.value  || '').toLowerCase();
  const desde      = $('fecha-desde').value;
  const hasta      = $('fecha-hasta').value;

  // Requiere al menos un criterio de búsqueda
  if (!q && !subregion && !municipio) return;

  mostrarSpinner(true);
  Estado.terminoBusqueda = q || null;
  Estado._todasSinFiltro = null;

  try {
    // Construir parámetros para el servidor
    const params = new URLSearchParams();
    params.append('q',    q || '');
    params.append('modo', 'antioquia'); // Filtrar solo noticias de Antioquia
    if (desde)     params.append('desde',     desde);
    if (hasta)     params.append('hasta',     hasta);
    if (subregion) params.append('subregion', subregion);
    if (municipio) params.append('municipio', municipio);

    const res  = await fetch(`/api/noticias/buscar?${params}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);

    // Filtrar localmente con normalización de tildes y palabras individuales
    let filtradas = q ? filtrarPorPalabras(data.noticias, q) : data.noticias;

    // Aplicar filtro de subregión local si viene del selector
    if (subregion) {
      filtradas = filtradas.filter(n =>
        normTexto(n.subregion || '') === normTexto(subregion)
      );
    }

    // Aplicar filtro de municipio local si viene del selector
    if (municipio) {
      filtradas = filtradas.filter(n =>
        normTexto(n.municipio || '') === normTexto(municipio)
      );
    }

    Estado.noticiasFiltradasMapa = filtradas;

    const ubicadas  = filtradas.filter(n => n.subregion && n.subregion !== 'general');
    const sinUbicar = filtradas.filter(n => !n.subregion || n.subregion === 'general');
    const conteoSubregion = {};
    ubicadas.forEach(n => {
      conteoSubregion[n.subregion] = (conteoSubregion[n.subregion] || 0) + 1;
    });

    window.MapaRadar.pintarSubregionesPorCategoria(conteoSubregion, ubicadas);
    if (sinUbicar.length > 0) window.MapaRadar.pintarSinUbicar(sinUbicar.length, sinUbicar);

    // Construir título descriptivo de la búsqueda
    const partes = [];
    if (q)         partes.push(`"${q}"`);
    if (subregion) partes.push(subregion.charAt(0).toUpperCase() + subregion.slice(1));
    if (municipio) partes.push(municipio.charAt(0).toUpperCase() + municipio.slice(1));
    if (desde || hasta) partes.push(`${desde || '...'} → ${hasta || '...'}`);
    const titulo = `Antioquia — ${partes.join(' · ')} (${filtradas.length})`;

    actualizarNoticias(filtradas, titulo);
    actualizarClasificacion(contarCategoriasLocal(filtradas), filtradas.length, partes.join(' · '));
    actualizarMetricas(contarCategoriasLocal(filtradas));
    mostrarAviso(ubicadas.length, sinUbicar.length, sinUbicar);

  } catch(err) { console.error('[BuscarAntioquia]', err); }
  finally { mostrarSpinner(false); }
}



$('q-antioquia') && $('q-antioquia').addEventListener('keypress', e => { if (e.key==='Enter') buscarEnAntioquia(); });

// ================= SECCIÓN: PERÍODO =================
function setPeriodo(periodo, btn) {
  Estado.periodo = periodo;
  document.querySelectorAll('#periodo-pills .pill').forEach(b => b.classList.remove('activo'));
  if (btn) btn.classList.add('activo');
  if ($('fecha-desde')) $('fecha-desde').value = '';
  if ($('fecha-hasta')) $('fecha-hasta').value = '';
  if (Estado.terminoBusqueda && $('q-antioquia')) {
    $('q-antioquia').value = Estado.terminoBusqueda;
    buscarEnAntioquia();
  } else { cargarDashboard(); }
}

// ================= SECCIÓN: AVISO SIN UBICAR =================
function mostrarAviso(ubicadas, sinUbicar, noticias) {
  const aviso = $('aviso-ubicacion'); if (!aviso) return;
  if (sinUbicar > 0) {
    aviso.innerHTML = `<span>${ubicadas} ubicadas en el mapa · <b style="cursor:pointer;text-decoration:underline" onclick="abrirModalSinUbicar()">${sinUbicar} sin municipio — ver todas</b></span>`;
    aviso.style.display = 'flex';
    window._noticiassinUbicar = noticias;
  } else { ocultarAviso(); }
}
function ocultarAviso() { const aviso = $('aviso-ubicacion'); if (aviso) aviso.style.display = 'none'; }

// ================= SECCIÓN: MODAL SIN UBICAR =================
function abrirModalSinUbicar() {
  const noticias = window._noticiassinUbicar || [];
  const html = noticias.map(n => {
    const badge = BADGES[n.categoria]   ||'badge-gris';
    const cat   = NOMBRES_C[n.categoria]||n.categoria;
    const fecha = new Date(n.fecha).toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    return `<div class="modal-noticia-item"><div class="modal-noticia-titulo"><a href="${n.link}" target="_blank" rel="noopener">${n.titulo}</a></div><div class="modal-noticia-meta"><span class="badge ${badge}">${cat}</span><span class="noticia-fecha">${fecha}</span></div></div>`;
  }).join('');
  $('modal-sin-ubicar-count').textContent = `${noticias.length} noticias sin municipio detectado`;
  $('modal-sin-ubicar-lista').innerHTML   = html || '<p style="color:#9e9e9e">Sin noticias.</p>';
  $('modal-sin-ubicar').style.display     = 'flex';
  document.body.style.overflow            = 'hidden';
}
function cerrarModal() {
  const modal = $('modal-sin-ubicar');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}
document.addEventListener('click', e => { if (e.target === $('modal-sin-ubicar')) cerrarModal(); });

// ================= SECCIÓN: MODO LIBRE =================
function setModo(modo) {
  Estado.modo = modo;
  $('btn-antioquia').classList.toggle('activo', modo==='antioquia');
  $('btn-libre').classList.toggle('activo', modo==='libre');
  const esAntioquia = modo === 'antioquia';
  $('seccion-mapa').classList.toggle('oculto',       !esAntioquia);
  $('seccion-graficos').classList.toggle('oculto',   !esAntioquia);
  $('metricas-section').classList.toggle('oculto',   !esAntioquia);
  $('buscador-antioquia').classList.toggle('oculto', !esAntioquia);
  $('filtros-geo').classList.toggle('oculto',        !esAntioquia);
  $('buscador-libre').classList.toggle('oculto',      esAntioquia);
  $('seccion-libre').classList.toggle('oculto',       esAntioquia);
  if (esAntioquia) {
    cargarDashboard();
  } else {
    $('libre-lista').innerHTML      = '<p style="color:#9e9e9e;font-size:13px;padding:20px 0;text-align:center">Ingresa un término y presiona Buscar.</p>';
    $('libre-paginacion').innerHTML = '';
    $('libre-resumen').textContent  = '';
  }
}

// ================= SECCIÓN: BÚSQUEDA LIBRE =================
async function ejecutarBusquedaLibre() {
  const q     = ($('q-libre').value || '').trim();
  const desde = $('fecha-desde').value;
  const hasta = $('fecha-hasta').value;
  if (!q) { $('q-libre').focus(); return; }
  mostrarSpinner(true);
  Estado.paginaActual = 1;
  try {
    const params = new URLSearchParams({ q });
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const res  = await fetch(`/api/noticias/buscar?${params}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);

    // Filtrar con normalización de tildes y palabras individuales
    const filtradas = filtrarPorPalabras(data.noticias, q);

    Estado.noticiasLibre = filtradas;
    Estado.totalPaginas  = Math.ceil(filtradas.length / ITEMS_POR_PAGINA);
    renderPaginaLibre();
    actualizarMetricas(contarCategoriasLocal(filtradas));
  } catch(err) {
    $('libre-lista').innerHTML = '<p style="color:#e53935;padding:20px">Error al buscar.</p>';
  } finally { mostrarSpinner(false); }
}


function renderPaginaLibre() {
  const inicio = (Estado.paginaActual-1)*ITEMS_POR_PAGINA;
  const fin    = inicio+ITEMS_POR_PAGINA;
  const pagina = Estado.noticiasLibre.slice(inicio, fin);
  const total  = Estado.noticiasLibre.length;
  $('libre-resumen').textContent = `${total} noticias — mostrando ${inicio+1}–${Math.min(fin,total)}`;
  $('libre-lista').innerHTML = pagina.map(n => {
    const badge  = BADGES[n.categoria]   ||'badge-gris';
    const cat    = NOMBRES_C[n.categoria]||n.categoria;
    const fecha  = new Date(n.fecha).toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const muni   = n.municipio ? `<span class="noticia-mun">${n.municipio}</span>` : '';
    return `<div class="noticia-libre"><div class="nl-titulo"><a href="${n.link}" target="_blank" rel="noopener">${n.titulo}</a></div><div class="nl-meta"><span class="badge ${badge}">${cat}</span>${muni}<span class="noticia-fecha">${fecha}</span></div></div>`;
  }).join('');
  renderPaginacion();
}

function renderPaginacion() {
  if (Estado.totalPaginas<=1) { $('libre-paginacion').innerHTML=''; return; }
  const p=Estado.paginaActual, max=Estado.totalPaginas;
  let html=`<button class="pag-btn" onclick="irPagina(${p-1})" ${p===1?'disabled':''}>← Ant</button>`;
  const ini=Math.max(1,p-2), fin=Math.min(max,p+2);
  if (ini>1) html+=`<button class="pag-btn" onclick="irPagina(1)">1</button><span class="pag-sep">…</span>`;
  for (let i=ini;i<=fin;i++) html+=`<button class="pag-btn ${i===p?'activo':''}" onclick="irPagina(${i})">${i}</button>`;
  if (fin<max) html+=`<span class="pag-sep">…</span><button class="pag-btn" onclick="irPagina(${max})">${max}</button>`;
  html+=`<button class="pag-btn" onclick="irPagina(${p+1})" ${p===max?'disabled':''}>Sig →</button>`;
  $('libre-paginacion').innerHTML = html;
}

function irPagina(n) {
  if (n<1||n>Estado.totalPaginas) return;
  Estado.paginaActual = n;
  renderPaginaLibre();
}

// ================= SECCIÓN: GRÁFICOS =================
let chartTendencia=null;

// Guardamos los datos de tendencia para usarlos al hacer clic
let _datosTendencia = [];

function actualizarTendencia(datos) {
  const ctx = $('chart-tendencia'); if (!ctx) return;
  _datosTendencia = datos; // Guardar para acceder al hacer clic
  const labels  = datos.map(d => new Date(d.dia+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short'}));
  const valores = datos.map(d => d.total);
  const color   = EstadoTendencia?.color || '#43a047';
  if (chartTendencia) chartTendencia.destroy();
  chartTendencia = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'Noticias',data:valores,borderColor:color,backgroundColor:color+'18',fill:true,tension:0.35,pointRadius:6,pointBackgroundColor:color,borderWidth:2,pointHoverRadius:9 }] },
    options:{
      responsive:true,
      plugins:{ legend:{display:false},
        tooltip:{ callbacks:{ label: ctx => ` ${ctx.parsed.y} noticias — clic para ver` } }
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:11}}},
        y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:11},precision:0}}
      },
      onClick:(e, els) => {
        if (!els.length) return;
        const idx  = els[0].index;
        const dia  = _datosTendencia[idx]?.dia;
        const cat  = EstadoTendencia.categoria;
        if (dia) abrirModalPorDia(dia, cat);
      }
    }
  });
  ctx.style.cursor = 'pointer';
}

// Abrir modal con noticias de un día específico y categoría
async function abrirModalPorDia(dia, categoria) {
  const color  = { todas:'#43a047',general:'#757575',orden_publico:'#e53935',homicidio:'#c62828',feminicidio:'#880e4f',mineria:'#e65100',clima:'#1565c0',violencia_politica:'#6a1b9a' }[categoria] || '#43a047';
  const nombre = { todas:'Todas las categorías',general:'General',orden_publico:'Orden público',homicidio:'Homicidio',feminicidio:'Feminicidio',mineria:'Minería',clima:'Clima',violencia_politica:'Violencia política' }[categoria] || categoria;
  const fechaLabel = new Date(dia+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  $('modal-cat-dot').style.background  = color;
  $('modal-cat-titulo').textContent    = nombre;
  $('modal-cat-subtitulo').textContent = fechaLabel;
  $('modal-cat-lista').innerHTML       = '<p style="text-align:center;padding:40px;color:#9ca3af">Cargando...</p>';
  $('modal-cat-buscador').value        = '';
  $('modal-categoria').style.display  = 'flex';
  document.body.style.overflow        = 'hidden';

  try {
    // El endpoint ahora acepta categoria='todas' para traer todas sin filtro
    const params = new URLSearchParams({ categoria, desde: dia, hasta: dia });
    const res    = await fetch(`/api/noticias/categoria?${params}`);
    const data   = await res.json();
    if (!data.ok) throw new Error(data.error);
    const noticias = data.noticias || [];
    modalState.noticias=noticias; modalState.filtradas=noticias;
    modalState.paginaModal=1; modalState.actual=0; modalState.categoria=categoria; modalState.color=color;
    modalState.totalPaginasM=Math.ceil(noticias.length/ITEMS_MODAL);
    $('modal-cat-subtitulo').textContent=`${noticias.length} noticias · ${fechaLabel}`;
    renderModalLista(); actualizarNavModal();
    setTimeout(()=>$('modal-cat-buscador')?.focus(),100);
  } catch(err) {
    $('modal-cat-lista').innerHTML='<p style="text-align:center;padding:40px;color:#e53935">Error al cargar.</p>';
  }
}
window.abrirModalPorDia = abrirModalPorDia;

const EstadoTendencia = { dias:7, categoria:'todas' };

async function cargarTendenciaIndep() {
  try {
    const params = new URLSearchParams({ dias:EstadoTendencia.dias, categoria:EstadoTendencia.categoria });
    const res  = await fetch(`/api/noticias/tendencia?${params}`);
    const data = await res.json();
    if (!data.ok) return;
    actualizarTendencia(data.tendencia);
  } catch(e) { console.error('[Tendencia]', e); }
}

function setTendenciaIndep(dias, btn) {
  EstadoTendencia.dias = dias;
  document.querySelectorAll('.periodo-pills.small .pill').forEach(b => b.classList.remove('activo'));
  if (btn) btn.classList.add('activo');
  cargarTendenciaIndep();
}

function setTendenciaCategoria(cat, btn) {
  EstadoTendencia.categoria = cat;
  document.querySelectorAll('#tendencia-filtros .filtro-cat-btn').forEach(b => b.classList.remove('activo'));
  if (btn) btn.classList.add('activo');
  EstadoTendencia.color = {
    todas:'#43a047', general:'#9e9e9e', orden_publico:'#e53935',
    homicidio:'#c62828', feminicidio:'#880e4f', mineria:'#e65100',
    violencia_politica:'#6a1b9a'
  }[cat] || '#43a047';
  cargarTendenciaIndep();
}

window.setTendenciaIndep     = setTendenciaIndep;
window.setTendenciaCategoria = setTendenciaCategoria;

// ================= SECCIÓN: IMPACTO MEDIÁTICO (eliminado) =================
function actualizarImpactoConModal() {} // Mantenida por compatibilidad

// ================= SECCIÓN: MODAL CATEGORÍA =================
const ITEMS_MODAL = 10;
const modalState  = { noticias:[],filtradas:[],paginaModal:1,totalPaginasM:1,actual:0,categoria:'',color:'' };
const COLORES_CAT = { homicidio:'#c62828',feminicidio:'#880e4f',orden_publico:'#e53935',desplazamiento:'#d84315',mineria:'#e65100',clima:'#1565c0',salud:'#2e7d32',violencia_politica:'#6a1b9a',general:'#757575' };
const NOMBRES_CAT = { homicidio:'Homicidio',feminicidio:'Feminicidio',orden_publico:'Orden público',desplazamiento:'Desplazamiento',mineria:'Minería',clima:'Clima',salud:'Salud',violencia_politica:'Violencia política',general:'General' };
const BADGES_CAT  = { homicidio:'badge-rojo',feminicidio:'badge-rosa',orden_publico:'badge-rojo',desplazamiento:'badge-rojo',mineria:'badge-amber',clima:'badge-azul',salud:'badge-verde',violencia_politica:'badge-morado',general:'badge-gris' };

async function abrirModalCategoria(categoria) {
  const color  = COLORES_CAT[categoria]||'#757575';
  const nombre = NOMBRES_CAT[categoria]||categoria;
  $('modal-cat-dot').style.background  = color;
  $('modal-cat-titulo').textContent    = nombre;
  $('modal-cat-subtitulo').textContent = 'Cargando...';
  $('modal-cat-lista').innerHTML       = '<p style="text-align:center;padding:40px;color:#9ca3af">Cargando...</p>';
  $('modal-cat-buscador').value        = '';
  $('modal-categoria').style.display  = 'flex';
  document.body.style.overflow        = 'hidden';
  try {
    const params = new URLSearchParams({ categoria, periodo:Estado.periodo });
    const desde  = $('fecha-desde').value;
    const hasta  = $('fecha-hasta').value;
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const res  = await fetch(`/api/noticias/categoria?${params}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    modalState.noticias=data.noticias; modalState.filtradas=data.noticias;
    modalState.paginaModal=1; modalState.actual=0; modalState.categoria=categoria; modalState.color=color;
    modalState.totalPaginasM=Math.ceil(data.noticias.length/ITEMS_MODAL);
    $('modal-cat-subtitulo').textContent=`${data.noticias.length} noticias encontradas`;
    renderModalLista(); actualizarNavModal();
    setTimeout(()=>$('modal-cat-buscador')?.focus(),100);
  } catch(err) { $('modal-cat-lista').innerHTML='<p style="text-align:center;padding:40px;color:#e53935">Error al cargar.</p>'; }
}

function renderModalLista() {
  const lista=$('modal-cat-lista'); if (!lista) return;
  const total=modalState.filtradas.length;
  modalState.totalPaginasM=Math.ceil(total/ITEMS_MODAL);
  if (total===0) { lista.innerHTML='<p style="text-align:center;color:#9ca3af;padding:32px 0">Sin noticias.</p>'; renderPaginacionModal(); return; }
  const inicio=(modalState.paginaModal-1)*ITEMS_MODAL, fin=Math.min(inicio+ITEMS_MODAL,total);
  const pagina=modalState.filtradas.slice(inicio,fin);
  lista.innerHTML=pagina.map((n,i)=>{ const idx=inicio+i,act=idx===modalState.actual;
    const fecha=new Date(n.fecha).toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const muni=n.municipio?`<span class="modal-not-mun">${n.municipio}</span>`:'';
    const badge=BADGES_CAT[n.categoria]||'badge-gris', cat=NOMBRES_CAT[n.categoria]||n.categoria;
    return `<div class="modal-not-item ${act?'activo':''}" id="modal-not-${idx}" onclick="seleccionarNoticia(${idx})">
      <div class="modal-not-numero">${idx+1}</div>
      <div class="modal-not-contenido"><div class="modal-not-titulo">${n.titulo}</div>
      <div class="modal-not-meta"><span class="badge ${badge}">${cat}</span>${muni}<span class="modal-not-fecha">${fecha}</span></div></div>
      <a href="${n.link}" target="_blank" rel="noopener" class="modal-not-abrir" onclick="event.stopPropagation()">Ver ↗</a>
    </div>`;
  }).join('');
  renderPaginacionModal(); lista.scrollTop=0;
}

function renderPaginacionModal() {
  const cont=$('modal-paginacion'); if (!cont) return;
  const p=modalState.paginaModal,max=modalState.totalPaginasM;
  if (max<=1) { cont.innerHTML=''; return; }
  let html=`<button class="nav-btn" onclick="irPaginaModal(${p-1})" ${p===1?'disabled':''}>← Ant</button>`;
  const ini=Math.max(1,p-2),fin=Math.min(max,p+2);
  if (ini>1) html+=`<button class="nav-btn" onclick="irPaginaModal(1)">1</button><span class="pag-sep">…</span>`;
  for (let i=ini;i<=fin;i++) html+=`<button class="nav-btn ${i===p?'activo':''}" onclick="irPaginaModal(${i})">${i}</button>`;
  if (fin<max) html+=`<span class="pag-sep">…</span><button class="nav-btn" onclick="irPaginaModal(${max})">${max}</button>`;
  html+=`<button class="nav-btn" onclick="irPaginaModal(${p+1})" ${p===max?'disabled':''}>Sig →</button>`;
  cont.innerHTML=html;
}

function irPaginaModal(n) { if(n<1||n>modalState.totalPaginasM)return; modalState.paginaModal=n; renderModalLista(); }
function seleccionarNoticia(idx) { modalState.actual=idx; const pag=Math.floor(idx/ITEMS_MODAL)+1; if(pag!==modalState.paginaModal)modalState.paginaModal=pag; renderModalLista(); actualizarNavModal(); }
function irNoticia(idx) { const max=modalState.filtradas.length-1; if(idx<0||idx>max)return; seleccionarNoticia(idx); }
function abrirNoticiaActual() { const n=modalState.filtradas[modalState.actual]; if(n?.link)window.open(n.link,'_blank','noopener'); }

function actualizarNavModal() {
  const total=modalState.filtradas.length,actual=modalState.actual;
  if($('modal-cat-nav-info'))$('modal-cat-nav-info').textContent=total>0?`Noticia ${actual+1} de ${total}`:'Sin resultados';
  if($('btn-primera'))  $('btn-primera').disabled  =actual===0||total===0;
  if($('btn-anterior')) $('btn-anterior').disabled =actual===0||total===0;
  if($('btn-siguiente'))$('btn-siguiente').disabled=actual>=total-1||total===0;
  if($('btn-ultima'))   $('btn-ultima').disabled   =actual>=total-1||total===0;
  if($('btn-abrir-actual'))$('btn-abrir-actual').disabled=total===0;
}

function filtrarModalNoticias(texto) {
  const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  modalState.filtradas=texto.trim()===''?modalState.noticias:modalState.noticias.filter(n=>norm(n.titulo).includes(norm(texto)));
  modalState.actual=0; modalState.paginaModal=1;
  modalState.totalPaginasM=Math.ceil(modalState.filtradas.length/ITEMS_MODAL);
  $('modal-cat-subtitulo').textContent=texto.trim()?`${modalState.filtradas.length} de ${modalState.noticias.length} noticias`:`${modalState.noticias.length} noticias encontradas`;
  renderModalLista(); actualizarNavModal();
}

function cerrarModalCategoria(e) { if(e&&e.target!==$('modal-categoria'))return; $('modal-categoria').style.display='none'; document.body.style.overflow=''; }

document.addEventListener('keydown', e => {
  const modal=$('modal-categoria');
  if(!modal||modal.style.display==='none')return;
  if(e.key==='Escape') cerrarModalCategoria();
  if(e.key==='ArrowRight') irNoticia(modalState.actual+1);
  if(e.key==='ArrowLeft')  irNoticia(modalState.actual-1);
  if(e.key==='Enter'&&document.activeElement?.id!=='modal-cat-buscador') abrirNoticiaActual();
});

// ================= SECCIÓN: MODAL SUBCATEGORÍAS =================
function abrirModalSubcategorias() { const modal=$('modal-subcategorias'); if(modal)modal.style.display='flex'; document.body.style.overflow='hidden'; }
function cerrarModalSubcategorias() { const modal=$('modal-subcategorias'); if(modal)modal.style.display='none'; document.body.style.overflow=''; }
document.addEventListener('click', e => { if(e.target===$('modal-subcategorias'))cerrarModalSubcategorias(); });

// ================= SECCIÓN: FICHA TÉCNICA =================
function toggleFicha() {
  const ficha=$('seccion-ficha'),mapa=$('seccion-mapa'),graficos=$('seccion-graficos'),metricas=$('metricas-section');
  const visible=!ficha.classList.contains('oculto');
  if (visible) {
    ficha.classList.add('oculto');
    if (Estado.modo==='antioquia') { mapa.classList.remove('oculto'); graficos.classList.remove('oculto'); metricas.classList.remove('oculto'); }
  } else {
    ficha.classList.remove('oculto');
    mapa.classList.add('oculto'); graficos.classList.add('oculto'); metricas.classList.add('oculto');
  }
}

// ================= SECCIÓN: VER SIN UBICAR =================
function verSinUbicar() {
  const sinUbicar = Estado.todasNoticiasPanel.filter(n => !n.subregion || n.subregion === 'general');
  actualizarNoticias(sinUbicar, `Sin municipio detectado (${sinUbicar.length})`);
}
window.verSinUbicar = verSinUbicar;

// ================= SECCIÓN: FILTROS GEOGRÁFICOS =================
const MUNICIPIOS_POR_SUBREGION = {
  aburra:    ['medellín','bello','itagüí','envigado','sabaneta','la estrella','caldas','copacabana','girardota','barbosa'],
  uraba:     ['turbo','apartadó','carepa','chigorodó','necoclí','san juan de urabá','arboletes','mutatá','vigía del fuerte','murindó','san pedro de urabá'],
  norte:     ['belmira','briceño','campamento','carolina del príncipe','don matías','entrerríos','gómez plata','guadalupe','ituango','san andrés de cuerquia','san josé de la montaña','san pedro de los milagros','santa rosa de osos','toledo','valdivia','yarumal','angostura'],
  nordeste:  ['amalfi','anorí','cisneros','remedios','san roque','santo domingo','segovia','vegachí','yalí','yolombó'],
  occidente: ['abriaquí','anzá','armenia antioquia','buriticá','caicedo','cañasgordas','dabeiba','ebéjico','frontino','giraldo','heliconia','liborina','olaya','peque','sabanalarga','san jerónimo','santa fe de antioquia','sopetrán','uramita'],
  oriente:   ['el carmen de viboral','rionegro','marinilla','guarne','la ceja','el retiro','la unión','san vicente ferrer','el santuario','cocorná','granada','san carlos','san luis','san rafael','argelia','nariño','abejorral','sonsón','alejandría','concepción','el peñol','guatapé','san francisco'],
  suroeste:  ['amagá','andes','angelópolis','betania','betulia','caramanta','ciudad bolívar','concordia','fredonia','hispania','jardín','jericó','la pintada','montebello','pueblorrico','salgar','santa bárbara','támesis','tarso','titiribí','urrao','valparaíso','venecia'],
  magdalena: ['caracolí','maceo','puerto berrío','puerto nare','puerto triunfo','yondó'],
  bajocauca: ['caucasia','el bagre','nechí','tarazá','zaragoza','cáceres'],
};

// Poblar municipios según subregión seleccionada
function actualizarSelectMunicipio(subregion) {
  const sel = $('filtro-municipio');
  if (!sel) return;
  sel.innerHTML = '<option value="">Todos los municipios</option>';
  const lista = subregion ? (MUNICIPIOS_POR_SUBREGION[subregion] || []) : Object.values(MUNICIPIOS_POR_SUBREGION).flat();
  lista.sort().forEach(m => {
    const op = document.createElement('option');
    op.value = m;
    op.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    sel.appendChild(op);
  });
}

// Cuando cambia subregión o municipio
function onFiltroGeoChange() {
  const subregion = $('filtro-subregion')?.value || '';
  const municipio = $('filtro-municipio')?.value || '';

  // Al cambiar subregión, actualizar lista de municipios y limpiar municipio
  actualizarSelectMunicipio(subregion);

  // Disparar búsqueda combinada
  buscarEnAntioquia();
}

function aplicarFiltroGeo() {
  const subregion = ($('filtro-subregion')?.value || '').toLowerCase();
  const municipio = ($('filtro-municipio')?.value || '').toLowerCase();

  if (!subregion && !municipio) {
    // Sin filtro — mostrar todas
    Estado.todasNoticiasPanel = Estado._todasSinFiltro || Estado.todasNoticiasPanel;
    renderNoticiasPanel();
    return;
  }

  // Guardar copia original si no existe
  if (!Estado._todasSinFiltro) {
    Estado._todasSinFiltro = [...Estado.todasNoticiasPanel];
  }

  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  Estado.todasNoticiasPanel = Estado._todasSinFiltro.filter(n => {
    const nMuni = norm(n.municipio || '');
    const nSubr = norm(n.subregion || '');
    if (municipio && subregion) return nMuni === norm(municipio) && nSubr === norm(subregion);
    if (municipio) return nMuni === norm(municipio);
    if (subregion) return nSubr === norm(subregion);
    return true;
  });

  Estado.paginaPanel = 0;
  renderNoticiasPanel();
}

// ================= SECCIÓN: RESET FILTROS =================
function resetFiltros() {
  if ($('fecha-desde')) $('fecha-desde').value = '';
  if ($('fecha-hasta')) $('fecha-hasta').value = '';
  if ($('q-antioquia')) $('q-antioquia').value = '';
  if ($('q-libre'))     $('q-libre').value     = '';
  Estado.terminoBusqueda       = null;
  Estado.noticiasFiltradasMapa = null;
  Estado._todasSinFiltro       = null;
  if ($('filtro-subregion'))  $('filtro-subregion').value  = '';
  if ($('filtro-municipio'))  { actualizarSelectMunicipio(''); $('filtro-municipio').value = ''; }
  document.querySelectorAll('#periodo-pills .pill').forEach(b => b.classList.remove('activo'));
  const btnHoy = document.querySelector('#periodo-pills .pill');
  if (btnHoy) btnHoy.classList.add('activo');
  Estado.periodo = 'hoy';
  cargarDashboard();
  cargarTendenciaIndep();
}
window.resetFiltros = resetFiltros;

// ================= SECCIÓN: EXPOSICIÓN GLOBAL =================
window.setModo               = setModo;
window.setPeriodo            = setPeriodo;
window.setTendencia          = setTendenciaIndep;
window.ejecutarBusquedaLibre = ejecutarBusquedaLibre;
window.buscarEnAntioquia     = buscarEnAntioquia;
window.irPagina              = irPagina;
window.onFechaChange         = onFechaChange;
window.navegarNoticias       = navegarNoticias;
window.filtrarNoticiasPanel  = filtrarNoticiasPanel;
window.filtrarPorCategoria   = filtrarPorCategoria;
window.abrirModalCategoria   = abrirModalCategoria;
window.cerrarModalCategoria  = cerrarModalCategoria;
window.irNoticia             = irNoticia;
window.irPaginaModal         = irPaginaModal;
window.filtrarModalNoticias  = filtrarModalNoticias;
window.abrirNoticiaActual    = abrirNoticiaActual;
window.seleccionarNoticia    = seleccionarNoticia;
window.abrirModalSinUbicar   = abrirModalSinUbicar;
window.cerrarModal           = cerrarModal;
window.abrirModalSubcategorias  = abrirModalSubcategorias;
window.cerrarModalSubcategorias = cerrarModalSubcategorias;
window.toggleFicha           = toggleFicha;
window.onFiltroGeoChange     = onFiltroGeoChange;
window.actualizarSelectMunicipio = actualizarSelectMunicipio;
