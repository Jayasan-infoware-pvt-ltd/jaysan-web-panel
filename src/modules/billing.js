import { supabase } from '../supabase.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Trash2, Printer, Download, PlusCircle } from 'lucide';

export async function initBilling(container) {
    container.innerHTML = `
        <div class="h-full flex gap-6">
            <!-- Product Selection (Left) -->
            <div class="w-1/2 flex flex-col gap-6">
                <div>
                     <h2 class="text-3xl font-bold text-slate-800 mb-2">New Bill</h2>
                     <p class="text-slate-500">Select products or add custom items</p>
                </div>
                
                <div class="card p-6 flex-1 flex flex-col overflow-y-auto">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Customer Details</label>
                        <div class="grid grid-cols-2 gap-4">
                            <input type="text" id="bill-cust-name" class="input-field" placeholder="Name">
                            <input type="text" id="bill-cust-phone" class="input-field" placeholder="Phone">
                        </div>
                    </div>

                    <!-- Search Product -->
                    <div class="mb-6 relative group">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Add Stock Product</label>
                        <input type="text" id="product-search" class="input-field" placeholder="Search product..." autocomplete="off">
                        <div id="product-dropdown" class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto hidden divide-y divide-slate-100">
                            <!-- Dropdown items -->
                        </div>
                    </div>

                    <div id="selected-product-preview" class="hidden bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                         <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-blue-900" id="preview-name"></span>
                            <span class="text-blue-700 text-sm">Stock: <span id="preview-stock"></span></span>
                         </div>
                         <div class="flex items-end gap-3">
                            <div class="flex-1">
                                <label class="text-xs text-blue-600 block mb-1">Quantity</label>
                                <input type="number" id="add-qty" class="input-field h-9 text-sm" value="1" min="1">
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-blue-600 block mb-1">Price</label>
                                <input type="number" id="add-price" class="input-field h-9 text-sm">
                            </div>
                            <button id="add-to-cart-btn" class="btn-primary h-9 px-4 text-sm">Add</button>
                         </div>
                    </div>

                    <!-- Manual Item Entry Divider -->
                    <div class="relative flex py-2 items-center">
                        <div class="flex-grow border-t border-slate-200"></div>
                        <span class="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or Add Manual Item</span>
                        <div class="flex-grow border-t border-slate-200"></div>
                    </div>

                    <!-- Manual Item Form -->
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                        <label class="block text-sm font-medium text-slate-700 mb-2">Manual Entry (Repair/Service)</label>
                        <div class="grid grid-cols-12 gap-2 mb-2">
                             <div class="col-span-6">
                                <input type="text" id="manual-name" class="input-field h-9 text-sm" placeholder="Item Name / Description">
                             </div>
                             <div class="col-span-3">
                                <input type="number" id="manual-price" class="input-field h-9 text-sm" placeholder="Price">
                             </div>
                             <div class="col-span-3">
                                <input type="number" id="manual-qty" class="input-field h-9 text-sm" value="1" placeholder="Qty">
                             </div>
                        </div>
                         <button id="add-manual-btn" class="btn-secondary w-full h-9 text-sm border-dashed">
                            <i data-lucide="plus-circle" class="w-4 h-4 mr-2"></i> Add Custom Item
                        </button>
                    </div>

                </div>
            </div>

            <!-- Invoice Preview (Right) -->
            <div class="w-1/2 flex flex-col">
                <div class="card h-full flex flex-col p-6 bg-white shadow-xl">
                    <div class="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <h3 class="font-bold text-xl text-slate-800">Invoice Draft</h3>
                            <p class="text-xs text-slate-400 mt-1" id="invoice-date">${new Date().toLocaleDateString()}</p>
                        </div>
                         <div class="flex items-center">
                             <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="gst-toggle" class="sr-only peer">
                                <div class="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                <span class="ms-3 text-sm font-medium text-slate-600">GST (18%)</span>
                            </label>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar">
                        <table class="w-full text-left">
                            <thead class="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th class="py-2 px-2 rounded-l-lg">Item</th>
                                    <th class="py-2 text-center">Qty</th>
                                    <th class="py-2 text-right">Price</th>
                                    <th class="py-2 text-right px-2 rounded-r-lg">Total</th>
                                    <th class="py-2"></th>
                                </tr>
                            </thead>
                            <tbody id="cart-items" class="text-slate-700 text-sm divide-y divide-slate-50">
                                <!-- Cart Items -->
                            </tbody>
                        </table>
                         <div id="empty-cart-msg" class="text-center py-10 text-slate-400 text-sm italic">
                            No items added yet.
                        </div>
                    </div>

                    <div class="bg-slate-50 rounded-xl p-4 mt-4 space-y-2 border border-slate-100">
                        <div class="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span id="subtotal-display">₹0.00</span>
                        </div>
                        <div class="flex justify-between text-slate-600 hidden" id="gst-row">
                            <span>GST (18%)</span>
                            <span id="gst-display">₹0.00</span>
                        </div>
                        <div class="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span id="total-display">₹0.00</span>
                        </div>
                    </div>

                    <button id="generate-bill-btn" class="btn-primary w-full mt-4 py-3 text-lg shadow-lg shadow-primary/20" disabled>
                        Generate Invoice
                    </button>
                    <div id="post-bill-actions" class="hidden grid-cols-2 gap-4 mt-4">
                        <button id="download-pdf" class="btn-secondary flex items-center justify-center gap-2 text-sm justify-center">
                            <i data-lucide="download" class="w-4 h-4"></i> Download PDF
                        </button>
                         <button id="print-bill" class="btn-secondary flex items-center justify-center gap-2 text-sm justify-center">
                            <i data-lucide="printer" class="w-4 h-4"></i> Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // State
    let cart = []; // { id, name, price, qty, original_price, max_qty, isManual }
    let products = [];
    let selectedProduct = null;
    let isGst = false;

    // Elements
    const searchInput = container.querySelector('#product-search');
    const dropdown = container.querySelector('#product-dropdown');
    const previewBox = container.querySelector('#selected-product-preview');
    const cartTbody = container.querySelector('#cart-items');
    const emptyMsg = container.querySelector('#empty-cart-msg');
    const gstToggle = container.querySelector('#gst-toggle');
    const generateBtn = container.querySelector('#generate-bill-btn');
    const postActions = container.querySelector('#post-bill-actions');

    const subtotalEl = container.querySelector('#subtotal-display');
    const gstEl = container.querySelector('#gst-display');
    const totalEl = container.querySelector('#total-display');
    const gstRow = container.querySelector('#gst-row');

    // Load Products for Search
    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').gt('quantity', 0);
        if (data) products = data;
    };
    fetchProducts();

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (!val) {
            dropdown.classList.add('hidden');
            return;
        }
        const matches = products.filter(p => p.name.toLowerCase().includes(val));

        dropdown.innerHTML = matches.map(p => `
            <div class="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0" data-id="${p.id}">
                <div class="font-medium text-slate-800">${p.name}</div>
                <div class="text-xs text-slate-500">₹${p.price} | Stock: ${p.quantity}</div>
            </div>
        `).join('');

        if (matches.length > 0) dropdown.classList.remove('hidden');
        else dropdown.classList.add('hidden');
    });

    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('[data-id]');
        if (item) {
            const id = item.dataset.id;
            selectedProduct = products.find(p => p.id === id);

            // Show preview
            container.querySelector('#preview-name').textContent = selectedProduct.name;
            container.querySelector('#preview-stock').textContent = selectedProduct.quantity;
            container.querySelector('#add-price').value = selectedProduct.price;
            container.querySelector('#add-qty').value = 1;
            container.querySelector('#add-qty').max = selectedProduct.quantity;

            previewBox.classList.remove('hidden');
            dropdown.classList.add('hidden');
            searchInput.value = '';
        }
    });

    // Add Stock Item
    container.querySelector('#add-to-cart-btn').addEventListener('click', () => {
        if (!selectedProduct) return;
        const qty = parseInt(container.querySelector('#add-qty').value) || 1;
        const price = parseFloat(container.querySelector('#add-price').value) || 0;

        if (qty > selectedProduct.quantity) {
            alert('Not enough stock!');
            return;
        }

        addItemToCart({
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: price,
            qty: qty,
            max_qty: selectedProduct.quantity,
            isManual: false
        });

        selectedProduct = null;
        previewBox.classList.add('hidden');
    });

    // Add Manual Item
    container.querySelector('#add-manual-btn').addEventListener('click', () => {
        const name = container.querySelector('#manual-name').value;
        const price = parseFloat(container.querySelector('#manual-price').value) || 0;
        const qty = parseInt(container.querySelector('#manual-qty').value) || 1;

        if (!name) { alert('Enter item name'); return; }
        if (price <= 0) { alert('Enter valid price'); return; }

        addItemToCart({
            id: null,
            name: name,
            price: price,
            qty: qty,
            max_qty: 9999,
            isManual: true
        });

        // Reset manual form
        container.querySelector('#manual-name').value = '';
        container.querySelector('#manual-price').value = '';
        container.querySelector('#manual-qty').value = '1';
    });

    function addItemToCart(newItem) {
        if (!newItem.isManual) {
            const existing = cart.find(i => i.id === newItem.id);
            if (existing) {
                if (existing.qty + newItem.qty > existing.max_qty) {
                    alert('Exceeds stock!');
                    return;
                }
                existing.qty += newItem.qty;
            } else {
                cart.push(newItem);
            }
        } else {
            // Manual items always add new row if different name/price, or just push
            cart.push(newItem);
        }
        renderCart();
    }

    // GST Toggle
    gstToggle.addEventListener('change', (e) => {
        isGst = e.target.checked;
        gstRow.classList.toggle('hidden', !isGst);
        renderCart();
    });

    function renderCart() {
        if (cart.length === 0) {
            cartTbody.innerHTML = '';
            emptyMsg.classList.remove('hidden');
        } else {
            emptyMsg.classList.add('hidden');
            cartTbody.innerHTML = cart.map((item, idx) => `
                <tr class="group hover:bg-slate-50 transition-colors">
                    <td class="py-3 px-2 font-medium text-slate-800">
                        ${item.name} 
                        ${item.isManual ? '<span class="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200 ml-1">MANUAL</span>' : ''}
                    </td>
                    <td class="py-3 text-center text-slate-600">${item.qty}</td>
                    <td class="py-3 text-right text-slate-600">₹${item.price.toFixed(2)}</td>
                    <td class="py-3 text-right font-medium px-2">₹${(item.price * item.qty).toFixed(2)}</td>
                    <td class="py-3 text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="text-slate-400 hover:text-red-500 transition-colors" data-idx="${idx}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const gst = isGst ? subtotal * 0.18 : 0;
        const total = subtotal + gst;

        subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
        gstEl.textContent = `₹${gst.toFixed(2)}`;
        totalEl.textContent = `₹${total.toFixed(2)}`;

        generateBtn.disabled = cart.length === 0;
        if (window.lucide) window.lucide.createIcons();

        // Remove listener
        cartTbody.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                cart.splice(idx, 1);
                renderCart();
            });
        });
    }

    // Generate Bill
    generateBtn.addEventListener('click', async () => {
        generateBtn.textContent = "Processing...";
        generateBtn.disabled = true;

        const custName = container.querySelector('#bill-cust-name').value || 'Walk-in Customer';
        const custPhone = container.querySelector('#bill-cust-phone').value;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const gst = isGst ? subtotal * 0.18 : 0;
        const total = subtotal + gst;

        // DB Insert
        const { data: billData, error: billError } = await supabase.from('bills').insert([{
            customer_name: custName,
            customer_phone: custPhone,
            total_amount: total,
            gst_applied: isGst
        }]).select().single();

        if (billError) {
            console.error(billError);
            alert('Error generating bill: ' + billError.message);
            generateBtn.textContent = "Generate Invoice";
            generateBtn.disabled = false;
            return;
        }

        // Insert Items
        // For manual items, product_id is null
        const itemsPayload = cart.map(item => ({
            bill_id: billData.id,
            product_id: item.isManual ? null : item.id,
            product_name: item.name,
            quantity: item.qty,
            price_at_sale: item.price
        }));

        const { error: itemsError } = await supabase.from('bill_items').insert(itemsPayload);

        if (itemsError) {
            console.error('Error adding items:', itemsError);
            alert('Bill created but items failed to save.');
        }

        // Update Stock (Only for non-manual items)
        for (const item of cart) {
            if (!item.isManual) {
                const newQty = item.max_qty - item.qty;
                await supabase.from('products').update({ quantity: newQty }).eq('id', item.id);
            }
        }

        fetchProducts(); // Refresh local product list
        generateBtn.textContent = "Invoice Generated";
        alert('Bill Generated Successfully!');

        // Show Actions
        generateBtn.classList.add('hidden');
        postActions.classList.remove('hidden');
        postActions.classList.add('grid');

        // Setup PDF Generator
        const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    /* =========================
       COMPANY INFO
    ========================== */
    const companyName = "JRPL | Jaysan Resource (P) Ltd.";
    const companySer = "Computer Hardware and Peripherals Sales & Services";
    const companyAddress = "Shop No. 3, Sameera Plaza, Naza Market, Lucknow (UP) - 226021";
    const companyPhone = "Ph: +91 96346 23233 | Email: jaysanresource555@gmail.com";

    /* =========================
       HEADER (FIXED POSITION)
    ========================== */
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(22);
    doc.text(companyName, 14, 20);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    // FIXED WIDTH BLOCK (IMPORTANT)
    const leftX = 14;
    const maxWidth = 120;

    doc.text(companySer, leftX, 28, { maxWidth });
    doc.text(companyAddress, leftX, 34, { maxWidth });
    doc.text(companyPhone, leftX, 40, { maxWidth });

    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text("INVOICE", 195, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`#${billData.id.slice(0, 8).toUpperCase()}`, 195, 33, { align: 'right' });

    /* =========================
       BILL TO
    ========================== */
    const yPos = 55;

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text("BILL TO", 14, yPos);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(custName, 14, yPos + 6);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (custPhone) doc.text(custPhone, 14, yPos + 11);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text("DATE", 150, yPos);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(new Date().toLocaleDateString(), 150, yPos + 6);

    /* =========================
       ITEMS TABLE
    ========================== */
    const tableData = cart.map((item, i) => [
        i + 1,
        item.name,
        item.qty,
        `INR ${item.price.toFixed(2)}`,
        `INR ${(item.price * item.qty).toFixed(2)}`
    ]);

    doc.autoTable({
        head: [['#', 'Item Description', 'Qty', 'Price', 'Total']],
        body: tableData,
        startY: yPos + 20,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: {
            fillColor: [248, 250, 252],
            textColor: [100, 116, 139],
            fontStyle: 'bold',
            lineColor: [226, 232, 240],
            lineWidth: 0.1
        },
        bodyStyles: { textColor: [51, 65, 85] },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
        }
    });

    /* =========================
       TOTALS
    ========================== */
    const finY = doc.lastAutoTable.finalY + 10;
    const xLabel = 140;
    const xRight = 195;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal", xLabel, finY);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${subtotal.toFixed(2)}`, xRight, finY, { align: 'right' });

    if (isGst) {
        doc.setTextColor(100, 116, 139);
        doc.text("GST (18%)", xLabel, finY + 6);
        doc.setTextColor(15, 23, 42);
        doc.text(`INR ${gst.toFixed(2)}`, xRight, finY + 6, { align: 'right' });
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(130, finY + 12, 195, finY + 12);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Total", xLabel, finY + 22);
    doc.text(`INR ${total.toFixed(2)}`, xRight, finY + 22, { align: 'right' });

    /* =========================
       FOOTER
    ========================== */
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for your business!", 14, pageHeight - 20);
    doc.text(
        "www.jaysanresource.com | jaysanresource555@gmail.com | +91 96346 23233",
        14,
        pageHeight - 15
    );

    doc.setFillColor(59, 130, 246);
    doc.rect(0, pageHeight - 2, 210, 2, 'F');

    return doc;
};

        container.querySelector('#download-pdf').addEventListener('click', () => {
            const doc = generatePDF();
            doc.save(`Invoice_${billData.id.slice(0, 8)}.pdf`);
        });

        container.querySelector('#print-bill').addEventListener('click', () => {
            const doc = generatePDF();
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        });
    });
}





