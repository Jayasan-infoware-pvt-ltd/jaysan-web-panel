import { supabase } from '../supabase.js';
import { Plus, Search, MoreVertical, Eye, Edit2, Trash2, X, Download } from 'lucide';

export async function initStock(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-800">Stock Inventory</h2>
                <div class="flex gap-2">
                    <button id="export-stock-btn" class="btn-secondary flex items-center gap-2 text-sm">
                        <i data-lucide="download" class="w-4 h-4"></i> Export CSV
                    </button>
                    <button id="add-product-btn" class="btn-primary flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> Add Product
                    </button>
                </div>
            </div>

            <div class="card p-4">
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"></i>
                    <input type="text" id="search-stock" placeholder="Search products..." class="input-field pl-12" />
                </div>
            </div>

            <div class="card overflow-x-auto relative">
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

        <!-- GLOBAL FLOATING POPUP MENU -->
        <div id="global-action-menu" class="hidden fixed z-[60] bg-white rounded-lg shadow-xl border border-slate-100 w-40 py-1 animate-in fade-in zoom-in-95 duration-100">
            <button id="popup-view" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4"></i> View Detail
            </button>
            <button id="popup-edit" class="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2">
                <i data-lucide="edit-2" class="w-4 h-4"></i> Edit
            </button>
            <div class="border-t border-slate-100 my-1"></div>
            <button id="popup-delete" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
            </button>
        </div>

        <!-- VIEW DETAIL MODAL -->
        <div id="view-modal" class="fixed inset-0 z-50 hidden bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 class="text-lg font-bold text-slate-800">Product Details</h3>
                    <button id="close-view-modal" class="text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div id="view-modal-content" class="p-6 space-y-4">
                    <!-- Injected via JS -->
                </div>
                <div class="px-6 py-4 bg-slate-50 text-right">
                    <button id="close-view-modal-btn" class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors">Close</button>
                </div>
            </div>
        </div>

        <!-- ADD/EDIT MODAL -->
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

    if (window.lucide) window.lucide.createIcons();

    const tbody = container.querySelector('#stock-table-body');
    const searchInput = container.querySelector('#search-stock');
    const modal = container.querySelector('#product-modal');
    const form = container.querySelector('#product-form');
    let products = [];

    // Popup Elements
    const popupMenu = container.querySelector('#global-action-menu');
    const popupViewBtn = container.querySelector('#popup-view');
    const popupEditBtn = container.querySelector('#popup-edit');
    const popupDeleteBtn = container.querySelector('#popup-delete');
    let currentActiveProduct = null;

    // View Modal Elements
    const viewModal = container.querySelector('#view-modal');
    const viewModalContent = container.querySelector('#view-modal-content');

    // Serial Inputs Logic
    const qtyInput = container.querySelector('#product-qty');
    const serialsContainer = container.querySelector('#serials-container');

    // ==========================================
    // FUNCTIONS (Using function declaration for safety)
    // ==========================================

    function renderSerialInputs(count, existingSerials = []) {
        if (count <= 0) {
            serialsContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Enter quantity to add serial numbers.</p>';
            return;
        }

        const currentInputs = Array.from(serialsContainer.querySelectorAll('input'));
        const currentValues = currentInputs.map(i => i.value);
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
        const currentInputs = Array.from(serialsContainer.querySelectorAll('.serial-input')).map(i => i.value);
        renderSerialInputs(val, currentInputs);
    });

    // Modal Logic (From your working code)
    const openModal = (isEdit = false, data = null) => {
        document.querySelector('#modal-title').textContent = isEdit ? 'Edit Product' : 'Add Product';
        document.querySelector('#product-id').value = isEdit ? data.id : '';
        document.querySelector('#product-name').value = isEdit ? data.name : '';
        document.querySelector('#product-price').value = isEdit ? data.price : '';
        document.querySelector('#product-qty').value = isEdit ? data.quantity : '';
        document.querySelector('#product-vendor').value = isEdit ? data.vendor_name || '' : '';
        document.querySelector('#product-location').value = isEdit ? data.location_from || '' : '';
        document.querySelector('#product-courier').value = isEdit ? data.courier_charges || 0 : '';

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

    function openViewModal(product) {
        hidePopup();
        let serialsHtml = '<span class="text-slate-400 italic">No serials recorded.</span>';
        if (product.serial_number) {
            const serials = product.serial_number.split(',');
            serialsHtml = `<div class="flex flex-wrap gap-2">` + 
                serials.map(s => `<span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 font-mono">${s}</span>`).join('') +
                `</div>`;
        }

        viewModalContent.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                    <div class="text-lg font-bold text-slate-800">${product.name}</div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-xs font-bold text-slate-400 uppercase">Price</label>
                        <div class="text-slate-800">₹${product.price}</div>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-slate-400 uppercase">In Stock</label>
                        <div class="${product.quantity < 5 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}">${product.quantity}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-xs font-bold text-slate-400 uppercase">Vendor</label>
                        <div class="text-slate-800">${product.vendor_name || '-'}</div>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-slate-400 uppercase">Location</label>
                        <div class="text-slate-800">${product.location_from || '-'}</div>
                    </div>
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase mb-2 block">Serial Numbers</label>
                    ${serialsHtml}
                </div>
                <div class="pt-4 border-t border-slate-100 text-xs text-slate-400">
                    Added on: ${new Date(product.created_at).toLocaleDateString()}
                </div>
            </div>
        `;
        viewModal.classList.remove('hidden');
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    container.querySelector('#add-product-btn').addEventListener('click', () => openModal(false));
    container.querySelector('#cancel-modal').addEventListener('click', closeModal);
    
    // Close View Modal
    container.querySelector('#close-view-modal').addEventListener('click', () => viewModal.classList.add('hidden'));
    container.querySelector('#close-view-modal-btn').addEventListener('click', () => viewModal.classList.add('hidden'));
    viewModal.addEventListener('click', (e) => { if (e.target === viewModal) viewModal.classList.add('hidden'); });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#product-id').value;
        const name = document.querySelector('#product-name').value;
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

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.name.toLowerCase().includes(term));
        renderTable(filtered);
    });

    // Popup Logic
    function showPopup(btn, product) {
        const rect = btn.getBoundingClientRect();
        currentActiveProduct = product;
        popupMenu.style.top = `${rect.bottom + 5}px`;
        popupMenu.style.left = `${rect.right - 150}px`; 
        popupMenu.classList.remove('hidden');
    }

    function hidePopup() {
        popupMenu.classList.add('hidden');
        currentActiveProduct = null;
    }

    document.addEventListener('click', (e) => {
        if (!popupMenu.contains(e.target) && !e.target.closest('.menu-trigger')) {
            hidePopup();
        }
    });

    // --- POPUP ACTIONS ---

    popupViewBtn.addEventListener('click', () => {
        if (currentActiveProduct) openViewModal(currentActiveProduct);
    });

    // FIX: Save product to local variable BEFORE hiding popup
    popupEditBtn.addEventListener('click', () => {
        if (currentActiveProduct) {
            const productToEdit = currentActiveProduct; // SAVE
            hidePopup();
            openModal(true, productToEdit); // PASS SAVED
        }
    });

    // FIX: Save ID to local variable BEFORE hiding popup
    popupDeleteBtn.addEventListener('click', async () => {
        if (currentActiveProduct) {
            const idToDelete = currentActiveProduct.id; // SAVE
            hidePopup();
            if (confirm('Are you sure you want to delete this product?')) {
                const { error } = await supabase.from('products').delete().eq('id', idToDelete);
                if (!error) fetchProducts();
            }
        }
    });

    // --- DATA FETCHING & RENDERING ---

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
                <td class="p-4 text-right">
                    <button class="menu-trigger p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors" data-id="${p.id}">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
        attachRowListeners();
    }

    function attachRowListeners() {
        tbody.querySelectorAll('.menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const product = products.find(p => p.id === id);
                if (product) showPopup(btn, product);
            });
        });
    }

    // Export CSV
    container.querySelector('#export-stock-btn').addEventListener('click', () => {
        if (products.length === 0) return;

        let csv = "ID,Name,Price,Quantity,Vendor,Location,Courier Charges,Serials,Created At\n";

        csv += products.map(p => {
            const safeName = (p.name || '').replace(/,/g, ' ');
            const safeVendor = (p.vendor_name || '').replace(/,/g, ' ');
            const safeLoc = (p.location_from || '').replace(/,/g, ' ');
            const safeSerials = (p.serial_number || '').replace(/,/g, ';'); 

            return `${p.id},${safeName},${p.price},${p.quantity},${safeVendor},${safeLoc},${p.courier_charges || 0},${safeSerials},${new Date(p.created_at).toLocaleDateString()}`;
        }).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `stock_inventory_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    fetchProducts();
}
