import { supabase } from '../supabase.js';
import { Plus, Search, Edit2, Trash2, Download, MoreVertical, Eye, Image as ImageIcon, Upload, X, ChevronLeft, ChevronRight } from 'lucide';

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

            <div class="card p-4 flex gap-4">
                <div class="relative flex-1">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"></i>
                    <input type="text" id="search-stock" placeholder="Search products..." class="input-field pl-12" />
                </div>
                <div class="w-48">
                    <select id="filter-category" class="input-field cursor-pointer">
                        <option value="">All Categories</option>
                        <!-- Dynamic Options populated later -->
                    </select>
                </div>
            </div>

            <div class="card overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                            <th class="p-4 font-semibold w-24">Img</th>
                            <th class="p-4 font-semibold">Product Name</th>
                            <th class="p-4 font-semibold">Category</th>
                            <th class="p-4 font-semibold">Price (₹)</th>
                            <th class="p-4 font-semibold">Quantity</th>
                            <th class="p-4 font-semibold">Last Updated</th>
                            <th class="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body" class="text-slate-700 divide-y divide-slate-100">
                        <tr><td colspan="7" class="p-4 text-center">Loading...</td></tr>
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

        <!-- Modal Template -->
        <div id="product-modal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-[100] backdrop-blur-sm">
            <div class="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100 ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
                <h3 id="modal-title" class="text-xl font-bold mb-4">Add Product</h3>
                <form id="product-form" class="space-y-4">
                    <input type="hidden" id="product-id">
                    
                    <!-- Multi-Image Upload -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
                        <div class="grid grid-cols-3 gap-2" id="image-gallery-preview">
                             <!-- Preview Items -->
                        </div>
                        <label class="mt-2 flex items-center justify-center w-full h-12 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <i data-lucide="plus" class="w-5 h-5 text-slate-400 mr-2"></i>
                            <span class="text-sm text-slate-500">Add Images</span>
                            <input type="file" id="product-image-input" accept="image/*" multiple class="hidden">
                        </label>
                        <button type="button" id="add-image-url-btn" class="flex flex-col items-center justify-center w-full h-12 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors">
                            <i data-lucide="link" class="w-5 h-5 mb-1"></i>
                            <span class="text-[10px]">Add via URL</span>
                        </button>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                        <input type="text" id="product-name" required class="input-field" placeholder="e.g. iPhone Screen">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Category / Tag</label>
                        <input type="text" id="product-category" class="input-field" list="category-suggestions" placeholder="e.g. Printer, Cables, Screen...">
                        <datalist id="category-suggestions">
                            <option value="Printer">
                            <option value="Toner / Cartridge">
                            <option value="Cables">
                            <option value="Accessories">
                            <option value="Spare Parts">
                            <option value="Mobile">
                        </datalist>
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
                            <div id="cost-mask" class="absolute inset-0 bg-indigo-100/90 backdrop-blur-md flex items-center justify-center text-xs text-indigo-400 font-mono select-none">
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

        <!-- Lightbox -->
        <div id="lightbox" class="fixed inset-0 z-[110] bg-black/95 hidden flex flex-col items-center justify-center backdrop-blur-md">
             <!-- Close button with very high z-index and pointer-events -->
             <button id="lightbox-close" class="absolute top-6 right-6 text-white hover:text-slate-300 z-[120] cursor-pointer p-2 bg-black/20 rounded-full">
                <i data-lucide="x" class="w-8 h-8"></i>
             </button>
             
             <div class="relative w-full h-full flex items-center justify-center px-12 z-[115]">
                 <button id="lightbox-prev" class="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[120]">
                    <i data-lucide="chevron-left" class="w-8 h-8"></i>
                 </button>
                 <img id="lightbox-img" class="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" src="" alt="Preview">
                 <button id="lightbox-next" class="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[120]">
                    <i data-lucide="chevron-right" class="w-8 h-8"></i>
                 </button>
             </div>
             <div id="lightbox-caption" class="absolute bottom-4 text-white/50 text-sm z-[120]"></div>
        </div>
    `;

    // Re-run icons
    if (window.lucide) window.lucide.createIcons();

    const tbody = container.querySelector('#stock-table-body');
    const searchInput = container.querySelector('#search-stock');
    const modal = container.querySelector('#product-modal');
    const form = container.querySelector('#product-form');
    const imageInput = container.querySelector('#product-image-input');
    const galleryPreview = container.querySelector('#image-gallery-preview');

    // Lightbox
    const lightbox = container.querySelector('#lightbox');
    const lbImg = container.querySelector('#lightbox-img');
    const lbPrev = container.querySelector('#lightbox-prev');
    const lbNext = container.querySelector('#lightbox-next');
    const lbClose = container.querySelector('#lightbox-close');

    let products = [];
    let currentUploadFiles = []; // Files explicitly selected to upload
    let currentExistingImages = []; // URLs of images already saved
    let initialExistingImages = []; // To track deletions

    let lightboxImages = [];
    let lightboxIndex = 0;

    // Fetch Data
    async function fetchProducts() {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching products:', error);
            tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">Error loading stock</td></tr>`;
            return;
        }
        products = data;
        updateCategoryDropdown();
        renderTable(products);
    }

    // Helper: Parse Image URLs
    function getImages(imgString) {
        if (!imgString) return [];
        return imgString.split(',').filter(s => s.trim().length > 0);
    }

    function getCategoryColor(cat) {
        const colors = {
            'Printer': 'bg-orange-100 text-orange-800',
            'Toner / Cartridge': 'bg-cyan-100 text-cyan-800',
            'Cables': 'bg-gray-100 text-gray-800',
            'Accessories': 'bg-purple-100 text-purple-800',
            'Spare Parts': 'bg-indigo-100 text-indigo-800',
            'Mobile': 'bg-pink-100 text-pink-800',
            'General': 'bg-blue-100 text-blue-800'
        };
        return colors[cat] || 'bg-emerald-100 text-emerald-800'; // Default fallback
    }

    function renderTable(items) {
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No products found</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(p => {
            const images = getImages(p.image_url);
            const thumb = images.length > 0 ? images[0] : null;

            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4">
                    ${thumb ?
                    `<div class="relative w-12 h-12 group cursor-zoom-in img-preview-trigger" data-id="${p.id}">
                             <img src="${thumb}" class="w-12 h-12 rounded-lg object-cover border border-slate-200" alt="${p.name}">
                             ${images.length > 1 ? `<span class="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-bl-sm rounded-tr-sm">+${images.length - 1}</span>` : ''}
                        </div>` :
                    `<div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><i data-lucide="image" class="w-5 h-5"></i></div>`
                }
                </td>
                <td class="p-4 font-medium text-slate-900">${p.name}</td>
                <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(p.category)}">
                        ${p.category || 'General'}
                    </span>
                </td>
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
        `}).join('');

        if (window.lucide) window.lucide.createIcons();
        attachRowListeners();
    }

    function openLightbox(images, index = 0) {
        lightboxImages = images;
        lightboxIndex = index;
        updateLightbox();
        lightbox.classList.remove('hidden');
    }

    function updateLightbox() {
        if (lightboxImages.length === 0) return;
        lbImg.src = lightboxImages[lightboxIndex];
        container.querySelector('#lightbox-caption').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
    }

    lbClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        lightbox.classList.add('hidden');
    });

    // Also close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.add('hidden');
    });

    lbPrev.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        updateLightbox();
    });
    lbNext.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
        updateLightbox();
    });


       // Popup Elements
    const popupMenu = container.querySelector('#stock-action-menu');
    let currentActiveId = null;

    function showPopup(btn, id) {
        const rect = btn.getBoundingClientRect();
        currentActiveId = id;

        // 1. Make the menu visible but hidden to the eye so we can measure its size
        popupMenu.classList.remove('hidden');
        popupMenu.style.visibility = 'hidden'; 

        const menuHeight = popupMenu.offsetHeight;
        const menuWidth = popupMenu.offsetWidth;

        // 2. Calculate Vertical Position (Top)
        // Default: Open below the button (rect.bottom + 5px gap)
        let top = rect.bottom + 5;

        // Check if opening below goes off the screen bottom
        if (top + menuHeight > window.innerHeight) {
            // Flip it to open ABOVE the button instead
            top = rect.top - menuHeight - 5;
        }

        // 3. Calculate Horizontal Position (Left)
        // Default: Align right edge of menu with right edge of button
        let left = rect.right - menuWidth;

        // Fallback: Ensure it doesn't go off the left edge of the screen
        if (left < 10) {
            left = 10; // Add some padding from the left
        }

        // 4. Apply the calculated positions
        popupMenu.style.top = `${top}px`;
        popupMenu.style.left = `${left}px`;

        // 5. Finally, make it visible
        popupMenu.style.visibility = 'visible';
    }

    function hidePopup() {
        popupMenu.classList.add('hidden');
        // We reset visibility style so it doesn't interfere if we reuse the element
        popupMenu.style.visibility = ''; 
        currentActiveId = null;
    }

    document.addEventListener('click', (e) => {
        if (!popupMenu.contains(e.target) && !e.target.closest('.menu-trigger')) {
            hidePopup();
        }
    });

    function attachRowListeners() {
        // Thumbnail Click
        tbody.querySelectorAll('.img-preview-trigger').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = el.dataset.id;
                const p = products.find(prod => prod.id === id);
                if (p) openLightbox(getImages(p.image_url));
            });
        });

        // Row Menu Triggers
        tbody.querySelectorAll('.menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                showPopup(btn, id);
            });
        });

        // View Button
        const oldViewBtn = container.querySelector('#stock-popup-view');
        const newViewBtn = oldViewBtn.cloneNode(true);
        oldViewBtn.replaceWith(newViewBtn);
        newViewBtn.addEventListener('click', () => {
            if (currentActiveId) {
                const product = products.find(p => p.id === currentActiveId);
                if (product) openModal(false, product, true); // View Mode
                hidePopup();
            }
        });

        // Edit Button
        const oldEditBtn = container.querySelector('#stock-popup-edit');
        const newEditBtn = oldEditBtn.cloneNode(true);
        oldEditBtn.replaceWith(newEditBtn);
        newEditBtn.addEventListener('click', () => {
            if (currentActiveId) {
                const product = products.find(p => p.id === currentActiveId);
                if (product) openModal(true, product); // Edit Mode
                hidePopup();
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

    // Search & Filter Logic
    function applyFilters() {
        const term = searchInput.value.toLowerCase();
        const cat = container.querySelector('#filter-category').value;

        console.log(`Filtering Stock - Term: "${term}", Category: "${cat}"`);

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(term);
            // Handle null/undefined category as 'General' and strict compare
            const prodCat = p.category || 'General';
            const matchesCat = cat === '' || prodCat === cat;
            return matchesSearch && matchesCat;
        });
        renderTable(filtered);
    }

    searchInput.addEventListener('input', applyFilters);

    container.querySelector('#filter-category').addEventListener('change', applyFilters);

    function updateCategoryDropdown() {
        // Collect unique categories
        // Normalize nulls to 'General'
        const cats = new Set(products.map(p => p.category || 'General'));
        const select = container.querySelector('#filter-category');
        const currentVal = select.value;

        // Sort alphabetically
        const sortedCats = Array.from(cats).sort((a, b) => a.localeCompare(b));

        select.innerHTML = '<option value="">All Categories</option>' +
            sortedCats.map(c => `<option value="${c}">${c}</option>`).join('');

        // Restore selection if it still exists, otherwise default to ""
        if (sortedCats.includes(currentVal)) {
            select.value = currentVal;
        } else {
            select.value = "";
        }
    }

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
        currentValues.forEach((val, i) => { if (i < count && !existingSerials.length) valuesToUse[i] = val; });

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

    // Image Upload Logic in Modal

    function renderGallery() {
        galleryPreview.innerHTML = '';

        // Existing
        currentExistingImages.forEach((url, i) => {
            const div = document.createElement('div');
            div.className = 'relative w-full h-20 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100';
            div.innerHTML = `
                <img src="${url}" class="w-full h-full object-cover">
                <button type="button" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 z-20 shadow-sm transition-transform hover:scale-110" title="Remove">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            `;
            // Delete existing
            const btn = div.querySelector('button');
            if (window.lucide) window.lucide.createIcons(div); // Init icons inside this div

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentExistingImages.splice(i, 1);
                renderGallery();
            });
            galleryPreview.appendChild(div);
        });

        // New Uploads
        currentUploadFiles.forEach((file, i) => {
            const div = document.createElement('div');
            div.className = 'relative w-full h-20 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100';
            // We use file reader just for viewing
            const reader = new FileReader();
            reader.onload = (e) => {
                div.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover opacity-90">
                    <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/20 pointer-events-none">NEW</div>
                    <button type="button" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 z-20 shadow-sm transition-transform hover:scale-110" title="Remove">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                `;
                if (window.lucide) window.lucide.createIcons(div);

                const btn = div.querySelector('button');
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentUploadFiles.splice(i, 1);
                    renderGallery();
                });
            };
            reader.readAsDataURL(file);
            galleryPreview.appendChild(div);
        });
    }

    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        currentUploadFiles = [...currentUploadFiles, ...files];
        renderGallery();
        imageInput.value = ''; // reset so same files can be selected again
        imageInput.value = ''; // reset so same files can be selected again
    });

    // Add Image via URL
    container.querySelector('#add-image-url-btn').addEventListener('click', () => {
        const url = prompt("Paste Image URL (e.g., from Imgur, Google Photos, etc.):");
        if (url && url.trim().length > 0) {
            // Basic validation or just trust user? Trust user for now, maybe check http
            if (!url.startsWith('http')) {
                alert('Please enter a valid URL starting with http:// or https://');
                return;
            }
            currentExistingImages.push(url.trim());
            renderGallery();
        }
    });


    // Modal Logic
    const openModal = (isEdit = false, data = null, isView = false) => {
        const title = isView ? 'Product Details' : (isEdit ? 'Edit Product' : 'Add Product');
        document.querySelector('#modal-title').textContent = title;

        document.querySelector('#product-id').value = isEdit || isView ? data.id : '';
        document.querySelector('#product-name').value = isEdit || isView ? data.name : '';
        document.querySelector('#product-category').value = isEdit || isView ? data.category || '' : '';
        document.querySelector('#product-price').value = isEdit || isView ? data.price : '';
        document.querySelector('#product-qty').value = isEdit || isView ? data.quantity : '';

        // Cost Price Handling (Secure)
        costInput.value = isEdit || isView ? data.cost_price || 0 : 0;
        costInput.disabled = true; // Always start disabled/locked
        costMask.classList.remove('hidden');
        unlockBtn.classList.remove('hidden');

        document.querySelector('#product-vendor').value = isEdit || isView ? data.vendor_name || '' : '';
        document.querySelector('#product-location').value = isEdit || isView ? data.location_from || '' : '';
        document.querySelector('#product-courier').value = isEdit || isView ? data.courier_charges || 0 : '';

        // Images Init
        currentUploadFiles = [];
        const existingDataImages = (isEdit || isView) ? getImages(data.image_url) : [];
        currentExistingImages = [...existingDataImages];
        initialExistingImages = [...existingDataImages]; // Snapshot for deletion logic

        renderGallery();

        // View Mode Specifics: Disable/Enable fields
        const allInteractables = form.querySelectorAll('input, select, textarea, button:not(#cancel-modal)');
        const saveBtn = container.querySelector('#save-product-btn');
        const cancelBtn = container.querySelector('#cancel-modal');
        const imageAddArea = container.querySelector('#product-image-input').parentElement; // The label wrapper
        const addUrlBtn = container.querySelector('#add-image-url-btn');

        if (isView) {
            allInteractables.forEach(i => {
                i.disabled = true;
                if (i.tagName === 'INPUT' || i.tagName === 'TEXTAREA' || i.tagName === 'SELECT') {
                    i.classList.add('bg-slate-100', 'text-slate-500');
                }
            });
            if (saveBtn) saveBtn.classList.add('hidden');
            if (cancelBtn) cancelBtn.textContent = 'Close';

            // Hide Image Upload Controls
            if (imageAddArea) imageAddArea.classList.add('hidden');
            if (addUrlBtn) addUrlBtn.classList.add('hidden');

            // Hide remove buttons on images
            galleryPreview.querySelectorAll('button').forEach(b => b.classList.add('hidden'));

        } else {
            allInteractables.forEach(i => {
                i.disabled = false;
                if (i.tagName === 'INPUT' || i.tagName === 'TEXTAREA' || i.tagName === 'SELECT') {
                    i.classList.remove('bg-slate-100', 'text-slate-500');
                }
            });
            if (saveBtn) saveBtn.classList.remove('hidden');
            if (cancelBtn) cancelBtn.textContent = 'Cancel';

            if (imageAddArea) imageAddArea.classList.remove('hidden');
            if (addUrlBtn) addUrlBtn.classList.remove('hidden');

            // Show remove buttons
            galleryPreview.querySelectorAll('button').forEach(b => b.classList.remove('hidden'));
        }

        const serials = ((isEdit || isView) && data.serial_number) ? data.serial_number.split(',') : [];
        renderSerialInputs((isEdit || isView) ? data.quantity : 0, serials);

        // Disable serial inputs if view mode
        if (isView) {
            container.querySelectorAll('.serial-input').forEach(i => {
                i.disabled = true;
                i.classList.add('bg-slate-100');
            });
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
        currentUploadFiles = [];
        currentExistingImages = [];
        initialExistingImages = [];

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
        const saveBtn = container.querySelector('#save-product-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'Saving...';

        const id = document.querySelector('#product-id').value;
        const name = document.querySelector('#product-name').value;
        const category = document.querySelector('#product-category').value.trim() || 'General';
        const serialInputs = container.querySelectorAll('.serial-input');
        const serial_number = Array.from(serialInputs).map(i => i.value).filter(v => v.trim() !== '').join(',');

        const price = parseFloat(document.querySelector('#product-price').value) || 0;
        const cost_price = parseFloat(costInput.value) || 0; // Capture Cost
        const quantity = parseInt(document.querySelector('#product-qty').value) || 0;
        const vendor_name = document.querySelector('#product-vendor').value;
        const location_from = document.querySelector('#product-location').value;
        const courier_charges = parseFloat(document.querySelector('#product-courier').value) || 0;

        try {
            // 0. Handle Image Deletions (Files)
            if (id && initialExistingImages.length > 0) {
                const deletedImages = initialExistingImages.filter(img => !currentExistingImages.includes(img));
                if (deletedImages.length > 0) {
                    console.log('Deleting images:', deletedImages);
                    // Extract file paths from URLs
                    // URL format: .../storage/v1/object/public/product-images/filename
                    const paths = deletedImages.map(url => {
                        const parts = url.split('/product-images/');
                        return parts.length > 1 ? parts[1] : null;
                    }).filter(p => p !== null);

                    if (paths.length > 0) {
                        const { error: delErr } = await supabase.storage.from('product-images').remove(paths);
                        if (delErr) console.error('Error deleting files:', delErr);
                    }
                }
            }

            // 1. Upload new files
            const uploadedUrls = [];
            for (const file of currentUploadFiles) {
                const fileName = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrlData.publicUrl);
            }

            // 2. Combine with kept existing images
            const finalImageString = [...currentExistingImages, ...uploadedUrls].join(',');

            let payload = { name, category, serial_number, price, cost_price, quantity, vendor_name, location_from, courier_charges, image_url: finalImageString };

            if (!name) throw new Error('Name is required');

            let error;
            if (id) {
                payload.updated_at = new Date().toISOString();
                const { error: err } = await supabase.from('products').update(payload).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabase.from('products').insert([payload]);
                error = err;
            }

            if (error) throw error;

            fetchProducts();
            closeModal();

        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save product: ' + err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Product';
        }
    });

    // Export CSV
    container.querySelector('#export-stock-btn').addEventListener('click', () => {
        if (products.length === 0) return;

        let csv = "ID,Name,Price,Quantity,Vendor,Location,Courier Charges,Serials,Created At,Image URLs\n";

        csv += products.map(p => {
            const safeName = (p.name || '').replace(/,/g, ' ');
            const safeVendor = (p.vendor_name || '').replace(/,/g, ' ');
            const safeLoc = (p.location_from || '').replace(/,/g, ' ');
            const safeSerials = (p.serial_number || '').replace(/,/g, ';');
            const safeImages = (p.image_url || '').replace(/,/g, ';');

            return `${p.id},${safeName},${p.price},${p.quantity},${safeVendor},${safeLoc},${p.courier_charges || 0},${safeSerials},${new Date(p.created_at).toLocaleDateString()},${safeImages}`;
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
