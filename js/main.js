/* ========================================
   🚀 GEOTRACKER PRO - JAVASCRIPT COMPLETO
   ========================================
   
   📋 RESUMEN DE FUNCIONALIDADES:
   - Obtener ubicación GPS del usuario
   - Mostrar ubicación en mapa interactivo
   - Convertir coordenadas a direcciones legibles
   - Permitir clicks en mapa para seleccionar puntos
   - Calcular distancias entre ubicaciones
   - Compartir ubicación actual
   - Seguimiento en tiempo real
   
   🌐 APIS UTILIZADAS:
   1. Geolocation API (navegador) - GPS
   2. Nominatim API (OpenStreetMap) - Geocodificación
   3. ipapi.co - Información de país
   4. Leaflet.js - Mapas interactivos
   5. Web Share API (navegador) - Compartir
   6. Clipboard API (navegador) - Copiar texto
   
======================================== */

/* ========================================
   📋 VARIABLES GLOBALES - ESTADO DE LA APP
   ========================================
   Estas variables mantienen el estado de toda la aplicación
   y permiten que las funciones se comuniquen entre sí
======================================== */

// 🗺️ VARIABLES DEL MAPA
let map;                    // Instancia principal del mapa Leaflet
let userMarker;            // Marcador AZUL que muestra TU ubicación actual
let clickedMarker;         // Marcador ROJO que muestra donde hiciste click
let routeControl;          // Objeto que contiene líneas de ruta y distancias

// 🎯 VARIABLES DE SEGUIMIENTO
let isTracking = false;    // Boolean: ¿está activado el seguimiento automático?
let watchId;               // ID numérico para poder cancelar watchPosition()

// 📊 VARIABLES DE DATOS
let updateCount = 0;       // Contador: cuántas veces se actualizó la ubicación
let locationHistory = [];  // Array: historial de todas las ubicaciones visitadas
let currentUserLocation = null; // Objeto: tu ubicación actual {lat, lng}

/* ========================================
   🚀 INICIALIZACIÓN DE LA APLICACIÓN
   ========================================
   Esta es la primera función que se ejecuta cuando
   el navegador termina de cargar el HTML
======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // DOMContentLoaded se dispara cuando el HTML está completamente cargado
    // pero antes de que terminen de cargar imágenes y otros recursos
    
    console.log('🚀 Iniciando GeoTracker Pro...');
    
    // PASO 1: Crear efectos visuales de fondo
    initializeParticles();     // Crear 50 partículas flotantes animadas
    
    // PASO 2: Configurar el mapa interactivo
    initializeMap();           // Inicializar Leaflet.js con OpenStreetMap
    
    // PASO 3: Solicitar ubicación del usuario
    getCurrentLocation();      // Llamar a Geolocation API del navegador
});

/* ========================================
   ✨ SISTEMA DE PARTÍCULAS DECORATIVAS
   ========================================
   Crea elementos visuales que flotan desde abajo hacia arriba
   para darle un efecto moderno y dinámico al fondo
======================================== */

function initializeParticles() {
    console.log('✨ Creando partículas decorativas...');
    
    // Buscar el contenedor HTML donde van las partículas
    const particlesContainer = document.getElementById('particles');
    
    // Crear 50 partículas individuales
    for (let i = 0; i < 50; i++) {
        // Crear elemento div para cada partícula
        const particle = document.createElement('div');
        particle.className = 'particle';  // Asignar clase CSS para estilos
        
        // POSICIÓN HORIZONTAL aleatoria (0% - 100% del ancho de pantalla)
        particle.style.left = Math.random() * 100 + '%';
        
        // DELAY aleatorio para que no todas empiecen al mismo tiempo (0-20 segundos)
        particle.style.animationDelay = Math.random() * 20 + 's';
        
        // DURACIÓN aleatoria de la animación (15-25 segundos)
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        
        // Agregar la partícula al DOM
        particlesContainer.appendChild(particle);
    }
    
    console.log('✅ 50 partículas creadas exitosamente');
}

/* ========================================
   🗺️ INICIALIZACIÓN DEL MAPA - LEAFLET.JS
   ========================================
   Configura el mapa interactivo usando la librería Leaflet
   y tiles (imágenes) de OpenStreetMap
======================================== */

function initializeMap() {
    console.log('🗺️ Inicializando mapa...');
    
    // CREAR INSTANCIA DEL MAPA
    // L.map() es la función principal de Leaflet.js
    // 'map' es el ID del div HTML donde se renderizará el mapa
    // .setView([lat, lng], zoom) establece la vista inicial
    map = L.map('map').setView([19.4326, -99.1332], 13);
    // Coordenadas de Ciudad de México como ubicación por defecto
    // Zoom 13 = vista de ciudad (0=mundo, 18=calle)
    
    // AGREGAR CAPA DE TILES (las imágenes del mapa)
    // Los tiles son imágenes cuadradas que forman el mapa completo
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'  // Créditos obligatorios
    }).addTo(map);  // .addTo(map) agrega la capa al mapa
    
    // URL explicada:
    // {s} = subdominio (a, b, c) para distribución de carga
    // {z} = nivel de zoom (0-18)
    // {x} = coordenada X del tile
    // {y} = coordenada Y del tile
    
    // APLICAR FILTROS CSS para mejorar la apariencia
    map.getContainer().style.filter = 'contrast(1.1) saturate(1.2)';
    // contrast(1.1) = aumentar contraste 10%
    // saturate(1.2) = aumentar saturación 20%

    // ⭐ EVENTO CRÍTICO: Detectar clicks en el mapa
    // Cada vez que el usuario haga click en cualquier parte del mapa,
    // se ejecutará la función onMapClick
    map.on('click', onMapClick);
    
    console.log('✅ Mapa inicializado exitosamente');
}

