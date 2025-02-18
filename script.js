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

function analizarCultivo() {
    const cultivo = document.getElementById("cultivo").value;
    const resultadosDiv = document.getElementById("resultados");

    const requisitos = requisitosCultivos[cultivo];

    resultadosDiv.innerHTML = `
        <h3>Requisitos para cultivar ${cultivo.charAt(0).toUpperCase() + cultivo.slice(1)}:</h3>
        <ul>
            <li><strong>Luminosidad:</strong> ${requisitos.luminosidad}</li>
            <li><strong>Precipitación:</strong> ${requisitos.precipitacion}</li>
            <li><strong>Humedad:</strong> ${requisitos.humedad}</li>
            <li><strong>Temperatura:</strong> ${requisitos.temperatura}</li>
        </ul>
        <p>¡Verifica si las condiciones de tu suelo son adecuadas!</p>
    `;

    mostrarGrafico(requisitos);
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
                },
                {
                    label: 'Condiciones actuales',
                    data: [9, 650, 62, 21], // Simulación de datos actuales
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#000",
                        font: { size: 14 }
                    }
                },
                x: {
                    ticks: {
                        color: "#000",
                        font: { size: 14 }
                    }
                }
            }
        }
    });
}

// WebSocket para recibir datos del ESP32
const socket = new WebSocket('ws://192.168.0.33:81'); // Reemplaza con la IP de tu ESP32

socket.onopen = function(event) {
    console.log("Conexión WebSocket establecida.");
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log("Datos recibidos:", data);

    // Actualizar los valores en la página
    document.getElementById("temperatura").textContent = data.temperatura.toFixed(2);
    document.getElementById("humedad").textContent = data.humedad.toFixed(2);
    document.getElementById("luz").textContent = data.luz;
};

socket.onerror = function(error) {
    console.error("Error en WebSocket:", error);
};

socket.onclose = function(event) {
    console.log("Conexión WebSocket cerrada.");
};

// Función monitorearCultivo
function monitorearCultivo() {
    document.getElementById("monitoreoResultados").innerHTML = `
        <p>Temperatura: <span id="temperatura">--</span>°C</p>
        <p>Humedad: <span id="humedad">--</span>%</p>
        <p>Luz: <span id="luz">--</span> lux</p>
    `;
}

// Asegúrate de que el código se ejecute solo cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    // Asignar los eventos a los botones
    document.getElementById("analizar").addEventListener("click", analizarCultivo);
    document.getElementById("monitorear").addEventListener("click", monitorearCultivo);
});
