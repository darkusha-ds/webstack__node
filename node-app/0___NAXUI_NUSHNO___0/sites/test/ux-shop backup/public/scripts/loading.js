document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        document.querySelector('.loading-container').style.display = 'none';
        document.querySelector('.home-header').style.display = 'block';
        document.querySelector('.home-body').style.display = 'block';
        document.querySelector('.home-footer').style.display = 'block';
    }, -100);
    // }, 2300);
});