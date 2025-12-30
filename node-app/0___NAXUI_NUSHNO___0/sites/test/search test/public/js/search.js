// public/js/search.js
document.getElementById('search-input').addEventListener('input', function() {
    let query = this.value;
    let suggestionsContainer = document.getElementById('suggestions');

    if (query.length >= 2) {
        window.location.href = `/?query=${query}`;
    }
});