/* ========================================
   📍 GEOLOCATION API - OBTENER UBICACIÓN
   ========================================
   Función principal que solicita la ubicación GPS del usuario
   usando la API nativa del navegador web
======================================== */

function getCurrentLocation() {
    console.log('📍 Verificando soporte de geolocalización...');
    
    if (!navigator.geolocation) {
        showError('❌ Tu navegador no soporta geolocalización');
        return;
    }

    // VERIFICAR PERMISOS PRIMERO
    if (navigator.permissions) {
        navigator.permissions.query({name: 'geolocation'}).then(function(result) {
            console.log('🔐 Estado de permisos:', result.state);
            
            if (result.state === 'denied') {
                showPermissionHelp();
            } else {
                requestLocation();
            }
        });
    } else {
        // Fallback para navegadores sin Permissions API
        requestLocation();
    }
    
    // En este punto la función termina, pero las callbacks se ejecutarán
    // de forma asíncrona cuando el navegador obtenga (o falle) la ubicación
}

/* ========================================
   ✅ MANEJO EXITOSO DE GEOLOCALIZACIÓN
   ========================================
   Esta función se ejecuta automáticamente cuando
   el usuario acepta compartir su ubicación y se obtiene exitosamente
======================================== */

function handleLocationSuccess(position) {
    console.log('✅ Ubicación obtenida exitosamente:', position);
    
    // EXTRAER DATOS DEL OBJETO POSITION
    // El navegador retorna un objeto complejo, extraemos lo que necesitamos
    const { latitude, longitude, accuracy } = position.coords;
    // También están disponibles: speed, heading, altitude, altitudeAccuracy
    
    console.log(`📍 Coordenadas: ${latitude}, ${longitude}`);
    console.log(`🎯 Precisión: ${accuracy} metros`);
    
    // ACTUALIZAR ESTADO GLOBAL DE LA APLICACIÓN
    updateCount++;  // Incrementar contador de actualizaciones
    console.log(`📊 Actualización #${updateCount}`);
    
    // Agregar nueva ubicación al historial con timestamp
    locationHistory.push({ 
        lat: latitude, 
        lng: longitude, 
        timestamp: new Date(),
        accuracy: accuracy
    });
    
    // Guardar ubicación actual para poder calcular distancias después
    currentUserLocation = { lat: latitude, lng: longitude };
    
    // ACTUALIZAR INTERFAZ DE USUARIO
    console.log('🔄 Actualizando interfaz...');
    
    updateLocationDisplay(position);    // Llenar panel izquierdo con datos GPS
    updateMap(latitude, longitude);     // Mover mapa a tu ubicación y agregar marcador azul
    updateStats(accuracy);              // Actualizar estadísticas en cards inferiores
    updateStatus(true);                 // Cambiar indicador de estado a verde (activo)
    
    // 🌐 LLAMADA A API DE GEOCODIFICACIÓN
    // Convertir las coordenadas numéricas en una dirección legible
    console.log('🌐 Obteniendo dirección...');
    getAddressFromCoordinates(latitude, longitude);
}

/* ========================================
   ❌ MANEJO DE ERRORES DE GEOLOCALIZACIÓN
   ========================================
   Esta función se ejecuta cuando hay problemas
   al obtener la ubicación del usuario
======================================== */

function handleLocationError(error) {
    console.error('❌ Error de geolocalización:', error);
    
    let message = 'Error desconocido';
    
    // IDENTIFICAR EL TIPO ESPECÍFICO DE ERROR
    // La Geolocation API define códigos de error estándar
    switch(error.code) {
        case error.PERMISSION_DENIED:
            // El usuario denegó el permiso de ubicación
            message = 'Permiso de geolocalización denegado';
            console.error('🚫 Usuario denegó permisos de ubicación');
            break;
        case error.POSITION_UNAVAILABLE:
            // No se pudo determinar la ubicación (GPS desactivado, sin señal, etc.)
            message = 'Información de ubicación no disponible';
            console.error('📡 No se pudo obtener señal GPS');
            break;
        case error.TIMEOUT:
            // Se agotó el tiempo de espera definido en options.timeout
            message = 'Tiempo de espera agotado';
            console.error('⏰ Timeout: tardó más de 10 segundos');
            break;
        default:
            console.error('❓ Error desconocido:', error.message);
    }
    
    // MOSTRAR ERROR AL USUARIO Y ACTUALIZAR ESTADO
    showError(message);     // Mostrar mensaje en la interfaz
    updateStatus(false);    // Cambiar indicador de estado a rojo (inactivo)
}

/* ========================================
   📊 ACTUALIZAR PANEL DE INFORMACIÓN GPS
   ========================================
   Toma todos los datos obtenidos del GPS y los
   muestra de forma organizada en el panel izquierdo
======================================== */

