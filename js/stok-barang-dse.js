/* =========================================================
   STOK AKHIR DSE
   VIEW ONLY (OPTIMIZED FOR SPEED & MODAL DOWNLOAD)
   ========================================================= */

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';

const PRICE_API_URL =
'https://script.google.com/macros/s/AKfycbx2YRAd2ysGLWZIszeahJLcbgWbrkUcIywvwq9pir-ijVZgFYQafZ1eNINx866fOI0g/exec';

const TAMBAHAN_API_URL =
'https://script.google.com/macros/s/AKfycbyYVkG4JyoHWdpPZhUIZq-nNwInE0QlYToNtQigYNU5ZnE6dZhewI3m1Ef6i89Fgg93/exec';

const MASTER_DATA_ACTION =
'stok-barang-dse';

const TAMBAHAN_ACTION =
'Tambahan';

const PRICE_SYNC_INTERVAL = 10000;
const STOCK_SYNC_INTERVAL = 30000;
const TAMBAHAN_SYNC_INTERVAL = 30000;

let globalRawData = [];
let globalHargaData = [];
let globalTambahanData = [];
let currentTab = 'pcs';

let priceSyncTimer = null;
let stockSyncTimer = null;
let tambahanSyncTimer = null;

let isPriceSyncing = false;
let isStockSyncing = false;
let isTambahanSyncing = false;

/* =========================================================
   CACHE STORAGE HELPERS
========================================================= */

function loadFromCache(){
    try{
        const cachedDse = localStorage.getItem('dse_raw_data');
        if(cachedDse){
            globalRawData = JSON.parse(cachedDse);
            processAndRender(globalRawData);
            console.log('⚡ Render cepat dari Cache DSE');
        }

        const cachedTambahan = localStorage.getItem('tambahan_raw_data');
        if(cachedTambahan){
            globalTambahanData = JSON.parse(cachedTambahan);
            const tambahanPCS = normalisasiTambahanRows(globalTambahanData);
            renderTambahanTable(tambahanPCS);
            console.log('⚡ Render cepat dari Cache Tambahan');
        }
    }catch(e){
        console.warn('⚠️ Gagal memuat cache:', e);
    }
}

/* =========================================================
   PARSE ANGKA & FORMAT DISPLAY
========================================================= */

function parseNum(value){
    if(value === undefined || value === null || value === '' || value === '-'){
        return null;
    }
    if(typeof value === 'number'){
        return value;
    }
    let clean = String(value).trim().replace(/^"|"$/g, '');
    if(clean === '0'){
        return 0;
    }
    if(clean.toLowerCase() === 'total' || clean === '-'){
        return null;
    }
    clean = clean.replace(/Rp/gi, '').replace(/IDR/gi, '').trim();
    if(clean.includes(',')){
        clean = clean.split(',')[0];
    }
    clean = clean.replace(/\./g, '').replace(/[^0-9-]/g, '');
    if(clean === ''){
        return null;
    }
    const parsed = parseInt(clean, 10);
    return isNaN(parsed) ? null : parsed;
}

function formatDisplay(num, isRupiah = false){
    if(num === null || num === undefined){
        return `<span class="zero-val">-</span>`;
    }
    if(num === 0){
        return '0';
    }
    const formatted = Number(num).toLocaleString('id-ID');
    return isRupiah ? `Rp ${formatted}` : formatted;
}

function getObjectValue(row, possibleNames){
    if(!row) return '';
    const keys = Object.keys(row);

    for(const target of possibleNames){
        for(const key of keys){
            if(String(key).trim().toLowerCase() === String(target).trim().toLowerCase()){
                return row[key];
            }
        }
    }

    for(const key of keys){
        const lowerKey = String(key).trim().toLowerCase();
        for(const target of possibleNames){
            if(lowerKey.includes(String(target).trim().toLowerCase())){
                return row[key];
            }
        }
    }
    return '';
}

function getNamaBarang(row){
    return String(getObjectValue(row, ['Jenis Barang', 'jenis barang', 'Nama Barang', 'nama barang', 'Barang', 'barang', 'Produk', 'produk', 'Item', 'item']) || '').trim();
}

