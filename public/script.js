// CONFIGURACIÓN EMAILJS - DATOS REALES
const EMAILJS_PUBLIC_KEY = 'VaZolVLIPNhPpRJwq'; // Clave pública
const EMAILJS_SERVICE_ID = 'service_ui8gyzj'; // Clave del servicio
const EMAILJS_TEMPLATE_ID = 'template_h759ldq'; // Clave de la plantilla
// Contraseña de administrador
const ADMIN_PASSWORD = 'Alt!plan02025';

// Base de datos actualizada
const firebaseConfig = {
  apiKey: "AIzaSyBMsj-KZnfIF5f-OuALBjLP28rumgpLbsU",
  authDomain: "subasta-9245c.firebaseapp.com",
  projectId: "subasta-9245c",
  storageBucket: "subasta-9245c.firebasestorage.app",
  messagingSenderId: "191632903649",
  appId: "1:191632903649:web:2af689243ae8fa474096a0"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 🔥 ESTILOS ADICIONALES PARA LA CARGA MEJORADA
const estilosAdicionales = `
.loading-products, .error-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  grid-column: 1 / -1;
  background: var(--card);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  margin: 20px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.1);
  border-top: 4px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-products p {
  color: var(--muted);
  font-size: 15px;
  margin: 0;
}

.no-products-icon, .error-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.error-products {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.2);
}

.error-products h3 {
  color: var(--danger);
  margin-bottom: 8px;
}

.error-products p {
  color: var(--muted);
  font-size: 14px;
}

.no-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  grid-column: 1 / -1;
  background: var(--card);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  margin: 20px 0;
}

.no-products h3 {
  color: #f8fafc;
  margin-bottom: 8px;
  font-size: 18px;
}

.no-products p {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
}

/* 🔥 NUEVOS ESTILOS PARA ESTADO VENDIDO */
.status.sold {
  background: #f59e0b;  /* Mismo color naranja que reservado */
  color: white;
}

/* 🔥 ESTILOS PARA BOTONES DEL PANEL ADMIN */
.reserva-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn.info {
  background: #2563eb;
}

.btn.info:hover {
  background: #1d4ed8;
}
`;

// 🔥 REEMPLAZA EL ARRAY DE PRODUCTOS CON ESTO
let productos = [];

// Función para cargar productos desde Firebase
async function cargarProductosDesdeFirebase() {
  try {
    console.log("📦 Cargando productos...");
    
    const snapshot = await db.collection("productos").get();
    
    if (snapshot.empty) {
      console.log("⚠️ No se encontraron productos en la base de datos ");
      productos = [];
      return;
    }
    
    productos = [];
    snapshot.forEach(doc => {
      const productoData = doc.data();
      productos.push({
        nombre: productoData.nombre,
        id: productoData.id,
        descripcion: productoData.descripcion,
        precio: productoData.precio,
        categoria: productoData.categoria,
        img: productoData.img,
        specs: productoData.specs || []
      });
    });
    
    console.log(`✅ ${productos.length} productos cargados desde Firebase`);
    
  } catch (error) {
    console.error("❌ Error cargando productos:", error);
    productos = [];
  }
}

// 🔥 VARIABLES GLOBALES PARA CONTROL DE CARGA
let categoriaActual = localStorage.getItem('categoriaActual') || 'all';
let productosFiltrados = [];
let modoAdminActivo = false;
let cargaEnProgreso = false;
let ultimaCargaId = 0;

// 🔥 FUNCIÓN PARA ENVIAR CORREO CON EMAILJS
async function enviarCorreoConfirmacion(datosReserva, emailDestino) {
  try {
    if (typeof emailjs !== 'undefined' && !emailjs.initiated) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      emailjs.initiated = true;
    }

    const templateParams = {
      to_email: emailDestino,
      nombre_cliente: datosReserva.nombre,
      producto: datosReserva.producto,
      telefono: datosReserva.telefono,
      precio: datosReserva.precio,
      codigo_reserva: datosReserva.codigo,
      fecha: new Date().toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    console.log('📧 Enviando correo con datos:', templateParams);

    const resultado = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
   
    console.log('✅ Correo enviado exitosamente:', resultado);
    return { success: true, data: resultado };
   
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return {
      success: false,
      error: error.text || error.message || 'Error desconocido al enviar correo'
    };
  }
}

// 🔥 ACTUALIZA ESTA FUNCIÓN
function limpiarYReorganizarDatos() {
  console.log("🧹 Verificando integridad de datos locales...");
  
  if (productos.length > 0) {
    const productosUnicos = [];
    const idsVistos = new Set();
    
    productos.forEach(producto => {
      if (!idsVistos.has(producto.id)) {
        idsVistos.add(producto.id);
        productosUnicos.push(producto);
      } else {
        console.warn(`⚠️ Eliminando duplicado local: ${producto.id}`);
      }
    });
    
    productos.length = 0;
    productos.push(...productosUnicos);
    console.log(`✅ Datos locales limpiados. Productos únicos: ${productos.length}`);
  }
}

// 🔥 ACTUALIZA ESTA FUNCIÓN
function verificarIntegridadDatos() {
  console.log("🔍 Verificando integridad de datos...");
  
  if (productos.length === 0) {
    console.log("ℹ️ No hay productos cargados para verificar");
    return;
  }
  
  const ids = productos.map(p => p.id);
  const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
  
  if (duplicados.length > 0) {
    console.warn("⚠️ IDs DUPLICADOS:", duplicados);
  } else {
    console.log("✅ Todos los IDs son únicos");
  }
  
  const categorias = {};
  productos.forEach(p => {
    if (!categorias[p.categoria]) categorias[p.categoria] = 0;
    categorias[p.categoria]++;
  });
  console.log("📊 Productos por categoría:", categorias);
}

// 🔥 FUNCIONES AUXILIARES PARA CATEGORÍAS
function obtenerIconoCategoria(categoria) {
  const icons = {
    'combos': '💻',
    'laptops': '💼',
    'ups': '🔋',
    'all': '📦'
  };
  return icons[categoria] || '📦';
}

function obtenerNombreCategoria(categoria) {
  const nombres = {
    'combos': 'Combo',
    'laptops': 'Laptop',
    'ups': 'UPS'
  };
  return nombres[categoria] || 'Producto';
}

// 🔥 FUNCIÓN PARA CONTAR PRODUCTOS POR CATEGORÍA
function contarProductosPorCategoria() {
  const counts = {
    all: productos.length,
    combos: 0,
    laptops: 0,
    ups: 0
  };

  productos.forEach(producto => {
    if (producto.categoria === 'combos') counts.combos++;
    if (producto.categoria === 'laptops') counts.laptops++;
    if (producto.categoria === 'ups') counts.ups++;
  });

  if (document.getElementById('count-combos')) {
    document.getElementById('count-combos').textContent = counts.combos;
    document.getElementById('count-laptops').textContent = counts.laptops;
    document.getElementById('count-ups').textContent = counts.ups;
  }
}

// 🔥 FUNCIÓN MEJORADA PARA FILTRAR PRODUCTOS
function filtrarProductos(categoria) {
  console.log(`🔍 Filtrando por categoría: ${categoria}`);
 
  ultimaCargaId++;
 
  categoriaActual = categoria;
  localStorage.setItem('categoriaActual', categoria);
 
  productosFiltrados = [];
 
  if (categoria === 'all') {
    productosFiltrados = [...productos];
  } else {
    productosFiltrados = productos.filter(producto => producto.categoria === categoria);
  }
 
  console.log(`📦 Productos después de filtrar: ${productosFiltrados.length}`);
 
  if (document.getElementById('productCount')) {
    document.getElementById('productCount').textContent = productosFiltrados.length;
  }
 
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-category') === categoria) {
      btn.classList.add('active');
    }
  });
 
  cargarProductosConEstado();
}

