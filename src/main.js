import './style.css'
import { renderSidebar } from './modules/layout.js'
import { initStock } from './modules/stock.js'
import { initBilling } from './modules/billing.js'
import { initRepairs } from './modules/repairs.js'
import { initAnalytics } from './modules/analytics.js'
import { checkAuth, renderLogin } from './modules/auth.js'

const app = document.querySelector('#app')
const loading = document.querySelector('#loading')

// State
let currentState = {
    view: 'dashboard', // dashboard, stock, billing, repairs
    user: null
}

async function init() {
    // Check session
    // For demo simplicity, we will assume logged in effectively if keys are present or just show layout
    // Real app would wait for checkAuth

    // Simulate loading
    setTimeout(() => {
        loading.style.display = 'none';
        renderApp();
    }, 500);
}

function renderApp() {
    app.innerHTML = '';

    // Layout Shell
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.className = 'w-64 h-full sidebar-glass flex-shrink-0 transition-all duration-300';

    const main = document.createElement('main');
    main.id = 'main-content';
    main.className = 'flex-1 h-full overflow-y-auto bg-background p-8';

    app.appendChild(sidebar);
    app.appendChild(main);

    // Initial Renders
    renderSidebar(sidebar, setCurrentView);
    navigateTo('dashboard');
}

function setCurrentView(view) {
    currentState.view = view;
    navigateTo(view);
}

function navigateTo(view) {
    const main = document.querySelector('#main-content');
    main.innerHTML = ''; // Clear current

    switch (view) {
        case 'dashboard':
            initAnalytics(main);
            break;
        case 'stock':
            initStock(main);
            break;
        case 'billing':
            initBilling(main);
            break;
        case 'repairs':
            initRepairs(main);
            break;
        default:
            main.innerHTML = '<h1 class="text-2xl">Page Not Found</h1>';
    }
}

init();
