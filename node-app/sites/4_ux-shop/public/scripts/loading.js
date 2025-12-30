document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        document.querySelector('.loading-container').style.display = 'none';
        document.querySelector('.header-hide').style.display = 'block';
        document.querySelector('.body-hide').style.display = 'block';
        document.querySelector('.footer-hide').style.display = 'block';
    }, -100);
    // }, 2300);
});