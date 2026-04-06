// ================= SECCIÓN: DEPENDENCIAS =================
const rateLimit = require('express-rate-limit'); // Limitador de peticiones

// ================= SECCIÓN: RATE LIMITER GENERAL =================
// Limita a 100 peticiones por IP cada 15 minutos
// Protege contra scraping abusivo y ataques de fuerza bruta
const limiterGeneral = rateLimit({
  windowMs:        15 * 60 * 1000, // Ventana de 15 minutos en milisegundos
  max:             100,            // Máximo 100 peticiones por ventana
  standardHeaders: true,           // Incluye headers RateLimit-* en la respuesta
  legacyHeaders:   false,          // Desactiva headers X-RateLimit-* obsoletos
  message: {
    ok:    false,
    error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.'
  }
});

// ================= SECCIÓN: RATE LIMITER PARA BÚSQUEDAS =================
// La búsqueda libre llama a Google News — limitamos más estrictamente
// para no ser bloqueados por Google (máx 20 búsquedas por 5 minutos)
const limiterBusqueda = rateLimit({
  windowMs: 5 * 60 * 1000, // Ventana de 5 minutos
  max:      20,            // Máximo 20 búsquedas por ventana
  message: {
    ok:    false,
    error: 'Límite de búsquedas alcanzado. Espera 5 minutos.'
  }
});

// ================= SECCIÓN: MIDDLEWARE DE HEADERS DE SEGURIDAD =================
/**
 * Agrega headers HTTP de seguridad básicos a todas las respuestas.
 * Previene ataques XSS, clickjacking y sniffing de content-type.
 */
function headersSeguridad(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');         // Previene MIME sniffing
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');             // Previene clickjacking
  res.setHeader('X-XSS-Protection', '1; mode=block');         // Activa filtro XSS del navegador
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); // Limita info de referrer
  next(); // Continúa al siguiente middleware
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  limiterGeneral,
  limiterBusqueda,
  headersSeguridad
};