function getHarga(row){
    return parseNum(getObjectValue(row, ['Harga', 'harga', 'HARGA', 'Price', 'price', 'Harga Satuan', 'harga satuan'])) || 0;
}

function getAndi(row){ return parseNum(getObjectValue(row, ['Andi', 'andi'])); }
function getFarhan(row){ return parseNum(getObjectValue(row, ['Farhan', 'farhan'])); }
function getEnden(row){ return parseNum(getObjectValue(row, ['Enden', 'enden'])); }
function getPebrian(row){ return parseNum(getObjectValue(row, ['Pebrian', 'pebrian'])); }

/* =========================================================
   NORMALISASI RESPONSE
========================================================= */

function normalisasiData(rawData){
    if(!rawData) return [];
    if(!Array.isArray(rawData) && typeof rawData === 'object'){
        if(Array.isArray(rawData.data)) rawData = rawData.data;
        else if(Array.isArray(rawData.rows)) rawData = rawData.rows;
        else if(Array.isArray(rawData.values)) rawData = rawData.values;
        else rawData = [rawData];
    }
    if(!Array.isArray(rawData) || rawData.length === 0) return [];
    if(typeof rawData[0] === 'object' && !Array.isArray(rawData[0])) return rawData;
    if(Array.isArray(rawData[0])){
        const headers = rawData[0];
        return rawData.slice(1).map(row => {
            const object = {};
            headers.forEach((header, index) => {
                object[String(header).trim()] = row[index];
            });
            return object;
        });
    }
    return [];
}

function normalisasiDSERows(data){
    return data.map(row => {
        const nama = getNamaBarang(row);
        const harga = getHarga(row);
        const andi = getAndi(row);
        const farhan = getFarhan(row);
        const enden = getEnden(row);
        const pebrian = getPebrian(row);
        const total = (andi || 0) + (farhan || 0) + (enden || 0) + (pebrian || 0);
        return { nama, harga, andi, farhan, enden, pebrian, total };
    }).filter(row => row.nama !== '' && row.nama.toLowerCase() !== 'total'); // Tambahan filter ini
}


/* =========================================================
   FETCH HARGA & MASTER DATA (PARALLELIZED)
========================================================= */

async function fetchHargaData(){
    try{
        const url = PRICE_API_URL + '?action=harga-dse&t=' + Date.now();
        const response = await fetch(url, { method:'GET', cache:'no-store' });
        if(!response.ok) throw new Error('Price API HTTP ' + response.status);
        const result = await response.json();
        if(!result || result.success !== true) throw new Error(result?.message || 'Response harga tidak valid.');
        globalHargaData = Array.isArray(result.data) ? result.data : [];
        return globalHargaData;
    }catch(error){
        console.error('❌ PRICE API ERROR:', error);
        return [];
    }
}

function mergeStokDenganHarga(stokData, hargaData){
    const hargaMap = new Map();
    hargaData.forEach(item => {
        const nama = String(item.nama || '').trim().toLowerCase();
        if(!nama) return;
        const harga = parseNum(item.harga) || 0;
        hargaMap.set(nama, harga);
    });

    return stokData.map(item => {
        const nama = String(item.nama || '').trim();
        const key = nama.toLowerCase();
        const harga = hargaMap.has(key) ? hargaMap.get(key) : (Number(item.harga) || 0);
        return { ...item, harga };
    });
}

