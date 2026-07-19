document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    initIonIcons();
});

/**
 * Handles the responsive hamburger slide-out mechanism for mobile devices
 */
function initMobileMenu() {
    const hamburgerBtn = document.getElementById("hamburger");
    const navLinks = document.querySelector(".header-nav");

    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevents instant closing
            navLinks.classList.toggle("active");
        });

        // Close menu if a user clicks outside the header frame
        document.addEventListener("click", (e) => {
            if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                navLinks.classList.remove("active");
            }
        });
    }
}

/**
 * Dynamically loads ion-icons required by your bottom tab layout
 */
function initIonIcons() {
    if (!document.querySelector('script[src*="ionicons"]')) {
        const moduleScript = document.createElement("script");
        moduleScript.type = "module";
        moduleScript.src = "https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js";
        document.body.appendChild(moduleScript);

        const noModuleScript = document.createElement("script");
        noModuleScript.noModule = true;
        noModuleScript.src = "https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js";
        document.body.appendChild(noModuleScript);
    }
}