// 🔥 FUNCIÓN MEJORADA PARA CARGAR PRODUCTOS CON SINCRONIZACIÓN
async function cargarProductosConEstado() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
 
  if (cargaEnProgreso) {
    console.log('⏳ Carga en progreso, ignorando solicitud...');
    return;
  }
 
  const cargaId = ++ultimaCargaId;
  console.log(`🚀 Iniciando carga #${cargaId} para categoría: ${categoriaActual}`);
 
  cargaEnProgreso = true;
 
  try {
    grid.innerHTML = `
      <div class="loading-products">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>
    `;
   
    const productosAMostrar = categoriaActual === 'all' ? productos : productosFiltrados;
   
    console.log(`📦 Productos a mostrar: ${productosAMostrar.length}`);
   
    if (productosAMostrar.length === 0) {
      if (cargaId !== ultimaCargaId) return;
     
      grid.innerHTML = `
        <div class="no-products">
          <div class="no-products-icon">📦</div>
          <h3>No se encontraron productos</h3>
          <p>No hay equipos disponibles en esta categoría.</p>
        </div>
      `;
      return;
    }
   
    await sincronizarLocalStorageConFirebase();
   
    const estadosProductos = await cargarEstadosProductos(productosAMostrar);
   
    if (cargaId !== ultimaCargaId) {
      console.log('❌ Carga cancelada - obsoleta');
      return;
    }
   
    const productosHTML = productosAMostrar.map((p, index) => {
      const estado = estadosProductos[index];
      const reservado = estado === 'reservado';
      const vendido = estado === 'vendido';
     
      let estadoTexto = 'Disponible';
      let estadoClase = 'available';
     
      if (vendido) {
        estadoTexto = 'Vendido';
        estadoClase = 'sold';
      } else if (reservado) {
        estadoTexto = 'Reservado';
        estadoClase = 'solicited';
      }
     
      return `
        <div class="card">
          <div class="img" style="background:url('${p.img}') center/cover; height:160px; border-radius:8px;"></div>
          <div class="card-header">
            <h3>${p.nombre}</h3>
          </div>
          <p>${p.descripcion}</p>
          <div class="price">Q${p.precio.toFixed(2)}</div>
          <div class="status ${estadoClase}">
            ${estadoTexto}
          </div>
          <button class="btn request" data-id="${p.id}" ${reservado || vendido ? 'disabled style="opacity:0.5"' : ''}>
            ${vendido ? 'Producto vendido' : (reservado ? 'Ya reservado' : 'Solicitar este equipo')}
          </button>
        </div>
      `;
    }).join('');
   
    if (cargaId === ultimaCargaId) {
      grid.innerHTML = productosHTML;
      console.log(`✅ Carga #${cargaId} completada - ${productosAMostrar.length} productos`);
    }
   
  } catch (error) {
    console.error(`❌ Error en carga #${cargaId}:`, error);
   
    if (cargaId === ultimaCargaId) {
      grid.innerHTML = `
        <div class="error-products">
          <div class="error-icon">⚠️</div>
          <h3>Error al cargar productos</h3>
          <p>Intenta recargar la página.</p>
        </div>
      `;
    }
  } finally {
    if (cargaId === ultimaCargaId) {
      cargaEnProgreso = false;
    }
  }
}

