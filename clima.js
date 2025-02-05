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

function mostrarClimaActual(data) {
    if (data.cod !== 200) {
        climaActualDiv.innerHTML = `<p class="error-msg">Error: ${data.message}</p>`;
        return;
    }

    // 🔥 Ahora sí podemos actualizar el nombre de la ciudad aquí
    document.getElementById("ciudad").innerText = `${data.name}, ${data.sys.country}`;

    const timestamp = data.dt * 1000;
    const fecha = new Date(timestamp);
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = diasSemana[fecha.getDay()];

    const temperatura = data.main.temp;
    const humedad = data.main.humidity;
    const condiciones = data.weather[0].description;
    const icono = data.weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/w/${icono}.png`;

    const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString("es-ES");
    const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString("es-ES");
    const viento = data.wind.speed;

    climaActualDiv.innerHTML = `
        <div class="weather-card">
            <h3>${data.name}, ${data.sys.country}</h3>
            <p>📅 Día: <strong>${diaSemana}</strong></p>
            <img src="${iconUrl}" alt="${condiciones}">
            <p class="temp">${temperatura}°C</p>
            <p>🐳 Humedad: ${humedad}%</p>
            <p>💨 Viento: <strong>${viento} m/s</strong></p>
            <p>🌅 Amanecer: <strong>${sunriseTime}</strong></p>
            <p>🌄 Atardecer: <strong>${sunsetTime}</strong></p>
            <p class="desc">${condiciones.charAt(0).toUpperCase() + condiciones.slice(1)}</p>
            <p id="reloj">🕒 Cargando hora...</p> <!-- 🔥 Aquí aparecerá la hora -->
        </div>
    `;
}

function obtenerPrediccion(data) {
    let pronosticoPorDia = {}; 
    let fechasGuardadas = []; // 🔥 Para asegurarnos de mostrar siempre 5 días

    data.list.forEach(item => {
        const fecha = new Date(item.dt * 1000);
        const dia = fecha.toLocaleDateString("es-ES", { weekday: "long" }); // Nombre del día
        const fechaClave = fecha.toISOString().split("T")[0]; // 🔥 Guardamos la fecha YYYY-MM-DD para comparaciones exactas

        if (!pronosticoPorDia[fechaClave]) {
            pronosticoPorDia[fechaClave] = {
                diaNombre: dia,
                min: item.main.temp,
                max: item.main.temp,
                icono: item.weather[0].icon,
                descripcion: item.weather[0].description
            };
            fechasGuardadas.push(fechaClave);
        } else {
            pronosticoPorDia[fechaClave].min = Math.min(pronosticoPorDia[fechaClave].min, item.main.temp);
            pronosticoPorDia[fechaClave].max = Math.max(pronosticoPorDia[fechaClave].max, item.main.temp);
        }
    });

    mostrarPrediccion(pronosticoPorDia, fechasGuardadas);
}

function mostrarPrediccion(pronostico, fechas) {
    let html = "<h3>Pronóstico para los próximos días:</h3><div class='forecast-container'>";
    const hoy = new Date().toISOString().split("T")[0]; // 🔥 Fecha exacta de hoy

    let diasMostrados = 0;
    for (let i = 0; i < fechas.length; i++) {
        if (fechas[i] !== hoy) { // Excluir hoy
            const { diaNombre, min, max, icono, descripcion } = pronostico[fechas[i]];
            const iconUrl = `http://openweathermap.org/img/w/${icono}.png`;

            html += `
                <div class="forecast-card">
                    <h4>${diaNombre}</h4>
                    <img src="${iconUrl}" alt="${descripcion}">
                    <p>${descripcion.charAt(0).toUpperCase() + descripcion.slice(1)}</p>
                    <p>🌡️ ${min.toFixed(1)}°C - ${max.toFixed(1)}°C</p>
                </div>
            `;

            diasMostrados++;
            // 🔥 Asegurar que mostramos 5 días exactos
        }
    }

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

