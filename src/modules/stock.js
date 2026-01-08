import { supabase } from '../supabase.js';
// Added 'X' to imports for the close button in the View Modal
import { Plus, Search, Edit2, Trash2, Download, MoreVertical, Eye, X } from 'lucide';

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

            <div class="card overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                            <th class="p-4 font-semibold">Product Name</th>
                            <th class="p-4 font-semibold">Price (₹)</th>
                            <th class="p-4 font-semibold">Quantity</th>
                            <th class="p-4 font-semibold">Last Updated</th>
                            <th class="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body" class="text-slate-700 divide-y divide-slate-100">
                        <tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- GLOBAL FLOATING POPUP MENU STOCK -->
        <div id="stock-action-menu" class="hidden fixed z-[60] bg-white rounded-lg shadow-xl border border-slate-100 w-40 py-1 animate-in fade-in zoom-in-95 duration-100">
            <button id="stock-popup-view" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4"></i> View Detail
            </button>
            <div class="border-t border-slate-100 my-1"></div>
            <button id="stock-popup-edit" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <i data-lucide="edit-2" class="w-4 h-4"></i> Edit Product
            </button>
            <div class="border-t border-slate-100 my-1"></div>
            <button id="stock-popup-delete" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
            </button>
        </div>

        <!-- VIEW DETAIL MODAL (From Code A) -->
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

        <!-- ADD/EDIT MODAL TEMPLATE -->
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
                            <label class="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                            <input type="number" id="product-price" required class="input-field" placeholder="0.00">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                            <input type="number" id="product-qty" required class="input-field" placeholder="0" min="0">
                        </div>
                    </div>

                    <!-- Actual Price (Cost) - Secured -->
                    <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-sm font-bold text-indigo-900">Actual Price (Cost)</label>
                            <button type="button" id="unlock-cost-btn" class="text-xs text-indigo-600 hover:text-indigo-800 underline">
                                <i data-lucide="lock" class="w-3 h-3 inline mr-1"></i>Unlock
                            </button>
                        </div>
                        <div class="relative">
                            <input type="number" id="product-cost" class="input-field bg-white" placeholder="Locked" disabled>
                            <div id="cost-mask" class="absolute inset-0 bg-indigo-50/50 backdrop-blur-[2px] flex items-center justify-center text-xs text-indigo-400 font-mono">
                                ••••••••
                            </div>
                        </div>
                        <p class="text-[10px] text-indigo-400 mt-1">Hidden from standard users. Required for profit calculation.</p>
                    </div>

                    <!-- Dynamic Serials Container -->
                    <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Serial Numbers</label>
                        <div id="serials-container" class="space-y-2 max-h-40 overflow-y-auto pr-1">
                            <p class="text-xs text-slate-400 italic">Enter quantity to add serial numbers.</p>
                        </div>
                    </div>
                    
                    <!-- Vendor/Location Fields -->
                    <div class="space-y-4 pt-2 border-t border-slate-100">
                        <div>
                             <label class="block text-sm font-medium text-slate-700 mb-1">Vendor/Supplier Name</label>
                             <input type="text" id="product-vendor" class="input-field" placeholder="e.g. ABC Electronics">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Sourced From</label>
                                <input type="text" id="product-location" class="input-field" placeholder="e.g. Bangalore">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Courier Charges</label>
                                <input type="number" id="product-courier" class="input-field" placeholder="0" value="0">
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" id="cancel-modal" class="btn-secondary">Cancel</button>
                        <button type="submit" id="save-product-btn" class="btn-primary">Save Product</button>
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
    const viewModal = container.querySelector('#view-modal');
    const viewModalContent = container.querySelector('#view-modal-content');
    const form = container.querySelector('#product-form');
    let products = [];

    // Fetch Data
    async function fetchProducts() {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching products:', error);
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error loading stock</td></tr>`;
            return;
        }
        products = data;
        renderTable(products);
    }

    function renderTable(items) {
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No products found</td></tr>`;
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
                <td class="p-4 text-sm text-slate-500">
                    ${p.updated_at ? new Date(p.updated_at).toLocaleString() : (p.created_at ? new Date(p.created_at).toLocaleString() : '-')}
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

    // Popup Elements
    const popupMenu = container.querySelector('#stock-action-menu');
    let currentActiveId = null;

    function showPopup(btn, id) {
        const rect = btn.getBoundingClientRect();
        currentActiveId = id;
        popupMenu.style.top = `${rect.bottom + 5}px`;
        popupMenu.style.left = `${rect.right - 150}px`;
        popupMenu.classList.remove('hidden');
    }

    function hidePopup() {
        popupMenu.classList.add('hidden');
        currentActiveId = null;
    }

    document.addEventListener('click', (e) => {
        if (!popupMenu.contains(e.target) && !e.target.closest('.menu-trigger')) {
            hidePopup();
        }
    });

    function attachRowListeners() {
        // Row Menu Triggers
        tbody.querySelectorAll('.menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                showPopup(btn, id);
            });
        });

        // View Button -> Opens the NEW View Modal (Clean Design)
        const oldViewBtn = container.querySelector('#stock-popup-view');
        const newViewBtn = oldViewBtn.cloneNode(true);
        oldViewBtn.replaceWith(newViewBtn);
        newViewBtn.addEventListener('click', () => {
            if (currentActiveId) {
                const product = products.find(p => p.id === currentActiveId);
                if (product) {
                    hidePopup();
                    openViewModal(product); // Calls the new specific function
                }
            }
        });

        // Edit Button -> Opens the Form Modal
        const oldEditBtn = container.querySelector('#stock-popup-edit');
        const newEditBtn = oldEditBtn.cloneNode(true);
        oldEditBtn.replaceWith(newEditBtn);
        newEditBtn.addEventListener('click', () => {
            if (currentActiveId) {
                const product = products.find(p => p.id === currentActiveId);
                if (product) {
                    hidePopup();
                    openModal(true, product); // Edit Mode
                }
            }
        });

        // Delete Button
        const oldDeleteBtn = container.querySelector('#stock-popup-delete');
        const newDeleteBtn = oldDeleteBtn.cloneNode(true);
        oldDeleteBtn.replaceWith(newDeleteBtn);
        newDeleteBtn.addEventListener('click', async () => {
            const idToDelete = currentActiveId;
            if (idToDelete) {
                hidePopup();

                const adminPass = prompt("Enter Developer Password to DELETE:");
                if (adminPass !== "Jayasan@9045") {
                    alert("Incorrect Password! Access Denied.");
                    return;
                }

                if (confirm('Are you sure you want to delete this product?')) {
                    const { error } = await supabase.from('products').delete().eq('id', idToDelete);
                    if (!error) fetchProducts();
                    else alert('Error: ' + error.message);
                }
            }
        });
    }

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.name.toLowerCase().includes(term));
        renderTable(filtered);
    });

        // ==========================================
    // VIEW DETAIL MODAL LOGIC (Updated with Courier Charges)
    // ==========================================
    function openViewModal(product) {
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
                
                <!-- COURIER CHARGES ADDED HERE -->
                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Courier Charges</label>
                    <div class="text-slate-800">₹${product.courier_charges || 0}</div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase mb-2 block">Serial Numbers</label>
                    ${serialsHtml}
                </div>

                <div class="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-400">
                     <div>Created: ${new Date(product.created_at).toLocaleDateString()}</div>
                     <div>Updated: ${product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}</div>
                </div>
            </div>
        `;
        viewModal.classList.remove('hidden');
    }

    // Close View Modal Events
    container.querySelector('#close-view-modal').addEventListener('click', () => viewModal.classList.add('hidden'));
    container.querySelector('#close-view-modal-btn').addEventListener('click', () => viewModal.classList.add('hidden'));
    viewModal.addEventListener('click', (e) => { if (e.target === viewModal) viewModal.classList.add('hidden'); });

    // ==========================================
    // ADD/EDIT FORM LOGIC
    // ==========================================

    // Serials Logic
    const qtyInput = container.querySelector('#product-qty');
    const serialsContainer = container.querySelector('#serials-container');

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

    // Unlock Cost Logic
    const costInput = container.querySelector('#product-cost');
    const costMask = container.querySelector('#cost-mask');
    const unlockBtn = container.querySelector('#unlock-cost-btn');

    unlockBtn.addEventListener('click', () => {
        const pass = prompt('Enter Developer Password to Unlock Cost Price:');
        if (pass === 'admin123') {
            costInput.disabled = false;
            costMask.classList.add('hidden');
            unlockBtn.classList.add('hidden');
            costInput.focus();
        } else {
            alert('Incorrect Password');
        }
    });

    // Modal Logic (Strictly Add/Edit)
    const openModal = (isEdit = false, data = null) => {
        const title = isEdit ? 'Edit Product' : 'Add Product';
        document.querySelector('#modal-title').textContent = title;

        document.querySelector('#product-id').value = isEdit ? data.id : '';
        document.querySelector('#product-name').value = isEdit ? data.name : '';
        document.querySelector('#product-price').value = isEdit ? data.price : '';
        document.querySelector('#product-qty').value = isEdit ? data.quantity : '';

        // Cost Price Handling (Secure)
        costInput.value = isEdit ? data.cost_price || 0 : 0;
        costInput.disabled = true; // Always start disabled/locked
        costMask.classList.remove('hidden');
        unlockBtn.classList.remove('hidden');

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

        // Reset Security
        costInput.disabled = true;
        costMask.classList.remove('hidden');
        unlockBtn.classList.remove('hidden');
    };

    container.querySelector('#add-product-btn').addEventListener('click', () => openModal(false));
    container.querySelector('#cancel-modal').addEventListener('click', closeModal);

    // Add/Edit Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#product-id').value;
        const name = document.querySelector('#product-name').value;
        const serialInputs = container.querySelectorAll('.serial-input');
        const serial_number = Array.from(serialInputs).map(i => i.value).filter(v => v.trim() !== '').join(',');

        const price = parseFloat(document.querySelector('#product-price').value) || 0;
        const cost_price = parseFloat(costInput.value) || 0; 
        const quantity = parseInt(document.querySelector('#product-qty').value) || 0;
        const vendor_name = document.querySelector('#product-vendor').value;
        const location_from = document.querySelector('#product-location').value;
        const courier_charges = parseFloat(document.querySelector('#product-courier').value) || 0;

        let payload = { name, serial_number, price, cost_price, quantity, vendor_name, location_from, courier_charges };

        if (!name) { alert('Name is required'); return; }

        let error;
        if (id) {
            payload.updated_at = new Date().toISOString();
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
