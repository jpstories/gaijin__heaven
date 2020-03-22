const inputCitiesFrom = document.querySelector('.input__cities-from'),
    inputCitiesTo = document.querySelector('.input__cities-to'),
    dropdownCitiesFrom = document.querySelector('.dropdown__cities-from'),
    dropdownCitiesTo = document.querySelector('.dropdown__cities-to'),
    buttonSearch = document.querySelector('.button__search'),
    inputBox = document.querySelector('.input'),
    formSearch = document.querySelector('.form-search'),
    inputDate = document.querySelector('.input__date-depart'),
    wrap = document.querySelector('.wrap');

// Тесты
// inputCitiesFrom.value = 'Хабаровск';
// inputCitiesTo.value = 'Токио';
// inputDate.value = '2020-03-27';

//Необходимые данные для запросов на сервера
const cityAPI = 'http://api.travelpayouts.com/data/ru/cities.json',
    proxy = 'https://cors-anywhere.herokuapp.com/',
    api_key = '2a9490894bbd098888e4bc0ba43d9fc8',
    calendar = 'http://min-prices.aviasales.ru/calendar_preload';

//Пустые массивы, сохраняем в них полученные данные с сервера
let cities = [];
let citiesRU = [];
let citiesJP = [];
let city_RU_JP = [];

//Блок для карточек
const priceList = document.createElement('div');
priceList.classList.add('priceList');
wrap.append(priceList);

//Лоадер
let loader = document.createElement('div');
loader.classList.add('loader');

//Получаем данные с сервера
const getData = (url, callback) => {
    const request = new XMLHttpRequest();

    request.open('GET', url);
    request.addEventListener('readystatechange', () => {
        if (request.readyState !== 4) return;
        if (request.status === 200) {
            callback(request.response);
        } else {
            console.error('Error:' + request.status);
        }
    });
    request.send();
};

//Отправляем запрос на сервер API, сортируем полученные данные по странам и регионам
getData(proxy + cityAPI, (data) => {
    cities = JSON.parse(data).filter(city => city.name); //remove Null
    cities.forEach(city => {
        if (city.country_code == "RU" && city.time_zone.includes('Asia')) {
            return citiesRU.push(city);
        }
        else if (city.country_code == "JP" && city.time_zone.includes('Asia')) {
            return citiesJP.push(city);
        }
    });
    //Соединяем 2 массива обьектов(RU, JP) в 1, для удобства
    city_RU_JP = citiesRU.concat(citiesJP);
    //Сортируем массив по алфавиту
    const citySort = (cityArray) =>{
        cityArray.sort((a, b) => {
            if (a.name > b.name) return 1;
            if (a.name < b.name) return -1;
            return 0;
        });
    };
    citySort(city_RU_JP);
});

// Функция вывода городов на странице
const showCity = (input, ul) => {
    if (input.value === '') return ul.remove();
    inputBox.append(ul);
    ul.textContent = '';

    const citiesFilter = city_RU_JP.filter(city => city.name.toLowerCase().includes(input.value.toLowerCase()));

    citiesFilter.forEach(city => {
        const li = document.createElement('li');
        li.classList.add('dropdown__city');
        li.textContent = city.name;
        ul.append(li);

        li.addEventListener('click', () => {
            input.value = li.textContent;
            ul.remove();
        });
    });
}

//События
inputCitiesFrom.addEventListener('input', () => {
    showCity(inputCitiesFrom, dropdownCitiesFrom);
});

inputCitiesTo.addEventListener('input', () => {
    showCity(inputCitiesTo, dropdownCitiesTo);
});

document.addEventListener('click', (e) => {
    if (e.target != inputCitiesFrom && e.target != inputCitiesTo) {
        dropdownCitiesFrom.remove();
        dropdownCitiesTo.remove();
    };
});

// Получаем данные с сервера, выводим рендерные данные, лоадер
formSearch.addEventListener('submit', (event) => {
    priceList.append(loader);
    event.preventDefault();

    // Ищем в массиве введеный город, берем оттуда код города
    const cityFrom = city_RU_JP.find((item) => {
        return item.name === inputCitiesFrom.value
    });
    // Ищем в массиве введеный город, берем оттуда код города
    const cityTo = city_RU_JP.find((item) => {
        return item.name === inputCitiesTo.value
    });
    //Формируем настройки запроса для API календарь цен
    const calendarOption = `?depart_date=${inputDate.value}&origin=${cityFrom.code}&destination=${cityTo.code}&one_way=true`;

    //Посылаем запрос на сервер, формируем url, получаем ответ
    getData(proxy + calendar + calendarOption, (response) => {
        //Парсим полученные данные в обьект
        const ticketValue = JSON.parse(response);
        const bestPrice = ticketValue.best_prices;
        //Заходим в массив с обьектами, в каждом обьекте ищем ключ value, сортируем по значению
        const responseSort = () =>{
            bestPrice.sort((a, b) => {
                if (a.value > b.value) return 1;
                if (a.value < b.value) return -1;
                return 0;
            });
        };
        //Сортируем обьект по введенной дате, формируем карточку
        const ticketCreate = () =>{
            bestPrice.forEach((item) => {
                if (item.depart_date === inputDate.value) {
                    const spanTicket = document.createElement('span');
                    spanTicket.innerHTML = `<div class="ticketCurrentDate">
                                                <span>Дата отправки: ${item.depart_date}</span>
                                                <span>Продавец: ${item.gate}</span>
                                                <span>Цена: <mark>${item.value}</mark> руб.</span>
                                                <button>В корзину</button>
                                            </div>`;
                    priceList.append(spanTicket);
                };
            });
        };
        responseSort();
        ticketCreate();
        loader.remove();
    });
});