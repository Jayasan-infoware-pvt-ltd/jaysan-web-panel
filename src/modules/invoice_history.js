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
    // Need to fetch items
    const { data: items } = await supabase.from('bill_items').select('*').eq('bill_id', billData.id);

    const doc = new jsPDF();
    const companyName = "YOUR COMPANY NAME HERE";
    const companyAddress = "Shop No. 1, Main Market, City Name - Pin Code";
    const companyPhone = "Ph: +91 XXXXX XXXXX | Email: contact@yourdomain.com";

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, 14, 20);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(companyAddress, 14, 28);
    doc.text(companyPhone, 14, 33);
    doc.setFontSize(26);
    doc.text("INVOICE", 195, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`#${billData.id.slice(0, 8).toUpperCase()}`, 195, 33, { align: 'right' });

    // Customer
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(billData.customer_name || 'Walk-in', 14, 60);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(billData.created_at).toLocaleDateString(), 150, 60);

    // Items
    const tableData = items?.map((item, i) => [
        i + 1,
        item.product_name,
        item.quantity,
        `INR ${item.price_at_sale.toFixed(2)}`,
        `INR ${(item.price_at_sale * item.quantity).toFixed(2)}`
    ]) || [];

    doc.autoTable({
        head: [['#', 'Item', 'Qty', 'Price', 'Total']],
        body: tableData,
        startY: 75,
        theme: 'plain',
        headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold' },
        styles: { cellPadding: 3, fontSize: 10 }
    });

    const finY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: INR ${billData.total_amount.toFixed(2)}`, 195, finY, { align: 'right' });

    doc.save(`Invoice_${billData.id.slice(0, 8)}.pdf`);
}