function updateLocationDisplay(position) {
    console.log('📊 Actualizando display de ubicación...');
    
    // EXTRAER TODOS LOS DATOS DISPONIBLES del objeto position
    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const timestamp = new Date(position.timestamp);  // Convertir timestamp a objeto Date
    
    // Buscar el elemento HTML donde mostrar la información
    const locationInfo = document.getElementById('locationInfo');
    
    // GENERAR HTML DINÁMICO usando template literals
    // Los template literals (backticks ``) permiten crear strings multilínea
    // y incluir variables con ${variable}
    locationInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Latitud:</span>
            <span class="info-value">${latitude.toFixed(6)}°</span>
        </div>
        <div class="info-item">
            <span class="info-label">Longitud:</span>
            <span class="info-value">${longitude.toFixed(6)}°</span>
        </div>
        <div class="info-item">
            <span class="info-label">Precisión:</span>
            <span class="info-value">${accuracy?.toFixed(0) || 'N/A'} m</span>
        </div>
        <div class="info-item">
            <span class="info-label">Velocidad:</span>
            <span class="info-value">${speed ? (speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Dirección:</span>
            <span class="info-value">${heading?.toFixed(0) + '°' || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Hora:</span>
            <span class="info-value">${timestamp.toLocaleTimeString()}</span>
        </div>
    `;
    
    // EXPLICACIÓN DE CÁLCULOS:
    // .toFixed(6) = mostrar 6 decimales (precisión de ~1 metro)
    // speed * 3.6 = convertir m/s a km/h
    // ?. = optional chaining (no falla si el valor es null)
    // || 'N/A' = mostrar 'N/A' si el valor no está disponible
    
    console.log('✅ Panel de ubicación actualizado');
}

/* ========================================
   🗺️ ACTUALIZAR MAPA CON MARCADOR AZUL
   ========================================
   Mueve el mapa a tu ubicación actual y agrega
   un marcador azul pulsante que te representa
======================================== */

function updateMap(lat, lng) {
    console.log(`🗺️ Actualizando mapa: ${lat}, ${lng}`);
    
    // REMOVER MARCADOR ANTERIOR (si existe)
    // Evita que se acumulen marcadores azules en el mapa
    if (userMarker) {
        map.removeLayer(userMarker);  // Leaflet función para quitar elementos del mapa
        console.log('🧹 Marcador anterior removido');
    }

    // CREAR ICONO PERSONALIZADO CON ANIMACIÓN CSS
    // L.divIcon permite crear marcadores con HTML personalizado
    const pulsingIcon = L.divIcon({
        className: 'pulsing-marker',     // Clase CSS (opcional)
        html: `<div style="
            width: 20px;
            height: 20px;
            background: #4facfe;         /* Color azul corporativo */
            border: 3px solid white;     /* Borde blanco para contraste */
            border-radius: 50%;          /* Hacer círculo perfecto */
            box-shadow: 0 0 20px rgba(79, 172, 254, 0.6); /* Sombra brillante */
            animation: pulse 2s infinite; /* Animación pulsante CSS */
        "></div>`,
        iconSize: [20, 20],              // Tamaño del icono en píxeles
        iconAnchor: [10, 10]             // Punto de anclaje (centro del círculo)
    });

    // AGREGAR MARCADOR AL MAPA
    // L.marker crea el marcador en las coordenadas especificadas
    userMarker = L.marker([lat, lng], { icon: pulsingIcon }).addTo(map);
    console.log('📍 Marcador azul agregado');
    
    // AGREGAR CÍRCULO DE PRECISIÓN (opcional)
    // Muestra un área circular que representa la precisión del GPS
    L.circle([lat, lng], {
        color: '#4facfe',       // Color del borde del círculo
        fillColor: '#4facfe',   // Color del relleno
        fillOpacity: 0.1,       // Transparencia del relleno (10%)
        radius: 100             // Radio en metros (ajustable según precisión)
    }).addTo(map);
    console.log('⭕ Círculo de precisión agregado');

    // CENTRAR MAPA EN LA NUEVA UBICACIÓN
    // .setView mueve la vista del mapa a las coordenadas especificadas
    map.setView([lat, lng], 16);  // Zoom nivel 16 = vista de barrio
    console.log('🎯 Mapa centrado en nueva ubicación');
}

/* ========================================
   🌐 API NOMINATIM - GEOCODIFICACIÓN INVERSA
   ========================================
   Esta es la función más compleja de la aplicación.
   Convierte coordenadas numéricas en direcciones legibles
   usando la API gratuita de OpenStreetMap
======================================== */

async function getAddressFromCoordinates(lat, lng) {
    console.log(`🌐 Obteniendo dirección para: ${lat}, ${lng}`);
    
    // MOSTRAR ESTADO DE CARGA AL USUARIO
    // Importante para UX: el usuario debe saber que algo está pasando
    const addressInfo = document.getElementById('addressInfo');
    addressInfo.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>Obteniendo dirección...</span>
        </div>
    `;
    
    try {
        // 🌐 LLAMADAS A MÚLTIPLES APIs EN PARALELO
        // Promise.allSettled permite que una API falle sin afectar las otras
        console.log('🚀 Iniciando llamadas a APIs...');
        
        const [nominatimData, ipLocationData] = await Promise.allSettled([
            
            // 🌐 API #1: NOMINATIM (OpenStreetMap) - Principal
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`),
            
            // 🌐 API #2: IPAPI.CO - Respaldo para información de país
            fetch(`https://ipapi.co/json/`)
        ]);

        // VARIABLES PARA ALMACENAR RESPUESTAS
        let addressData = null;
        let countryData = null;

        // PROCESAR RESPUESTA DE NOMINATIM
        if (nominatimData.status === 'fulfilled') {
            console.log('✅ Nominatim API respondió exitosamente');
            const nominatimResponse = await nominatimData.value.json();
            addressData = nominatimResponse;
            console.log('📍 Datos de Nominatim:', addressData);
        } else {
            console.warn('⚠️ Nominatim API falló:', nominatimData.reason);
        }

        // PROCESAR RESPUESTA DE IPAPI (respaldo)
        if (ipLocationData.status === 'fulfilled') {
            console.log('✅ ipapi.co respondió exitosamente');
            countryData = await ipLocationData.value.json();
            console.log('🌍 Datos de ipapi:', countryData);
        } else {
            console.warn('⚠️ ipapi.co falló:', ipLocationData.reason);
        }

        // MOSTRAR INFORMACIÓN OBTENIDA
        displayAddressInfo(addressData, countryData);
        updateAddressStatus(true);  // Cambiar indicador a verde

    } catch (error) {
        // MANEJO DE ERRORES DE RED
        console.error('❌ Error en APIs de geocodificación:', error);
        addressInfo.innerHTML = `
            <div class="error">
                Error al obtener información de dirección
            </div>
        `;
        updateAddressStatus(false);  // Cambiar indicador a rojo
    }
}

