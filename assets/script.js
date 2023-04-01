class DailyWeather {
    
date = new Date();
   icon = {
     name: '',
     description: '',
    }
    temp = 0;
    humidity = 0;
    constructor(temp, humidity) {
      this.temp = temp;
      this.humidity = humidity;
    }
  
    
    setDate(openWeatherDate) {
      
      this.date = new Date(openWeatherDate * 1000);
      return this;
    }

    setIconName(iconName) {
      this.icon.name = iconName.slice(0, iconName.length - 1) + this.generateIconEnding();
      return this;
    }

    setIconDescription(iconDescription) {
      this.icon.description = iconDescription;
      return this;
    }
}
  

DailyWeather.prototype.generateIconEnding = function() {
    const hour = this.date.getHours();
    return (hour >= 0 && hour < 12) ? 'n' : 'd';
};
  
class CurrentWeather extends DailyWeather{
    windSpeed = 0;
    uv = {
      index: 0,
      color: '',
    };
    constructor(temp, humidity, windSpeed) {
      super(temp, humidity);
      this.windSpeed = windSpeed;
    }
  
    setUV(uvIndex) {
      this.uv.index = uvIndex;
      this.uv.color = this.generateUVIndexColor(uvIndex);
      return this;
    }
}
  

CurrentWeather.prototype.generateUVIndexColor = function(uvIndex) {
    if (uvIndex <= 2) {
      return 'bg-secondary text-white';
    } else if (uvIndex <=5) {
      return 'bg-dark text-white';
    } else if (uvIndex <=7) {
      return 'bg-success text-white';
    } else if (uvIndex <=10) {
      return 'bg-warning text-dark';
    } else {
      return 'bg-danger text-white';
    }
};
  
class WeatherData {
    city = {
      cityName: '',
      lat: '',
      lon: '',
    };
    currentDay;
    nextFiveDays = [];
  
    constructor(cityName, lat, lon) {
      this.city.cityName = cityName;
      this.city.lat = lat;
      this.city.lon = lon;
    }
  
    setCurrentDay(currentDay) {
      this.currentDay = currentDay;
    }
  
    appendToNextFiveDays(day) {
      this.nextFiveDays.push(day);
    }
}
  

WeatherData.prototype.setDays = function (dayList) {
    const listLength = dayList.length;
    dayList.forEach(function(day, index) {
      if (index === 0) {
        this.currentDay.setUV(day.uvi);
      } else if (index <= 5) {
        let nextFiveDay = new DailyWeather(
          day.temp.day,
          day.humidity)
          .setDate(day.dt)
          .setIconName(day.weather[0].icon)
          .setIconDescription(day.weather[0].description);
        this.appendToNextFiveDays(nextFiveDay);
      }
    }.bind(this));
    return this;
}
  
  window.onload = function() {
    const localWeatherObj = getWeatherObjFromLocal();
    if (localWeatherObj) {
      displayInformation(localWeatherObj);
    }
}
  

document.getElementById('search-city').addEventListener('submit', submitSearch);

document.getElementById('search-history').addEventListener('click', submitSearchHistoryEntry);
  

function submitSearchHistoryEntry(event) {
    event.preventDefault();
  
    if (event.target.matches('.search-entry')) {
      startGettingWeatherData(event.target.dataset.cityName);
    }
}
  

function submitSearch(event) {
    event.preventDefault();
    resetSearchError();
    
    const userInput = getUserInput();
  
    if (userInput) {
      startGettingWeatherData(userInput);
    } else {
      document.getElementById('city-name').value = '';
      showSearchError('Please enter a city name');
    }
}
  
function getUserInput() {
    let userInput = document.getElementById('city-name').value;
    userInput = userInput.replace(/\s+/g,' ');
    userInput = userInput.trim();
    return userInput;
}
  
function resetSearchError() {
    document.getElementById('city-name').classList.remove('border-danger');
    document.getElementById('error').textContent = '';
}
  
function showSearchError(message) {
    document.getElementById('city-name').classList.add('border-danger');
    document.getElementById('error').textContent = message;
}
  

const API_KEY = '8364edf40aaaa47bca43e4b4901faf72';
  
function startGettingWeatherData(cityName) {
    if (!isCurrentlyDisplayed(cityName)) {
      fetchData(getCurrentWeatherURL(cityName), processCurrentWeatherData);
    }
}
  

  function fetchData(queryURL, nextAction) {
    fetch(queryURL)
      .then(function(response){
        return response.json();
      }).then(nextAction);
}
  

function processCurrentWeatherData(data) {
    if (data.cod != 200) {
      showSearchError(properlyCapitalize(data.message));
    } else {
      const weatherData = new WeatherData(
        data.name, 
        data.coord.lat,
        data.coord.lon);
      const currentDay = new CurrentWeather(
        data.main.temp,
        data.main.humidity,
        data.wind.speed)
        .setDate(data.dt)
        .setIconName(data.weather[0].icon)
        .setIconDescription(data.weather[0].description);
      weatherData.setCurrentDay(currentDay);
      fetchData(getOneCallURL(data.coord.lat, data.coord.lon), function(data) {
        processOneCallData(data, weatherData);
      });
    }
}
  
