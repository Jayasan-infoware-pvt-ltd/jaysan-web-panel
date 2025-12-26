import { supabase } from '../supabase.js';
import { Plus, Search, Edit2, Trash2 } from 'lucide';

export async function initStock(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-800">Stock Inventory</h2>
                <button id="add-product-btn" class="btn-primary flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Add Product
                </button>
            </div>

            <div class="card p-4">
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"></i>
                    <input type="text" id="search-stock" placeholder="Search products..." class="input-field pl-12" />
                </div>
            </div>

            <div class="card overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                            <th class="p-4 font-semibold">Product Name</th>
                            <th class="p-4 font-semibold">Price (₹)</th>
                            <th class="p-4 font-semibold">Quantity</th>
                            <th class="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body" class="text-slate-700 divide-y divide-slate-100">
                        <tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Template -->
        <div id="product-modal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-[100] backdrop-blur-sm">
            <div class="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100 ring-1 ring-black/5">
                <h3 id="modal-title" class="text-xl font-bold mb-4">Add Product</h3>
                <form id="product-form" class="space-y-4">
                    <input type="hidden" id="product-id">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                        <input type="text" id="product-name" required class="input-field" placeholder="e.g. iPhone Screen">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Price</label>
                            <input type="number" id="product-price" required class="input-field" placeholder="0.00">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                            <input type="number" id="product-qty" required class="input-field" placeholder="0" min="0">
                        </div>
                    </div>

                    <!-- Dynamic Serials Container -->
                    <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Serial Numbers</label>
                        <div id="serials-container" class="space-y-2 max-h-40 overflow-y-auto pr-1">
                            <p class="text-xs text-slate-400 italic">Enter quantity to add serial numbers.</p>
                        </div>
                    </div>

                    <div>
                         <label class="block text-sm font-medium text-slate-700 mb-1">Vendor/Supplier Name</label>
                         <input type="text" id="product-vendor" class="input-field" placeholder="e.g. ABC Electronics">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Sourced From (Location)</label>
                            <input type="text" id="product-location" class="input-field" placeholder="e.g. Bangalore">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Courier Charges</label>
                            <input type="number" id="product-courier" class="input-field" placeholder="0" value="0">
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" id="cancel-modal" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Re-run icons
    if (window.lucide) window.lucide.createIcons();

    const tbody = container.querySelector('#stock-table-body');
    const searchInput = container.querySelector('#search-stock');
    const modal = container.querySelector('#product-modal');
    const form = container.querySelector('#product-form');
    let products = [];

    // Fetch Data
    async function fetchProducts() {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching products:', error);
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Error loading stock</td></tr>`;
            return;
        }
        products = data;
        renderTable(products);
    }

    function renderTable(items) {
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-400">No products found</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(p => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-medium text-slate-900">${p.name}</td>
                <td class="p-4">₹${p.price}</td>
                <td class="p-4">
                    <span class="${p.quantity < 5 ? 'text-red-600 font-bold' : 'text-green-600'}">
                        ${p.quantity}
                    </span>
                </td>
                <td class="p-4 text-right space-x-2">
                    <button class="edit-btn p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" data-id="${p.id}">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-btn p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" data-id="${p.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.name.toLowerCase().includes(term));
        renderTable(filtered);
    });

    // Serials Logic
    const qtyInput = container.querySelector('#product-qty');
    const serialsContainer = container.querySelector('#serials-container');

    function renderSerialInputs(count, existingSerials = []) {
        if (count <= 0) {
            serialsContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Enter quantity to add serial numbers.</p>';
            return;
        }

        // Keep existing values if quantity increases, truncate if decreases
        // Actually, we'll rebuild to be safe, but try to preserve inputs
        const currentInputs = Array.from(serialsContainer.querySelectorAll('input'));
        const currentValues = currentInputs.map(i => i.value);

        // Merge existing DB serials if this is first load
        const valuesToUse = existingSerials.length > 0 ? existingSerials : currentValues;

        let html = '';
        for (let i = 0; i < count; i++) {
            const val = valuesToUse[i] || '';
            html += `
                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 w-6">#${i + 1}</span>
                    <input type="text" class="serial-input input-field py-1 text-sm" placeholder="Serial No." value="${val}">
                </div>
            `;
        }
        serialsContainer.innerHTML = html;
    }

    qtyInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) || 0;
        // If typing, we don't want to blow away data constantly logic-wise, but for simple UI:
        // We need to grab current typed values before re-rendering
        const currentInputs = Array.from(serialsContainer.querySelectorAll('.serial-input')).map(i => i.value);
        renderSerialInputs(val, currentInputs);
    });

    // Modal Logic
    const openModal = (isEdit = false, data = null) => {
        document.querySelector('#modal-title').textContent = isEdit ? 'Edit Product' : 'Add Product';
        document.querySelector('#product-id').value = isEdit ? data.id : '';
        document.querySelector('#product-name').value = isEdit ? data.name : '';
        document.querySelector('#product-price').value = isEdit ? data.price : '';
        document.querySelector('#product-qty').value = isEdit ? data.quantity : '';
        document.querySelector('#product-vendor').value = isEdit ? data.vendor_name || '' : '';
        document.querySelector('#product-location').value = isEdit ? data.location_from || '' : '';
        document.querySelector('#product-courier').value = isEdit ? data.courier_charges || 0 : '';

        // Handle Serials
        const serials = (isEdit && data.serial_number) ? data.serial_number.split(',') : [];
        renderSerialInputs(isEdit ? data.quantity : 0, serials);

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
    };

    container.querySelector('#add-product-btn').addEventListener('click', () => openModal(false));
    container.querySelector('#cancel-modal').addEventListener('click', closeModal);

    // Add/Edit Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#product-id').value;
        const name = document.querySelector('#product-name').value;
        // Collect serials
        const serialInputs = container.querySelectorAll('.serial-input');
        const serial_number = Array.from(serialInputs).map(i => i.value).filter(v => v.trim() !== '').join(',');

        const price = parseFloat(document.querySelector('#product-price').value) || 0;
        const quantity = parseInt(document.querySelector('#product-qty').value) || 0;
        const vendor_name = document.querySelector('#product-vendor').value;
        const location_from = document.querySelector('#product-location').value;
        const courier_charges = parseFloat(document.querySelector('#product-courier').value) || 0;

        const payload = { name, serial_number, price, quantity, vendor_name, location_from, courier_charges };

        if (!name) { alert('Name is required'); return; }

        let error;
        if (id) {
            const { error: err } = await supabase.from('products').update(payload).eq('id', id);
            error = err;
        } else {
            const { error: err } = await supabase.from('products').insert([payload]);
            error = err;
        }

        if (error) {
            console.error('Save error:', error);
            alert('Failed to save product: ' + error.message);
        } else {
            fetchProducts();
            closeModal();
        }
    });

    // Table Actions
    tbody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const product = products.find(p => p.id === id);
            openModal(true, product);
        }

        if (deleteBtn) {
            if (confirm('Are you sure you want to delete this product?')) {
                const id = deleteBtn.dataset.id;
                const { error } = await supabase.from('products').delete().eq('id', id);
                if (!error) fetchProducts();
            }
        }
    });

    // Initial Load
    fetchProducts();
}