// 🔥 NUEVA FUNCIÓN: SINCRONIZAR LOCALSTORAGE CON FIREBASE
async function sincronizarLocalStorageConFirebase() {
  try {
    console.log('🔄 Sincronizando localStorage con Firebase...');
   
    const snapshot = await db.collection("reservas")
      .where("estado", "in", ["reservado", "vendido"])
      .get();
   
    const productosFirebase = new Set();
    snapshot.forEach(doc => {
      const reserva = doc.data();
      if (reserva.idProducto) {
        productosFirebase.add(reserva.idProducto);
      }
    });
   
    productos.forEach(producto => {
      const enLocalStorage = localStorage.getItem(producto.id) === 'reservado';
      const enFirebase = productosFirebase.has(producto.id);
     
      if (enLocalStorage && !enFirebase) {
        console.log(`🧹 Limpiando localStorage para ${producto.id}`);
        localStorage.removeItem(producto.id);
        localStorage.removeItem(producto.id + '_code');
        localStorage.removeItem(producto.id + '_datos');
      }
     
      if (enFirebase && !enLocalStorage) {
        console.log(`📝 Actualizando localStorage para ${producto.id}`);
        localStorage.setItem(producto.id, 'reservado');
      }
    });
   
    console.log('✅ Sincronización completada');
   
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
  }
}