function processOneCallData(data, weatherData) {
    const weatherObj = weatherData;
    weatherObj.setDays(data.daily);
  
    displayInformation(weatherObj);
    saveWeatherObjToLocal(weatherObj);
}
  

function getCurrentWeatherURL(cityName) {
    return 'https://api.openweathermap.org/data/2.5/weather?'
     + `q=${cityName}`
     + '&units=imperial'
     + `&appid=${API_KEY}`;
}
  
function getOneCallURL(lat, lon) {
    return 'https://api.openweathermap.org/data/2.5/onecall?'
    + `lat=${lat}`
    + `&lon=${lon}`
    + '&units=imperial'
    + `&appid=${API_KEY}`;
}
  
function displayInformation(weatherObj) {
    resetCityInfo(weatherObj.city.cityName);
    displayOverviewCard(weatherObj.currentDay, weatherObj.city.cityName);
    displayFiveDayForecast(weatherObj.nextFiveDays);
    displayNewSearchEntry(weatherObj.city.cityName);
}
  
function resetCityInfo(cityName) {
    const cityInfo = document.getElementById('city-info');
    cityInfo.setAttribute('data-city', cityName);
    cityInfo.innerHTML = '';
}
  
function displayOverviewCard(currentDay, cityName) {
    const cityInfo = document.getElementById('city-info');
  
    cityInfo.innerHTML +=
      `<div class="row mb-4">
        <div class="col">
          <div class="card" id="display-info">
            <div class="card-body">
              <div class="card-body" id="city-info" data-city="${cityName}">
                <h2 class="d-inline-block mr-3">${cityName} ${formatDate(currentDay.date)}</h2>
                <img class="d-inline-block" src="https://openweathermap.org/img/wn/${currentDay.icon.name}@2x.png" alt="${currentDay.icon.description}">
                <p>Temperature: ${currentDay.temp} &#176;F</p>
                <p>Humidity: ${currentDay.humidity}&#37;</p>
                <p>Wind Speed: ${currentDay.windSpeed} MPH</p>
                <p>UV Index: <span id="current-uv-index" class="${currentDay.uv.color} py-1 px-2 rounded">${currentDay.uv.index}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>`;
}
  
function displayFiveDayForecast(dayList) {
    const cityInfo = document.getElementById('city-info');
    cityInfo.innerHTML += 
      `<div class="row">
        <div class="col">
          <h3>5-Day Forecast:</h3>
            <div class="row" id="five-day-forecast-cards">
            </div>
          </div>
        </div>`;
    const fiveDayForecastCards = document.getElementById('five-day-forecast-cards');
    for (day of dayList) {
      fiveDayForecastCards.innerHTML +=
        `<div class="col-lg" id="five-day-weather-card">
          <div class="card bg-primary text-white">
            <div class="card-body d-flex flex-column justify-content-center align-items-center">
              <p class="h5">${formatDate(day.date)}</p>
              <img class="mb-3" src="https://openweathermap.org/img/wn/${day.icon.name}@2x.png" alt="${day.icon.description}">
              <p>Temp: ${day.temp} &#176;F</p>
              <p>Humidity: ${day.humidity}&#37;</p>
            </div>
          </div>
        </div>`;
    }
}
  
function displayNewSearchEntry(cityName) {
    const searchHistoryList = document.getElementById('search-history');
    if (!isExistingSearch(cityName, searchHistoryList)) {
    searchHistoryList.innerHTML += 
    `<li class="list-group-item search-entry" data-city-name="${cityName}">${cityName}</li>`;
    }
}
  
function isExistingSearch(cityName, searchHistoryList) {
    const searchHistoryItems = searchHistoryList.children;

    for (item of searchHistoryItems) {
      if (item.dataset.cityName === cityName) {
        return true;
      }
    }
    return false;
}
  
function isCurrentlyDisplayed(cityName) {
    const currentDisplay = document.getElementById('city-info').dataset.city;
    return currentDisplay === cityName ? true : false; 
}

function formatDate(date) {
    const newDate = new Date(date);
    return `(${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()})`;
}
  
function properlyCapitalize(str) {
    let copy = str.toString().toLowerCase();
    return copy.charAt(0).toUpperCase() + copy.slice(1);
}

function saveWeatherObjToLocal(weatherObj) {
    localStorage.setItem('weatherObj', JSON.stringify(weatherObj));
}
  
function getWeatherObjFromLocal() {
    let weatherObj = localStorage.getItem('weatherObj');
    return weatherObj ? JSON.parse(weatherObj) : null;
}
   