/* ========================================
   📋 MOSTRAR INFORMACIÓN DE DIRECCIÓN
   ========================================
   Procesa las respuestas de las APIs de geocodificación
   y las muestra de forma organizada en el panel central
======================================== */

function displayAddressInfo(addressData, countryData) {
    console.log('📋 Procesando información de dirección...');
    
    const addressInfo = document.getElementById('addressInfo');
    
    // VERIFICAR QUE TENEMOS DATOS VÁLIDOS
    if (!addressData) {
        console.warn('⚠️ No hay datos de dirección disponibles');
        addressInfo.innerHTML = `
            <div class="error">
                No se pudo obtener información de dirección
            </div>
        `;
        return;  // Salir de la función si no hay datos
    }

    // EXTRAER INFORMACIÓN ESPECÍFICA de la respuesta de Nominatim
    // El objeto address contiene todos los componentes de la dirección
    const address = addressData.address || {};
    
    console.log('🏠 Componentes de dirección:', address);

    // EXTRAER CADA CAMPO (pueden existir o no dependiendo del lugar)
    const house_number = address.house_number || '';           // Número de casa/edificio
    const road = address.road || address.street || '';         // Nombre de calle/avenida
    const neighbourhood = address.neighbourhood || address.suburb || '';  // Barrio/colonia
    const city = address.city || address.town || address.village || address.municipality || '';  // Ciudad
    const county = address.county || address.state_district || '';     // Condado/municipio
    const state = address.state || address.province || '';     // Estado/provincia
    const country = address.country || (countryData?.country_name) || '';  // País
    const postcode = address.postcode || '';                   // Código postal
    const country_code = address.country_code || (countryData?.country_code) || '';  // Código ISO del país

    // OBTENER EMOJI DE BANDERA DEL PAÍS
    const flagEmoji = getFlagEmoji(country_code);
    console.log(`🏳️ Bandera: ${flagEmoji} (${country_code})`);

    // ACTUALIZAR ESTADÍSTICA DE PAÍS en las cards inferiores
    document.getElementById('currentCountry').textContent = flagEmoji;

    // CREAR DIRECCIÓN SIMPLIFICADA (como me pediste: calle, ciudad, país)
    const streetAddress = house_number && road ? `${house_number} ${road}` : (road || 'Dirección no especificada');
    const fullSimpleAddress = `${streetAddress}, ${city || 'Ciudad no especificada'}, ${country || 'País no especificado'}`;
    
    console.log('📍 Dirección simplificada:', fullSimpleAddress);

    // GENERAR HTML DINÁMICO con toda la información
    // Usamos template literals y operador ternario para mostrar campos opcionales
    addressInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Dirección:</span>
            <span class="info-value" style="font-size: 0.95em; line-height: 1.4;">${fullSimpleAddress}</span>
        </div>
        ${neighbourhood ? `
        <div class="info-item">
            <span class="info-label">Barrio/Colonia:</span>
            <span class="info-value">${neighbourhood}</span>
        </div>` : ''}
        ${county ? `
        <div class="info-item">
            <span class="info-label">Condado/Municipio:</span>
            <span class="info-value">${county}</span>
        </div>` : ''}
        ${state ? `
        <div class="info-item">
            <span class="info-label">Estado/Provincia:</span>
            <span class="info-value">${state}</span>
        </div>` : ''}
        ${postcode ? `
        <div class="info-item">
            <span class="info-label">Código Postal:</span>
            <span class="info-value">${postcode}</span>
        </div>` : ''}
        <div class="info-item">
            <span class="info-label">Tipo de Lugar:</span>
            <span class="info-value">${getPlaceType(addressData)}</span>
        </div>
    `;
    
    console.log('✅ Información de dirección mostrada');
}

/* ========================================
   🏳️ SISTEMA DE BANDERAS POR PAÍS
   ========================================
   Convierte códigos de país ISO (mx, us, etc.)
   en emojis de banderas correspondientes
======================================== */

function getFlagEmoji(countryCode) {
    if (!countryCode) {
        console.log('🌍 Sin código de país, usando emoji genérico');
        return '🌍';  // Emoji por defecto si no hay código
    }
    
    console.log(`🏳️ Buscando bandera para: ${countryCode}`);
    
    // MAPEO DE CÓDIGOS ISO 3166-1 ALPHA-2 a EMOJIS DE BANDERAS
    // Solo incluimos los países más comunes para no hacer el objeto muy grande
    const flags = {
        // América
        'mx': '🇲🇽', 'us': '🇺🇸', 'ca': '🇨🇦', 'br': '🇧🇷', 'ar': '🇦🇷',
        'co': '🇨🇴', 'pe': '🇵🇪', 'cl': '🇨🇱', 've': '🇻🇪', 'ec': '🇪🇨',
        
        // Europa
        'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'gb': '🇬🇧',
        
        // Asia
        'jp': '🇯🇵', 'kr': '🇰🇷', 'cn': '🇨🇳', 'in': '🇮🇳',
        
        // Oceanía
        'au': '🇦🇺'
    };
    
    // Buscar bandera específica o retornar emoji genérico
    const flag = flags[countryCode.toLowerCase()] || '🌍';
    console.log(`🏳️ Bandera encontrada: ${flag}`);
    return flag;
}

/* ========================================
   🏢 CLASIFICACIÓN INTELIGENTE DE LUGARES
   ========================================
   Analiza los datos de Nominatim para determinar
   qué tipo de lugar es (residencial, comercial, etc.)
======================================== */

function getPlaceType(addressData) {
    const address = addressData.address || {};
    
    console.log('🏢 Clasificando tipo de lugar...');
    
    // CLASIFICAR SEGÚN CARACTERÍSTICAS ESPECÍFICAS
    // Revisamos en orden de especificidad (más específico primero)
    
    if (address.house_number) {
        console.log('🏠 Detectado: Residencial (tiene número de casa)');
        return '🏠 Residencial';
    }
    
    if (address.shop || address.amenity === 'shop') {
        console.log('🏪 Detectado: Comercial');
        return '🏪 Comercial';
    }
    
    if (address.amenity === 'restaurant') {
        console.log('🍽️ Detectado: Restaurante');
        return '🍽️ Restaurante';
    }
    
    if (address.amenity === 'hospital') {
        console.log('🏥 Detectado: Hospital');
        return '🏥 Hospital';
    }
    
    if (address.amenity === 'school') {
        console.log('🏫 Detectado: Escuela');
        return '🏫 Escuela';
    }
    
    if (address.amenity === 'bank') {
        console.log('🏦 Detectado: Banco');
        return '🏦 Banco';
    }
    
    if (address.highway) {
        console.log('🛣️ Detectado: Vía');
        return '🛣️ Vía';
    }
    
    if (address.natural) {
        console.log('🌿 Detectado: Área Natural');
        return '🌿 Área Natural';
    }
    
    if (address.leisure) {
        console.log('🎯 Detectado: Recreativo');
        return '🎯 Recreativo';
    }
    
    console.log('📍 Tipo genérico asignado');
    return '📍 Ubicación General';  // Clasificación por defecto
}

/* ========================================
   🖱️ MANEJO DE CLICKS EN EL MAPA
   ========================================
   Esta función se ejecuta CADA VEZ que el usuario
   hace click en cualquier parte del mapa
======================================== */

function onMapClick(e) {
    // OBTENER COORDENADAS DEL CLICK
    // Leaflet proporciona las coordenadas exactas donde se hizo click
    const { lat, lng } = e.latlng;
    console.log(`🖱️ Click en mapa: ${lat}, ${lng}`);
    
    // REMOVER MARCADOR ROJO ANTERIOR (si existe)
    // Evita que se acumulen marcadores rojos en el mapa
    if (clickedMarker) {
        map.removeLayer(clickedMarker);
        console.log('🧹 Marcador rojo anterior removido');
    }

    // CREAR ICONO PARA PUNTO CLICKEADO (rojo y más pequeño que el azul)
    const clickIcon = L.divIcon({
        className: 'clicked-marker',     // Clase CSS opcional
        html: `<div style="
            width: 16px;
            height: 16px;
            background: #ff4757;           /* Color rojo distintivo */
            border: 2px solid white;       /* Borde blanco para contraste */
            border-radius: 50%;            /* Círculo perfecto */
            box-shadow: 0 0 15px rgba(255, 71, 87, 0.6); /* Sombra roja */
            animation: pulse 2s infinite;  /* Animación pulsante */
        "></div>`,
        iconSize: [16, 16],              // Más pequeño que el marcador azul
        iconAnchor: [8, 8]               // Centro del círculo
    });

    // AGREGAR MARCADOR ROJO AL MAPA
    clickedMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
    console.log('🔴 Marcador rojo agregado');
    
    // OBTENER INFORMACIÓN DEL LUGAR CLICKEADO
    // Hacer nueva llamada a Nominatim para este punto específico
    getClickedLocationInfo(lat, lng);
    
    // CALCULAR Y MOSTRAR RUTA (si tenemos ubicación del usuario)
    if (currentUserLocation) {
        console.log('📏 Calculando ruta...');
        calculateRoute(currentUserLocation, { lat, lng });
    } else {
        console.warn('⚠️ No hay ubicación de usuario para calcular ruta');
    }
}

