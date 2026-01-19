import { supabase } from '../supabase.js';
import { Chart } from 'chart.js/auto'; // Fix import if needed, assuming global or module
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function initAnalytics(container, navigateFn) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header & Controls -->
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                     <h2 class="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
                     <p class="text-slate-500 text-sm mt-1">Overview of your business performance</p>
                </div>
               
                <div class="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <div class="flex items-center gap-2 px-2" id="month-picker-container">
                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period</span>
                        <input type="month" id="dashboard-month-picker" class="bg-slate-50 border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer rounded px-2 py-1" value="${new Date().toISOString().slice(0, 7)}">
                    </div>
                    <div class="w-px h-6 bg-slate-200"></div>
                    <button id="all-time-btn" class="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 transition-colors border border-transparent">
                        All Time
                    </button>
                </div>
            </div>
            
            <!-- Stat Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <!-- Total Revenue (All Time) -->
                <div class="bg-slate-800 rounded-xl p-6 text-white shadow-lg shadow-slate-800/20 relative overflow-hidden group hover:shadow-xl transition-shadow">
                    <div class="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                         <i data-lucide="infinity" class="w-10 h-10 text-emerald-400"></i>
                    </div>
                    <h3 class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue (Lifetime)</h3>
                    <p class="text-3xl font-bold text-emerald-400" id="all-time-revenue-card">₹0</p>
                    <div class="mt-4 flex items-center text-xs text-slate-400 font-medium">
                        <span class="bg-slate-700 px-2 py-1 rounded-full text-white">All Time</span>
                    </div>
                </div>

                <!-- Sales -->
                <div class="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i data-lucide="trending-up" class="w-10 h-10 text-blue-600"></i>
                    </div>
                    <h3 class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2" id="label-sales">Total Revenue</h3>
                    <p class="text-3xl font-bold text-slate-800" id="month-sales-card">₹0</p>
                    <div class="mt-4 flex items-center text-xs text-blue-600 font-medium">
                        <span class="bg-blue-50 px-2 py-1 rounded-full">Revenue</span>
                    </div>
                </div>
                
                <!-- Expenditure -->
                <div class="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.1)] relative overflow-hidden group hover:shadow-md transition-shadow">
                     <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i data-lucide="wallet" class="w-10 h-10 text-rose-600"></i>
                    </div>
                     <h3 class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2" id="label-exp">Total Expenditure</h3>
                     <p class="text-3xl font-bold text-slate-800" id="month-expenditure-card">₹0</p>
                     <div class="mt-4 flex items-center text-xs text-rose-600 font-medium">
                        <span class="bg-rose-50 px-2 py-1 rounded-full">Expenses</span>
                    </div>
                </div>

                <!-- Net Profit -->
                <div class="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:shadow-md transition-shadow">
                     <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i data-lucide="piggy-bank" class="w-10 h-10 text-emerald-600"></i>
                    </div>
                     <h3 class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2" id="label-profit">Net Profit</h3>
                     <p class="text-3xl font-bold text-slate-800" id="net-profit-card">₹0</p>
                     
                     <div class="mt-4 flex justify-between items-center">
                        <span class="bg-emerald-50 text-emerald-600 text-xs font-medium px-2 py-1 rounded-full">After COGS & Exp</span>
                        <button id="download-financial-report" class="text-slate-400 hover:text-blue-600 transition-colors p-1 hover:bg-slate-100 rounded" title="Download Full Financial Report">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                 <!-- Active Repairs -->
                 <div class="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(139,92,246,0.1)] relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <i data-lucide="wrench" class="w-10 h-10 text-purple-600"></i>
                    </div>
                    <h3 class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Active Repairs</h3>
                    <p class="text-3xl font-bold text-slate-800" id="active-repairs">0</p>
                    <div class="mt-4 flex items-center text-xs text-purple-600 font-medium">
                        <span class="bg-purple-50 px-2 py-1 rounded-full">In Progress</span>
                    </div>
                </div>
            </div>

            <!-- Chart Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="font-bold text-slate-700 mb-6 flex items-center gap-2 text-sm">
                        <i data-lucide="bar-chart-3" class="w-4 h-4 text-slate-400"></i>
                        Sales Trend
                    </h3>
                    <div class="h-64">
                         <canvas id="sales-chart"></canvas>
                    </div>
                </div>
                
                 <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="font-bold text-slate-700 mb-6 flex items-center gap-2 text-sm">
                        <i data-lucide="pie-chart" class="w-4 h-4 text-slate-400"></i>
                        Repair Status
                    </h3>
                    <div class="h-64 flex justify-center items-center">
                         <canvas id="repair-chart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity Section (Grid) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Recent Transactions -->
                <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col h-full">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-slate-700 flex items-center gap-2 text-sm">
                            <i data-lucide="shopping-cart" class="w-4 h-4 text-emerald-500"></i>
                            Recent Sales
                        </h3>
                        <button id="view-all-txns" class="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors">View All</button>
                    </div>
                    <div class="flex-1 overflow-auto max-h-[300px]">
                        <table class="w-full text-left border-collapse">
                             <thead class="sticky top-0 bg-white shadow-sm z-10">
                                <tr class="text-xs text-slate-400 border-b border-slate-100">
                                    <th class="pb-2 font-normal pl-2">Details</th>
                                    <th class="pb-2 font-normal text-right pr-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody id="recent-txns" class="text-sm text-slate-600 divide-y divide-slate-50"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent Expenditure -->
                <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col h-full">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-slate-700 flex items-center gap-2 text-sm">
                            <i data-lucide="credit-card" class="w-4 h-4 text-rose-500"></i>
                            Recent Expenses
                        </h3>
                         <button id="view-all-exp" class="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors">View All</button>
                    </div>
                    <div class="flex-1 overflow-auto max-h-[300px]">
                         <table class="w-full text-left border-collapse">
                             <thead class="sticky top-0 bg-white shadow-sm z-10">
                                <tr class="text-xs text-slate-400 border-b border-slate-100">
                                    <th class="pb-2 font-normal pl-2">Description</th>
                                    <th class="pb-2 font-normal text-right pr-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody id="recent-exp" class="text-sm text-slate-600 divide-y divide-slate-50"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent Queries -->
                <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col h-full">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-slate-700 flex items-center gap-2 text-sm">
                            <i data-lucide="message-square" class="w-4 h-4 text-purple-500"></i>
                            Recent Queries
                        </h3>
                         <button id="view-all-queries" class="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors">View All</button>
                    </div>
                    <div class="flex-1 overflow-auto max-h-[300px]">
                         <table class="w-full text-left border-collapse">
                            <thead class="sticky top-0 bg-white shadow-sm z-10">
                                <tr class="text-xs text-slate-400 border-b border-slate-100">
                                    <th class="pb-2 font-normal pl-2">Customer / Req</th>
                                    <th class="pb-2 font-normal text-right pr-2">Status</th>
                                </tr>
                            </thead>
                            <tbody id="recent-queries" class="text-sm text-slate-600 divide-y divide-slate-50"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Elements
    const monthPicker = container.querySelector('#dashboard-month-picker');
    const allTimeBtn = container.querySelector('#all-time-btn');
    const monthPickerContainer = container.querySelector('#month-picker-container');

    const salesCard = container.querySelector('#month-sales-card');
    const expCard = container.querySelector('#month-expenditure-card');
    const profitCard = container.querySelector('#net-profit-card');

    const lblSales = container.querySelector('#label-sales');
    const lblExp = container.querySelector('#label-exp');
    const lblProfit = container.querySelector('#label-profit');

    let salesChartInstance = null;
    let repairChartInstance = null;
    let isAllTime = false;

    // --- Main Fetch Logic ---
    async function loadDashboardData() {
        // 1. Fetch Bills (without join due to missing FK)
        let billsQuery = supabase.from('bills').select('*');
        let expQuery = supabase.from('expenditures').select('*');

        // Prepare simple all-time query for the new card
        const allTimeBillsQuery = supabase.from('bills').select('total_amount');

        // Fetch Products for Dynamic COGS (Current Buy Price)
        const { data: products } = await supabase.from('products').select('id, cost_price');
        const productMap = new Map((products || []).map(p => [p.id, Number(p.cost_price) || 0]));

        if (isAllTime) {
            // ... existing logic ...
            // Update UI State for All Time
            allTimeBtn.classList.add('bg-slate-800', 'text-white');
            allTimeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
            monthPicker.disabled = true;
            monthPickerContainer.classList.add('opacity-50');

            lblSales.textContent = 'Sales (All Time)';
            lblExp.textContent = 'Expenditure (All Time)';
            lblProfit.textContent = 'Net Profit (All Time)';
        } else {
            // ... existing logic ...
            // Update UI State for Monthly
            allTimeBtn.classList.remove('bg-slate-800', 'text-white');
            allTimeBtn.classList.add('text-slate-600', 'hover:bg-slate-100');
            monthPicker.disabled = false;
            monthPickerContainer.classList.remove('opacity-50');

            lblSales.textContent = 'Sales (Selected Month)';
            lblExp.textContent = 'Expenditure (Selected Month)';
            lblProfit.textContent = 'Net Profit (Selected Month)';

            const selectedMonth = monthPicker.value; // YYYY-MM
            if (!selectedMonth) return;

            const [year, month] = selectedMonth.split('-');
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

            lblSales.textContent = `Sales (${new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })})`;
            lblExp.textContent = `Expenditure (${new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })})`;
            lblProfit.textContent = 'Net Profit';

            billsQuery = billsQuery.gte('created_at', startDate).lte('created_at', endDate);
            expQuery = expQuery.gte('created_at', startDate).lte('created_at', endDate);
        }

        // Execute Queries
        const { data: bills, error: billsError } = await billsQuery;
        const { data: expenses, error: expError } = await expQuery;
        const { data: allTimeBills } = await allTimeBillsQuery;

        if (billsError) console.error('Error fetching bills:', billsError);
        if (expError) console.error('Error fetching expenses:', expError);

        // --- Manual Join for Bill Items (Fix for missing FK) ---
        let billItems = [];
        if (bills && bills.length > 0) {
            const billIds = bills.map(b => b.id);
            // Fetch items in chunks if too many, but for now simple IN clause
            // Note: Supabase limits URL length, so if billIds is huge this might fail (need chunking later if scale grows)
            const { data: items, error: itemsError } = await supabase
                .from('bill_items')
                .select('*')
                .in('bill_id', billIds);

            if (!itemsError && items) {
                billItems = items;
            }
        }

        // 2. Calculate Totals
        const totalSales = bills?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
        const totalExp = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

        // Calculate All Time Revenue separate
        const allTimeRevenue = allTimeBills?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

        // 3. Calculate COGS (Dynamic)
        let totalCOGS = 0;
        billItems.forEach(item => {
            // Prefer current product cost, fallback to historical cost_at_sale
            const currentCost = productMap.get(item.product_id) ?? Number(item.cost_at_sale) ?? 0;
            const qty = Number(item.quantity) || 1;
            totalCOGS += currentCost * qty;
        });

        const netProfit = (totalSales - totalCOGS) - totalExp;

        // 4. Update UI
        salesCard.textContent = `₹${totalSales.toLocaleString()}`;
        expCard.textContent = `₹${totalExp.toLocaleString()}`;
        profitCard.textContent = `₹${netProfit.toLocaleString()}`;

        // Update All Time Card
        const allTimeCard = container.querySelector('#all-time-revenue-card');
        if (allTimeCard) allTimeCard.textContent = `₹${allTimeRevenue.toLocaleString()}`;


        if (netProfit < 0) {
            profitCard.classList.remove('text-slate-800');
            profitCard.classList.add('text-rose-500');
        } else {
            profitCard.classList.add('text-slate-800');
            profitCard.classList.remove('text-rose-500');
        }

        profitCard.parentElement.setAttribute('title',
            `Sales: ${totalSales} - COGS: ${totalCOGS} - Exp: ${totalExp} = ${netProfit}`
        );

        // 5. Update Chart
        const [year, month] = monthPicker.value.split('-');
        updateSalesChart(bills, isAllTime ? null : year, isAllTime ? null : month);
    }

    // --- Chart Logic ---
    function updateSalesChart(bills, year, month) {
        let labels, data;

        if (isAllTime || !year) {
            // Aggregate by Month for All Time
            const sortedBills = bills?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) || [];
            const monthlyData = {};

            sortedBills.forEach(b => {
                const d = new Date(b.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[key] = (monthlyData[key] || 0) + Number(b.total_amount);
            });

            labels = Object.keys(monthlyData);
            data = Object.values(monthlyData);
        } else {
            // Daily for Specific Month
            const daysInMonth = new Date(year, month, 0).getDate();
            labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            data = new Array(daysInMonth).fill(0);

            if (bills) {
                bills.forEach(b => {
                    const d = new Date(b.created_at);
                    if (d.getMonth() === month - 1) { // Guard ensuring correct month
                        const day = d.getDate();
                        data[day - 1] += Number(b.total_amount);
                    }
                });
            }
        }

        const ctx = container.querySelector('#sales-chart').getContext('2d');
        if (salesChartInstance) salesChartInstance.destroy();

        salesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: isAllTime ? 'Monthly Sales' : 'Daily Sales',
                    data: data,
                    borderColor: '#2563eb', // Blue-600
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [2, 4], color: '#f1f5f9' },
                        ticks: { font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    async function loadGlobalStats() {
        // Active Repairs Count
        const { count: activeRepairs } = await supabase
            .from('repairs')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Received', 'In Process', 'Part Not Available']);

        container.querySelector('#active-repairs').textContent = activeRepairs || 0;

        // Repair Status Chart
        const { data: allRepairs } = await supabase.from('repairs').select('status');
        const statusCounts = {};
        allRepairs?.forEach(r => {
            statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
        });

        const ctx = container.querySelector('#repair-chart').getContext('2d');
        if (repairChartInstance) repairChartInstance.destroy();

        repairChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#64748b', '#8b5cf6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                },
                cutout: '70%'
            }
        });

        // Recent Transactions
        const { data: recentBills } = await supabase
            .from('bills')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10); // increased limit slightly

        const txnBody = container.querySelector('#recent-txns');
        txnBody.innerHTML = recentBills?.map(b => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 pl-2">
                    <div class="font-medium text-slate-700">${b.customer_name || 'Walk-in'}</div>
                     <div class="text-[10px] text-slate-400 font-mono">#${b.invoice_number || b.id.slice(0, 6)} • ${new Date(b.created_at).toLocaleDateString()}</div>
                </td>
                <td class="py-3 pr-2 text-right">
                    <span class="font-semibold text-slate-700">₹${b.total_amount}</span>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="2" class="p-4 text-center text-slate-400 text-xs">No recent transactions</td></tr>';

        // Recent Expenditure
        const { data: recentExp } = await supabase
            .from('expenditures')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        const expBody = container.querySelector('#recent-exp');
        expBody.innerHTML = recentExp?.map(e => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 pl-2">
                    <div class="font-medium text-slate-700">${e.item_name}</div>
                    <div class="text-[10px] text-slate-400">${e.category || 'General'} • ${new Date(e.created_at).toLocaleDateString()}</div>
                </td>
                <td class="py-3 pr-2 text-right">
                     <span class="font-semibold text-rose-600">-₹${e.amount}</span>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="2" class="p-4 text-center text-slate-400 text-xs">No recent expenditures</td></tr>';

        // Recent Queries
        const { data: recentQueries } = await supabase
            .from('customer_queries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        const queryBody = container.querySelector('#recent-queries');
        queryBody.innerHTML = recentQueries?.map(q => `
            <tr class="hover:bg-slate-50 transition-colors">
                 <td class="py-3 pl-2">
                    <div class="font-medium text-slate-700 truncate max-w-[120px]" title="${q.customer_name}">${q.customer_name}</div>
                    <div class="text-[10px] text-slate-400 truncate max-w-[120px]" title="${q.requirement}">${q.requirement}</div>
                </td>
                <td class="py-3 pr-2 text-right">
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(q.status)}">
                        ${q.status}
                    </span>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="2" class="p-4 text-center text-slate-400 text-xs">No recent queries</td></tr>';
    }

    function getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
            case 'resolved': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            case 'in progress': return 'bg-blue-50 text-blue-600 border border-blue-100';
            default: return 'bg-slate-50 text-slate-600 border border-slate-100';
        }
    }

    // --- Listeners ---
    monthPicker.addEventListener('change', () => {
        isAllTime = false;
        loadDashboardData();
    });

    allTimeBtn.addEventListener('click', () => {
        isAllTime = !isAllTime;
        loadDashboardData();
    });

    // View All Buttons Hooks
    const btnTxns = container.querySelector('#view-all-txns');
    const btnExp = container.querySelector('#view-all-exp');
    const btnQueries = container.querySelector('#view-all-queries');

    if (btnTxns) btnTxns.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigateFn) navigateFn('invoices');
    });

    if (btnExp) btnExp.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigateFn) navigateFn('expenditure');
    });

    if (btnQueries) btnQueries.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigateFn) navigateFn('queries');
    });


    // Initial Loads
    loadDashboardData();
    loadGlobalStats();

    // PDF Report
    const finBtn = container.querySelector('#download-financial-report');
    if (finBtn) {
        finBtn.addEventListener('click', async () => {
            generateFinancialReport(isAllTime, monthPicker.value);
        });
    }

    async function generateFinancialReport(isAllTime, dateInput) {
        // Fetch Bills without join
        let reportBillsQuery = supabase.from('bills').select('*').order('created_at', { ascending: true });
        let reportExpQuery = supabase.from('expenditures').select('*').order('created_at', { ascending: true });
        let titleSuffix = '';

        if (!isAllTime) {
            const [year, month] = dateInput.split('-');
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
            titleSuffix = monthName;

            reportBillsQuery = reportBillsQuery.gte('created_at', startDate).lte('created_at', endDate);
            reportExpQuery = reportExpQuery.gte('created_at', startDate).lte('created_at', endDate);
        } else {
            titleSuffix = 'All Time';
        }

        const doc = new jsPDF();
        const { data: reportBills, error: billsError } = await reportBillsQuery;
        const { data: reportExp } = await reportExpQuery;

        // Fetch Products for Dynamic COGS
        const { data: products } = await supabase.from('products').select('id, cost_price');
        const productMap = new Map((products || []).map(p => [p.id, Number(p.cost_price) || 0]));

        if (billsError) console.error('PDF Bills Error:', billsError);

        // --- Manual Join for PDF ---
        if (reportBills && reportBills.length > 0) {
            const billIds = reportBills.map(b => b.id);
            // Fetch items in chunks to avoid URL length issues if many bills
            let allItems = [];
            // Simple chunking for safety
            const chunkSize = 20;
            for (let i = 0; i < billIds.length; i += chunkSize) {
                const chunk = billIds.slice(i, i + chunkSize);
                const { data: items } = await supabase
                    .from('bill_items')
                    .select('*')
                    .in('bill_id', chunk);
                if (items) allItems = allItems.concat(items);
            }

            // Map items to bills
            reportBills.forEach(bill => {
                bill.bill_items = allItems.filter(i => i.bill_id === bill.id);
            });
        }

        let totalRevenue = 0;
        let totalExpenditure = 0;
        let totalCOGS = 0;
        let totalPaid = 0;
        let totalPending = 0;

        doc.setFontSize(18);
        doc.text(`Financial Report - ${titleSuffix}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);

        doc.setFontSize(14);
        doc.text('1. Revenue (Invoices)', 14, 35);

        const billRows = [];
        if (reportBills && reportBills.length > 0) {
            reportBills.forEach(bill => {
                const amount = Number(bill.total_amount) || 0;
                totalRevenue += amount;

                // Track Paid/Pending
                const status = bill.payment_status || 'Paid';
                if (status === 'Paid') totalPaid += amount;
                else totalPending += amount;

                if (bill.bill_items) {
                    bill.bill_items.forEach(item => {
                        // Dynamic COGS
                        const currentCost = productMap.get(item.product_id) ?? Number(item.cost_at_sale) ?? 0;
                        totalCOGS += currentCost * (item.quantity || 1);
                    });
                }

                billRows.push([
                    new Date(bill.created_at).toLocaleDateString(),
                    `#${bill.invoice_number || bill.id.slice(0, 6)}`,
                    bill.customer_name || 'Walk-in',
                    status,
                    amount.toFixed(2)
                ]);
            });
        } else {
            billRows.push(['-', '-', 'No invoices found', '-', '0.00']);
        }

        doc.autoTable({
            head: [['Date', 'Inv #', 'Customer', 'Status', 'Amount']],
            body: billRows,
            startY: 40,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY > 250) { doc.addPage(); finalY = 20; }

        doc.setFontSize(14);
        doc.text('2. Expenditure', 14, finalY);

        const expRows = [];
        if (reportExp && reportExp.length > 0) {
            reportExp.forEach(ex => {
                totalExpenditure += (Number(ex.amount) || 0);
                expRows.push([
                    new Date(ex.created_at).toLocaleDateString(),
                    ex.item_name,
                    ex.category || '-',
                    Number(ex.amount).toFixed(2)
                ]);
            });
        } else {
            expRows.push(['-', 'No expenditures recorded', '-', '0.00']);
        }

        doc.autoTable({
            head: [['Date', 'Description', 'Category', 'Amount']],
            body: expRows,
            startY: finalY + 5,
            theme: 'striped',
            headStyles: { fillColor: [244, 63, 94] }
        });

        finalY = doc.lastAutoTable.finalY + 20;
        if (finalY > 220) { doc.addPage(); finalY = 20; }

        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenditure;

        doc.setDrawColor(200);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, finalY, 180, 95, 3, 3, 'FD');

        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text('Financial Summary', 20, finalY + 12);
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);

        const startYStats = finalY + 25;
        const lineHeight = 7;

        doc.text(`Total Revenue:`, 20, startYStats);
        doc.text(`${totalRevenue.toFixed(2)}`, 150, startYStats, { align: 'right' });

        // Paid / Pending Breakdown
        doc.text(`Total Paid:`, 20, startYStats + lineHeight);
        doc.setTextColor(16, 185, 129); // Green
        doc.text(`${totalPaid.toFixed(2)}`, 150, startYStats + lineHeight, { align: 'right' });
        doc.setTextColor(71, 85, 105); // Reset

        doc.text(`Total Pending:`, 20, startYStats + (lineHeight * 2));
        doc.setTextColor(245, 158, 11); // Amber
        doc.text(`${totalPending.toFixed(2)}`, 150, startYStats + (lineHeight * 2), { align: 'right' });
        doc.setTextColor(71, 85, 105); // Reset

        doc.text(`Cost of Goods Sold (Current):`, 20, startYStats + (lineHeight * 3));
        doc.text(`(${totalCOGS.toFixed(2)})`, 150, startYStats + (lineHeight * 3), { align: 'right' });

        doc.text(`Gross Profit:`, 20, startYStats + (lineHeight * 4));
        doc.text(`${grossProfit.toFixed(2)}`, 150, startYStats + (lineHeight * 4), { align: 'right' });

        doc.text(`Total Expenditure:`, 20, startYStats + (lineHeight * 5));
        doc.text(`(${totalExpenditure.toFixed(2)})`, 150, startYStats + (lineHeight * 5), { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.line(20, startYStats + (lineHeight * 6), 180, startYStats + (lineHeight * 6));

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`Net Profit / Loss:`, 20, startYStats + (lineHeight * 7) + 5);

        if (netProfit >= 0) doc.setTextColor(16, 185, 129);
        else doc.setTextColor(244, 63, 94);

        doc.text(`${netProfit.toFixed(2)}`, 150, startYStats + (lineHeight * 7) + 5, { align: 'right' });
        doc.save(`Financial_Report_${titleSuffix.replace(' ', '_')}.pdf`);
    }
}
