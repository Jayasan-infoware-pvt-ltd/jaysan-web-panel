import { supabase } from '../supabase.js';
import { Plus, Search, Trash2, Phone, User, MessageCircle, CheckCircle, Clock } from 'lucide';

export async function initQueries(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-800">Customer Queries</h2>
                <button id="add-query-btn" class="btn-primary flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Add Query
                </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="card p-4 bg-orange-50 border-orange-100 flex items-center gap-4">
                    <div class="p-3 bg-orange-100 rounded-full text-orange-600"><i data-lucide="clock" class="w-6 h-6"></i></div>
                    <div>
                        <div class="text-sm text-slate-500">Pending Requests</div>
                        <div class="text-xl font-bold text-slate-800" id="stat-pending">0</div>
                    </div>
                </div>
                <div class="card p-4 bg-emerald-50 border-emerald-100 flex items-center gap-4">
                    <div class="p-3 bg-emerald-100 rounded-full text-emerald-600"><i data-lucide="check-circle" class="w-6 h-6"></i></div>
                    <div>
                        <div class="text-sm text-slate-500">Resolved</div>
                        <div class="text-xl font-bold text-slate-800" id="stat-resolved">0</div>
                    </div>
                </div>
                <div class="card p-4 bg-sky-50 border-sky-100 flex items-center gap-4">
                    <div class="p-3 bg-sky-100 rounded-full text-sky-600"><i data-lucide="message-circle" class="w-6 h-6"></i></div>
                    <div>
                        <div class="text-sm text-slate-500">Total Queries</div>
                        <div class="text-xl font-bold text-slate-800" id="stat-total">0</div>
                    </div>
                </div>
            </div>

            <div class="card overflow-hidden">
                <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 class="font-bold text-slate-700">Recent Queries</h3>
                    <div class="relative w-64">
                         <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none"></i>
                         <input type="text" id="search-queries" placeholder="Search customer or item..." class="input-field pl-9 py-1.5 text-sm">
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                            <tr>
                                <th class="p-4">Date</th>
                                <th class="p-4">Customer</th>
                                <th class="p-4">Requirement / Query</th>
                                <th class="p-4">Status</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="queries-body" class="divide-y divide-slate-100 text-sm text-slate-600">
                            <tr><td colspan="5" class="p-8 text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add Modal -->
        <div id="query-modal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-[100] backdrop-blur-sm">
            <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 class="text-xl font-bold mb-4 text-slate-800">New Customer Query</h3>
                <form id="query-form" class="space-y-4">
                    <div>
                        <label class="label">Customer Name</label>
                        <div class="relative">
                            <i data-lucide="user" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10"></i>
                            <input type="text" id="q-name" required class="input-field pl-12" placeholder="Enter name">
                        </div>
                    </div>
                    <div>
                        <label class="label">Phone Number</label>
                        <div class="relative">
                             <i data-lucide="phone" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10"></i>
                            <input type="tel" id="q-phone" class="input-field pl-12" placeholder="Enter phone number">
                        </div>
                    </div>
                    <div>
                        <label class="label">Requirement / Item Needed</label>
                        <textarea id="q-req" required class="input-field h-24 resize-none" placeholder="What is the customer looking for?"></textarea>
                    </div>
                    
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" id="close-modal" class="btn-secondary">Cancel</button>
                        <button type="submit" id="save-query-btn" class="btn-primary">Save Query</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const tbody = container.querySelector('#queries-body');
    const modal = container.querySelector('#query-modal');
    const form = container.querySelector('#query-form');
    const searchInput = container.querySelector('#search-queries');
    let queries = [];

    // --- Data Fetching ---
    async function fetchQueries() {
        const { data, error } = await supabase
            .from('customer_queries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error loading queries</td></tr>`;
            return;
        }
        queries = data;
        renderList(queries);
        updateStats();
    }

    function renderList(list) {
        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">No queries recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(q => `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-4 whitespace-nowrap text-slate-500">${new Date(q.created_at).toLocaleDateString()}</td>
                <td class="p-4">
                    <div class="font-medium text-slate-800">${q.customer_name}</div>
                    <div class="text-xs text-slate-400 font-mono">${q.phone_number || '-'}</div>
                </td>
                <td class="p-4">
                    <p class="text-slate-700 max-w-xs truncate" title="${q.requirement}">${q.requirement}</p>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold 
                        ${q.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">
                        ${q.status || 'Pending'}
                    </span>
                </td>
                <td class="p-4 text-right">
                    ${q.status !== 'Resolved' ? `
                        <button class="resolve-btn hover:text-emerald-600 text-slate-400 mr-2 transition-colors" data-id="${q.id}" title="Mark Resolved">
                            <i data-lucide="check-circle" class="w-5 h-5"></i>
                        </button>
                    ` : ''}
                    <button class="delete-btn hover:text-red-500 text-slate-400 transition-colors" data-id="${q.id}" title="Delete">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
        attachListeners();
    }

    function updateStats() {
        const total = queries.length;
        const resolved = queries.filter(q => q.status === 'Resolved').length;
        const pending = total - resolved;

        container.querySelector('#stat-total').textContent = total;
        container.querySelector('#stat-resolved').textContent = resolved;
        container.querySelector('#stat-pending').textContent = pending;
    }

    function attachListeners() {
        container.querySelectorAll('.resolve-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const { error } = await supabase
                    .from('customer_queries')
                    .update({ status: 'Resolved' })
                    .eq('id', id);

                if (!error) fetchQueries();
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete this query record?')) {
                    const id = btn.dataset.id;
                    const { error } = await supabase.from('customer_queries').delete().eq('id', id);
                    if (!error) fetchQueries();
                }
            });
        });
    }

    // --- Search ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = queries.filter(q =>
            q.customer_name.toLowerCase().includes(term) ||
            q.requirement.toLowerCase().includes(term) ||
            (q.phone_number && q.phone_number.includes(term))
        );
        renderList(filtered);
    });

    // --- Modal ---
    const openBtn = container.querySelector('#add-query-btn');
    const closeBtn = container.querySelector('#close-modal');

    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        form.querySelector('#q-name').focus();
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = container.querySelector('#save-query-btn');
        btn.disabled = true;
        btn.innerText = 'Saving...';

        const name = form.querySelector('#q-name').value;
        const phone = form.querySelector('#q-phone').value;
        const req = form.querySelector('#q-req').value;

        const { error } = await supabase.from('customer_queries').insert({
            customer_name: name,
            phone_number: phone,
            requirement: req,
            status: 'Pending'
        });

        btn.disabled = false;
        btn.innerText = 'Save Query';

        if (error) {
            alert('Error: ' + error.message);
        } else {
            closeBtn.click();
            fetchQueries();
        }
    });

    // Init
    fetchQueries();
}