/* ========================================
   📍 OBTENER INFO DE LUGAR CLICKEADO
   ========================================
   Hace una nueva llamada a Nominatim API para obtener
   información específica del punto donde hizo click el usuario
======================================== */

async function getClickedLocationInfo(lat, lng) {
    console.log(`📍 Obteniendo info de punto clickeado: ${lat}, ${lng}`);
    
    try {
        // 🌐 NUEVA LLAMADA A NOMINATIM API
        // Similar a la anterior pero para el punto clickeado
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        console.log('📍 Datos del lugar clickeado:', data);
        
        // EXTRAER INFORMACIÓN BÁSICA PARA EL POPUP
        const address = data.address || {};
        const house_number = address.house_number || '';
        const road = address.road || address.street || '';
        const city = address.city || address.town || address.village || address.municipality || '';
        const country = address.country || '';
        const country_code = address.country_code || '';
        const flagEmoji = getFlagEmoji(country_code);

        // CREAR DIRECCIÓN SIMPLIFICADA PARA MOSTRAR
        const streetAddress = house_number && road ? `${house_number} ${road}` : (road || 'Dirección no especificada');
        const fullSimpleAddress = `${streetAddress}, ${city || 'Ciudad no especificada'}, ${country || 'País no especificado'}`;

        // CREAR CONTENIDO DEL POPUP
        // HTML que se mostrará en una ventana flotante sobre el marcador
        const popupContent = `
            <div style="min-width: 200px; font-family: 'Segoe UI', sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 1.1em;">
                    📍 Ubicación Seleccionada
                </h3>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">
                    <strong>Dirección:</strong><br>
                    ${fullSimpleAddress}
                </p>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">
                    <strong>Coordenadas:</strong><br>
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </p>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">
                    <strong>Tipo:</strong> ${getPlaceType(data)}
                </p>
            </div>
        `;

        // MOSTRAR POPUP EN EL MARCADOR ROJO
        // .bindPopup asocia el contenido HTML al marcador
        // .openPopup() lo muestra inmediatamente
        clickedMarker.bindPopup(popupContent).openPopup();
        console.log('💬 Popup mostrado con información');
        
    } catch (error) {
        console.error('❌ Error obteniendo info del lugar clickeado:', error);
        
        // POPUP DE FALLBACK en caso de error de red
        clickedMarker.bindPopup(`
            <div style="font-family: 'Segoe UI', sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #333;">📍 Ubicación</h3>
                <p>Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p style="color: #ff4757;">No se pudo obtener información detallada</p>
            </div>
        `).openPopup();
    }
}

