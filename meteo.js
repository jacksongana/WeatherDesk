document.getElementById("btnMeteo").addEventListener("click", () => {
    const ville = document.getElementById("villeInput").value;
    getWeatherByCity(ville);
});

document.getElementById("btnGeolocalisation").addEventListener("click", () => {
    getCurrentLocationWeather();
});

function getWeatherByCity(ville) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${ville}&appid=077589f269502227c4975a17ea671359&units=metric&lang=fr`;
    console.log(`Fetching weather data for city: ${ville} from URL: ${apiUrl}`);
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const { lat, lon } = data.coord;
            updateWeatherAndMap(lat, lon, data);
        })
        .catch(error => {
            document.getElementById("result").innerHTML = `<p>Erreur lors de la récupération des données météorologiques : ${error.message}</p>`;
            console.error('Error fetching weather data:', error);
        });
}

function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=077589f269502227c4975a17ea671359&units=metric&lang=fr`;
            console.log(`Fetching weather data for current location from URL: ${apiUrl}`);
            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    updateWeatherAndMap(latitude, longitude, data);
                })
                .catch(error => {
                    document.getElementById("result").innerHTML = `<p>Erreur lors de la récupération des données météorologiques pour votre position : ${error.message}</p>`;
                    console.error('Error fetching weather data for your location:', error);
                });
        });
    } else {
        document.getElementById("result").innerHTML = `<p>La géolocalisation n'est pas prise en charge par votre navigateur.</p>`;
    }
}

function updateWeatherAndMap(lat, lon, weatherData) {
    const meteo = weatherData.weather[0];
    const iconUrl = `http://openweathermap.org/img/wn/${meteo.icon}.png`;

    document.getElementById("result").innerHTML = `
        <h2>Météo actuelle à ${weatherData.name}</h2>
        <p>Temps : ${meteo.description}</p>
        <p>Température : ${weatherData.main.temp}°C</p>
        <img src="${iconUrl}" width="100" height="100" alt="${meteo.description}"/>
    `;

    updateMap(lat, lon, weatherData.name, meteo.description);
    getForecast(lat, lon);
    checkWeatherConditions(weatherData);
}

function getForecast(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=077589f269502227c4975a17ea671359&units=metric&lang=fr`;
    console.log(`Fetching forecast data from URL: ${apiUrl}`);
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            let forecastHTML = `<h2>Prévisions sur 3 jours</h2>`;
            let hourlyForecastHTML = `<h2>Prévisions horaires</h2>`;

            const forecastDays = {};

            data.list.forEach((forecast) => {
                const date = new Date(forecast.dt * 1000);
                const day = date.toLocaleDateString("fr-FR", { weekday: 'long' });

                if (!forecastDays[day]) {
                    forecastDays[day] = [];
                }
                forecastDays[day].push(forecast);
            });

            Object.keys(forecastDays).slice(0, 3).forEach((day, index) => {
                forecastHTML += `
                    <div class="forecast-day">
                        <h3>${day}</h3>
                        ${forecastDays[day].map((forecast) => {
                            const time = new Date(forecast.dt * 1000).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
                            const iconUrl = `http://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;
                            return `
                                <p>Heure : ${time}</p>
                                <p>Météo : ${forecast.weather[0].description}</p>
                                <p>Température : ${forecast.main.temp}°C</p>
                                <img src="${iconUrl}" width="50" height="50" alt="${forecast.weather[0].description}"/>
                            `;
                        }).join('')}
                        </div>
                    `;
    
                    if (index === 0) {
                        hourlyForecastHTML += `
                            <div class="hourly-forecast">
                                <h3>${day}</h3>
                                ${forecastDays[day].slice(0, 8).map((forecast) => {
                                    const time = new Date(forecast.dt * 1000).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
                                    const iconUrl = `http://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;
                                    return `
                                        <p>Heure : ${time}</p>
                                        <p>Météo : ${forecast.weather[0].description}</p>
                                        <p>Température : ${forecast.main.temp}°C</p>
                                        <img src="${iconUrl}" width="50" height="50" alt="${forecast.weather[0].description}"/>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    }
                });
    
                document.getElementById("result").innerHTML += forecastHTML;
                document.getElementById("result").innerHTML += hourlyForecastHTML;
            })
            .catch(error => {
                document.getElementById("result").innerHTML += `<p>Erreur lors de la récupération des prévisions : ${error.message}</p>`;
                console.error('Error fetching forecast data:', error);
            });
    }
    
    let map;
    
    function updateMap(lat, lon, ville, description) {
        if (!map) {
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            map.on('click', onMapClick);
        } else {
            map.setView([lat, lon], 10);
        }
    
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${ville}</b><br>${description}`)
            .openPopup();
    }
    
    function onMapClick(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=077589f269502227c4975a17ea671359&units=metric&lang=fr`;
        console.log(`Fetching weather data for clicked location from URL: ${apiUrl}`);
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                updateWeatherAndMap(lat, lon, data);
            })
            .catch(error => {
                console.error('Error fetching weather data for clicked location:', error);
            });
    }
    
    function checkWeatherConditions(data) {
        if (data.main.temp > 28) {
            showNotification('Alerte Température Élevée', `La température est au-dessus de 28°C !`);
        }
    
        if (data.wind.speed > 10) {
            showNotification('Alerte Vent Fort', 'Il y a du vent fort !');
        }
    
        const severeWeather = data.weather.some(condition =>
            ['Orage', 'Neige', 'Pluie'].includes(condition.main) && condition.description.includes('fort')
        );
    
        if (severeWeather) {
            showNotification('Alerte Météo Sévère', 'Il y a des conditions météorologiques sévères dans votre région !');
        }
    }
    
    function showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            });
        }
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=077589f269502227c4975a17ea671359&units=metric&lang=fr`;
            console.log(`Fetching weather data for current location from URL: ${apiUrl}`);
            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    updateWeatherAndMap(latitude, longitude, data);
                })
                .catch(error => {
                    document.getElementById("result").innerHTML = `<p>Erreur lors de la récupération des données météorologiques pour votre position : ${error.message}</p>`;
                    console.error('Error fetching weather data for your location:', error);
                });
        });
    } else {
        document.getElementById("result").innerHTML = `<p>La géolocalisation n'est pas prise en charge par votre navigateur.</p>`;
    }
    