// 🔥 FUNCIÓN ACTUALIZADA PARA CARGAR ESTADOS EN LOTE
async function cargarEstadosProductos(productosACargar) {
  try {
    const promesasEstados = productosACargar.map(producto =>
      verificarDisponibilidad(producto.id)
        .then(disponible => {
          const reservadoEnLocal = localStorage.getItem(producto.id) === 'reservado';
          return !disponible || reservadoEnLocal;
        })
        .catch(error => {
          console.error(`Error verificando ${producto.id}:`, error);
          return false;
        })
    );
   
    const estados = await Promise.all(promesasEstados);
   
    const estadosFinales = await Promise.all(
      productosACargar.map(async (producto, index) => {
        const estaReservado = estados[index];
       
        if (estaReservado) {
          try {
            const snapshot = await db.collection("reservas")
              .where("idProducto", "==", producto.id)
              .where("estado", "==", "vendido")
              .get();
           
            return snapshot.empty ? 'reservado' : 'vendido';
          } catch (error) {
            console.error(`Error verificando estado vendido para ${producto.id}:`, error);
            return 'reservado';
          }
        }
       
        return 'disponible';
      })
    );
   
    return estadosFinales;
  } catch (error) {
    console.error('Error cargando estados:', error);
    return productosACargar.map(() => 'disponible');
  }
}

// 🔥 INICIALIZAR FILTROS
function inicializarFiltros() {
  contarProductosPorCategoria();
 
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const categoria = this.getAttribute('data-category');
     
      if (cargaEnProgreso) {
        console.log('⏳ Espera a que termine la carga actual...');
        return;
      }
     
      filtrarProductos(categoria);
    });
  });
 
  setTimeout(() => {
    aplicarCategoriaGuardada();
  }, 100);
}

// 🔥 APLICAR CATEGORÍA GUARDADA
function aplicarCategoriaGuardada() {
  const categoriaGuardada = localStorage.getItem('categoriaActual') || 'all';

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-category') === categoriaGuardada) {
      btn.classList.add('active');
    }
  });
 
  filtrarProductos(categoriaGuardada);
}

// Referencias a elementos del modal detalle
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalClose2 = document.getElementById('modalClose2');
const modalTitle = document.getElementById('modal-title');
const modalSub = document.getElementById('modal-sub');
const modalDesc = document.getElementById('modal-desc');
const modalImg = document.getElementById('modalImg');
const modalSpecs = document.getElementById('modal-specs');
const modalPrice = document.getElementById('modal-price');
const modalStatus = document.getElementById('modal-status');
const modalRequest = document.getElementById('modalRequest');

let selectedProduct = null;

// Mostrar modal detalle cuando se pulsa "Solicitar" en la tarjeta
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('request')) {
    const id = e.target.dataset.id;
    const prod = productos.find(p => p.id === id);
    selectedProduct = prod;

    modalTitle.textContent = prod.nombre;
    modalSub.textContent = prod.id;
    modalDesc.textContent = prod.descripcion;
    modalImg.style.background = `url('${prod.img}') center/cover`;
    modalSpecs.innerHTML = prod.specs.map(s => `<li>${s}</li>`).join('');
    modalPrice.textContent = `Q${prod.precio.toFixed(2)}`;

    try {
      const disponible = await verificarDisponibilidad(prod.id);
      const reservadoEnLocal = localStorage.getItem(prod.id) === 'reservado';
 
      const snapshotVendido = await db.collection("reservas")
        .where("idProducto", "==", prod.id)
        .where("estado", "==", "vendido")
        .get();
 
      const vendido = !snapshotVendido.empty;
      const reservado = (!disponible || reservadoEnLocal) && !vendido;
 
      modalStatus.textContent = vendido ? 'Vendido' : (reservado ? 'Reservado' : 'Disponible');
      modalStatus.className = 'status ' + (vendido ? 'sold' : (reservado ? 'solicited' : 'available'));
      modalRequest.disabled = reservado || vendido;
 
      if (vendido) {
        modalRequest.classList.add('ghost');
        modalRequest.textContent = 'Producto vendido';
      } else if (reservado) {
        modalRequest.classList.add('ghost');
        modalRequest.textContent = 'Equipo reservado';
      } else {
        modalRequest.classList.remove('ghost');
        modalRequest.textContent = 'Solicitar este equipo';
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      modalStatus.textContent = 'Disponible';
      modalStatus.className = 'status available';
      modalRequest.disabled = false;
      modalRequest.classList.remove('ghost');
      modalRequest.textContent = 'Solicitar este equipo';
    }

    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
  }
});