/* ========================================
   📏 SISTEMA DE CÁLCULO DE RUTAS
   ========================================
   Dibuja una línea punteada entre tu ubicación
   y el punto clickeado, mostrando la distancia
======================================== */

function calculateRoute(from, to) {
    console.log(`📏 Calculando ruta de ${from.lat},${from.lng} a ${to.lat},${to.lng}`);
    
    // REMOVER RUTA ANTERIOR (si existe)
    // Evita que se acumulen líneas en el mapa
    if (routeControl) {
        routeControl.remove();  // Función personalizada que definimos más abajo
        routeControl = null;
        console.log('🧹 Ruta anterior removida');
    }

    // CALCULAR DISTANCIA EN LÍNEA RECTA
    // Usa la fórmula matemática de Haversine para precisión geográfica
    const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    console.log(`📏 Distancia calculada: ${distance}`);
    
    // CREAR LÍNEA DE RUTA VISUAL en el mapa
    // L.polyline dibuja una línea entre múltiples puntos
    const routeLine = L.polyline([
        [from.lat, from.lng],    // Punto de inicio (tu ubicación azul)
        [to.lat, to.lng]         // Punto final (marcador rojo clickeado)
    ], {
        color: '#4facfe',        // Color azul que combina con el tema
        weight: 4,               // Grosor de línea en píxeles
        opacity: 0.8,            // Transparencia (80% opaco)
        dashArray: '10, 10'      // Patrón de línea punteada (10px línea, 10px espacio)
    }).addTo(map);

    // CALCULAR PUNTO MEDIO para mostrar la distancia
    // El marcador de distancia aparece exactamente en el centro de la línea
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;
    console.log(`📍 Punto medio: ${midLat}, ${midLng}`);
    
    // CREAR MARCADOR DE DISTANCIA en el punto medio
    // Muestra la distancia calculada en un label flotante
    const distanceMarker = L.marker([midLat, midLng], {
        icon: L.divIcon({
            className: 'distance-marker',    // Clase CSS opcional
            html: `<div style="
                background: rgba(79, 172, 254, 0.9); /* Fondo azul semitransparente */
                color: white;                         /* Texto blanco */
                padding: 5px 10px;                    /* Espacio interno */
                border-radius: 15px;                  /* Bordes redondeados */
                font-size: 12px;                      /* Tamaño de fuente */
                font-weight: bold;                    /* Texto en negrita */
                box-shadow: 0 2px 10px rgba(0,0,0,0.3); /* Sombra sutil */
                white-space: nowrap;                  /* No quebrar línea */
            ">📏 ${distance}</div>`,  // Mostrar la distancia con emoji
            iconSize: [80, 30],       // Tamaño estimado del contenedor
            iconAnchor: [40, 15]      // Punto de anclaje (centro)
        })
    }).addTo(map);

    // GUARDAR REFERENCIAS para poder limpiar después
    // Creamos un objeto personalizado con función de limpieza
    routeControl = {
        line: routeLine,             // Referencia a la línea punteada
        marker: distanceMarker,      // Referencia al marcador de distancia
        remove: function() {         // Función personalizada para limpiar todo
            console.log('🧹 Removiendo elementos de ruta...');
            map.removeLayer(routeLine);      // Quitar línea del mapa
            map.removeLayer(distanceMarker); // Quitar marcador de distancia
        }
    };

    // AJUSTAR VISTA DEL MAPA para mostrar ambos puntos
    // L.latLngBounds crea un rectángulo que contiene ambos puntos
    const bounds = L.latLngBounds([
        [from.lat, from.lng],        // Esquina 1: tu ubicación
        [to.lat, to.lng]             // Esquina 2: punto clickeado
    ]);
    // .fitBounds ajusta el zoom para que ambos puntos sean visibles
    map.fitBounds(bounds, { padding: [20, 20] });  // Con 20px de margen
    
    console.log('✅ Ruta dibujada y vista ajustada');
}

/* ========================================
   🧮 CÁLCULO DE DISTANCIA - FÓRMULA DE HAVERSINE
   ========================================
   Calcula la distancia real entre dos puntos en la Tierra
   considerando su curvatura (más preciso que línea recta euclidiana)
======================================== */

