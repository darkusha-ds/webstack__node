// Получаем элементы
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const suggestionsContainer = document.getElementById('suggestions');

// Пример данных для подсказок (заменить на динамические данные из базы данных)
const sampleData = [
    'Корм для собак',
    'Игрушки для кошек',
    'Аквариумные растения',
    'Лежанки для животных',
    'Переноски для котов',
    'Витамины для животных',
    'Лакомства для собак'
];

// Функция для выполнения поиска
function performSearch(query) {
    if (query.trim() !== "") {
        alert('Ищем: ' + query);  // Здесь можно заменить на реальную логику поиска
    } else {
        alert('Пожалуйста, введите запрос для поиска!');
    }
}

// Обработчик ввода в поле
searchInput.addEventListener('input', function() {
    let query = this.value;
    
    if (query.length >= 2) {
        const filteredSuggestions = sampleData.filter(item => item.toLowerCase().includes(query.toLowerCase()));

        if (filteredSuggestions.length > 0) {
            suggestionsContainer.innerHTML = filteredSuggestions.map(item => 
                `<div class="suggestion-item">${item}</div>`
            ).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    } else {
        suggestionsContainer.style.display = 'none';
    }
});

// Обработчик клика на подсказку
suggestionsContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('suggestion-item')) {
        searchInput.value = e.target.textContent;
        suggestionsContainer.style.display = 'none';
        performSearch(searchInput.value);  // Выполняем поиск после выбора подсказки
    }
});

// Обработчик нажатия клавиши Enter
searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Предотвращаем отправку формы (если есть)
        performSearch(searchInput.value);  // Выполняем поиск по нажатию Enter
    }
});

// Обработчик для кнопки поиска
searchBtn.addEventListener('click', function() {
    performSearch(searchInput.value);  // Выполняем поиск при клике на кнопку
});
