import { supabase } from '../supabase.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileText, Trash2, Download, Table } from 'lucide';

export async function initInvoiceHistory(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-800">Invoice History</h2>
                <button id="download-all-report" class="btn-secondary text-sm">
                    <i data-lucide="table" class="w-4 h-4 mr-2"></i> Export CSV
                </button>
            </div>

            <div class="card overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                        <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="p-4">Invoice ID</th>
                                <th class="p-4">Date</th>
                                <th class="p-4">Customer</th>
                                <th class="p-4 text-center">GST</th>
                                <th class="p-4 text-right">Amount</th>
                                <th class="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="invoice-list-body" class="divide-y divide-slate-100">
                            <tr><td colspan="6" class="p-8 text-center">Loading invoices...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    const tbody = container.querySelector('#invoice-list-body');
    let bills = [];

    // Fetch Bills
    async function fetchBills() {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error loading data</td></tr>`;
            return;
        }

        bills = data;
        renderTable();
    }

    function renderTable() {
        if (bills.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No invoices found</td></tr>`;
            return;
        }

        tbody.innerHTML = bills.map(b => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-mono text-xs text-slate-500">#${b.id.slice(0, 8).toUpperCase()}</td>
                <td class="p-4">${new Date(b.created_at).toLocaleDateString()}</td>
                <td class="p-4 font-medium text-slate-800">${b.customer_name || 'Walk-in'}</td>
                <td class="p-4 text-center">
                    ${b.gst_applied ? '<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">YES</span>' : '<span class="text-slate-300">-</span>'}
                </td>
                <td class="p-4 text-right font-bold text-slate-800">₹${b.total_amount.toFixed(2)}</td>
                <td class="p-4 flex justify-center gap-3">
                    <button class="download-btn text-slate-400 hover:text-blue-600 transition-colors" data-id="${b.id}" title="Download PDF">
                        <i data-lucide="download" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-btn text-slate-400 hover:text-red-600 transition-colors" data-id="${b.id}" title="Delete Permanently">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    // Actions
    tbody.addEventListener('click', async (e) => {
        const downloadBtn = e.target.closest('.download-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (downloadBtn) {
            const id = downloadBtn.dataset.id;
            const bill = bills.find(b => b.id === id);
            await generateAndDownloadPDF(bill);
        }

        if (deleteBtn) {
            const adminPass = prompt("Enter Developer Password to DELETE:");
            if (adminPass !== "Jayasan@9045") {
                alert("Incorrect Password! Access Denied.");
                return;
            }

            if (confirm('Are you sure you want to DELETE this invoice from the database? This action is irreversible.')) {
                const id = deleteBtn.dataset.id;
                const { error } = await supabase.from('bills').delete().eq('id', id);
                if (error) alert('Error deleting: ' + error.message);
                else fetchBills();
            }
        }
    });

    // CSV Report
    container.querySelector('#download-all-report').addEventListener('click', () => {
        if (bills.length === 0) return;
        const csvContent = "data:text/csv;charset=utf-8,"
            + "ID,Date,Customer,Phone,GST Applied,Total Amount\n"
            + bills.map(b => `${b.id},${new Date(b.created_at).toLocaleDateString()},${b.customer_name || 'Walk-in'},${b.customer_phone || ''},${b.gst_applied},${b.total_amount}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    fetchBills();
}

// Re-using PDF logic (Simplified duplication for stability)
async function generateAndDownloadPDF(billData) {
    // Fetch bill items
    const { data: items } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billData.id);

    const doc = new jsPDF('p', 'mm', 'a4');

    /* =========================
       COMPANY INFO (SAME STYLE)
    ========================== */
    const companyName = "JRPL | Jaysan Resource (P) Ltd.";
    const companySer = "Computer Hardware and Peripherals Sales & Services";
    const companyAddress = "Shop No. 3, Sameera Plaza, Naza Market, Lucknow (UP) - 226021";
    const companyPhone = "Ph: +91 96346 23233 | Email: jaysanresource555@gmail.com";

    /* =========================
       HEADER
    ========================== */
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(22);
    doc.text(companyName, 14, 20);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    // Fixed-width text (IMPORTANT)
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
       BILL TO + META
    ========================== */
    const yPos = 55;

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text("BILL TO", 14, yPos);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(billData.customer_name || 'Walk-in Customer', 14, yPos + 6);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (billData.customer_phone) {
        doc.text(billData.customer_phone, 14, yPos + 11);
    }

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text("DATE", 150, yPos);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(new Date(billData.created_at).toLocaleDateString(), 150, yPos + 6);

    /* =========================
       ITEMS TABLE
    ========================== */
    const tableData = (items || []).map((item, i) => [
        i + 1,
        item.product_name,
        item.quantity,
        `INR ${item.price_at_sale.toFixed(2)}`,
        `INR ${(item.price_at_sale * item.quantity).toFixed(2)}`
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
        bodyStyles: {
            textColor: [51, 65, 85]
        },
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
    const subtotal = items.reduce(
        (sum, i) => sum + i.price_at_sale * i.quantity, 0
    );
    const gst = billData.gst_applied ? subtotal * 0.18 : 0;
    const total = subtotal + gst;

    const finY = doc.lastAutoTable.finalY + 10;
    const xLabel = 140;
    const xRight = 195;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal", xLabel, finY);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${subtotal.toFixed(2)}`, xRight, finY, { align: 'right' });

    if (billData.gst_applied) {
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

    doc.save(`Invoice_${billData.id.slice(0, 8)}.pdf`);
}