function calculateDistance(lat1, lng1, lat2, lng2) {
    console.log(`🧮 Calculando distancia Haversine...`);
    
    // CONSTANTE: Radio promedio de la Tierra en kilómetros
    const R = 6371;
    
    // CONVERTIR GRADOS A RADIANES
    // Las funciones trigonométricas de JavaScript requieren radianes
    const dLat = (lat2 - lat1) * Math.PI / 180;  // Diferencia de latitudes en radianes
    const dLng = (lng2 - lng1) * Math.PI / 180;  // Diferencia de longitudes en radianes
    
    console.log(`📐 Diferencias en radianes - Lat: ${dLat}, Lng: ${dLng}`);
    
    // APLICAR FÓRMULA DE HAVERSINE
    // Esta fórmula calcula la distancia más corta entre dos puntos en una esfera
    // Fórmula: a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlong/2)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLng/2) * Math.sin(dLng/2);
             
    // c = 2 × atan2(√a, √(1−a))
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // d = R × c (distancia en kilómetros)
    const distance = R * c;
    
    console.log(`📏 Distancia calculada: ${distance.toFixed(3)} km`);

    // RETORNAR FORMATO APROPIADO SEGÚN LA DISTANCIA
    if (distance < 1) {
        // Si es menos de 1 km, mostrar en metros para mayor precisión
        const meters = Math.round(distance * 1000);
        console.log(`📏 Resultado: ${meters} metros`);
        return `${meters} m`;
    } else {
        // Si es 1 km o más, mostrar en kilómetros con 2 decimales
        const kilometers = distance.toFixed(2);
        console.log(`📏 Resultado: ${kilometers} kilómetros`);
        return `${kilometers} km`;
    }
}

/* ========================================
   📊 ACTUALIZAR ESTADÍSTICAS INFERIORES
   ========================================
   Actualiza las 4 cards de estadísticas que aparecen
   en la parte inferior de la aplicación
======================================== */

function updateStats(accuracy) {
    console.log('📊 Actualizando estadísticas...');
    
    // ACTUALIZAR PRECISIÓN (en metros)
    document.getElementById('accuracyValue').textContent = accuracy?.toFixed(0) || '--';
    
    // ACTUALIZAR CONTADOR DE ACTUALIZACIONES
    document.getElementById('updateCount').textContent = updateCount;
    
    // ACTUALIZAR TIMESTAMP DE ÚLTIMA ACTUALIZACIÓN
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    
    // NOTA: currentCountry se actualiza en displayAddressInfo() cuando llega la respuesta de las APIs
    
    console.log(`📊 Estadísticas actualizadas - Precisión: ${accuracy}m, Actualizaciones: ${updateCount}`);
}

/* ========================================
   🚥 ACTUALIZAR INDICADORES DE ESTADO
   ========================================
   Controla los pequeños círculos de colores que aparecen
   junto a los títulos de las secciones (verde=activo, rojo=inactivo)
======================================== */

// INDICADOR DE ESTADO PARA GEOLOCALIZACIÓN
function updateStatus(isActive) {
    const indicator = document.getElementById('statusIndicator');
    // Cambiar clases CSS según el estado
    indicator.className = `status-indicator ${isActive ? 'status-active' : 'status-inactive'}`;
    console.log(`🚥 Estado GPS: ${isActive ? 'ACTIVO' : 'INACTIVO'}`);
}

// INDICADOR DE ESTADO PARA GEOCODIFICACIÓN
function updateAddressStatus(isActive) {
    const indicator = document.getElementById('addressStatusIndicator');
    indicator.className = `status-indicator ${isActive ? 'status-active' : 'status-inactive'}`;
    console.log(`🚥 Estado Geocodificación: ${isActive ? 'ACTIVO' : 'INACTIVO'}`);
}

/* ========================================
   ❌ MOSTRAR MENSAJES DE ERROR
   ========================================
   Función utilitaria para mostrar errores de forma
   consistente en la interfaz de usuario
======================================== */

function showError(message) {
    console.error(`❌ Mostrando error: ${message}`);
    
    // Buscar el panel de información de ubicación
    const locationInfo = document.getElementById('locationInfo');
    
    // Mostrar mensaje de error con estilos CSS apropiados
    locationInfo.innerHTML = `<div class="error">${message}</div>`;
}

/* ========================================
   🔄 SISTEMA DE SEGUIMIENTO EN TIEMPO REAL
   ========================================
   Permite activar/desactivar actualizaciones automáticas
   de ubicación cuando el usuario se mueve
======================================== */

// ALTERNAR ESTADO DE SEGUIMIENTO
function toggleTracking() {
    const btn = document.getElementById('trackingBtn');
    console.log(`🔄 Alternando seguimiento. Estado actual: ${isTracking}`);
    
    if (!isTracking) {
        // ACTIVAR SEGUIMIENTO
        console.log('🟢 Activando seguimiento automático...');
        startTracking();
        btn.textContent = 'Detener Seguimiento';
        btn.style.background = 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)';  // Cambiar a rojo
    } else {
        // DESACTIVAR SEGUIMIENTO
        console.log('🔴 Desactivando seguimiento automático...');
        stopTracking();
        btn.textContent = 'Iniciar Seguimiento';
        btn.style.background = 'var(--secondary-gradient)';  // Volver al color original
    }
    
    // Cambiar estado global
    isTracking = !isTracking;
}

// INICIAR SEGUIMIENTO AUTOMÁTICO
function startTracking() {
    console.log('🚀 Iniciando watchPosition...');
    
    const options = {
        enableHighAccuracy: true,    // Usar GPS para máxima precisión
        timeout: 5000,              // Timeout más corto para seguimiento (5 segundos)
        maximumAge: 0               // Siempre obtener nueva ubicación
    };

    // 🌐 WATCHPOSITION - API QUE ACTUALIZA AUTOMÁTICAMENTE
    // A diferencia de getCurrentPosition, esta función se ejecuta repetidamente
    // cada vez que detecta un cambio en la ubicación del usuario
    watchId = navigator.geolocation.watchPosition(
        handleLocationSuccess,    // Se ejecuta cada vez que cambia la ubicación
        handleLocationError,      // Se ejecuta si hay errores
        options
    );
    
    console.log(`🎯 watchPosition iniciado con ID: ${watchId}`);
}

