import { supabase } from '../supabase.js';
import { Database, Upload, Download, AlertTriangle, CheckCircle, Lock } from 'lucide';

export function initBackup(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center gap-3">
                <h2 class="text-3xl font-bold text-slate-800">Data Backup & Restore</h2>
                <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">Admin Only</span>
            </div>

            <p class="text-slate-500 max-w-2xl">
                Securely export your entire database to a JSON file or restore data from a previous backup. 
                <br><strong>Note:</strong> Restore operations require the Administrator Password.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <!-- EXPORT SECTION -->
                <div class="card p-8 border-l-4 border-l-emerald-500">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                            <i data-lucide="download" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800">Export / Backup</h3>
                            <p class="text-sm text-slate-500">Download all data as a .json file</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="p-4 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                            <strong>Includes:</strong> Products, Stock Levels, Repairs, Bills, Sales History, Expenditures, and Customer Queries.
                        </div>
                        <button id="start-backup-btn" class="btn-primary w-full py-4 text-lg shadow-emerald-200 shadow-lg hover:shadow-xl transition-all">
                            Download Backup File
                        </button>
                        <div id="backup-status" class="text-center text-sm font-medium h-6"></div>
                    </div>
                </div>

                <!-- IMPORT SECTION -->
                <div class="card p-8 border-l-4 border-l-blue-500 relative overflow-hidden">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="p-4 bg-blue-100 text-blue-600 rounded-full">
                            <i data-lucide="upload" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800">Restore Data</h3>
                            <p class="text-sm text-slate-500">Import data from a backup file</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="p-4 bg-amber-50 rounded-lg text-sm text-amber-800 border border-amber-100 flex gap-2">
                            <i data-lucide="alert-triangle" class="w-5 h-5 flex-shrink-0"></i>
                            <p><strong>Warning:</strong> Restoring data acts as a "Smart Update". It will update existing records (if IDs match) and create new ones. It does not delete existing data.</p>
                        </div>
                        
                        <div class="relative group">
                            <input type="file" id="restore-file-input" accept=".json" class="bs-file-input block w-full text-sm text-slate-500
                              file:mr-4 file:py-3 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100 cursor-pointer
                            "/>
                        </div>

                        <button id="start-restore-btn" class="btn-secondary w-full py-4 text-lg border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 transition-all">
                            <i data-lucide="lock" class="w-4 h-4 inline mr-2"></i> Restore from Backup
                        </button>
                        <div id="restore-status" class="text-center text-sm font-medium h-6"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Logic
    const backupBtn = container.querySelector('#start-backup-btn');
    const backupStatus = container.querySelector('#backup-status');

    // EXPORT
    backupBtn.addEventListener('click', async () => {
        backupBtn.disabled = true;
        backupBtn.textContent = 'Gathering Data...';
        backupStatus.textContent = 'Fetching tables...';
        backupStatus.className = 'text-center text-sm font-medium h-6 text-slate-500';

        try {
            const tables = ['products', 'expenditures', 'customer_queries', 'bills', 'bill_items', 'repairs'];
            const exportData = {};

            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
                exportData[table] = data;
            }

            exportData.meta = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                app: 'RepairCmd'
            };

            // Download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_repaircmd_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            backupStatus.textContent = 'Backup Downloaded Successfully!';
            backupStatus.className = 'text-center text-sm font-medium h-6 text-emerald-600';
            setTimeout(() => {
                backupBtn.textContent = 'Download Backup File';
                backupBtn.disabled = false;
            }, 2000);

        } catch (err) {
            console.error(err);
            alert('Export Failed: ' + err.message);
            backupBtn.disabled = false;
            backupBtn.textContent = 'Download Backup File';
            backupStatus.textContent = '';
        }
    });


    // RESTORE
    const restoreBtn = container.querySelector('#start-restore-btn');
    const fileInput = container.querySelector('#restore-file-input');
    const restoreStatus = container.querySelector('#restore-status');

    restoreBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a .json backup file first.');
            return;
        }

        const pass = prompt('Enter Admin Password to RESTORE database:');
        if (pass !== 'admin123') {
            alert('Incorrect Password. Restore Cancelled.');
            return;
        }

        if (!confirm('Are you sure you want to restore? This will update existing records and add new ones.')) return;

        restoreBtn.disabled = true;
        restoreBtn.innerHTML = '<span class="animate-pulse">Restoring... Do NOT Close.</span>';

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let json = JSON.parse(e.target.result);

                // HANDLE RAW SUPABASE EXPORT (ARRAY)
                if (Array.isArray(json)) {
                    // Heuristic detection of table
                    const sample = json[0];
                    if (!sample) throw new Error("Empty file.");

                    let detectedTable = null;
                    if ('bill_id' in sample && 'product_id' in sample) detectedTable = 'bill_items';
                    else if ('customer_name' in sample && 'total_amount' in sample && 'payment_status' in sample) detectedTable = 'bills';
                    else if ('device_details' in sample && 'status' in sample) detectedTable = 'repairs';
                    else if ('item_name' in sample && 'amount' in sample && 'type' in sample) detectedTable = 'expenditures';
                    else if ('requirement' in sample && 'customer_name' in sample) detectedTable = 'customer_queries';
                    else if ('name' in sample && 'price' in sample && 'quantity' in sample) detectedTable = 'products';

                    if (detectedTable) {
                        const confirmMsg = `Detected Supabase export for table '${detectedTable}' (${json.length} rows).\nProceed to restore?`;
                        if (!confirm(confirmMsg)) {
                            restoreBtn.disabled = false;
                            restoreBtn.innerHTML = '<i data-lucide="lock" class="w-4 h-4 inline mr-2"></i> Restore from Backup';
                            return;
                        }
                        // Wrap it to match expected format
                        json = { [detectedTable]: json };
                    } else {
                        throw new Error("Could not automatically detect table type from JSON. Please use the system backup format.");
                    }
                }

                const sequence = ['products', 'expenditures', 'customer_queries', 'repairs', 'bills', 'bill_items'];
                let totalRestored = 0;

                for (const table of sequence) {
                    const rows = json[table];
                    if (rows && rows.length > 0) {
                        restoreStatus.textContent = `Restoring ${table} (${rows.length} records)...`;
                        restoreStatus.className = 'text-center text-sm font-medium h-6 text-blue-600';

                        // Batch Upsert preventing payload too large errors
                        const BATCH_SIZE = 50;
                        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                            const chunk = rows.slice(i, i + BATCH_SIZE);
                            const { error } = await supabase.from(table).upsert(chunk);
                            if (error) throw new Error(`Failed to restore ${table} (chunk ${i}): ${error.message}`);
                        }

                        totalRestored += rows.length;
                    }
                }

                restoreStatus.textContent = `Success! Restored ${totalRestored} records.`;
                restoreStatus.className = 'text-center text-sm font-medium h-6 text-emerald-600 font-bold';
                alert('Database Restore Complete!');
                fileInput.value = '';

            } catch (err) {
                console.error(err);
                alert('Restore Failed: ' + err.message);
                restoreStatus.textContent = 'Restore Failed. Check Console.';
                restoreStatus.className = 'text-center text-sm font-medium h-6 text-red-600';
            } finally {
                restoreBtn.innerHTML = '<i data-lucide="lock" class="w-4 h-4 inline mr-2"></i> Restore from Backup';
                restoreBtn.disabled = false;
                if (window.lucide) window.lucide.createIcons();
            }
        };
        reader.readAsText(file);
    });
}
