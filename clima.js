const apiEndpoint = 'https://api.openweathermap.org/data/2.5/';
const apiKey = 'a6c70ff6ee453d0222a396af6c64552f';

const ubicacionInput = document.getElementById('ubicacion');
const paisSelect = document.getElementById('pais');
const buscarClimaButton = document.getElementById('buscar-clima');
const climaActualDiv = document.getElementById('clima-actual');

buscarClimaButton.addEventListener('click', buscarClima);

function buscarClima() {
    const ubicacion = ubicacionInput.value.trim();
    if (!ubicacion) {
        climaActualDiv.innerHTML = '<p class="error-msg">Por favor, ingresa una ciudad válida.</p>';
        return;
    }

    climaActualDiv.innerHTML = '<p class="loading">Cargando...</p>';
    document.getElementById("pronostico").innerHTML = ""; // Limpia el pronóstico anterior

    const pais = paisSelect.value;
    const urlClima = `${apiEndpoint}weather?q=${ubicacion},${pais}&units=metric&appid=${apiKey}&lang=es`;
    const urlForecast = `${apiEndpoint}forecast?q=${ubicacion},${pais}&units=metric&appid=${apiKey}&lang=es`;

    fetch(urlClima)
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            mostrarClimaActual(data);
            actualizarReloj(data.timezone); // 🔥 MOVIDO AQUÍ
        })
        .catch(error => {
            climaActualDiv.innerHTML = '<p class="error-msg">No se pudo obtener la información del clima.</p>';
            console.error(error);
        });

    fetch(urlForecast)
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => obtenerPrediccion(data))
        .catch(error => console.error("Error obteniendo el pronóstico:", error));
}

function obtenerPrediccion(data) {
    let pronosticoPorDia = {}; // Objeto para almacenar datos por día

    data.list.forEach(item => {
        const fecha = new Date(item.dt * 1000);
        const dia = fecha.toLocaleDateString("es-ES", { weekday: "long" }); // Día en español

        if (!pronosticoPorDia[dia]) {
            pronosticoPorDia[dia] = {
                min: item.main.temp,
                max: item.main.temp,
                icono: item.weather[0].icon,
                descripcion: item.weather[0].description
            };
        } else {
            pronosticoPorDia[dia].min = Math.min(pronosticoPorDia[dia].min, item.main.temp);
            pronosticoPorDia[dia].max = Math.max(pronosticoPorDia[dia].max, item.main.temp);
        }
    });

    mostrarPrediccion(pronosticoPorDia);
}
function mostrarPrediccion(pronostico) {
    let html = "<h3>Pronóstico para los próximos días:</h3><div class='forecast-container'>";

    const hoy = new Date().toLocaleDateString("es-ES", { weekday: "long" });

    Object.keys(pronostico).forEach(dia => {
        if (dia !== hoy) { // 🔥 Excluir el día actual
            const { min, max, icono, descripcion } = pronostico[dia];
            const iconUrl = `http://openweathermap.org/img/w/${icono}.png`;

            html += `
                <div class="forecast-card">
                    <h4>${dia}</h4>
                    <img src="${iconUrl}" alt="${descripcion}">
                    <p>${descripcion.charAt(0).toUpperCase() + descripcion.slice(1)}</p>
                    <p>🌡️ ${min.toFixed(1)}°C - ${max.toFixed(1)}°C</p>
                </div>
            `;
        }
    });

    html += "</div>";
    document.getElementById("pronostico").innerHTML = html;
}

function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const url = `${apiEndpoint}weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=es`;
            
            fetch(url)
                .then(res => res.json())
                .then(data => mostrarClimaActual(data))
                .catch(err => console.error("Error obteniendo ubicación:", err));
        });
    } else {
        alert("Tu navegador no admite geolocalización.");
    }
}
function actualizarReloj(timezone) {
    function mostrarHora() {
        const ahora = new Date();
        const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
        const horaLocal = new Date(utc + (timezone * 1000));
        document.getElementById("reloj").innerText = `🕒 Hora local: ${horaLocal.toLocaleTimeString()}`;
    }
    mostrarHora(); // Muestra la hora inmediatamente
    setInterval(mostrarHora, 1000); // Actualiza cada segundo
}

