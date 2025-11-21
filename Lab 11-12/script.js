function navigateTo(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active-screen'));

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active-screen');
    }
}

function toggleVariant() {
    const checkbox = document.getElementById('ab-switch');
    const screen = document.getElementById('screen-dashboard');
    
    if (checkbox.checked) {
        // Switch to Classic Green (Variant B in this context, or "My Style")
        screen.classList.add('theme-green');
    } else {
        // Switch to Modern Blue (Default)
        screen.classList.remove('theme-green');
    }
}
