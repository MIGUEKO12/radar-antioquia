// ================= SECCIÓN: ESTADO ADMIN =================
const AdminState = {
  activo: false,
  token: null,
  noticiaActual: null,
};

// Lista de municipios de Antioquia para el selector
const MUNICIPIOS_LISTA = [
  // Aburrá
  'medellín','bello','itagüí','envigado','sabaneta','la estrella','caldas','copacabana','girardota','barbosa',
  // Urabá
  'turbo','apartadó','carepa','chigorodó','necoclí','san juan de urabá','arboletes','mutatá','vigía del fuerte','murindó','san pedro de urabá',
  // Norte
  'belmira','briceño','campamento','carolina del príncipe','don matías','entrerríos','gómez plata','guadalupe','ituango','san andrés de cuerquia','san josé de la montaña','san pedro de los milagros','santa rosa de osos','toledo','valdivia','yarumal','angostura',
  // Nordeste
  'amalfi','anorí','cisneros','remedios','san roque','santo domingo','segovia','vegachí','yalí','yolombó',
  // Occidente
  'abriaquí','anzá','armenia antioquia','buriticá','caicedo','cañasgordas','dabeiba','ebéjico','frontino','giraldo','heliconia','liborina','olaya','peque','sabanalarga','san jerónimo','santa fe de antioquia','sopetrán','uramita',
  // Oriente
  'el carmen de viboral','rionegro','marinilla','guarne','la ceja','el retiro','la unión','san vicente ferrer','el santuario','cocorná','granada','san carlos','san luis','san rafael','argelia','nariño','abejorral','sonsón','alejandría','concepción','el peñol','guatapé','san francisco',
  // Suroeste
  'amagá','andes','angelópolis','betania','betulia','caramanta','ciudad bolívar','concordia','fredonia','hispania','jardín','jericó','la pintada','montebello','pueblorrico','salgar','santa bárbara','támesis','tarso','titiribí','urrao','valparaíso','venecia',
  // Magdalena Medio
  'caracolí','maceo','puerto berrío','puerto nare','puerto triunfo','yondó',
  // Bajo Cauca
  'caucasia','el bagre','nechí','tarazá','zaragoza','cáceres',
];

// ================= SECCIÓN: TOQUE SECRETO EN LOGO (móvil) =================
// 5 toques seguidos en el logo "RA" abre el login admin
let _logoClicks = 0;
let _logoTimer  = null;

document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.header-logo');
  if (!logo) return;
  logo.addEventListener('click', () => {
    _logoClicks++;
    clearTimeout(_logoTimer);
    if (_logoClicks >= 5) {
      _logoClicks = 0;
      if (AdminState.activo) salirAdmin();
      else abrirLoginAdmin();
    } else {
      _logoTimer = setTimeout(() => { _logoClicks = 0; }, 2000);
    }
  });
});

// ================= SECCIÓN: ATAJO DE TECLADO =================
let _keysPressed = {};
document.addEventListener('keydown', e => {
  _keysPressed[e.key] = true;
  if (_keysPressed['Control'] && _keysPressed['Shift'] && _keysPressed['Z']) {
    e.preventDefault();
    if (AdminState.activo) salirAdmin();
    else abrirLoginAdmin();
  }
});
document.addEventListener('keyup', e => { delete _keysPressed[e.key]; });

// ================= SECCIÓN: LOGIN =================
function abrirLoginAdmin() {
  const modal = document.getElementById('modal-admin-login');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('admin-password-input')?.focus(), 100);
  document.getElementById('admin-login-error').style.display = 'none';
  document.getElementById('admin-password-input').value = '';
}

function cerrarLoginAdmin() {
  document.getElementById('modal-admin-login').style.display = 'none';
  document.body.style.overflow = '';
}

async function verificarAdminPassword() {
  const password = document.getElementById('admin-password-input').value;
  if (!password) return;
  try {
    const res  = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.ok) {
      AdminState.activo = true;
      AdminState.token  = data.token;
      cerrarLoginAdmin();
      activarModoAdmin();
    } else {
      document.getElementById('admin-login-error').style.display = 'block';
      document.getElementById('admin-password-input').value = '';
      document.getElementById('admin-password-input').focus();
    }
  } catch(e) { console.error('[Admin] Error login:', e); }
}

