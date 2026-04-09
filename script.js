const API_URL = '/api';

// Mobile menu toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Smooth scroll for navigation links - SOLO PARA ENLACES DEL MENU DE NAVEGACION
// Seleccionar específicamente los enlaces del menú que apuntan a secciones internas
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Solo procesar si es un enlace interno (empieza con #)
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href;
            if (targetId && targetId !== '#') {
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    if (navMenu && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                    }
                }
            }
        }
    });
});

// Cotización form
const form = document.getElementById('cotizacionForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const m2 = document.getElementById('m2').value;
        const ambientes = document.getElementById('ambientes').value;
        const banos = document.getElementById('banos').value;
        const amoblado = document.querySelector('input[name="amoblado"]:checked')?.value;
        const mascota = document.querySelector('input[name="mascota"]:checked')?.value;
        const tipoLimpieza = document.querySelector('input[name="tipoLimpieza"]:checked')?.value;
        const accesorios = document.querySelector('input[name="accesorios"]:checked')?.value;
        
        // Validaciones
        if (!m2 || !ambientes || !amoblado || !tipoLimpieza || !accesorios) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }
        
        if (parseFloat(m2) < 40) {
            alert('El área mínima es de 40 m²');
            return;
        }
        
        // El valor de banos será 0 si está vacío o es inválido
        let banosValue = parseInt(banos);
        if (isNaN(banosValue) || banosValue < 0) {
            banosValue = 0;
        }
        
        // Mostrar loading
        const btn = document.querySelector('.btn-cotizar');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>Calculando...</span>';
        btn.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/cotizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    m2: parseFloat(m2),
                    ambientes: parseInt(ambientes),
                    banos: banosValue,
                    amoblado,
                    mascota: mascota || 'no',
                    tipoLimpieza,
                    accesorios
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al calcular');
            }
            
            mostrarResultado(data.cotizacion, data.precio);
            
        } catch (error) {
            alert('Error: ' + error.message + '\n¿El servidor está corriendo en http://localhost:3007?');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

function mostrarResultado(cotizacion, precio) {
    const resultadoCard = document.getElementById('resultado');
    const resultadoContent = document.getElementById('resultadoContent');
    
    if (!resultadoCard || !resultadoContent) return;
    
    const tipoLimpiezaTexto = cotizacion.tipoLimpieza === 'basica' ? 'Limpieza Básica' : 'Limpieza Profunda';
    const accesoriosTexto = cotizacion.accesorios === 'con' ? 'Con accesorios' : 'Sin accesorios';
    const amobladoTexto = cotizacion.amoblado ? 'Sí' : 'No';
    const banosTexto = cotizacion.banos > 0 ? cotizacion.banos : '0 (sin baños)';
    const mascotaTexto = cotizacion.mascota === 'si' ? 'Sí' : 'No';
    
    let mensajeWhatsApp = '';
    if (cotizacion.metros > 97) {
        mensajeWhatsApp = `
            <div class="mensaje-info">
                ⚠️ Para áreas mayores a 97m², el precio es referencial.<br>
                Contáctanos para un presupuesto personalizado.
            </div>
        `;
    }
    
    resultadoContent.innerHTML = `
        <div class="detalle-item">
            <span class="detalle-label">Área total:</span>
            <span class="detalle-valor">${cotizacion.metros} m²</span>
        </div>
        <div class="detalle-item">
            <span class="detalle-label">N° de ambientes:</span>
            <span class="detalle-valor">${cotizacion.ambientes}</span>
        </div>
        <div class="detalle-item">
            <span class="detalle-label">N° de baños:</span>
            <span class="detalle-valor">${banosTexto}</span>
        </div>
        <div class="detalle-item">
            <span class="detalle-label">¿Amoblado?:</span>
            <span class="detalle-valor">${amobladoTexto}</span>
        </div>
        <div class="detalle-item">
            <span class="detalle-label">🐕 ¿Tiene mascota?:</span>
            <span class="detalle-valor">${mascotaTexto}</span>
        </div>
        <div class="detalle-item">
            <span class="detalle-label">Tipo de limpieza:</span>
            <span class="detalle-valor">${tipoLimpiezaTexto}</span>
        </div>
        <div class="detalle-item">
            <span class="detalle-label">Accesorios:</span>
            <span class="detalle-valor">${accesoriosTexto}</span>
        </div>
        
        <div class="precio-total">
            <div class="precio-label">PRESUPUESTO TOTAL</div>
            <div class="precio-monto">S/ ${precio}</div>
        </div>
        
        ${mensajeWhatsApp}
    `;
    
    // Configurar enlace de WhatsApp
    const mensaje = `Hola, quiero solicitar una cotización para limpieza:%0A%0A` +
        `🏠 *Datos de la cotización:*%0A` +
        `📏 Área: ${cotizacion.metros} m²%0A` +
        `🚪 Ambientes: ${cotizacion.ambientes}%0A` +
        `🚿 Baños: ${cotizacion.banos}%0A` +
        `🛋️ Amoblado: ${amobladoTexto}%0A` +
        `🐕 Mascota: ${mascotaTexto}%0A` +
        `🧹 Tipo: ${tipoLimpiezaTexto}%0A` +
        `🧼 Accesorios: ${accesoriosTexto}%0A%0A` +
        `💰 *Presupuesto: S/ ${precio}*%0A%0A` +
        `📅 ¿Podrían darme más información?`;
    
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        whatsappLink.href = `https://wa.me/51982116816?text=${encodeURIComponent(mensaje)}`;
    }
    
    resultadoCard.classList.remove('hidden');
    
    // Scroll al resultado
    resultadoCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Cerrar resultado
const cerrarBtn = document.getElementById('cerrarResultado');
if (cerrarBtn) {
    cerrarBtn.addEventListener('click', () => {
        const resultado = document.getElementById('resultado');
        if (resultado) resultado.classList.add('hidden');
    });
}

// Nueva cotización
const nuevaBtn = document.getElementById('nuevaCotizacion');
if (nuevaBtn) {
    nuevaBtn.addEventListener('click', () => {
        const resultado = document.getElementById('resultado');
        if (resultado) resultado.classList.add('hidden');
        const form = document.getElementById('cotizacionForm');
        if (form) form.reset();
        // Resetear valores por defecto
        const banosInput = document.getElementById('banos');
        if (banosInput) banosInput.value = '0';
        const mascotaNo = document.querySelector('input[name="mascota"][value="no"]');
        if (mascotaNo) mascotaNo.checked = true;
        const m2Input = document.getElementById('m2');
        if (m2Input) m2Input.focus();
    });
}

// Scroll reveal animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .cotizador-form, .cotizador-resultado, .servicio-detalle-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});
