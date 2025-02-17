const apiEndpoint = 'https://api.openweathermap.org/data/2.5/';
const apiKey = 'a6c70ff6ee453d0222a396af6c64552f';

const ubicacionInput = document.getElementById('ubicacion');
const paisSelect = document.getElementById('pais');
const buscarClimaButton = document.getElementById('buscar-clima');
const climaActualDiv = document.getElementById('clima-actual');
const requisitosCultivos = {
    mora: { luminosidad: "6-8 horas", precipitacion: "800-1200 mm", humedad: "60-70%", temperatura: "15-25°C" },
    lulo: { luminosidad: "8-10 horas", precipitacion: "1000-1500 mm", humedad: "70-80%", temperatura: "15-20°C" },
    frijol: { luminosidad: "6-8 horas", precipitacion: "500-800 mm", humedad: "50-60%", temperatura: "20-30°C" },
    cafe: { luminosidad: "5-7 horas", precipitacion: "1000-1500 mm", humedad: "70-80%", temperatura: "18-24°C" },
    maiz: { luminosidad: "10-12 horas", precipitacion: "600-800 mm", humedad: "55-75%", temperatura: "20-30°C" },
    arveja: { luminosidad: "6-8 horas", precipitacion: "500-600 mm", humedad: "50-70%", temperatura: "15-20°C" },
    yuca: { luminosidad: "8-10 horas", precipitacion: "1000-1200 mm", humedad: "60-70%", temperatura: "25-30°C" },
    auyama: { luminosidad: "6-8 horas", precipitacion: "800-1000 mm", humedad: "60-70%", temperatura: "20-25°C" },
    papa: { luminosidad: "8-10 horas", precipitacion: "600-800 mm", humedad: "70-80%", temperatura: "15-20°C" },
    cebolla: { luminosidad: "10-12 horas", precipitacion: "500-600 mm", humedad: "60-70%", temperatura: "15-20°C" },
    tomate: { luminosidad: "8-10 horas", precipitacion: "600-800 mm", humedad: "60-70%", temperatura: "20-25°C" },
    naranjas: { luminosidad: "8-10 horas", precipitacion: "600-800 mm", humedad: "50-60%", temperatura: "25-30°C" },
};

let chart;

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

    const temperatura = data.main.temp;
    const humedad = data.main.humidity;
    const condiciones = data.weather[0].description;
    const icono = data.weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/w/${icono}.png`;

    // Verificar las condiciones con respecto al cultivo seleccionado
    const cultivoSeleccionado = document.getElementById("cultivo").value;
    const requisitos = requisitosCultivos[cultivoSeleccionado];

    // Verificar si las condiciones actuales son adecuadas
    let condicionesAdecuadas = true;
    if (temperatura < parseFloat(requisitos.temperatura.split('-')[0]) || temperatura > parseFloat(requisitos.temperatura.split('-')[1])) {
        condicionesAdecuadas = false;
    }
    if (humedad < parseFloat(requisitos.humedad.split('-')[0]) || humedad > parseFloat(requisitos.humedad.split('-')[1])) {
        condicionesAdecuadas = false;
    }

    climaActualDiv.innerHTML = `
        <div class="weather-card">
            <h3>${data.name}, ${data.sys.country}</h3>
            <p class="temp">${temperatura}°C</p>
            <p>🐳 Humedad: ${humedad}%</p>
            <p class="desc">${condiciones.charAt(0).toUpperCase() + condiciones.slice(1)}</p>
            <p>¿Es adecuado para cultivar ${cultivoSeleccionado}? ${condicionesAdecuadas ? 'Sí' : 'No'}</p>
        </div>
    `;
    mostrarGrafico(requisitos); // Mostrar gráfico al cargar el clima
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

    Object.keys(pronostico).forEach(dia => {
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
    });

    html += "</div>";
    document.getElementById("pronostico").innerHTML = html;
}

function mostrarGrafico(requisitos) {
    const container = document.getElementById('graficoContainer');

    const oldCanvas = document.getElementById('graficoCondiciones');
    if (oldCanvas) {
        oldCanvas.remove();
    }

    const nuevoCanvas = document.createElement('canvas');
    nuevoCanvas.id = 'graficoCondiciones';
    nuevoCanvas.width = 500; 
    nuevoCanvas.height = 300; 
    container.appendChild(nuevoCanvas);

    const ctx = nuevoCanvas.getContext('2d');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Luminosidad (h)', 'Precipitación (mm)', 'Humedad (%)', 'Temperatura (°C)'],
            datasets: [
                {
                    label: 'Requisitos óptimos',
                    data: [
                        parseFloat(requisitos.luminosidad.split('-')[0]),
                        parseFloat(requisitos.precipitacion.split('-')[0]),
                        parseFloat(requisitos.humedad.split('-')[0]),
                        parseFloat(requisitos.temperatura.split('-')[0])
                    ],
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