// ================= SECCIÓN: MODO ADMIN =================
function activarModoAdmin() {
  AdminState.activo = true;
  const banner = document.getElementById('banner-admin');
  if (banner) banner.style.display = 'flex';
  if (typeof renderNoticiasPanel === 'function') renderNoticiasPanel();
}

function salirAdmin() {
  AdminState.activo = false;
  AdminState.token  = null;
  const banner = document.getElementById('banner-admin');
  if (banner) banner.style.display = 'none';
  if (typeof renderNoticiasPanel === 'function') renderNoticiasPanel();
}

// ================= SECCIÓN: EDITAR NOTICIA =================
function abrirAdminEditar(noticia) {
  if (!AdminState.activo) return;
  AdminState.noticiaActual = noticia;

  document.getElementById('admin-editar-titulo').textContent = noticia.titulo;
  document.getElementById('admin-editar-categoria').value = noticia.categoria || 'general';

  // Poblar selector de municipios
  const selMuni = document.getElementById('admin-editar-municipio');
  selMuni.innerHTML = '<option value="">— Sin municipio —</option>' +
    MUNICIPIOS_LISTA.map(m => `<option value="${m}" ${noticia.municipio === m ? 'selected' : ''}>${m.charAt(0).toUpperCase()+m.slice(1)}</option>`).join('');

  document.getElementById('modal-admin-editar').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarAdminEditar() {
  document.getElementById('modal-admin-editar').style.display = 'none';
  document.body.style.overflow = '';
  AdminState.noticiaActual = null;
}

async function guardarCambioCategoria() {
  const noticia   = AdminState.noticiaActual;
  const categoria = document.getElementById('admin-editar-categoria').value;
  const municipio = document.getElementById('admin-editar-municipio').value;
  if (!noticia || !categoria) return;

  try {
    const res  = await fetch('/api/admin/noticia/categoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': AdminState.token },
      body: JSON.stringify({ id: noticia.id, hash: noticia.hash, categoria, municipio })
    });
    const data = await res.json();
    if (data.ok) {
      cerrarAdminEditar();
      noticia.categoria = categoria;
      if (municipio) noticia.municipio = municipio;
      if (typeof renderNoticiasPanel === 'function') renderNoticiasPanel();
      mostrarToastAdmin(`✓ Guardado y bloqueado para el cron`);
    } else { alert('Error: ' + data.error); }
  } catch(e) { console.error('[Admin] Error guardar:', e); }
}

async function eliminarNoticia() {
  const noticia = AdminState.noticiaActual;
  if (!noticia) return;
  if (!confirm(`¿Eliminar y bloquear esta noticia?\n\nNo volverá a aparecer nunca.\n\n"${noticia.titulo.substring(0,80)}..."`)) return;

  try {
    const res  = await fetch('/api/admin/noticia/eliminar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': AdminState.token },
      body: JSON.stringify({ id: noticia.id, hash: noticia.hash, titulo: noticia.titulo })
    });
    const data = await res.json();
    if (data.ok) {
      cerrarAdminEditar();
      if (typeof Estado !== 'undefined') {
        Estado.todasNoticiasPanel = Estado.todasNoticiasPanel.filter(n => n.id !== noticia.id);
        renderNoticiasPanel();
      }
      mostrarToastAdmin('🗑 Eliminada y bloqueada permanentemente');
    } else { alert('Error: ' + data.error); }
  } catch(e) { console.error('[Admin] Error eliminar:', e); }
}

// ================= SECCIÓN: TOAST =================
function mostrarToastAdmin(mensaje) {
  const toast = document.createElement('div');
  toast.textContent = mensaje;
  toast.style.cssText = `position:fixed;bottom:70px;right:16px;z-index:99999;background:#1b5e20;color:white;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ================= SECCIÓN: EXPOSICIÓN GLOBAL =================
window.abrirLoginAdmin        = abrirLoginAdmin;
window.cerrarLoginAdmin       = cerrarLoginAdmin;
window.verificarAdminPassword = verificarAdminPassword;
window.salirAdmin             = salirAdmin;
window.abrirAdminEditar       = abrirAdminEditar;
window.cerrarAdminEditar      = cerrarAdminEditar;
window.guardarCambioCategoria = guardarCambioCategoria;
window.eliminarNoticia        = eliminarNoticia;
window.AdminState             = AdminState;