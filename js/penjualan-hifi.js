/*! MC-SAGARANTEN - PENJUALAN HIFI */
const JSON_DATA_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/penjualan-hifi.json';
let gudangDataMap = [];

const parseNumber = val => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    const text = String(val).trim().replace(/^"|"$/g, '');
    if (!text || text === '-') return 0;
    const num = Number(text.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
};

const formatRupiah = val => parseNumber(val) === 0 ? '-' : 'Rp ' + new Intl.NumberFormat('id-ID').format(parseNumber(val));
const formatNumber = val => parseNumber(val) === 0 ? '-' : parseNumber(val).toLocaleString('id-ID');
const escapeHTML = val => String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

function normalisasiData(rawData) {
    if (!rawData) return [];
    if (!Array.isArray(rawData) && typeof rawData === 'object') {
        rawData = rawData.data || rawData.rows || rawData.values || [rawData];
    }
    if (!Array.isArray(rawData) || !rawData.length) return [];
    if (typeof rawData[0] === 'object' && !Array.isArray(rawData[0])) return rawData;
    if (Array.isArray(rawData[0])) {
        const headers = rawData[0];
        return rawData.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, i) => { obj[String(h).trim()] = row[i]; });
            return obj;
        });
    }
    return [];
}

function getObjectValue(row, keys) {
    if (!row) return '';
    const rowKeys = Object.keys(row);
    for (const key of keys) {
        for (const rKey of rowKeys) {
            if (rKey.trim().toLowerCase() === key.trim().toLowerCase()) return row[rKey];
        }
    }
    for (const rKey of rowKeys) {
        const lowerKey = rKey.trim().toLowerCase();
        for (const key of keys) {
            if (lowerKey.includes(key.trim().toLowerCase())) return row[rKey];
        }
    }
    return '';
}

function parseExcelDate(val) {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    if (typeof val === 'string') {
        const text = val.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
        const date = new Date(text);
        return !isNaN(date.getTime()) ? formatDateObj(date) : text;
    }
    if (typeof val === 'number' && typeof XLSX !== 'undefined') {
        const obj = XLSX.SSF.parse_date_code(val);
        if (obj) return [obj.y, String(obj.m).padStart(2, '0'), String(obj.d).padStart(2, '0')].join('-');
    }
    return String(val);
}