// Cerrar modal
modalClose.onclick = modalClose2.onclick = () => {
  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none';
};

// FORMULARIO DE RESERVA
const formModal = document.createElement('div');
formModal.className = 'form-modal';
formModal.innerHTML = `
  <div class="form-card">
    <h3>Reservar equipo</h3>
    <p id="form-product-name" style="font-size:14px;color:#666;"></p>
    <form id="reserveForm">
      <label>Nombre completo</label>
      <input type="text" id="nombre" required>
      <label>Teléfono</label>
      <input type="tel" id="telefono" required>
      <label>Correo electrónico</label>
      <input type="email" id="email" required>
      <button type="submit">Confirmar reserva</button>
    </form>
  </div>
`;
document.body.appendChild(formModal);

modalRequest.addEventListener('click', () => {
  if (!selectedProduct) return;
  if (localStorage.getItem(selectedProduct.id) === 'reservado') {
    alert('Lo sentimos — este equipo ya fue reservado.');
    modal.style.display = 'none';
    return;
  }
  modal.style.display = 'none';
  document.getElementById('form-product-name').textContent = selectedProduct.nombre;
  document.getElementById('nombre').value = '';
  document.getElementById('telefono').value = '';
  document.getElementById('email').value = '';
  formModal.style.display = 'flex';
});

formModal.addEventListener('click', e => {
  if (e.target === formModal) formModal.style.display = 'none';
});

// 🔥 FUNCIONES FIREBASE
async function reservarEnFirebase(datos) {
  try {
    const docRef = await db.collection("reservas").add({
      producto: datos.producto,
      nombre: datos.nombre,
      telefono: datos.telefono,
      email: datos.email,
      codigo: datos.codigo,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      precio: datos.precio,
      idProducto: datos.idProducto,
      estado: "reservado"
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error Firebase:", error);
    return { success: false, error: error.message };
  }
}

async function verificarDisponibilidad(idProducto) {
  try {
    const snapshot = await db.collection("reservas")
      .where("idProducto", "==", idProducto)
      .where("estado", "in", ["reservado", "vendido"])
      .get();
    return snapshot.empty;
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    return true;
  }
}

// 🔥 FORMULARIO ACTUALIZADO
document.getElementById('reserveForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!nombre || !telefono || !email) {
    alert('Por favor completa todos los campos.');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    alert('Por favor ingresa un correo electrónico válido.');
    return;
  }

  const code = 'UVG-' + Math.floor(100000 + Math.random() * 900000);
  const datosReserva = {
    producto: selectedProduct.nombre,
    nombre: nombre,
    telefono: telefono,
    email: email,
    codigo: code,
    
    precio: selectedProduct.precio,
    idProducto: selectedProduct.id
  };

  const boton = e.target.querySelector('button');
  const textoOriginal = boton.textContent;
  boton.textContent = 'Reservando...';
  boton.disabled = true;

  try {
    const disponible = await verificarDisponibilidad(selectedProduct.id);
   
    if (!disponible) {
      alert('❌ Este equipo ya fue reservado por otra persona.');
      await cargarProductosConEstado();
      formModal.style.display = 'none';
      return;
    }

    const resultado = await reservarEnFirebase(datosReserva);
   
    if (resultado.success) {
      const correoResultado = await enviarCorreoConfirmacion(datosReserva, email);
     
      if (correoResultado.success) {
        alert(`✅ RESERVA EXITOSA!\n\n📧 Se ha enviado un correo de confirmación a: ${email}\n\n🔐 Código de reserva: ${code}\n\nGuarda este código para futuras referencias.`);
      } else {
        alert(`✅ RESERVA EXITOSA!\n\n🔐 Código de reserva: ${code}\n\n⚠️ No se pudo enviar el correo de confirmación, pero tu reserva está registrada.\n\nGuarda este código para futuras referencias.`);
      }

      formModal.style.display = 'none';
      guardarReservaLocal(datosReserva);
      await cargarProductosConEstado();
     
    } else {
      throw new Error(resultado.error);
    }
   
  } catch (error) {
    console.error('Error:', error);
    guardarReservaLocal(datosReserva);
    alert(`✅ RESERVA EXITOSA (modo local)\nCódigo: ${code}\n\nNota: Los datos se guardaron localmente.`);
    formModal.style.display = 'none';
    await cargarProductosConEstado();
  } finally {
    boton.textContent = textoOriginal;
    boton.disabled = false;
  }
});

