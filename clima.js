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

    const pais = paisSelect.value;
    const url = `${apiEndpoint}weather?q=${ubicacion},${pais}&units=metric&appid=${apiKey}&lang=es`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => mostrarClimaActual(data))
        .catch(error => {
            climaActualDiv.innerHTML = '<p class="error-msg">No se pudo obtener la información del clima.</p>';
            console.error(error);
        });
}

function mostrarClimaActual(data) {
    if (data.cod !== 200) {
        climaActualDiv.innerHTML = `<p class="error-msg">Error: ${data.message}</p>`;
        return;
    }

    // Obtener datos adicionales
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
            <p>Humedad: ${humedad}%</p>
            <p>💨 Viento: <strong>${viento} m/s</strong></p>
            <p>🌅 Amanecer: <strong>${sunriseTime}</strong></p>
            <p>🌄 Atardecer: <strong>${sunsetTime}</strong></p>
            <p class="desc">${condiciones.charAt(0).toUpperCase() + condiciones.slice(1)}</p>
        </div>
    `;
}