async function fetchMasterData(){
    if(isStockSyncing) return;
    isStockSyncing = true;

    try{
        const updateTime = document.getElementById('updateTime');
        if(updateTime) updateTime.textContent = 'Update Data: Memuat...';

        const dseUrl = MASTER_DATA_API_URL + '?action=' + encodeURIComponent(MASTER_DATA_ACTION) + '&t=' + Date.now();
        const priceUrl = PRICE_API_URL + '?action=harga-dse&t=' + Date.now();

        const [dseResponse, priceResponse] = await Promise.all([
            fetch(dseUrl, { method:'GET', cache:'no-store' }),
            fetch(priceUrl, { method:'GET', cache:'no-store' }).catch(() => null)
        ]);

        if(!dseResponse.ok) throw new Error('Master Data API HTTP ' + dseResponse.status);

        const result = await dseResponse.json();
        if(!result || result.success !== true) throw new Error(result?.message || 'Master Data API gagal.');

        let hargaData = [];
        if(priceResponse && priceResponse.ok){
            const priceResult = await priceResponse.json();
            if(priceResult && priceResult.success === true && Array.isArray(priceResult.data)){
                globalHargaData = priceResult.data;
                hargaData = globalHargaData;
            }
        } else {
            hargaData = globalHargaData;
        }

        const objectData = normalisasiData(result.data);
        if(objectData.length === 0) throw new Error('Data DSE kosong.');

        const dseRows = normalisasiDSERows(objectData);
        if(dseRows.length === 0) throw new Error('Tidak ditemukan data stok DSE.');

        globalRawData = mergeStokDenganHarga(dseRows, hargaData);

        localStorage.setItem('dse_raw_data', JSON.stringify(globalRawData));
        processAndRender(globalRawData);

        if(updateTime){
            updateTime.textContent = 'Update Data: ' + new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
        }
    }catch(error){
        console.error('❌ GAGAL MENGAMBIL DATA DSE:', error);
        if(globalRawData.length === 0){
            const tbody = document.getElementById('cso-stock-table');
            if(tbody){
                tbody.innerHTML = `<tr><td colspan="6" class="loading-text">⚠️ Gagal mengambil data DSE<br><small>${escapeHTML(error.message)}</small></td></tr>`;
            }
        }
    }finally{
        isStockSyncing = false;
    }
}

/* =========================================================
   FETCH TAMBAHAN
========================================================= */

async function fetchTambahanData(){
    if(isTambahanSyncing) return;
    isTambahanSyncing = true;

    try{
        const url = TAMBAHAN_API_URL + '?action=' + encodeURIComponent(TAMBAHAN_ACTION) + '&sheet=' + encodeURIComponent('Tambahan') + '&t=' + Date.now();
        const response = await fetch(url, { method: 'GET', cache: 'no-store' });
        if(!response.ok) throw new Error('Tambahan API HTTP ' + response.status);

        const result = await response.json();
        if(result && result.success === false) throw new Error(result.message || 'API Tambahan gagal.');

        let rawData = result?.data ?? result?.rows ?? result?.values ?? result;
        const rows = normalisasiData(rawData);
        if(!Array.isArray(rows)) throw new Error('Format data Tambahan tidak valid.');

        globalTambahanData = rows;
        localStorage.setItem('tambahan_raw_data', JSON.stringify(globalTambahanData));

        const tambahanPCS = normalisasiTambahanRows(globalTambahanData);
        renderTambahanTable(tambahanPCS);
    }catch(error){
        console.error('❌ GAGAL MENGAMBIL DATA TAMBAHAN:', error);
        if(globalTambahanData.length > 0){
            const tambahanPCS = normalisasiTambahanRows(globalTambahanData);
            renderTambahanTable(tambahanPCS);
        }
    }finally{
        isTambahanSyncing = false;
    }
}

function normalisasiTambahanRows(data){
    if(!Array.isArray(data)) return [];
    return data.map(row => {
        const nama = String(getObjectValue(row, ['Jenis Barang', 'jenis barang', 'Nama Barang', 'nama barang', 'Barang', 'barang', 'Produk', 'produk', 'Item', 'item']) || '').trim();
        const andi = parseNum(getObjectValue(row, ['Andi', 'andi']));
        const farhan = parseNum(getObjectValue(row, ['Farhan', 'farhan', 'Parhan', 'parhan']));
        const enden = parseNum(getObjectValue(row, ['Enden', 'enden']));
        const pebrian = parseNum(getObjectValue(row, ['Pebrian', 'pebrian']));
        const total = (andi || 0) + (farhan || 0) + (enden || 0) + (pebrian || 0);
        return { nama, andi, farhan, enden, pebrian, total };
    }).filter(row => row.nama !== '' && row.nama.toLowerCase() !== 'total'); // Tambahan filter ini
}


