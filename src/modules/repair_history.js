import { supabase } from '../supabase.js';
import { Search, Download, MoreVertical, Eye, Trash2, X } from 'lucide';

export async function initRepairHistory(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-800">Repair History</h2>
                <button id="export-repairs-btn" class="btn-secondary flex items-center gap-2 text-sm">
                    <i data-lucide="download" class="w-4 h-4"></i> Export CSV
                </button>
            </div>

            <div class="card p-4 flex gap-4">
                 <div class="relative flex-1">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"></i>
                    <input type="text" id="search-repair" placeholder="Search customer, device or status..." class="input-field pl-12" />
                </div>
            </div>

            <div class="card overflow-hidden relative">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                        <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="p-4">Date</th>
                                <th class="p-4">Customer</th>
                                <th class="p-4">Device</th>
                                <th class="p-4">Serial No.</th>
                                <th class="p-4">Description</th>
                                <th class="p-4">Status</th>
                                <th class="p-4 text-right">Cost</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="repair-list-body" class="divide-y divide-slate-100">
                            <tr><td colspan="8" class="p-8 text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- GLOBAL FLOATING POPUP MENU -->
        <!-- This sits outside the table flow so it never gets clipped/hidden -->
        <div id="global-action-menu" class="hidden fixed z-[60] bg-white rounded-lg shadow-xl border border-slate-100 w-40 py-1 animate-in fade-in zoom-in-95 duration-100">
            <button id="popup-view" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4"></i> View Detail
            </button>
            <div class="border-t border-slate-100 my-1"></div>
            <button id="popup-delete" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
            </button>
        </div>

        <!-- Modal for Full Details -->
        <div id="detail-modal" class="fixed inset-0 z-50 hidden bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 class="text-lg font-bold text-slate-800">Repair Details</h3>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div id="modal-content" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <!-- Content injected via JS -->
                </div>
                <div class="px-6 py-4 bg-slate-50 text-right">
                    <button id="close-modal-action" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition-colors">Close</button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    const tbody = container.querySelector('#repair-list-body');
    const searchInput = container.querySelector('#search-repair');
    
    // Popup Elements
    const popupMenu = container.querySelector('#global-action-menu');
    const popupViewBtn = container.querySelector('#popup-view');
    const popupDeleteBtn = container.querySelector('#popup-delete');
    let currentActiveId = null; // Tracks which ID is currently being acted upon

    let repairs = [];

    // --- Popup Logic ---
    function showPopup(btn, id) {
        const rect = btn.getBoundingClientRect();
        currentActiveId = id;

        // Position the popup at the button's location, aligned to the right
        // Using fixed positioning ensures it pops OVER the table without clipping
        popupMenu.style.top = `${rect.bottom + 5}px`;
        popupMenu.style.left = `${rect.right - 150}px`; 
        
        popupMenu.classList.remove('hidden');
    }

    function hidePopup() {
        popupMenu.classList.add('hidden');
        currentActiveId = null;
    }

    // Close popup when clicking anywhere else
    document.addEventListener('click', (e) => {
        if (!popupMenu.contains(e.target) && !e.target.closest('.menu-trigger')) {
            hidePopup();
        }
    });

    // --- Modal Logic ---
    const modal = container.querySelector('#detail-modal');
    const modalContent = container.querySelector('#modal-content');
    const closeModalBtns = [container.querySelector('#close-modal-btn'), container.querySelector('#close-modal-action')];

    function openModal(repair) {
        hidePopup(); // Close menu when opening modal
        modalContent.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="text-xs font-bold text-slate-400 uppercase">Customer Info</label>
                    <div class="text-slate-800 font-medium">${repair.customer_name}</div>
                    <div class="text-slate-500 text-sm">${repair.contact_number || 'No contact'}</div>
                </div>
                
                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Device</label>
                    <div class="text-slate-800 font-medium">${repair.device_details}</div>
                    <div class="text-xs text-slate-500">Model: ${repair.model_number || '-'}</div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Serial No.</label>
                    <div class="text-slate-800 font-mono">${repair.serial_number || '-'}</div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Technician</label>
                    <div class="text-slate-800">${repair.technician_name || '-'}</div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Status</label>
                    <div class="mt-1 inline-block">
                        <span class="px-2 py-1 rounded-full text-xs font-bold 
                            ${repair.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            repair.status === 'Repaired' ? 'bg-blue-100 text-blue-700' :
                            repair.status === 'Part Not Available' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
                            ${repair.status}
                        </span>
                    </div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Estimated Cost</label>
                    <div class="text-slate-800 font-bold">₹${repair.estimated_cost || 0}</div>
                </div>
                
                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Part Replaced</label>
                    <div class="text-slate-800">${repair.part_replaced_name || 'None'}</div>
                </div>

                <div class="col-span-2">
                    <label class="text-xs font-bold text-slate-400 uppercase">Issue Description</label>
                    <div class="p-3 bg-slate-50 rounded border border-slate-100 text-sm text-slate-700 mt-1">
                        ${repair.issue_description || 'No description provided.'}
                    </div>
                </div>

                <div class="col-span-2 text-xs text-slate-400 border-t pt-2 mt-2">
                    Created on: ${new Date(repair.created_at).toLocaleString()} <br>
                    ID: ${repair.id}
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }

    closeModalBtns.forEach(btn => {
        btn?.addEventListener('click', () => modal.classList.add('hidden'));
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // --- Data Fetching ---
    async function fetchRepairs() {
        const { data, error } = await supabase
            .from('repairs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">Error loading data</td></tr>`;
            return;
        }

        repairs = data;
        renderTable(repairs);
    }

    // --- Rendering ---
    function renderTable(items) {
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No repair records found</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(r => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 whitespace-nowrap">
                    <div class="font-medium text-slate-700">${new Date(r.created_at).toLocaleDateString()}</div>
                    <div class="text-xs text-slate-400">${new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td class="p-4 font-medium text-slate-800">
                    ${r.customer_name}
                    <div class="text-xs text-slate-400">${r.contact_number || ''}</div>
                </td>
                <td class="p-4">${r.device_details}</td>
                <td class="p-4 font-mono text-xs text-slate-500">${r.serial_number || '-'}</td>
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
                    <button class="menu-trigger p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors" data-id="${r.id}">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
        attachRowListeners();
    }

    function attachRowListeners() {
        // Trigger for Popup
        tbody.querySelectorAll('.menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent document click from closing immediately
                const id = btn.dataset.id;
                showPopup(btn, id);
            });
        });

        // Handle Popup View Click
        popupViewBtn.addEventListener('click', () => {
            if (currentActiveId) {
                const repair = repairs.find(r => r.id == currentActiveId);
                if (repair) openModal(repair);
            }
        });

        // Handle Popup Delete Click (FIXED LOGIC HERE)
        popupDeleteBtn.addEventListener('click', async () => {
            // 1. Capture ID locally before hiding popup (which clears the global variable)
            const idToDelete = currentActiveId;

            if (idToDelete) {
                hidePopup(); // Hide popup UI
                
                const adminPass = prompt("Enter Developer Password to DELETE:");
                if (adminPass !== "Jayasan@9045") {
                    alert("Incorrect Password! Access Denied.");
                    return;
                }

                if (confirm('Delete this repair entry permanently?')) {
                    // 2. Use the locally captured ID for the delete operation
                    const { error } = await supabase.from('repairs').delete().eq('id', idToDelete);
                    if (error) alert('Error: ' + error.message);
                    else fetchRepairs();
                }
            }
        });
    }

    // --- Search ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = repairs.filter(r =>
            r.customer_name.toLowerCase().includes(term) ||
            r.device_details.toLowerCase().includes(term) ||
            (r.serial_number && r.serial_number.toLowerCase().includes(term)) ||
            r.status.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });

    // --- Export CSV ---
    container.querySelector('#export-repairs-btn').addEventListener('click', () => {
        if (repairs.length === 0) return;

        let csv = "Date,Customer,Contact,Device,Model,Serial No,Problem,Status,Cost,Technician,PartReplaced\n";

        csv += repairs.map(r => {
            const safeCust = (r.customer_name || '').replace(/,/g, ' ');
            const safeDevice = (r.device_details || '').replace(/,/g, ' ');
            const safeProblem = (r.issue_description || '').replace(/,/g, ' ');
            const safeSerial = (r.serial_number || '').replace(/,/g, ' ');

            return `${new Date(r.created_at).toLocaleDateString()},${safeCust},${r.contact_number || ''},${safeDevice},${r.model_number || ''},${safeSerial},${safeProblem},${r.status},${r.estimated_cost || 0},${r.technician_name || ''},${r.part_replaced_name || ''}`;
        }).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `repair_history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    fetchRepairs();
}

