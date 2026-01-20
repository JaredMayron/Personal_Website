function initTheme() {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');

    if (!themeToggleBtn) return;

    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        if (themeToggleLightIcon) themeToggleLightIcon.classList.remove('d-none');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('d-none');
        document.documentElement.setAttribute('data-theme', 'light');
    }

    themeToggleBtn.addEventListener('click', function () {
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.toggle('d-none');
        if (themeToggleLightIcon) themeToggleLightIcon.classList.toggle('d-none');

        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });
}

function initNavbar() {
    function navbarAdjust() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        if (window.innerWidth < 768) {
            navbar.classList.add('fixed-top');
            document.body.classList.add('has-fixed-navbar');
        } else {
            navbar.classList.remove('fixed-top');
            document.body.classList.remove('has-fixed-navbar');
        }
    }

    navbarAdjust();
    window.addEventListener('resize', navbarAdjust);
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavbar();
});