function renderTambahanTable(rows){
    const tbody = document.getElementById('tambahan-table');
    if(!tbody) return;

    if(!Array.isArray(rows) || rows.length === 0){
        tbody.innerHTML = `<tr><td colspan="6" class="loading-text">Tidak ada data tambahan.</td></tr>`;
        return;
    }

    let html = '';
    let grandAndi = 0, grandFarhan = 0, grandEnden = 0, grandPebrian = 0, grandTotal = 0;

    rows.forEach(item => {
        grandAndi += Number(item.andi || 0);
        grandFarhan += Number(item.farhan || 0);
        grandEnden += Number(item.enden || 0);
        grandPebrian += Number(item.pebrian || 0);
        grandTotal += Number(item.total || 0);

        html += `
            <tr class="data-row">
                <td class="item-name-col">${escapeHTML(item.nama)}</td>
                <td>${formatDisplay(item.andi, false)}</td>
                <td>${formatDisplay(item.farhan, false)}</td>
                <td>${formatDisplay(item.enden, false)}</td>
                <td>${formatDisplay(item.pebrian, false)}</td>
                <td class="total-col">${formatDisplay(item.total, false)}</td>
            </tr>
        `;
    });

    html += `
        <tr class="total-row">
            <td class="item-name-col">TOTAL</td>
            <td>${formatDisplay(grandAndi, false)}</td>
            <td>${formatDisplay(grandFarhan, false)}</td>
            <td>${formatDisplay(grandEnden, false)}</td>
            <td>${formatDisplay(grandPebrian, false)}</td>
            <td class="total-col">${formatDisplay(grandTotal, false)}</td>
        </tr>
    `;

    tbody.innerHTML = html;

    // ==========================================
    // UPDATE KARTU RINGKASAN DI BAGIAN ATAS
    // ==========================================
    const totalLabel = document.getElementById('dse-total-label');
    if(totalLabel) totalLabel.textContent = 'Total Tambahan';

    ['andi', 'farhan', 'enden', 'pebrian'].forEach((person, idx) => {
        const el = document.getElementById('summary-' + person);
        const vals = [grandAndi, grandFarhan, grandEnden, grandPebrian];
        if(el) el.textContent = formatDisplay(vals[idx], false).replace(/<[^>]*>/g, '');
    });

    const grandTotalEl = document.getElementById('dse-grand-total');
    if(grandTotalEl) grandTotalEl.textContent = formatDisplay(grandTotal, false).replace(/<[^>]*>/g, '');
}


async function syncHargaRealtime(){
    if(isPriceSyncing || globalRawData.length === 0) return;
    isPriceSyncing = true;
    try{
        const hargaData = await fetchHargaData();
        if(!Array.isArray(hargaData) || hargaData.length === 0) return;

        const oldData = globalRawData;
        const newData = mergeStokDenganHarga(oldData, hargaData);
        let changed = false;

        for(let i = 0; i < newData.length; i++){
            if(Number(oldData[i]?.harga || 0) !== Number(newData[i]?.harga || 0)){
                changed = true;
                break;
            }
        }

        globalRawData = newData;
        if(changed){
            processAndRender(globalRawData);
        }
    }catch(error){
        console.warn('⚠️ SYNC HARGA GAGAL:', error.message);
    }finally{
        isPriceSyncing = false;
    }
}

/* =========================================================
   AUTO SYNC TIMERS
========================================================= */

function startRealtimeSync(){
    stopRealtimeSync();
    priceSyncTimer = setInterval(syncHargaRealtime, PRICE_SYNC_INTERVAL);
    stockSyncTimer = setInterval(fetchMasterData, STOCK_SYNC_INTERVAL);
    tambahanSyncTimer = setInterval(fetchTambahanData, TAMBAHAN_SYNC_INTERVAL);
}

function stopRealtimeSync(){
    if(priceSyncTimer){ clearInterval(priceSyncTimer); priceSyncTimer = null; }
    if(stockSyncTimer){ clearInterval(stockSyncTimer); stockSyncTimer = null; }
    if(tambahanSyncTimer){ clearInterval(tambahanSyncTimer); tambahanSyncTimer = null; }
}

document.addEventListener('visibilitychange', function(){
    if(document.hidden){
        stopRealtimeSync();
    }else{
        syncHargaRealtime();
        fetchMasterData();
        fetchTambahanData();
        startRealtimeSync();
    }
});

/* =========================================================
   RENDER TABLE DSE
========================================================= */

