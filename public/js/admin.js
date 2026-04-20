// ================= SECCIÓN: ESTADO ADMIN =================
const AdminState = {
  activo: false,
  token: null,
  noticiaActual: null,
};

// ================= SECCIÓN: ATAJO DE TECLADO =================
// Ctrl + Shift + A abre el login admin
let _keysPressed = {};
document.addEventListener('keydown', e => {
  _keysPressed[e.key] = true;
  if (_keysPressed['Control'] && _keysPressed['Shift'] && _keysPressed['A']) {
    e.preventDefault();
    if (AdminState.activo) {
      salirAdmin();
    } else {
      abrirLoginAdmin();
    }
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
  } catch(e) {
    console.error('[Admin] Error login:', e);
  }
}

// ================= SECCIÓN: MODO ADMIN =================
function activarModoAdmin() {
  AdminState.activo = true;
  // Mostrar banner
  const banner = document.getElementById('banner-admin');
  if (banner) banner.style.display = 'flex';
  // Re-renderizar noticias con botones de edición
  if (typeof renderNoticiasPanel === 'function') renderNoticiasPanel();
  console.log('[Admin] Modo admin activado');
}

function salirAdmin() {
  AdminState.activo = false;
  AdminState.token  = null;
  const banner = document.getElementById('banner-admin');
  if (banner) banner.style.display = 'none';
  if (typeof renderNoticiasPanel === 'function') renderNoticiasPanel();
  console.log('[Admin] Modo admin desactivado');
}

// ================= SECCIÓN: EDITAR NOTICIA =================
function abrirAdminEditar(noticia) {
  if (!AdminState.activo) return;
  AdminState.noticiaActual = noticia;

  const modal = document.getElementById('modal-admin-editar');
  const titulo = document.getElementById('admin-editar-titulo');
  const select = document.getElementById('admin-editar-categoria');

  titulo.textContent = noticia.titulo;
  select.value = noticia.categoria || 'general';

  modal.style.display = 'flex';
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
  if (!noticia || !categoria) return;

  try {
    const res  = await fetch('/api/admin/noticia/categoria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': AdminState.token
      },
      body: JSON.stringify({ id: noticia.id, categoria })
    });
    const data = await res.json();

    if (data.ok) {
      cerrarAdminEditar();
      // Actualizar localmente sin recargar
      noticia.categoria = categoria;
      if (typeof renderNoticiasPanel === 'function') renderNoticiasPanel();
      mostrarToastAdmin(`✓ Categoría cambiada a "${categoria}"`);
    } else {
      alert('Error: ' + data.error);
    }
  } catch(e) {
    console.error('[Admin] Error guardar:', e);
  }
}

async function eliminarNoticia() {
  const noticia = AdminState.noticiaActual;
  if (!noticia) return;
  if (!confirm(`¿Eliminar esta noticia?\n\n"${noticia.titulo.substring(0,80)}..."`)) return;

  try {
    const res  = await fetch('/api/admin/noticia/eliminar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': AdminState.token
      },
      body: JSON.stringify({ id: noticia.id })
    });
    const data = await res.json();

    if (data.ok) {
      cerrarAdminEditar();
      // Eliminar de la lista local
      if (typeof Estado !== 'undefined') {
        Estado.todasNoticiasPanel = Estado.todasNoticiasPanel.filter(n => n.id !== noticia.id);
        renderNoticiasPanel();
      }
      mostrarToastAdmin('🗑 Noticia eliminada');
    } else {
      alert('Error: ' + data.error);
    }
  } catch(e) {
    console.error('[Admin] Error eliminar:', e);
  }
}

// ================= SECCIÓN: TOAST DE CONFIRMACIÓN =================
function mostrarToastAdmin(mensaje) {
  const toast = document.createElement('div');
  toast.textContent = mensaje;
  toast.style.cssText = `
    position:fixed;bottom:70px;right:16px;z-index:99999;
    background:#1b5e20;color:white;padding:10px 18px;
    border-radius:12px;font-size:13px;font-weight:600;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
    animation:fadeInUp 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ================= SECCIÓN: EXPOSICIÓN GLOBAL =================
window.abrirLoginAdmin      = abrirLoginAdmin;
window.cerrarLoginAdmin     = cerrarLoginAdmin;
window.verificarAdminPassword = verificarAdminPassword;
window.salirAdmin           = salirAdmin;
window.abrirAdminEditar     = abrirAdminEditar;
window.cerrarAdminEditar    = cerrarAdminEditar;
window.guardarCambioCategoria = guardarCambioCategoria;
window.eliminarNoticia      = eliminarNoticia;
window.AdminState           = AdminState;
