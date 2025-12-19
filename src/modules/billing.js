import { supabase } from '../supabase.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Trash2, Printer, Download } from 'lucide';

export async function initBilling(container) {
    container.innerHTML = `
        <div class="h-full flex gap-6">
            <!-- Product Selection (Left) -->
            <div class="w-1/2 flex flex-col gap-6">
                <div>
                     <h2 class="text-3xl font-bold text-slate-800 mb-2">New Bill</h2>
                     <p class="text-slate-500">Select products to create an invoice</p>
                </div>
                
                <div class="card p-6 flex-1 flex flex-col">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Customer Details</label>
                        <div class="grid grid-cols-2 gap-4">
                            <input type="text" id="bill-cust-name" class="input-field" placeholder="Name">
                            <input type="text" id="bill-cust-phone" class="input-field" placeholder="Phone">
                        </div>
                    </div>

                    <div class="mb-4 relative">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Add Product</label>
                        <input type="text" id="product-search" class="input-field" placeholder="Search product..." autocomplete="off">
                        <div id="product-dropdown" class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto hidden">
                            <!-- Dropdown items -->
                        </div>
                    </div>

                    <div id="selected-product-preview" class="hidden bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
                         <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-slate-800" id="preview-name"></span>
                            <span class="text-slate-600">Stock: <span id="preview-stock"></span></span>
                         </div>
                         <div class="flex items-end gap-4">
                            <div class="flex-1">
                                <label class="text-xs text-slate-500 block mb-1">Quantity</label>
                                <input type="number" id="add-qty" class="input-field h-10" value="1" min="1">
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-slate-500 block mb-1">Price</label>
                                <input type="number" id="add-price" class="input-field h-10">
                            </div>
                            <button id="add-to-cart-btn" class="btn-primary h-10 px-4">Add</button>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Invoice Preview (Right) -->
            <div class="w-1/2 flex flex-col">
                <div class="card h-full flex flex-col p-6">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h3 class="font-bold text-xl text-slate-800">Invoice</h3>
                            <p class="text-xs text-slate-400 mt-1" id="invoice-date">${new Date().toLocaleDateString()}</p>
                        </div>
                        <div class="text-right">
                             <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="gst-toggle" class="sr-only peer">
                                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                <span class="ms-3 text-sm font-medium text-slate-700">GST (18%)</span>
                            </label>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto">
                        <table class="w-full text-left">
                            <thead class="text-xs text-slate-500 uppercase border-b border-slate-100">
                                <tr>
                                    <th class="py-2">Item</th>
                                    <th class="py-2 text-center">Qty</th>
                                    <th class="py-2 text-right">Price</th>
                                    <th class="py-2 text-right">Total</th>
                                    <th class="py-2"></th>
                                </tr>
                            </thead>
                            <tbody id="cart-items" class="text-slate-700 text-sm divide-y divide-slate-50">
                                <!-- Cart Items -->
                            </tbody>
                        </table>
                    </div>

                    <div class="border-t border-slate-100 pt-4 mt-4 space-y-2">
                        <div class="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span id="subtotal-display">₹0.00</span>
                        </div>
                        <div class="flex justify-between text-slate-600 hidden" id="gst-row">
                            <span>GST (18%)</span>
                            <span id="gst-display">₹0.00</span>
                        </div>
                        <div class="flex justify-between text-xl font-bold text-slate-800 pt-2">
                            <span>Total</span>
                            <span id="total-display">₹0.00</span>
                        </div>
                    </div>

                    <button id="generate-bill-btn" class="btn-primary w-full mt-6 py-3 text-lg shadow-lg shadow-primary/20" disabled>
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
    let cart = []; // { id, name, price, qty, original_price, max_qty }
    let products = [];
    let selectedProduct = null;
    let isGst = false;

    // Elements
    const searchInput = container.querySelector('#product-search');
    const dropdown = container.querySelector('#product-dropdown');
    const previewBox = container.querySelector('#selected-product-preview');
    const cartTbody = container.querySelector('#cart-items');
    const gstToggle = container.querySelector('#gst-toggle');
    const generateBtn = container.querySelector('#generate-bill-btn');
    const postActions = container.querySelector('#post-bill-actions');

    const subtotalEl = container.querySelector('#subtotal-display');
    const gstEl = container.querySelector('#gst-display');
    const totalEl = container.querySelector('#total-display');
    const gstRow = container.querySelector('#gst-row');

    // Load Products for Search
    const { data } = await supabase.from('products').select('*').gt('quantity', 0);
    if (data) products = data;

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

    // Add to Cart
    container.querySelector('#add-to-cart-btn').addEventListener('click', () => {
        if (!selectedProduct) return;
        const qty = parseInt(container.querySelector('#add-qty').value);
        const price = parseFloat(container.querySelector('#add-price').value);

        if (qty > selectedProduct.quantity) {
            alert('Not enough stock!');
            return;
        }

        const existing = cart.find(i => i.id === selectedProduct.id);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: price,
                qty: qty,
                max_qty: selectedProduct.quantity
            });
        }

        selectedProduct = null;
        previewBox.classList.add('hidden');
        renderCart();
    });

    // GST Toggle
    gstToggle.addEventListener('change', (e) => {
        isGst = e.target.checked;
        gstRow.classList.toggle('hidden', !isGst);
        renderCart();
    });

    function renderCart() {
        cartTbody.innerHTML = cart.map((item, idx) => `
            <tr>
                <td class="py-2 font-medium">${item.name}</td>
                <td class="py-2 text-center text-slate-600">${item.qty}</td>
                <td class="py-2 text-right text-slate-600">₹${item.price}</td>
                <td class="py-2 text-right font-medium">₹${(item.price * item.qty).toFixed(2)}</td>
                <td class="py-2 text-right">
                    <button class="text-red-400 hover:text-red-600" data-idx="${idx}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');

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
            alert('Error generating bill');
            return;
        }

        // Insert Items separate calls or one call
        const itemsPayload = cart.map(item => ({
            bill_id: billData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.qty,
            price_at_sale: item.price
        }));

        const { error: itemsError } = await supabase.from('bill_items').insert(itemsPayload);
        if (itemsError) console.error(itemsError);

        // Update Stock
        for (const item of cart) {
            const newQty = item.max_qty - item.qty;
            await supabase.from('products').update({ quantity: newQty }).eq('id', item.id);
        }

        alert('Bill Generated Successfully!');

        // Show Actions
        generateBtn.classList.add('hidden');
        postActions.classList.remove('hidden');
        postActions.classList.add('grid');

        // Setup PDF Generator
        const generatePDF = () => {
            const doc = new jsPDF();
            doc.text("INVOICE", 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.text(`Customer: ${custName}`, 14, 30);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);
            if (custPhone) doc.text(`Phone: ${custPhone}`, 14, 40);

            const tableData = cart.map(item => [item.name, item.qty, item.price.toFixed(2), (item.price * item.qty).toFixed(2)]);

            doc.autoTable({
                head: [['Item', 'Qty', 'Price', 'Total']],
                body: tableData,
                startY: 50,
            });

            const finY = doc.lastAutoTable.finalY || 50;
            doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 140, finY + 10);
            if (isGst) doc.text(`GST (18%): ${gst.toFixed(2)}`, 140, finY + 15);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`Total: ${total.toFixed(2)}`, 140, finY + 25);

            return doc;
        };

        container.querySelector('#download-pdf').addEventListener('click', () => {
            const doc = generatePDF();
            doc.save('invoice.pdf');
        });

        container.querySelector('#print-bill').addEventListener('click', () => {
            const doc = generatePDF();
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        });

        // Reset state for next bill? User might want to stay here
    });
}
