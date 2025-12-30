document.addEventListener("DOMContentLoaded", function () {
    const fontCards = document.querySelectorAll(".font-card");
    const cartList = document.getElementById("cart-list");
    const generateLinkBtn = document.getElementById("generate-link");
    const generatedLink = document.getElementById("generated-link");

    let cart = [];

    function updateFontPreview() {
        document.querySelectorAll(".preview-text").forEach(el => {
            const font = el.dataset.font;
            const italic = document.querySelector(`.italic-toggle[data-font='${font}']`).checked ? "italic" : "normal";
            const weight = document.querySelector(`.weight-slider[data-font='${font}']`).value;
            const width = document.querySelector(`.width-slider[data-font='${font}']`).value;

            el.style.fontStyle = italic;
            el.style.fontWeight = weight;
            el.style.fontStretch = width + "%";
        });
    }

    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", updateFontPreview);
    });

    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", function () {
            const font = this.dataset.font;
            const italic = document.querySelector(`.italic-toggle[data-font='${font}']`).checked ? 1 : 0;
            const weight = document.querySelector(`.weight-slider[data-font='${font}']`).value;
            const width = document.querySelector(`.width-slider[data-font='${font}']`).value;

            const fontEntry = `${font}:ital@${italic};wdth@${width};wght@${weight}`;

            if (!cart.includes(fontEntry)) {
                cart.push(fontEntry);
                const li = document.createElement("li");
                li.textContent = fontEntry;
                cartList.appendChild(li);
            }
        });
    });

    generateLinkBtn.addEventListener("click", function () {
        if (cart.length === 0) {
            alert("Корзина пуста!");
            return;
        }

        const encodedFamilies = cart.map(family => encodeURIComponent(family)).join("&family=");
        const fullURL = `${window.location.origin}/css2?family=${encodedFamilies}&display=swap`;

        generatedLink.value = fullURL;
        generatedLink.select();
        document.execCommand("copy");
        alert("✅ Ссылка скопирована!");
    });
});