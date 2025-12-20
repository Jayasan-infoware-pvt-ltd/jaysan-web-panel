import { Zap, Box, Receipt, Wrench, BarChart2, LogOut } from 'lucide';

export function renderSidebar(container, navigateCallback) {
    // Icons need to be lucide names as strings if we are using the CDN script, 
    // or we can just use SVG strings/components if we were in React.
    // Since we are vanilla and using lucide global, we will use data-lucide attributes.

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'stock', label: 'Stock Management', icon: 'box' },
        { id: 'billing', label: 'New Invoice', icon: 'receipt' },
        { id: 'invoices', label: 'Invoice History', icon: 'file-text' }, // New
        { id: 'repairs', label: 'Repair Board', icon: 'wrench' },
        { id: 'repair-history', label: 'All Repairs List', icon: 'clipboard-list' }, // New
    ];

    container.innerHTML = `
        <div class="p-6 flex items-center space-x-3 border-b border-slate-700/50">
            <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
               <i data-lucide="zap" class="text-white w-5 h-5"></i>
            </div>
            <span class="font-bold text-lg tracking-wide">RepairCmd</span>
        </div>

        <nav class="mt-6 px-4 space-y-2">
            ${menuItems.map(item => `
                <button 
                    data-view="${item.id}"
                    class="nav-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 group"
                >
                    <i data-lucide="${item.icon}" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                    <span class="font-medium">${item.label}</span>
                </button>
            `).join('')}
        </nav>

        <div class="absolute bottom-0 w-full p-4 border-t border-slate-700/50">
            <button class="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors">
                <i data-lucide="log-out" class="w-5 h-5"></i>
                <span class="font-medium">Logout</span>
            </button>
        </div>
    `;

    // Re-initialize icons
    if (window.lucide) window.lucide.createIcons();

    // Event Listeners
    container.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Active state
            container.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('bg-accent', 'text-white', 'shadow-lg', 'shadow-accent/20');
                b.classList.add('text-slate-300');
            });
            btn.classList.add('bg-accent', 'text-white', 'shadow-lg', 'shadow-accent/20');
            btn.classList.remove('text-slate-300');

            navigateCallback(btn.dataset.view);
        });
    });

    // Set active default
    const defaultBtn = container.querySelector('[data-view="dashboard"]');
    if (defaultBtn) defaultBtn.click();
}
