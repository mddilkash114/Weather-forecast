
const apiUrl = CONFIG.API_URL;

const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const weatherInfo = document.getElementById('weatherInfo');
const errorMessage = document.getElementById('errorMessage');
const loadingElement = document.querySelector('.loading');

const feelsLikeElement = document.getElementById('feelsLike');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('windSpeed');
const weatherIconElement = document.getElementById('weatherIcon');

const rainElement = document.getElementById('rain');
const cloudsElement = document.getElementById('clouds');
const pressureElement = document.getElementById('pressure');
const sunriseElement = document.getElementById('sunrise');
const sunsetElement = document.getElementById('sunset');
const visibilityElement = document.getElementById('visibility');

const installPrompt = document.getElementById('installPrompt');
const installButton = document.getElementById('installButton');
const cancelInstall = document.getElementById('cancelInstall');

let deferredPrompt;
let map;
let marker;

searchButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeather(location);
    } else {
        showError('Please enter a city name');
    }
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const location = locationInput.value.trim();
        if (location) {
            fetchWeather(location);
        } else {
            showError('Please enter a city name');
        }
    }
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    setTimeout(() => {
        installPrompt.style.display = 'block';
    }, 3000);
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installPrompt.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

cancelInstall.addEventListener('click', () => {
    installPrompt.style.display = 'none';
});

function initMap(lat = 51.505, lon = -0.09) {
    if (!map) {
        map = L.map('map').setView([lat, lon], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            fetchWeatherByCoords(lat, lng);
        });

        if (window.ResizeObserver) {
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                const resizeObserver = new ResizeObserver(() => {
                    if (map) {
                        map.invalidateSize();
                    }
                });
                resizeObserver.observe(mapContainer);
            }
        }
    } else {
        map.setView([lat, lon], 8);
    }

    if (marker) {
        marker.setLatLng([lat, lon]);
    } else {
        marker = L.marker([lat, lon]).addTo(map);
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

window.addEventListener('resize', () => {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }
});

function fetchWeather(location) {
    loadingElement.style.display = 'block';
    weatherInfo.classList.remove('active');
    weatherInfo.style.display = 'none';
    errorMessage.style.display = 'none';

    const url = `${apiUrl}?q=${encodeURIComponent(location)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found. Please check the spelling.');
                } else if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your API configuration.');
                } else {
                    throw new Error('Weather service unavailable. Please try again later.');
                }
            }
            return response.json();
        })
        .then(data => {
            displayWeather(data);
        })
        .catch(error => {
            showError(error.message);
        })
        .finally(() => {
            loadingElement.style.display = 'none';
        });
}

function fetchWeatherByCoords(lat, lon) {
    loadingElement.style.display = 'block';
    errorMessage.style.display = 'none';

    const url = `${apiUrl}?lat=${lat}&lon=${lon}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your API configuration.');
                } else {
                    throw new Error('Weather service unavailable. Please try again later.');
                }
            }
            return response.json();
        })
        .then(data => {
            displayWeather(data, lat, lon);
        })
        .catch(error => {
            showError(error.message);
        })
        .finally(() => {
            loadingElement.style.display = 'none';
        });
}

function displayWeather(data, clickedLat, clickedLon) {
    locationElement.textContent = `${data.name}, ${data.sys.country}`;
    temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
    descriptionElement.textContent = data.weather[0].description;

    feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidityElement.textContent = `${data.main.humidity}%`;
    windSpeedElement.textContent = `${data.wind.speed} m/s`;

    const rainVolume = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : null;
    if (rainVolume !== null) {
        rainElement.textContent = `${rainVolume} mm`;
        rainElement.style.color = '#333';
    } else {
        rainElement.textContent = 'No rain';
        rainElement.style.color = '#aaa';
    }

    cloudsElement.textContent = `${data.clouds.all}%`;
    pressureElement.textContent = `${data.main.pressure} hPa`;

    const sunriseTime = new Date(data.sys.sunrise * 1000);
    const sunsetTime = new Date(data.sys.sunset * 1000);

    sunriseElement.textContent = sunriseTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    sunsetElement.textContent = sunsetTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    const visibilityKm = data.visibility ? (data.visibility / 1000).toFixed(1) : null;
    if (visibilityKm !== null) {
        visibilityElement.textContent = `${visibilityKm} km`;
        visibilityElement.style.color = '#333';
    } else {
        visibilityElement.textContent = 'N/A';
        visibilityElement.style.color = '#aaa';
    }

    const iconCode = data.weather[0].icon;

    weatherIconElement.innerHTML =
        `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" 
        alt="${data.weather[0].description}">`;

    weatherInfo.classList.add('active');
    weatherInfo.style.display = 'grid';
    errorMessage.style.display = 'none';

    const lat = clickedLat !== undefined ? clickedLat : data.coord.lat;
    const lon = clickedLon !== undefined ? clickedLon : data.coord.lon;

    initMap(lat, lon);
    marker.bindPopup(
        `<b>${data.name}</b><br>${Math.round(data.main.temp)}°C, ${data.weather[0].description}`
    ).openPopup();
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    weatherInfo.classList.remove('active');
    weatherInfo.style.display = 'none';
}

window.addEventListener('load', () => {
    fetchWeather('London');
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}