function processAndRender(rows){
    let html = '';
    let grandAndi = 0, grandFarhan = 0, grandEnden = 0, grandPebrian = 0;
    const dataSp = [], dataVdk = [];
    let isVdkActiveGroup = false;
    const isRupiah = currentTab === 'rupiah';

    rows.forEach(item => {
        const nama = String(item.nama || '').trim();
        if(!nama) return;

        if(nama.toUpperCase() === 'VDK'){
            isVdkActiveGroup = true;
        }

        const multiplier = isRupiah ? (item.harga || 0) : 1;

        if(nama.toUpperCase() !== 'VDK'){
            grandAndi += (item.andi || 0) * multiplier;
            grandFarhan += (item.farhan || 0) * multiplier;
            grandEnden += (item.enden || 0) * multiplier;
            grandPebrian += (item.pebrian || 0) * multiplier;
        }

        if(isVdkActiveGroup) dataVdk.push(item);
        else dataSp.push(item);
    });

    function makeRowHtml(item){
        const mult = isRupiah ? (item.harga || 0) : 1;
        const valAndi = item.andi !== null ? item.andi * mult : null;
        const valFarhan = item.farhan !== null ? item.farhan * mult : null;
        const valEnden = item.enden !== null ? item.enden * mult : null;
        const valPebrian = item.pebrian !== null ? item.pebrian * mult : null;
        const valTotal = item.total !== null ? item.total * mult : null;

        return `
            <tr class="data-row">
                <td class="item-name-col">${escapeHTML(item.nama)}</td>
                <td>${formatDisplay(valAndi, isRupiah)}</td>
                <td>${formatDisplay(valFarhan, isRupiah)}</td>
                <td>${formatDisplay(valEnden, isRupiah)}</td>
                <td>${formatDisplay(valPebrian, isRupiah)}</td>
                <td class="total-col">${formatDisplay(valTotal, isRupiah)}</td>
            </tr>
        `;
    }

    dataSp.forEach(item => { html += makeRowHtml(item); });

    if(dataVdk.length > 0){
        html += `<tr class="dse-divider"><td colspan="6"></td></tr>`;
        dataVdk.forEach(item => { html += makeRowHtml(item); });
    }

    const grandTotalSemua = grandAndi + grandFarhan + grandEnden + grandPebrian;

    const totalLabel = document.getElementById('dse-total-label');
    if(totalLabel) totalLabel.textContent = isRupiah ? 'Total Rupiah' : 'Total Stok';

    ['andi', 'farhan', 'enden', 'pebrian'].forEach((person, idx) => {
        const el = document.getElementById('summary-' + person);
        const vals = [grandAndi, grandFarhan, grandEnden, grandPebrian];
        if(el) el.textContent = formatDisplay(vals[idx], isRupiah).replace(/<[^>]*>/g, '');
    });

    const grandTotal = document.getElementById('dse-grand-total');
    if(grandTotal) grandTotal.textContent = formatDisplay(grandTotalSemua, isRupiah).replace(/<[^>]*>/g, '');

    html += `
        <tr class="total-row">
            <td class="item-name-col">TOTAL</td>
            <td>${formatDisplay(grandAndi, isRupiah)}</td>
            <td>${formatDisplay(grandFarhan, isRupiah)}</td>
            <td>${formatDisplay(grandEnden, isRupiah)}</td>
            <td>${formatDisplay(grandPebrian, isRupiah)}</td>
            <td class="total-col">${formatDisplay(grandTotalSemua, isRupiah)}</td>
        </tr>
    `;

    const tbody = document.getElementById('cso-stock-table');
    if(tbody) tbody.innerHTML = html;
}

function switchTab(tab){
    currentTab = tab;
    document.querySelectorAll('.dse-tab-btn').forEach(btn => {
        const btnTab = btn.textContent.trim().toLowerCase();
        btn.classList.toggle('active', btnTab === tab);
    });

    const mainTable = document.getElementById('pcs-rupiah-table');
    const tambahanTable = document.getElementById('tambahan-dse-table');

    if(tab === 'tambahan'){
        if(mainTable) mainTable.style.display = 'none';
        if(tambahanTable) tambahanTable.style.display = 'table';
        if(globalTambahanData.length > 0){
            renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        }
        return;
    }

    if(mainTable) mainTable.style.display = 'table';
    if(tambahanTable) tambahanTable.style.display = 'none';

    if(globalRawData.length > 0){
        processAndRender(globalRawData);
    }
}