const formatDateObj = d => !d || isNaN(d.getTime()) ? '-' : [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
const formatUpdateDate = d => !d || isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

function getHiFiData(row) {
    return {
        no: getObjectValue(row, ['No', 'no']),
        barang: String(getObjectValue(row, ['Barang', 'barang', 'Produk', 'produk']) || '-').trim(),
        jumlah: parseNumber(getObjectValue(row, ['Jumlah', 'jumlah', 'Qty', 'qty'])),
        nomor: String(getObjectValue(row, ['Nomor Hifi', 'Nomor HIFI', 'Nomor HiFi', 'nomor hifi']) || '-').trim(),
        iccid: String(getObjectValue(row, ['ICCID', 'iccid']) || '-').trim(),
        imei: String(getObjectValue(row, ['IMEI Devices', 'IMEI Device', 'IMEI', 'imei']) || '-').trim(),
        nama: String(getObjectValue(row, ['Nama', 'nama']) || '').trim().toUpperCase(),
        harga: parseNumber(getObjectValue(row, ['Harga', 'harga'])),
        tglAmbil: parseExcelDate(getObjectValue(row, ['Tgl Ambil', 'Tanggal Ambil', 'tgl ambil'])),
        tglBayar: parseExcelDate(getObjectValue(row, ['Tgl Bayar', 'Tanggal Bayar', 'tgl bayar'])),
        keterangan: String(getObjectValue(row, ['Keterangan', 'keterangan', 'Status', 'status']) || '').trim()
    };
}

function renderHiFiDashboard(objectData) {
    const tbody = document.getElementById('tableBody');
    const hifiFilter = document.getElementById('hifiFilter');
    if (!tbody || !hifiFilter) return;

    tbody.innerHTML = '';
    gudangDataMap = [];
    hifiFilter.innerHTML = '<option value="ALL">-- TAMPILKAN SEMUA DATA --</option>';

    const listNamaFilter = new Set();
    let totalStok = 0, dseSudahBayarCount = 0, sisaOnHandDSE = 0, segelGudangCount = 0, sisaTagihanNominal = 0, sisaTagihanQty = 0;

    objectData.map(getHiFiData).forEach(row => {
        const { no, barang, jumlah, nomor, iccid, imei, nama, harga, tglAmbil, tglBayar, keterangan } = row;
        totalStok += jumlah;

        if (nama && nama !== 'GUDANG' && nama !== 'STOK GUDANG') listNamaFilter.add(nama);

        const statusText = keterangan || '-';
        const ketLower = statusText.toLowerCase();
        let badgeClass = 'badge-status';

        if (ketLower.includes('stok gudang')) badgeClass += ' badge-segel';
        else if (ketLower.includes('on hand dse')) badgeClass += ' badge-onhand';
        else if (ketLower.includes('terjual') || ketLower.includes('lunas')) badgeClass += ' badge-terjual-sukses';
        else if (ketLower.includes('reture')) badgeClass += ' badge-status-danger';
        else badgeClass += ' badge-sold';

        if (nama !== 'STOK GUDANG') {
            if (ketLower.includes('stok gudang')) {
                segelGudangCount += jumlah;
                gudangDataMap.push({ barang, noHifi: nomor, imei, iccid, qty: jumlah });
            } else if (!ketLower.includes('reward') && !ketLower.includes('reture')) {
                if (ketLower.includes('terjual') || ketLower.includes('lunas')) {
                    dseSudahBayarCount += jumlah;
                } else if (ketLower.includes('on hand dse')) {
                    sisaOnHandDSE += jumlah;
                    sisaTagihanNominal += harga;
                    sisaTagihanQty += jumlah;
                }
            }
        } else {
            segelGudangCount += jumlah;
            gudangDataMap.push({ barang, noHifi: nomor, imei, iccid, qty: jumlah });
        }

        if (barang === '-' && nomor === '-' && iccid === '-' && imei === '-' && !nama && harga === 0 && jumlah === 0) return;

        const tr = document.createElement('tr');
        tr.className = 'row-item';
        tr.setAttribute('data-nama', nama);
        tr.setAttribute('data-keterangan', ketLower);
        tr.innerHTML = `
            <td class="text-center" data-label="No">${escapeHTML(no)}</td>
            <td class="text-center" data-label="Barang">${escapeHTML(barang)}</td>
            <td class="qty-col" data-label="Jumlah">${formatNumber(jumlah)}</td>
            <td class="text-center" data-label="Nomor Hifi">${escapeHTML(nomor)}</td>
            <td class="text-center mono-col" data-label="ICCID">${escapeHTML(iccid)}</td>
            <td class="text-center mono-col" data-label="IMEI Devices">${escapeHTML(imei)}</td>
            <td class="text-left" data-label="Nama">${escapeHTML(nama || '-')}</td>
            <td class="text-right currency-col" data-label="Harga">${harga ? formatRupiah(harga) : '-'}</td>
            <td class="text-center" data-label="Tgl Ambil">${escapeHTML(tglAmbil)}</td>
            <td class="text-center" data-label="Tgl Bayar">${escapeHTML(tglBayar)}</td>
            <td class="text-center" data-label="Keterangan"><span class="${badgeClass}">${escapeHTML(statusText)}</span></td>
        `;
        tbody.appendChild(tr);
    });

    Array.from(listNamaFilter).sort().forEach(dse => {
        const option = document.createElement('option');
        option.value = option.textContent = dse;
        hifiFilter.appendChild(option);
    });

    const optGudang = document.createElement('option');
    optGudang.value = 'GUDANG';
    optGudang.textContent = 'GUDANG (STOK SEGEL)';
    hifiFilter.appendChild(optGudang);

    const totalTr = document.createElement('tr');
    totalTr.className = 'total-row';
    totalTr.id = 'defaultTotalRow';
    totalTr.innerHTML = `
        <td class="text-left" colspan="4">TOTAL SISA TAGIHAN</td>
        <td class="qty-col" id="bottomTotalQty">${formatNumber(sisaTagihanQty)} Unit</td>
        <td colspan="6"></td>
    `;
    tbody.appendChild(totalTr);

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setVal('topTotalUnit', formatNumber(totalStok) + ' Unit');
    setVal('topTotalTerjual', formatNumber(dseSudahBayarCount) + ' Unit');
    setVal('topTotalSold', formatNumber(sisaOnHandDSE) + ' Unit');
    setVal('topTotalSegel', formatNumber(segelGudangCount) + ' Unit');
    setVal('topTotalOmset', formatRupiah(sisaTagihanNominal));

    setupHifiFilterListener();
}

function renderHifiCards(selectedType) {
    const container = document.getElementById('hifiCardContainer');
    if (!container) return;

    const rows = [...document.querySelectorAll('#tableBody tr.row-item')];
    const selected = String(selectedType || '').trim().toUpperCase();
    const isGudangMode = selected === 'GUDANG';

    const data = rows.filter(row => {
        const nama = String(row.dataset.nama || '').trim().toUpperCase();
        const ket = String(row.dataset.keterangan || '').trim().toLowerCase();
        const gudang = !nama || nama === '-' || nama === 'GUDANG' || nama === 'STOK GUDANG' || ket.includes('stok gudang');
        return isGudangMode ? gudang : !gudang && nama === selected;
    });

    if (!data.length) {
        container.innerHTML = `
            <div class="hifi-card-empty">
                📭 Tidak ada data untuk <strong>${isGudangMode ? 'STOK SEGEL GUDANG' : escapeHTML(selectedType)}</strong>
            </div>
        `;
        return;
    }

    const cards = data.map((row, index) => {
        const cell = sel => row.querySelector(sel)?.textContent?.trim() || '-';
        const [no, barang, jumlah, nomor, iccid, imei, nama, harga, tglAmbil, tglBayar] = [
            '[data-label="No"]', '[data-label="Barang"]', '[data-label="Jumlah"]',
            '[data-label="Nomor Hifi"]', '[data-label="ICCID"]', '[data-label="IMEI Devices"]',
            '[data-label="Nama"]', '[data-label="Harga"]', '[data-label="Tgl Ambil"]', '[data-label="Tgl Bayar"]'
        ].map(cell);

        const status = row.querySelector('[data-label="Keterangan"] .badge-status')?.textContent?.trim() || '-';
        const sLower = status.toLowerCase();
        let statusClass = sLower.includes('stok gudang') ? 'segel' 
            : sLower.includes('on hand dse') ? 'onhand' 
            : (sLower.includes('terjual') || sLower.includes('lunas')) ? 'terjual' 
            : sLower.includes('reture') ? 'danger' : 'default';

        const cardNo = no !== '-' ? no : String(index + 1);

        if (isGudangMode) {
            return `
                <article class="hifi-data-card hifi-gudang-card">
                    <div class="hifi-card-head">
                        <div class="hifi-card-title"><strong>📦 ${escapeHTML(barang)}</strong><span>STOK SEGEL GUDANG</span></div>
                        <div class="hifi-card-no">${escapeHTML(cardNo)}</div>
                    </div>
                    <div class="hifi-gudang-qty">
                        <span class="hifi-gudang-qty-label">STOK TERSEDIA</span>
                        <strong>${escapeHTML(jumlah)}<small>Unit</small></strong>
                    </div>
                    <div class="hifi-card-info">
                        <div class="hifi-info-row"><span class="hifi-info-label">Nomor HiFi</span><span class="hifi-info-value mono">${escapeHTML(nomor)}</span></div>
                        <div class="hifi-info-row"><span class="hifi-info-label">ICCID</span><span class="hifi-info-value mono">${escapeHTML(iccid)}</span></div>
                        <div class="hifi-info-row"><span class="hifi-info-label">IMEI Device</span><span class="hifi-info-value mono">${escapeHTML(imei)}</span></div>
                    </div>
                    <div class="hifi-card-footer">
                        <div class="hifi-card-price">${escapeHTML(harga)}</div>
                        <span class="hifi-card-status ${statusClass}">${escapeHTML(status)}</span>
                    </div>
                </article>
            `;
        }

        return `
            <article class="hifi-data-card">
                <div class="hifi-card-head">
                    <div class="hifi-card-title"><strong>${escapeHTML(barang)}</strong><span>${escapeHTML(nama)}</span></div>
                    <div class="hifi-card-no">${escapeHTML(cardNo)}</div>
                </div>
                <div class="hifi-card-info">
                    <div class="hifi-info-row"><span class="hifi-info-label">Jumlah</span><span class="hifi-info-value">${escapeHTML(jumlah)}</span></div>
                    <div class="hifi-info-row"><span class="hifi-info-label">Nomor HiFi</span><span class="hifi-info-value mono">${escapeHTML(nomor)}</span></div>
                    <div class="hifi-info-row"><span class="hifi-info-label">ICCID</span><span class="hifi-info-value mono">${escapeHTML(iccid)}</span></div>
                    <div class="hifi-info-row"><span class="hifi-info-label">IMEI Device</span><span class="hifi-info-value mono">${escapeHTML(imei)}</span></div>
                    <div class="hifi-info-row"><span class="hifi-info-label">Nama</span><span class="hifi-info-value">${escapeHTML(nama)}</span></div>
                    <div class="hifi-info-row"><span class="hifi-info-label">Tgl Ambil</span><span class="hifi-info-value">${escapeHTML(tglAmbil)}</span></div>
                    <div class="hifi-info-row"><span class="hifi-info-label">Tgl Bayar</span><span class="hifi-info-value">${escapeHTML(tglBayar)}</span></div>
                </div>
                <div class="hifi-card-footer">
                    <div class="hifi-card-price">${escapeHTML(harga)}</div>
                    <span class="hifi-card-status ${statusClass}">${escapeHTML(status)}</span>
                </div>
            </article>
        `;
    }).join('');

    container.innerHTML = `<div class="hifi-card-grid">${cards}</div>`;
}


function setupHifiFilterListener() {

    const hifiFilter = document.getElementById('hifiFilter');
    const tbody = document.getElementById('tableBody');
    const tableResponsive = document.querySelector('.table-responsive');
    const cardContainer = document.getElementById('hifiCardContainer');

    if (!hifiFilter || !tbody) return;

    hifiFilter.onchange = function () {

        const selected =
            String(this.value || 'ALL').trim().toUpperCase();

        const rows = tbody.querySelectorAll('tr.row-item');
        const totalRow = document.getElementById('defaultTotalRow');

        /* =====================================================
           MODE SEMUA DATA
        ===================================================== */

        if (selected === 'ALL') {

            if (tableResponsive) {
                tableResponsive.style.display = '';
            }

            if (cardContainer) {
                cardContainer.style.display = 'none';
            }

            rows.forEach(row => {
                row.style.setProperty(
                    'display',
                    'table-row',
                    'important'
                );
            });

            if (totalRow) {
                totalRow.style.setProperty(
                    'display',
                    'table-row',
                    'important'
                );
            }

            return;
        }

        /* =====================================================
           MODE DSE
        ===================================================== */

        if (tableResponsive) {
            tableResponsive.style.display = 'none';
        }

        if (cardContainer) {
            cardContainer.style.display = 'block';
        }

        rows.forEach(row => {
            row.style.setProperty(
                'display',
                'none',
                'important'
            );
        });

        if (totalRow) {
            totalRow.style.setProperty(
                'display',
                'none',
                'important'
            );
        }

        renderHifiCards(selected);
    };
}

async function fetchMasterData() {
    const updateTime = document.getElementById('updateTime');
    const tbody = document.getElementById('tableBody');
    try {
        if (updateTime) updateTime.textContent = 'Update Data: Memuat...';
        const res = await fetch(`${JSON_DATA_URL}?t=${Date.now()}`, { method: 'GET', cache: 'no-store' });
        if (!res.ok) throw new Error(`JSON gagal dimuat. HTTP ${res.status}`);
        const result = await res.json();
        if (!result || result.success !== true) throw new Error(result?.message || 'Format JSON tidak valid');

        const objectData = normalisasiData(result.data);
        if (!objectData.length) throw new Error('Data HiFi Air kosong');

        renderHiFiDashboard(objectData);

        let updateDate = result.updated_at ? new Date(result.updated_at) : new Date();
        if (isNaN(updateDate.getTime())) updateDate = new Date();
        if (updateTime) updateTime.innerHTML = 'Update Data: ' + formatUpdateDate(updateDate);
    } catch (error) {
        console.error('❌ GAGAL MENGAMBIL DATA HIFI AIR', error);
        if (updateTime) updateTime.textContent = 'Update Data: Gagal memuat';
        if (tbody) tbody.innerHTML = `<tr><td colspan="11" class="loading-text">⚠️ Gagal memuat data: ${escapeHTML(error.message)}</td></tr>`;
    }
}

async function downloadHifiTableImage() {
    const button = document.getElementById('downloadTableBtn');
    const table = document.getElementById('hifiTable');
    if (!table || typeof html2canvas === 'undefined') return alert('Library / Tabel belum tersedia.');

    const rows = table.querySelectorAll('tbody tr');
    if (!rows.length) return alert('Belum ada data.');

    const originalHTML = button ? button.innerHTML : '';
    if (button) { button.disabled = true; button.innerHTML = '⏳ Memproses...'; }

    let wrapper = null;
    try {
        wrapper = document.createElement('div');
        wrapper.className = 'hifi-download-clone';
        
        const title = document.createElement('div'); title.className = 'hifi-download-title'; title.textContent = 'REKAPITULASI PENJUALAN HIFI AIR';
        const subtitle = document.createElement('div'); subtitle.className = 'hifi-download-subtitle'; subtitle.textContent = 'Data Monitor Penjualan HiFi Air Mei 2026';
        
        wrapper.appendChild(title);
        wrapper.appendChild(subtitle);

        const clonedTable = table.cloneNode(true);
        clonedTable.querySelectorAll('tr').forEach(r => { r.style.display = 'table-row'; });
        clonedTable.querySelectorAll('td, th').forEach(c => { c.style.display = 'table-cell'; c.style.whiteSpace = 'nowrap'; c.style.visibility = 'visible'; });
        clonedTable.querySelectorAll('.badge-status').forEach(b => { b.style.display = 'inline-block'; });
        wrapper.appendChild(clonedTable);

        const footer = document.createElement('div'); footer.className = 'hifi-download-footer'; footer.textContent = 'Generated from MC Sagaranten • ' + formatUpdateDate(new Date());
        wrapper.appendChild(footer);

        document.body.appendChild(wrapper);
        await new Promise(r => setTimeout(r, 300));

        const canvas = await html2canvas(wrapper, { backgroundColor: '#ffffff', scale: Math.min(2, window.devicePixelRatio || 1), useCORS: true, allowTaint: true, logging: false, imageTimeout: 0 });
        const link = document.createElement('a');
        link.download = `Rekap-Penjualan-HiFi-Air-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } catch (error) {
        console.error('Gagal membuat gambar tabel:', error);
        alert('Gagal membuat gambar tabel.');
    } finally {
        if (wrapper) wrapper.remove();
        if (button) { button.disabled = false; button.innerHTML = originalHTML; }
    }
}

document.addEventListener('DOMContentLoaded', fetchMasterData);

function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'dashboard.html';
}