function guardarReservaLocal(datos) {
  localStorage.setItem(datos.idProducto, 'reservado');
  localStorage.setItem(datos.idProducto + '_code', datos.codigo);
  localStorage.setItem(datos.idProducto + '_datos', JSON.stringify(datos));
}

// PANEL DE ADMINISTRADOR
function toggleModoAdministrador() {
  if (!modoAdminActivo) {
    const password = prompt('Ingrese la contraseña de administrador:');
    if (password === ADMIN_PASSWORD) {
      modoAdminActivo = true;
      const adminBtn = document.getElementById('adminPanel');
      if (adminBtn) {
        adminBtn.textContent = 'Cerrar Panel Admin';
        adminBtn.classList.remove('ghost');
        adminBtn.classList.add('btn');
      }
      mostrarPanelAdministrador();
    } else if (password !== null) {
      alert('Contraseña incorrecta');
    }
  } else {
    cerrarPanelAdmin();
  }
}

async function mostrarPanelAdministrador() {
  const panelAdmin = document.createElement('div');
  panelAdmin.id = 'panelAdmin';
  panelAdmin.innerHTML = `
    <div class="panel-admin-overlay">
      <div class="panel-admin-content">
        <div class="panel-header">
          <h2>🔧 Panel de Administración - Venta UVG</h2>
          <button class="close-panel" onclick="cerrarPanelAdmin()">✕</button>
        </div>
       
        <div class="panel-tabs">
          <button class="tab-btn active" data-tab="reservas">📋 Reservas Activas</button>
          <button class="tab-btn" data-tab="productos">📦 Gestionar Productos</button>
          <button class="tab-btn" data-tab="limpiar">🧹 Limpiar Sistema</button>
        </div>
       
        <div class="tab-content">
          <div id="tab-reservas" class="tab-pane active">
            <h3>Reservas Activas</h3>
            <div id="lista-reservas" class="reservas-list">
              <div class="loading">Cargando reservas...</div>
            </div>
          </div>
         
          <div id="tab-productos" class="tab-pane">
            <h3>Gestionar Estado de Productos</h3>
            <div id="lista-productos" class="productos-list">
              <div class="loading">Cargando productos...</div>
            </div>
          </div>
         
          <div id="tab-limpiar" class="tab-pane">
            <h3>Limpiar Sistema</h3>
            <div class="clean-actions">
              <button class="btn danger" id="limpiarTodo">
                🗑️ Limpiar TODAS las reservas (Firebase)
              </button>
              <p class="warning">⚠️ Esta acción no se puede deshacer. Eliminará todas las reservas de la base de datos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panelAdmin);
 
  await cargarReservasActivas();
  await cargarListaProductos();
 
  configurarTabs();
 
  document.getElementById('limpiarTodo').addEventListener('click', limpiarTodasLasReservas);
}

function cerrarPanelAdmin() {
  const panel = document.getElementById('panelAdmin');
  if (panel) {
    panel.remove();
  }
  modoAdminActivo = false;
 
  const adminBtn = document.getElementById('adminPanel');
  if (adminBtn) {
    adminBtn.textContent = 'Modo Administrador';
    adminBtn.classList.remove('btn');
    adminBtn.classList.add('ghost');
  }
}

async function cargarReservasActivas() {
  try {
    const listaReservas = document.getElementById('lista-reservas');
    listaReservas.innerHTML = '<div class="loading">Cargando reservas...</div>';
   
    const snapshot = await db.collection("reservas")
      .orderBy("fecha", "desc")
      .get();
   
    if (snapshot.empty) {
      listaReservas.innerHTML = '<div class="no-data">No hay reservas activas</div>';
      return;
    }
   
    let html = '';
    snapshot.forEach(doc => {
      const reserva = doc.data();
      const fecha = reserva.fecha ? reserva.fecha.toDate().toLocaleString('es-GT') : 'Fecha no disponible';
     
      html += `
        <div class="reserva-item">
          <div class="reserva-info">
            <strong>${reserva.producto}</strong>
            <div class="reserva-details">
              👤 ${reserva.nombre} | 📧 ${reserva.email} | 📞 ${reserva.telefono}
              | 🔐 ${reserva.codigo} | 📅 ${fecha} | ${reserva.idProducto}
              | <span class="status ${reserva.estado === 'vendido' ? 'sold' : 'solicited'}">
                ${reserva.estado === 'vendido' ? 'Vendido' : 'Reservado'}
              </span>
            </div>
          </div>
          <div class="reserva-actions">
            ${reserva.estado !== 'vendido' ? `
              <button class="btn small success" onclick="marcarComoVendido('${doc.id}', '${reserva.idProducto}')">
                ✅ Marcar como Vendido
              </button>
            ` : ''}
            <button class="btn small danger" onclick="eliminarReserva('${doc.id}', '${reserva.idProducto}')">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      `;
    });
   
    listaReservas.innerHTML = html;
  } catch (error) {
    console.error('Error cargando reservas:', error);
    document.getElementById('lista-reservas').innerHTML = '<div class="error">Error cargando reservas</div>';
  }
}

// 🔥 ACTUALIZA ESTA FUNCIÓN EN EL PANEL ADMIN
async function cargarListaProductos() {
  try {
    const listaProductos = document.getElementById('lista-productos');
    listaProductos.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    const snapshotReservas = await db.collection("reservas").get();
    const productosReservados = new Set();
    
    snapshotReservas.forEach(doc => {
      const reserva = doc.data();
      if (reserva.idProducto) {
        productosReservados.add(reserva.idProducto);
      }
    });
    
    let html = '';
    
    for (const producto of productos) {
      const reservado = productosReservados.has(producto.id);
      const estado = reservado ? 'Reservado' : 'Disponible';
      const claseEstado = reservado ? 'solicited' : 'available';
      
      html += `
        <div class="producto-admin-item">
          <div class="producto-info">
            <strong>${producto.nombre}</strong>
            <div class="producto-details">
              💰 Q${producto.precio} | 🆔 ${producto.id}
              | <span class="status ${claseEstado}">${estado}</span>
            </div>
          </div>
          <div class="producto-actions">
            ${reservado ? `
              <button class="btn small success" onclick="liberarProducto('${producto.id}')">
                ✅ Marcar como Disponible
              </button>
            ` : `
              <button class="btn small warning" onclick="reservarProductoAdmin('${producto.id}')">
                🔒 Marcar como Reservado
              </button>
            `}
          </div>
        </div>
      `;
    }
    
    listaProductos.innerHTML = html;
  } catch (error) {
    console.error('Error cargando productos:', error);
    document.getElementById('lista-productos').innerHTML = '<div class="error">Error cargando productos</div>';
  }
}

async function eliminarReserva(idReserva, idProducto) {
  if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
    try {
      await db.collection("reservas").doc(idReserva).delete();
     
      await sincronizarLocalStorageConFirebase();
     
      await actualizarEstadoProducto(idProducto);
     
      alert('✅ Reserva eliminada correctamente');
      await cargarReservasActivas();
      await cargarListaProductos();
     
    } catch (error) {
      console.error('Error eliminando reserva:', error);
      alert('❌ Error eliminando reserva');
    }
  }
}

async function marcarComoVendido(idReserva, idProducto) {
  if (confirm('¿Estás seguro de que quieres marcar este producto como VENDIDO?\n\nEsta acción cambiará el estado del producto a "Vendido" y no podrá ser reservado nuevamente.')) {
    try {
      await db.collection("reservas").doc(idReserva).update({
        estado: "vendido",
        fechaVendido: firebase.firestore.FieldValue.serverTimestamp()
      });
     
      await actualizarEstadoProducto(idProducto, 'vendido');
     
      alert('✅ Producto marcado como VENDIDO correctamente');
      await cargarReservasActivas();
      await cargarListaProductos();
     
    } catch (error) {
      console.error('Error marcando como vendido:', error);
      alert('❌ Error marcando producto como vendido');
    }
  }
}

async function actualizarEstadoProducto(idProducto, nuevoEstado = 'disponible') {
  if (nuevoEstado === 'disponible') {
    localStorage.removeItem(idProducto);
    localStorage.removeItem(idProducto + '_code');
    localStorage.removeItem(idProducto + '_datos');
  }
 
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
 
  const cards = grid.querySelectorAll('.card');
  cards.forEach(card => {
    const button = card.querySelector('.request');
    const status = card.querySelector('.status');
   
    if (button && button.dataset.id === idProducto) {
      if (nuevoEstado === 'vendido') {
        status.textContent = 'Vendido';
        status.className = 'status sold';
        button.disabled = true;
        button.style.opacity = '0.5';
        button.textContent = 'Producto vendido';
      } else if (nuevoEstado === 'disponible') {
        status.textContent = 'Disponible';
        status.className = 'status available';
        button.disabled = false;
        button.style.opacity = '1';
        button.textContent = 'Solicitar este equipo';
      }
    }
  });
}

async function liberarProducto(idProducto) {
  if (confirm('¿Liberar este producto y marcarlo como disponible?')) {
    try {
      const snapshot = await db.collection("reservas")
        .where("idProducto", "==", idProducto)
        .get();
     
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
     
      await actualizarEstadoProducto(idProducto);
     
      alert('✅ Producto liberado correctamente');
      await cargarListaProductos();
      await cargarProductosConEstado();
     
    } catch (error) {
      console.error('Error liberando producto:', error);
      alert('❌ Error liberando producto');
    }
  }
}

async function reservarProductoAdmin(idProducto) {
  const producto = productos.find(p => p.id === idProducto);
  if (confirm(`¿Marcar "${producto.nombre}" como reservado?`)) {
    try {
      await db.collection("reservas").add({
        producto: producto.nombre,
        nombre: "Reservado por Admin",
        telefono: "N/A",
        email: "admin@uvg.edu.gt",
        codigo: "ADMIN-" + Date.now(),
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        precio: producto.precio,
        idProducto: idProducto,
        estado: "reservado"
      });
     
      alert('✅ Producto marcado como reservado');
      await cargarListaProductos();
      cargarProductosConEstado();
    } catch (error) {
      console.error('Error reservando producto:', error);
      alert('❌ Error reservando producto');
    }
  }
}

async function limpiarTodasLasReservas() {
  if (confirm('⚠️ ¿ESTÁS SEGURO?\n\nEsta acción eliminará TODAS las reservas de la base de datos y no se puede deshacer.')) {
    try {
      const snapshot = await db.collection("reservas").get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
     
      productos.forEach(p => {
        localStorage.removeItem(p.id);
        localStorage.removeItem(p.id + '_code');
        localStorage.removeItem(p.id + '_datos');
      });
     
      await cargarReservasActivas();
      await cargarListaProductos();
      await cargarProductosConEstado();
     
      alert('✅ Todas las reservas han sido eliminadas');
     
    } catch (error) {
      console.error('Error limpiando reservas:', error);
      alert('❌ Error limpiando reservas');
    }
  }
}

function configurarTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
 
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
     
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

function injectarEstilosAdicionales() {
  if (!document.getElementById('estilos-adicionales')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'estilos-adicionales';
    styleSheet.textContent = estilosAdicionales;
    document.head.appendChild(styleSheet);
  }
}

// 🔥 ACTUALIZA ESTA PARTE - INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async function() {
  console.log("🚀 Inicializando aplicación...");
  
  injectarEstilosAdicionales();
  
  // 🔥 CARGAR PRODUCTOS DESDE FIREBASE PRIMERO
  await cargarProductosDesdeFirebase();
  
  limpiarYReorganizarDatos();
  verificarIntegridadDatos();
  
  inicializarFiltros();
  
  const adminBtn = document.getElementById('adminPanel');
  if (adminBtn) {
    adminBtn.addEventListener('click', toggleModoAdministrador);
  }
  
  setTimeout(async () => {
    await sincronizarLocalStorageConFirebase();
  }, 500);
  
  console.log("✅ Aplicación inicializada correctamente");
});