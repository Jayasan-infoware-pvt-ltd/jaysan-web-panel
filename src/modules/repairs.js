import { supabase } from '../supabase.js';

export async function initRepairs(container) {
    container.innerHTML = `
        <div class="space-y-6 h-full flex flex-col">
            <div class="flex justify-between items-center shrink-0">
                <h2 class="text-3xl font-bold text-slate-800">Repair Panel</h2>
                <button id="add-repair-btn" class="btn-primary flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> New Entry
                </button>
            </div>

            <!-- Kanban Board -->
            <div class="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div class="flex gap-6 h-full min-w-[1000px]">
                    ${['Received', 'In Process', 'Part Not Available', 'Repaired', 'Delivered'].map(status => `
                        <div class="flex-1 flex flex-col bg-slate-100 rounded-xl p-4 min-w-[280px]">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-bold text-slate-700">${status}</h3>
                                <span class="bg-white px-2 py-1 rounded text-xs font-bold text-slate-500 shadow-sm" id="count-${status.replace(/\s+/g, '-')}">0</span>
                            </div>
                            <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar" id="col-${status.replace(/\s+/g, '-')}">
                                <!-- Cards go here -->
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Repair Modal -->
        <div id="repair-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
                <h3 id="repair-modal-title" class="text-xl font-bold mb-4">New Repair Entry</h3>
                <form id="repair-form" class="space-y-4">
                    <input type="hidden" id="repair-id">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                            <input type="text" id="cust-name" required class="input-field">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Contact Details</label>
                            <input type="text" id="cust-contact" class="input-field">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Device Details</label>
                        <input type="text" id="device-info" required class="input-field" placeholder="e.g. Samsung S21">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Serial Number <span class="text-red-500">*</span></label>
                        <input type="text" id="serial-number" required class="input-field" placeholder="IMEI / SN">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Issue Description</label>
                        <textarea id="issue-desc" class="input-field h-24 resize-none"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                             <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                             <select id="repair-status" class="input-field">
                                <option value="Received">Received</option>
                                <option value="In Process">In Process</option>
                                <option value="Part Not Available">Part Not Available</option>
                                <option value="Repaired">Repaired</option>
                                <option value="Delivered">Delivered</option>
                             </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Est. Cost</label>
                            <input type="number" id="repair-cost" class="input-field">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Custom Message/Notes</label>
                        <textarea id="custom-message" class="input-field h-20 resize-none" placeholder="Internal notes..."></textarea>
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" id="cancel-repair-modal" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Save Entry</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const modal = container.querySelector('#repair-modal');
    const form = container.querySelector('#repair-form');
    let repairs = [];

    async function fetchRepairs() {
        const { data, error } = await supabase.from('repairs').select('*').order('updated_at', { ascending: false });
        if (!error) {
            repairs = data;
            renderBoard();
        }
    }

    function renderBoard() {
        // Clear all columns
        ['Received', 'In Process', 'Part Not Available', 'Repaired', 'Delivered'].forEach(status => {
            const colId = `col-${status.replace(/\s+/g, '-')}`;
            const countId = `count-${status.replace(/\s+/g, '-')}`;
            const col = container.querySelector(`#${colId}`);
            if (col) col.innerHTML = '';

            const items = repairs.filter(r => r.status === status);
            container.querySelector(`#${countId}`).textContent = items.length;

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow group';
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-slate-800">${item.customer_name}</h4>
                        <span class="text-xs text-slate-400">${new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="text-sm text-slate-600 font-medium mb-1">${item.device_details}</p>
                    <p class="text-xs text-slate-400 font-mono mb-2">SN: ${item.serial_number || 'N/A'}</p>
                    <p class="text-xs text-slate-500 line-clamp-2 mb-3">${item.issue_description || 'No description'}</p>
                    <div class="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">#${item.contact_number?.slice(-4) || '----'}</span>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="edit-repair text-blue-500 hover:text-blue-700 p-1"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `;
                card.querySelector('.edit-repair').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal(true, item);
                });
                if (col) col.appendChild(card);
            });
        });
        if (window.lucide) window.lucide.createIcons();
    }

    // Modal logic
    const openModal = (isEdit = false, data = null) => {
        document.querySelector('#repair-modal-title').textContent = isEdit ? 'Edit Repair' : 'New Repair Entry';
        document.querySelector('#repair-id').value = isEdit ? data.id : '';
        document.querySelector('#cust-name').value = isEdit ? data.customer_name : '';
        document.querySelector('#cust-contact').value = isEdit ? data.contact_number : '';
        document.querySelector('#cust-contact').value = isEdit ? data.contact_number : '';
        document.querySelector('#device-info').value = isEdit ? data.device_details : '';
        document.querySelector('#serial-number').value = isEdit ? data.serial_number : '';
        document.querySelector('#issue-desc').value = isEdit ? data.issue_description : '';
        document.querySelector('#repair-status').value = isEdit ? data.status : 'Received';
        document.querySelector('#repair-cost').value = isEdit ? data.estimated_cost : '';
        document.querySelector('#custom-message').value = isEdit ? data.custom_message : '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
    };

    container.querySelector('#add-repair-btn').addEventListener('click', () => openModal(false));
    container.querySelector('#cancel-repair-modal').addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#repair-id').value;
        const payload = {
            customer_name: document.querySelector('#cust-name').value,
            contact_number: document.querySelector('#cust-contact').value,
            device_details: document.querySelector('#device-info').value,
            serial_number: document.querySelector('#serial-number').value,
            issue_description: document.querySelector('#issue-desc').value,
            status: document.querySelector('#repair-status').value,
            estimated_cost: document.querySelector('#repair-cost').value || 0,
            custom_message: document.querySelector('#custom-message').value
        };

        if (id) {
            const { error } = await supabase.from('repairs').update(payload).eq('id', id);
            if (!error) fetchRepairs();
        } else {
            const { error } = await supabase.from('repairs').insert([payload]);
            if (!error) fetchRepairs();
        }
        closeModal();
    });

    fetchRepairs();
}
