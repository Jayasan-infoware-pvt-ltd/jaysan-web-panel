import { supabase } from '../supabase.js';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileDown } from 'lucide';

export async function initAnalytics(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-3xl font-bold text-slate-800">Dashboard</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Stat Cards -->
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-500/30">
                    <h3 class="text-blue-100 text-sm font-medium mb-1">Today's Sales</h3>
                    <p class="text-3xl font-bold" id="today-sales">₹0</p>
                </div>
                
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg shadow-purple-500/30">
                    <h3 class="text-purple-100 text-sm font-medium mb-1">Active Repairs</h3>
                    <p class="text-3xl font-bold" id="active-repairs">0</p>
                </div>

                <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg shadow-emerald-500/30 relative overflow-hidden group">
                    <h3 class="text-emerald-100 text-sm font-medium mb-1">Monthly Estimate</h3>
                    <p class="text-3xl font-bold" id="month-sales">₹0</p>
                    <button id="download-month-report" class="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm transition-colors" title="Download Monthly Report">
                        <i data-lucide="file-down" class="w-5 h-5"></i>
                    </button>
                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                </div>
            </div>

            <!-- Chart Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card p-6">
                    <h3 class="font-bold text-slate-700 mb-4">Sales - Last 7 Days</h3>
                    <div class="h-64">
                         <canvas id="sales-chart"></canvas>
                    </div>
                </div>
                
                 <div class="card p-6">
                    <h3 class="font-bold text-slate-700 mb-4">Repair Status Distribution</h3>
                    <div class="h-64 flex justify-center">
                         <canvas id="repair-chart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="card p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-700">Recent Transactions</h3>
                    <button class="text-sm text-accent hover:underline">View All</button>
                </div>
                 <table class="w-full text-left text-sm">
                    <thead class="text-slate-400 font-normal border-b border-slate-100">
                        <tr>
                            <th class="pb-2">ID</th>
                            <th class="pb-2">Customer</th>
                            <th class="pb-2">Amount</th>
                            <th class="pb-2 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody id="recent-txns" class="text-slate-600 divide-y divide-slate-50">
                        <!-- rows -->
                    </tbody>
                 </table>
            </div>
        </div>
    `;

    // Fetch Analytics Data
    const today = new Date().toISOString().split('T')[0];
    const { data: todayBills } = await supabase
        .from('bills')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00`);

    const todayTotal = todayBills?.reduce((sum, b) => sum + b.total_amount, 0) || 0;
    container.querySelector('#today-sales').textContent = `₹${todayTotal.toLocaleString()}`;

    const { count: activeRepairs } = await supabase
        .from('repairs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Received', 'In Process', 'Part Not Available']);

    container.querySelector('#active-repairs').textContent = activeRepairs || 0;

    // Monthly (Rough estimate using logic or fetch)
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthBills } = await supabase
        .from('bills')
        .select('total_amount, created_at')
        .gte('created_at', firstDay);

    const monthTotal = monthBills?.reduce((sum, b) => sum + b.total_amount, 0) || 0;
    container.querySelector('#month-sales').textContent = `₹${monthTotal.toLocaleString()}`;

    // Chart Data Preparation
    // Last 7 days sales
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const salesData = last7Days.map(date => {
        const daySales = monthBills?.filter(b => b.created_at.startsWith(date)) || [];
        return daySales.reduce((sum, b) => sum + b.total_amount, 0);
    });

    // Render Charts
    const salesCtx = container.querySelector('#sales-chart').getContext('2d');
    new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: last7Days.map(d => d.slice(5)), // MM-DD
            datasets: [{
                label: 'Sales (₹)',
                data: salesData,
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
        }
    });

    // Repair Chart
    const { data: allRepairs } = await supabase.from('repairs').select('status');
    const statusCounts = {};
    ['Received', 'In Process', 'Repaired'].forEach(s => statusCounts[s] = 0);
    allRepairs?.forEach(r => {
        if (statusCounts[r.status] !== undefined) statusCounts[r.status]++;
    });

    const repairCtx = container.querySelector('#repair-chart').getContext('2d');
    new Chart(repairCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });

    // Recent Txns
    const { data: recentBills } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    const txnBody = container.querySelector('#recent-txns');
    txnBody.innerHTML = recentBills?.map(b => `
        <tr>
            <td class="py-3 text-slate-400 font-mono text-xs">#${b.id.slice(0, 6)}</td>
            <td class="py-3 font-medium text-slate-700">${b.customer_name || 'Walk-in'}</td>
            <td class="py-3 font-medium text-slate-800">₹${b.total_amount}</td>
            <td class="py-3 text-right text-slate-500 text-xs">${new Date(b.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('') || '';

    // Monthly Report PDF Generation
    const btn = container.querySelector('#download-month-report');
    if (btn) {
        btn.addEventListener('click', async () => {
            const doc = new jsPDF();
            doc.text(`Monthly Sales Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 20);

            // Monthly start date
            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            // Fetch detailed data for month
            const { data: reportBills } = await supabase
                .from('bills')
                .select('*, bill_items(*)')
                .gte('created_at', firstDay)
                .order('created_at', { ascending: true });

            if (!reportBills || reportBills.length === 0) {
                alert('No data for this month');
                return;
            }

            const tableRows = [];
            let totalSales = 0;
            let totalGST = 0;

            reportBills.forEach(bill => {
                const date = new Date(bill.created_at).toLocaleDateString();
                const items = bill.bill_items.map(i => `${i.product_name} (${i.quantity})`).join(', ');
                const gstAmt = bill.gst_applied ? (bill.total_amount * 0.18 / 1.18) : 0;

                totalSales += bill.total_amount;
                if (bill.gst_applied) totalGST += gstAmt;

                tableRows.push([
                    date,
                    bill.customer_name || 'Walk-in',
                    items,
                    bill.gst_applied ? 'Yes' : 'No',
                    bill.total_amount.toFixed(2)
                ]);
            });

            doc.autoTable({
                head: [['Date', 'Customer', 'Items', 'GST', 'Amount']],
                body: tableRows,
                startY: 30,
            });

            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(11);
            doc.text(`Total Sales: ${totalSales.toFixed(2)}`, 14, finalY);
            doc.text(`Total GST Collected (approx): ${totalGST.toFixed(2)}`, 14, finalY + 6);
            doc.text(`Total Transactions: ${reportBills.length}`, 14, finalY + 12);

            doc.save(`Monthly_Report_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
        });
    }
}
