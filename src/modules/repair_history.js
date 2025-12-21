import { supabase } from '../supabase.js';
import { Calendar, Search, Filter } from 'lucide';

export async function initRepairHistory(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-3xl font-bold text-slate-800">Repair History</h2>

            <div class="card p-4 flex gap-4">
                 <div class="relative flex-1">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"></i>
                    <input type="text" id="search-repair" placeholder="Search customer, device or status..." class="input-field pl-12" />
                </div>
            </div>

            <div class="card overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                        <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="p-4">Date</th>
                                <th class="p-4">Customer</th>
                                <th class="p-4">Device</th>
                                <th class="p-4">Description</th>
                                <th class="p-4">Status</th>
                                <th class="p-4 text-right">Cost</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="repair-list-body" class="divide-y divide-slate-100">
                            <tr><td colspan="6" class="p-8 text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    const tbody = container.querySelector('#repair-list-body');
    const searchInput = container.querySelector('#search-repair');
    let repairs = [];

    async function fetchRepairs() {
        const { data, error } = await supabase
            .from('repairs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error loading data</td></tr>`;
            return;
        }

        repairs = data;
        renderTable(repairs);
    }

    function renderTable(items) {
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No repair records found</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(r => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 whitespace-nowrap">${new Date(r.created_at).toLocaleDateString()}</td>
                <td class="p-4 font-medium text-slate-800">
                    ${r.customer_name}
                    <div class="text-xs text-slate-400">${r.contact_number || ''}</div>
                </td>
                <td class="p-4">${r.device_details}</td>
                <td class="p-4 max-w-xs truncate" title="${r.issue_description || ''}">${r.issue_description || '-'}</td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold 
                        ${r.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                r.status === 'Repaired' ? 'bg-blue-100 text-blue-700' :
                    r.status === 'Part Not Available' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${r.status}
                    </span>
                </td>
                <td class="p-4 text-right font-medium">₹${r.estimated_cost || 0}</td>
                <td class="p-4 text-right">
                     <button class="delete-repair-btn text-slate-300 hover:text-red-500 transition-colors" data-id="${r.id}" title="Delete Entry">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        if (window.lucide) window.lucide.createIcons();

        // Add Listener for Delete
        tbody.querySelectorAll('.delete-repair-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const adminPass = prompt("Enter Developer Password to DELETE:");
                if (adminPass !== "Jayasan@9045") {
                    alert("Incorrect Password! Access Denied.");
                    return;
                }

                if (confirm('Delete this repair entry permanently?')) {
                    const id = btn.dataset.id;
                    const { error } = await supabase.from('repairs').delete().eq('id', id);
                    if (error) alert('Error: ' + error.message);
                    else fetchRepairs();
                }
            });
        });
    }

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = repairs.filter(r =>
            r.customer_name.toLowerCase().includes(term) ||
            r.device_details.toLowerCase().includes(term) ||
            r.status.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });

    fetchRepairs();
}