// DETENER SEGUIMIENTO AUTOMÁTICO
function stopTracking() {
    if (watchId) {
        console.log(`🛑 Deteniendo watchPosition con ID: ${watchId}`);
        
        // CANCELAR el seguimiento automático usando el ID guardado
        navigator.geolocation.clearWatch(watchId);
        watchId = null;  // Limpiar referencia
    } else {
        console.warn('⚠️ No hay watchId para detener');
    }
}

/* ========================================
   📤 COMPARTIR UBICACIÓN ACTUAL
   ========================================
   Permite al usuario compartir su ubicación usando
   las APIs nativas del navegador (móvil) o portapapeles (desktop)
======================================== */

async function shareLocation() {
    console.log('📤 Iniciando proceso de compartir ubicación...');
    
    // VERIFICAR QUE TENEMOS UBICACIÓN PARA COMPARTIR
    if (locationHistory.length === 0) {
        console.warn('⚠️ No hay ubicación disponible');
        alert('No hay ubicación disponible para compartir');
        return;
    }

    // OBTENER LA ÚLTIMA UBICACIÓN REGISTRADA
    const lastLocation = locationHistory[locationHistory.length - 1];
    console.log('📍 Ubicación a compartir:', lastLocation);
    
    // CREAR TEXTO Y ENLACE PARA COMPARTIR
    // Usamos Google Maps porque es universalmente reconocido
    const shareText = `Mi ubicación actual: https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}`;
    const shareUrl = `https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}`;

    // 🌐 INTENTAR WEB SHARE API PRIMERO (principalmente móviles)
    if (navigator.share) {
        console.log('📱 Web Share API disponible, usando share nativo...');
        try {
            await navigator.share({
                title: 'Mi Ubicación',           // Título que aparece en el share
                text: shareText,                 // Texto descriptivo
                url: shareUrl                    // URL a compartir
            });
            console.log('✅ Ubicación compartida exitosamente');
        } catch (err) {
            // El usuario canceló el share o hubo error
            console.log('⚠️ Share cancelado o error:', err);
        }
    } else {
        // 🌐 FALLBACK: CLIPBOARD API para desktop
        console.log('💻 Web Share API no disponible, usando portapapeles...');
        
        try {
            await navigator.clipboard.writeText(shareText);
            alert('Ubicación copiada al portapapeles');
            console.log('✅ Ubicación copiada al portapapeles');
        } catch (err) {
            console.error('❌ Error copiando al portapapeles:', err);
            alert('Error al copiar la ubicación');
        }
    }
}

/* ========================================
   🧹 LIMPIAR RUTAS Y MARCADORES
   ========================================
   Función asociada al botón "Limpiar Ruta"
   que remueve todos los elementos temporales del mapa
======================================== */

function clearRoute() {
    console.log('🧹 Limpiando ruta y marcadores...');
    
    // REMOVER ELEMENTOS DE RUTA (si existen)
    if (routeControl) {
        routeControl.remove();  // Usa la función personalizada que creamos
        routeControl = null;    // Limpiar referencia
        console.log('✅ Ruta removida');
    }
    
    // REMOVER MARCADOR ROJO (si existe)
    if (clickedMarker) {
        map.removeLayer(clickedMarker);  // Leaflet función para quitar del mapa
        clickedMarker = null;            // Limpiar referencia
        console.log('✅ Marcador rojo removido');
    }
    
    console.log('✅ Limpieza completada');
}


async function getWeatherData(lat, lng) {
    console.log(`🌤️ Obteniendo datos del clima para: ${lat}, ${lng}`);
    
    try {
        // 🌐 OPENWEATHERMAP API
        // Necesitas registrarte en https://openweathermap.org/api
        // y reemplazar 'TU_API_KEY' con tu clave real
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=TU_API_KEY&units=metric`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🌤️ Datos del clima obtenidos:', data);
        
        // EJEMPLO DE DATOS QUE PUEDES OBTENER:
        // data.main.temp = temperatura actual
        // data.weather[0].description = descripción del clima
        // data.main.humidity = humedad
        // data.wind.speed = velocidad del viento
        
        return data;
        
    } catch (error) {
        console.error('❌ Error obteniendo datos del clima:', error);
        return null;
    }
}

// NUEVA FUNCIÓN: Mostrar ayuda de permisos
function showPermissionHelp() {
    const locationInfo = document.getElementById('locationInfo');
    locationInfo.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h3 style="color: #E53E3E; margin-bottom: 16px;">
                🔒 Permisos de Ubicación Requeridos
            </h3>
            <p style="margin-bottom: 16px; color: #4A5568;">
                Para usar esta aplicación, necesitas permitir el acceso a tu ubicación.
            </p>
            <div style="background: rgba(229, 62, 62, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="font-weight: 600; margin-bottom: 8px;">🛠️ Cómo activar permisos:</p>
                <ol style="text-align: left; color: #4A5568;">
                    <li>Haz click en el <strong>🔒 candado</strong> junto a la URL</li>
                    <li>Busca <strong>"Ubicación"</strong></li>
                    <li>Cambia a <strong>"Permitir"</strong></li>
                    <li>Recarga la página</li>
                </ol>
            </div>
            <button onclick="requestLocation()" class="btn btn-primary">
                🔄 Intentar de nuevo
            </button>
        </div>
    `;
}

// NUEVA FUNCIÓN: Solicitar ubicación
function requestLocation() {
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        options
    );
}