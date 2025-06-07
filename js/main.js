        // Variables globales
        let map;
        let userMarker;
        let clickedMarker;
        let routeControl;
        let isTracking = false;
        let watchId;
        let updateCount = 0;
        let locationHistory = [];
        let currentUserLocation = null;

        // Inicializar la aplicación (cargar la pagina)
        document.addEventListener('DOMContentLoaded', function() {
            initializeParticles();
            initializeMap();
            getCurrentLocation();
        });

        // Crear partículas flotantes
        function initializeParticles() {
            const particlesContainer = document.getElementById('particles');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 20 + 's';
                particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
                particlesContainer.appendChild(particle);
            }
        }

        // Inicializar el mapa
        function initializeMap() {
            map = L.map('map').setView([19.4326, -99.1332], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Añadir efectos de estilo al mapa
            map.getContainer().style.filter = 'contrast(1.1) saturate(1.2)';

            // Agregar event listener para clicks en el mapa
            map.on('click', onMapClick);
        }

        // Obtener ubicación actual
        function getCurrentLocation() {
            if (!navigator.geolocation) {
                showError('Tu navegador no soporta geolocalización');
                return;
            }

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

        // Manejar éxito en obtención de ubicación
        function handleLocationSuccess(position) {
            const { latitude, longitude, accuracy } = position.coords;
            
            updateCount++;
            locationHistory.push({ lat: latitude, lng: longitude, timestamp: new Date() });
            currentUserLocation = { lat: latitude, lng: longitude };
            
            updateLocationDisplay(position);
            updateMap(latitude, longitude);
            updateStats(accuracy);
            updateStatus(true);
            
            // Obtener información de dirección
            getAddressFromCoordinates(latitude, longitude);
        }

        // Manejar error en obtención de ubicación
        function handleLocationError(error) {
            let message = 'Error desconocido';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Permiso de geolocalización denegado';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Información de ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    message = 'Tiempo de espera agotado';
                    break;
            }
            showError(message);
            updateStatus(false);
        }

        // Actualizar display de ubicación
        function updateLocationDisplay(position) {
            const { latitude, longitude, accuracy, speed, heading } = position.coords;
            const timestamp = new Date(position.timestamp);

            const locationInfo = document.getElementById('locationInfo');
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
        }

        // Manejar click en el mapa
        function onMapClick(e) {
            const { lat, lng } = e.latlng;
            
            // Remover marker anterior si existe
            if (clickedMarker) {
                map.removeLayer(clickedMarker);
            }

            // Crear nuevo marker para el punto clickeado
            const clickIcon = L.divIcon({
                className: 'clicked-marker',
                html: `<div style="
                    width: 16px;
                    height: 16px;
                    background: #ff4757;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 15px rgba(255, 71, 87, 0.6);
                    animation: pulse 2s infinite;
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            clickedMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
            
            // Obtener información del lugar clickeado
            getClickedLocationInfo(lat, lng);
            
            // Calcular y mostrar ruta si tenemos ubicación del usuario
            if (currentUserLocation) {
                calculateRoute(currentUserLocation, { lat, lng });
            }
        }

        // Obtener información del lugar clickeado
        async function getClickedLocationInfo(lat, lng) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await response.json();
                
                const address = data.address || {};
                const house_number = address.house_number || '';
                const road = address.road || address.street || '';
                const city = address.city || address.town || address.village || address.municipality || '';
                const country = address.country || '';
                const country_code = address.country_code || '';
                const flagEmoji = getFlagEmoji(country_code);

                // Crear dirección simplificada
                const streetAddress = house_number && road ? `${house_number} ${road}` : (road || 'Dirección no especificada');
                const fullSimpleAddress = `${streetAddress}, ${city || 'Ciudad no especificada'}, ${country || 'País no especificado'}`;

                // Mostrar popup con información
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

                clickedMarker.bindPopup(popupContent).openPopup();
                
            } catch (error) {
                console.error('Error fetching clicked location info:', error);
                clickedMarker.bindPopup(`
                    <div style="font-family: 'Segoe UI', sans-serif;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">📍 Ubicación</h3>
                        <p>Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                        <p style="color: #ff4757;">No se pudo obtener información detallada</p>
                    </div>
                `).openPopup();
            }
        }

        // Calcular ruta entre dos puntos
        function calculateRoute(from, to) {
            // Remover ruta anterior si existe
            if (routeControl) {
                map.removeControl(routeControl);
            }

            // Calcular distancia en línea recta
            const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
            
            // Crear línea de ruta
            const routeLine = L.polyline([
                [from.lat, from.lng],
                [to.lat, to.lng]
            ], {
                color: '#4facfe',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(map);

            // Crear popup de distancia en el punto medio
            const midLat = (from.lat + to.lat) / 2;
            const midLng = (from.lng + to.lng) / 2;
            
            const distanceMarker = L.marker([midLat, midLng], {
                icon: L.divIcon({
                    className: 'distance-marker',
                    html: `<div style="
                        background: rgba(79, 172, 254, 0.9);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 15px;
                        font-size: 12px;
                        font-weight: bold;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        white-space: nowrap;
                    ">📏 ${distance}</div>`,
                    iconSize: [80, 30],
                    iconAnchor: [40, 15]
                })
            }).addTo(map);

            // Guardar referencias para limpiar después
            routeControl = {
                line: routeLine,
                marker: distanceMarker,
                remove: function() {
                    map.removeLayer(routeLine);
                    map.removeLayer(distanceMarker);
                }
            };

            // Ajustar vista para mostrar ambos puntos
            const bounds = L.latLngBounds([
                [from.lat, from.lng],
                [to.lat, to.lng]
            ]);
            map.fitBounds(bounds, { padding: [20, 20] });
        }

        // Calcular distancia entre dos puntos (fórmula de Haversine)
        function calculateDistance(lat1, lng1, lat2, lng2) {
            const R = 6371; // Radio de la Tierra en km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                     Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            // Retornar formato apropiado
            if (distance < 1) {
                return `${Math.round(distance * 1000)} m`;
            } else {
                return `${distance.toFixed(2)} km`;
            }
        }

        // Actualizar mapa
        function updateMap(lat, lng) {
            if (userMarker) {
                map.removeLayer(userMarker);
            }

            // Crear marker personalizado con animación
            const pulsingIcon = L.divIcon({
                className: 'pulsing-marker',
                html: `<div style="
                    width: 20px;
                    height: 20px;
                    background: #4facfe;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 20px rgba(79, 172, 254, 0.6);
                    animation: pulse 2s infinite;
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            userMarker = L.marker([lat, lng], { icon: pulsingIcon }).addTo(map);
            
            // Añadir círculo de precisión
            L.circle([lat, lng], {
                color: '#4facfe',
                fillColor: '#4facfe',
                fillOpacity: 0.1,
                radius: 100
            }).addTo(map);

            map.setView([lat, lng], 16);
        }

        // Actualizar estadísticas
        function updateStats(accuracy) {
            document.getElementById('accuracyValue').textContent = accuracy?.toFixed(0) || '--';
            document.getElementById('updateCount').textContent = updateCount;
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        }

        // Actualizar estado
        function updateStatus(isActive) {
            const indicator = document.getElementById('statusIndicator');
            indicator.className = `status-indicator ${isActive ? 'status-active' : 'status-inactive'}`;
        }

        // Actualizar estado de dirección
        function updateAddressStatus(isActive) {
            const indicator = document.getElementById('addressStatusIndicator');
            indicator.className = `status-indicator ${isActive ? 'status-active' : 'status-inactive'}`;
        }

        // Mostrar error
        function showError(message) {
            const locationInfo = document.getElementById('locationInfo');
            locationInfo.innerHTML = `<div class="error">${message}</div>`;
        }

        // Toggle tracking
        function toggleTracking() {
            const btn = document.getElementById('trackingBtn');
            
            if (!isTracking) {
                startTracking();
                btn.textContent = 'Detener Seguimiento';
                btn.style.background = 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)';
            } else {
                stopTracking();
                btn.textContent = 'Iniciar Seguimiento';
                btn.style.background = 'var(--secondary-gradient)';
            }
            
            isTracking = !isTracking;
        }

        // Iniciar seguimiento
        function startTracking() {
            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };

            watchId = navigator.geolocation.watchPosition(
                handleLocationSuccess,
                handleLocationError,
                options
            );
        }

        // Detener seguimiento
        function stopTracking() {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        }

        // Compartir ubicación
        async function shareLocation() {
            if (locationHistory.length === 0) {
                alert('No hay ubicación disponible para compartir');
                return;
            }

            const lastLocation = locationHistory[locationHistory.length - 1];
            const shareText = `Mi ubicación actual: https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Mi Ubicación',
                        text: shareText,
                        url: `https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}`
                    });
                } catch (err) {
                    console.log('Error sharing:', err);
                }
            } else {
                // Fallback: copiar al portapapeles
                navigator.clipboard.writeText(shareText).then(() => {
                    alert('Ubicación copiada al portapapeles');
                });
            }
        }

        // Funciones adicionales para APIs
        async function getWeatherData(lat, lng) {
            // Aquí podrías integrar una API de clima
            // Ejemplo con OpenWeatherMap API
            try {
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=TU_API_KEY&units=metric`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.log('Error fetching weather data:', error);
                return null;
            }
        }

        async function getAddressFromCoordinates(lat, lng) {
            // Mostrar loading
            const addressInfo = document.getElementById('addressInfo');
            addressInfo.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Obteniendo dirección...</span>
                </div>
            `;
            
            try {
                // Usar múltiples APIs para obtener información más completa
                const [nominatimData, ipLocationData] = await Promise.allSettled([
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`),
                    fetch(`https://ipapi.co/json/`)
                ]);

                let addressData = null;
                let countryData = null;

                // Procesar datos de Nominatim
                if (nominatimData.status === 'fulfilled') {
                    const nominatimResponse = await nominatimData.value.json();
                    addressData = nominatimResponse;
                }

                // Procesar datos de IP (como respaldo para país)
                if (ipLocationData.status === 'fulfilled') {
                    countryData = await ipLocationData.value.json();
                }

                displayAddressInfo(addressData, countryData);
                updateAddressStatus(true);

            } catch (error) {
                console.error('Error fetching address data:', error);
                addressInfo.innerHTML = `
                    <div class="error">
                        Error al obtener información de dirección
                    </div>
                `;
                updateAddressStatus(false);
            }
        }

        function displayAddressInfo(addressData, countryData) {
            const addressInfo = document.getElementById('addressInfo');
            
            if (!addressData) {
                addressInfo.innerHTML = `
                    <div class="error">
                        No se pudo obtener información de dirección
                    </div>
                `;
                return;
            }

            const address = addressData.address || {};

            // Extraer información específica (simplificada según tu solicitud)
            const house_number = address.house_number || '';
            const road = address.road || address.street || '';
            const neighbourhood = address.neighbourhood || address.suburb || '';
            const city = address.city || address.town || address.village || address.municipality || '';
            const county = address.county || address.state_district || '';
            const state = address.state || address.province || '';
            const country = address.country || (countryData?.country_name) || '';
            const postcode = address.postcode || '';
            const country_code = address.country_code || (countryData?.country_code) || '';

            // Crear display con emojis de banderas
            const flagEmoji = getFlagEmoji(country_code);

            // Actualizar estadística de país
            document.getElementById('currentCountry').textContent = flagEmoji;

            // Crear dirección simplificada: calle, ciudad, país
            const streetAddress = house_number && road ? `${house_number} ${road}` : (road || 'Dirección no especificada');
            const fullSimpleAddress = `${streetAddress}, ${city || 'Ciudad no especificada'}, ${country || 'País no especificado'}`;

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
        }

        function getFlagEmoji(countryCode) {
            if (!countryCode) return '🌍';
            
            // Convertir código de país a emoji de bandera
            const flags = {
                'mx': '🇲🇽', 'us': '🇺🇸', 'ca': '🇨🇦', 'br': '🇧🇷', 'ar': '🇦🇷',
                'co': '🇨🇴', 'pe': '🇵🇪', 'cl': '🇨🇱', 've': '🇻🇪', 'ec': '🇪🇨',
                'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'gb': '🇬🇧',
                'jp': '🇯🇵', 'kr': '🇰🇷', 'cn': '🇨🇳', 'in': '🇮🇳', 'au': '🇦🇺'
            };
            
            return flags[countryCode.toLowerCase()] || '🌍';
        }

        function getPlaceType(addressData) {
            const address = addressData.address || {};
            
            if (address.house_number) return '🏠 Residencial';
            if (address.shop || address.amenity === 'shop') return '🏪 Comercial';
            if (address.amenity === 'restaurant') return '🍽️ Restaurante';
            if (address.amenity === 'hospital') return '🏥 Hospital';
            if (address.amenity === 'school') return '🏫 Escuela';
            if (address.amenity === 'bank') return '🏦 Banco';
            if (address.highway) return '🛣️ Vía';
            if (address.natural) return '🌿 Área Natural';
            if (address.leisure) return '🎯 Recreativo';
            
            return '📍 Ubicación General';
        }