function escapeHTML(value){
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* =========================================================
   MODAL & DOWNLOAD ACTION HANDLING (FIXED WIDTH)
========================================================= */

function openDownloadModal(){
    const modal = document.getElementById('downloadModal');
    if(modal) modal.style.display = 'flex';
}

function closeDownloadModal(){
    const modal = document.getElementById('downloadModal');
    if(modal) modal.style.display = 'none';
}

async function executeDownload(targetType){
    closeDownloadModal();

    const previousTab = currentTab;

    // Render tampilan sesuai pilihan target secara sementara
    if(targetType === 'pcs' || targetType === 'rupiah'){
        currentTab = targetType;
        if(globalRawData.length > 0){
            processAndRender(globalRawData);
        }
    } else if(targetType === 'tambahan'){
        if(globalTambahanData.length > 0){
            renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        }
    }

    let table = (targetType === 'tambahan') 
        ? document.getElementById('tambahan-dse-table') 
        : document.getElementById('pcs-rupiah-table');

    if(!table){
        alert('Tabel tidak ditemukan.');
        currentTab = previousTab;
        return;
    }

    let container = null;
    try{
        const clone = table.cloneNode(true);
        clone.style.display = 'table'; // Paksa tampil pada clone

        container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-99999px';
        container.style.top = '0';
        container.style.background = '#ffffff';
        container.style.padding = '20px';
        // Jangan tentukan width di sini karena tabel hidden ukurannya masih 0

        clone.querySelectorAll('th, td').forEach(cell => { 
            cell.style.position = 'static'; 
        });
        clone.style.width = 'auto';
        clone.style.minWidth = '100%';
        clone.style.maxWidth = 'none';
        clone.style.background = '#ffffff';

        container.appendChild(clone);
        document.body.appendChild(container);

        // Beri jeda render agar browser menghitung lebar tabel yang sebenarnya
        await new Promise(resolve => setTimeout(resolve, 150));

        // Atur width container berdasarkan lebar asli dari clone setelah masuk ke DOM
        container.style.width = (clone.scrollWidth + 40) + 'px';

        const canvas = await html2canvas(container, { 
            backgroundColor: '#ffffff', 
            scale: 2, 
            useCORS: true, 
            logging: false 
        });

        const link = document.createElement('a');
        const tanggal = new Date().toISOString().slice(0, 10);
        link.download = 'stok-akhir-dse-' + targetType + '-' + tanggal + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }catch(error){
        console.error('❌ DOWNLOAD ERROR:', error);
        alert('Gagal membuat gambar tabel.');
    }finally{
        if(container) container.remove();

        // Kembalikan tab ke kondisi semula
        currentTab = previousTab;
        if(currentTab === 'tambahan'){
            const mainTable = document.getElementById('pcs-rupiah-table');
            const tambahanTable = document.getElementById('tambahan-dse-table');
            if(mainTable) mainTable.style.display = 'none';
            if(tambahanTable) tambahanTable.style.display = 'table';
            if(globalTambahanData.length > 0) renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        } else {
            const mainTable = document.getElementById('pcs-rupiah-table');
            const tambahanTable = document.getElementById('tambahan-dse-table');
            if(mainTable) mainTable.style.display = 'table';
            if(tambahanTable) tambahanTable.style.display = 'none';
            if(globalRawData.length > 0) processAndRender(globalRawData);
        }
    }
}


function goBack(){
    if(window.history.length > 1){
        window.history.back();
    }else{
        window.location.href = 'dashboard.html';
    }
}

/* =========================================================
   START HALAMAN (DENGAN CACHING INSTAN)
========================================================= */

document.addEventListener('DOMContentLoaded', async function(){
    console.log('🚀 STOK AKHIR DSE DIMULAI');

    // 1. Tampilkan data dari cache secara instan jika ada
    loadFromCache();

    // 2. Tarik data terbaru di background secara paralel
    await Promise.allSettled([
        fetchMasterData(),
        fetchTambahanData()
    ]);

    startRealtimeSync();
});

window.addEventListener('beforeunload', function(){
    stopRealtimeSync();
});
