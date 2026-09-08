/*! MC-SAGARANTEN - STOK AKHIR DSE - GITHUB JSON */
(function () {
    /* =========================================================
       CONFIG & STATE
    ========================================================= */
    const BASE_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/';
    const STOCK_URL = BASE_URL + 'stok-barang-dse.json';
    const PRICE_URL = BASE_URL + 'harga.json';
    const TAMBAHAN_URL = BASE_URL + 'tambahan.json';

    let rawData = [];
    let hargaData = [];
    let tambahanData = [];
    let currentTab = 'pcs';

    let pcsSummary = {
        adiguna: 0,
        farhan: 0,
        enden: 0,
        pebrian: 0,
        total: 0
    };

    let isLoadingStock = false;
    let isLoadingHarga = false;
    let isLoadingTambahan = false;

    /* =========================================================
       HELPERS
    ========================================================= */
    const escHTML = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const parseNum = v => {
        if (v === undefined || v === null || v === '' || v === '-') return null;
        if (typeof v === 'number') return Number.isFinite(v) ? v : null;
        let clean = String(v).trim().replace(/^"|"$/g, '');
        if (!clean || clean === '-') return null;
        clean = clean.replace(/Rp/gi, '').replace(/IDR/gi, '').trim();
        if (clean.includes(',')) clean = clean.split(',')[0];
        clean = clean.replace(/\./g, '').replace(/[^0-9-]/g, '');
        if (!clean || clean === '-') return null;
        const result = parseInt(clean, 10);
        return Number.isFinite(result) ? result : null;
    };

    const formatDisplay = (num, isRupiah = false) => {
        if (num === null || num === undefined) return '<span class="zero-val">-</span>';
        if (Number(num) === 0) return '0';
        const formatted = Number(num).toLocaleString('id-ID');
        return isRupiah ? `Rp ${formatted}` : formatted;
    };

    const getObjVal = (row, names) => {
        if (!row || typeof row !== 'object') return '';
        const keys = Object.keys(row);

        for (const target of names) {
            for (const key of keys) {
                if (String(key).trim().toLowerCase() === String(target).trim().toLowerCase()) return row[key];
            }
        }

        for (const key of keys) {
            const lowerKey = String(key).trim().toLowerCase();
            for (const target of names) {
                if (lowerKey.includes(String(target).trim().toLowerCase())) return row[key];
            }
        }
        return '';
    };

    /* =========================================================
       FIELD GETTERS
    ========================================================= */
    const getNama = row => String(getObjVal(row, ['nama', 'NAMA', 'JENIS BARANG', 'jenis barang', 'Nama Barang', 'nama barang', 'Barang', 'barang', 'Produk', 'produk', 'Item', 'item']) || '').trim();
    const getHarga = row => parseNum(getObjVal(row, ['HARGA', 'harga', 'PRICE', 'price']));
    const getAdiguna = row => parseNum(getObjVal(row, ['ADIGUNA', 'adiguna']));
    const getFarhan = row => parseNum(getObjVal(row, ['FARHAN', 'farhan', 'PARHAN', 'parhan']));
    const getEnden = row => parseNum(getObjVal(row, ['ENDEN', 'enden']));
    const getPebrian = row => parseNum(getObjVal(row, ['PEBRIAN', 'pebrian']));

    /* =========================================================
       NORMALIZE DATA
    ========================================================= */
    const normalizeData = raw => {
        if (!raw) return [];
        if (!Array.isArray(raw) && typeof raw === 'object') {
            if (Array.isArray(raw.data)) raw = raw.data;
            else if (Array.isArray(raw.rows)) raw = raw.rows;
            else if (Array.isArray(raw.values)) raw = raw.values;
            else raw = [raw];
        }
        if (!Array.isArray(raw) || !raw.length) return [];
        if (typeof raw[0] === 'object' && !Array.isArray(raw[0])) return raw;
        if (Array.isArray(raw[0])) {
            const headers = raw[0];
            return raw.slice(1).map(row => {
                const obj = {};
                headers.forEach((h, idx) => { obj[String(h).trim()] = row[idx]; });
                return obj;
            });
        }
        return [];
    };

    const normalizeRows = data => {
        if (!Array.isArray(data)) return [];
        return data.map(row => {
            const nama = getNama(row);
            const adiguna = getAdiguna(row);
            const farhan = getFarhan(row);
            const enden = getEnden(row);
            const pebrian = getPebrian(row);
            const total = (adiguna || 0) + (farhan || 0) + (enden || 0) + (pebrian || 0);
            return { nama, adiguna, farhan, enden, pebrian, total };
        }).filter(row => {
            const n = String(row.nama || '').trim().toLowerCase();
            return n !== '' && n !== 'total' && n !== 'total sp' && n !== 'total voucher';
        });
    };

    const normalizeStockRows = data => {
        if (!Array.isArray(data) || !data.length) return [];
        const alreadyNormalized = data.every(row =>
            row && typeof row === 'object' &&
            Object.prototype.hasOwnProperty.call(row, 'nama') &&
            (Object.prototype.hasOwnProperty.call(row, 'adiguna') ||
             Object.prototype.hasOwnProperty.call(row, 'farhan') ||
             Object.prototype.hasOwnProperty.call(row, 'enden') ||
             Object.prototype.hasOwnProperty.call(row, 'pebrian'))
        );

        if (alreadyNormalized) {
            return data.map(row => {
                const adiguna = parseNum(row.adiguna) ?? 0;
                const farhan = parseNum(row.farhan) ?? 0;
                const enden = parseNum(row.enden) ?? 0;
                const pebrian = parseNum(row.pebrian) ?? 0;
                return {
                    nama: String(row.nama || '').trim(),
                    adiguna,
                    farhan,
                    enden,
                    pebrian,
                    total: adiguna + farhan + enden + pebrian,
                    ...(row.harga !== undefined ? { harga: parseNum(row.harga) ?? 0 } : {})
                };
            }).filter(row => {
                const n = row.nama.trim().toLowerCase();
                return n !== '' && n !== 'total' && n !== 'total sp' && n !== 'total voucher';
            });
        }
        return normalizeRows(data);
    };

    const splitSPVDK = rows => {
        const dataSp = [], dataVdk = [];
        let isVdk = false;
        rows.forEach(row => {
            const nama = String(row.nama || '').trim();
            if (!nama) return;
            if (nama.toUpperCase() === 'VDK') { isVdk = true; return; }
            (isVdk ? dataVdk : dataSp).push(row);
        });
        return { dataSp, dataVdk };
    };

    /* =========================================================
       SUMMARY DSE
    ========================================================= */
    function updateSummaryDisplay() {
    const summaryAdiguna = document.getElementById('summary-adiguna');
    const summaryFarhan = document.getElementById('summary-farhan');
    const summaryEnden = document.getElementById('summary-enden');
    const summaryPebrian = document.getElementById('summary-pebrian');

    // Format angka dengan titik sebagai pemisah ribuan
    const formatSummary = value => {
        const number = Number(value || 0);

        return number.toLocaleString('id-ID');
    };

    if (summaryAdiguna) {
        summaryAdiguna.textContent = formatSummary(pcsSummary.adiguna);
    }

    if (summaryFarhan) {
        summaryFarhan.textContent = formatSummary(pcsSummary.farhan);
    }

    if (summaryEnden) {
        summaryEnden.textContent = formatSummary(pcsSummary.enden);
    }

    if (summaryPebrian) {
        summaryPebrian.textContent = formatSummary(pcsSummary.pebrian);
    }
}

    function calculatePCSSummary(rows) {
        const normalized = normalizeStockRows(rows);
        let adiguna = 0, farhan = 0, enden = 0, pebrian = 0;

        normalized.forEach(item => {
            adiguna += Number(item.adiguna || 0);
            farhan += Number(item.farhan || 0);
            enden += Number(item.enden || 0);
            pebrian += Number(item.pebrian || 0);
        });

        pcsSummary = {
            adiguna,
            farhan,
            enden,
            pebrian,
            total: adiguna + farhan + enden + pebrian
        };

        updateSummaryDisplay();
    }

    /* =========================================================
       GRAND TOTAL
    ========================================================= */
    function updateSummaryLabel() {
        const label = document.getElementById('dse-total-label');
        if (!label) return;
        if (currentTab === 'pcs') label.textContent = 'Total PCS';
        else if (currentTab === 'rupiah') label.textContent = 'Total Rupiah';
        else if (currentTab === 'tambahan') label.textContent = 'Total Tambahan';
    }

    function updateGrandTotal(value) {
        const el = document.getElementById('dse-grand-total');
        if (!el) return;
        el.textContent = (value !== undefined && value !== null && value !== '') ? value : '0';
        updateSummaryLabel();
    }

    function updateGrandTotalFromTable(tableBody) {
        if (!tableBody) return;
        const totalRow = tableBody.querySelector('tr.total-row');
        if (!totalRow) { updateGrandTotal('0'); return; }
        const cells = totalRow.querySelectorAll('td');
        if (cells.length < 6) { updateGrandTotal('0'); return; }
        updateGrandTotal(cells[5].textContent.trim() || '0');
    }

    /* =========================================================
       CACHE
    ========================================================= */
    const loadCache = () => {
        try {
            const stockCache = localStorage.getItem('dse_raw_data');
            if (stockCache) {
                const parsed = JSON.parse(stockCache);
                if (Array.isArray(parsed)) {
                    rawData = normalizeStockRows(parsed);
                    calculatePCSSummary(rawData);
                    processAndRender(rawData);
                }
            }
            const hargaCache = localStorage.getItem('dse_harga_data');
            if (hargaCache) {
                const parsed = JSON.parse(hargaCache);
                if (Array.isArray(parsed)) hargaData = parsed;
            }
            const tambahanCache = localStorage.getItem('tambahan_raw_data');
            if (tambahanCache) {
                const parsed = JSON.parse(tambahanCache);
                if (Array.isArray(parsed)) {
                    tambahanData = parsed;
                    renderTambahanTable(normalizeRows(tambahanData));
                }
            }
        } catch (e) {
            console.warn('Cache DSE tidak dapat dibaca:', e);
        }
    };

    /* =========================================================
       FETCH HARGA & MASTER STOCK
    ========================================================= */
    const fetchHarga = async () => {
        if (isLoadingHarga) return hargaData;
        isLoadingHarga = true;
        try {
            const res = await fetch(PRICE_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format harga salah');
            hargaData = json.data;
            localStorage.setItem('dse_harga_data', JSON.stringify(hargaData));
            return hargaData;
        } catch (e) {
            console.warn('Gagal mengambil harga:', e);
            return hargaData;
        } finally {
            isLoadingHarga = false;
        }
    };

    const mergeHarga = (stok, harga) => {
        const map = new Map();
        if (Array.isArray(harga)) {
            harga.forEach(item => {
                const nama = getNama(item).toLowerCase().trim();
                if (nama) map.set(nama, getHarga(item) ?? 0);
            });
        }
        return stok.map(item => ({
            ...item,
            harga: map.get(String(item.nama || '').trim().toLowerCase()) || 0
        }));
    };

    const fetchMaster = async () => {
        if (isLoadingStock) return;
        isLoadingStock = true;
        const updateTime = document.getElementById('updateTime');
        if (updateTime) updateTime.textContent = 'Update Data: Memuat...';

        try {
            const [stockRes, harga] = await Promise.all([
                fetch(STOCK_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' }),
                fetchHarga()
            ]);

            if (!stockRes.ok) throw new Error('HTTP ' + stockRes.status);
            const json = await stockRes.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format stok salah');

            const normalizedStock = normalizeRows(normalizeData(json.data));
            calculatePCSSummary(normalizedStock);
            rawData = mergeHarga(normalizedStock, harga);
            localStorage.setItem('dse_raw_data', JSON.stringify(rawData));
            processAndRender(rawData);

            if (updateTime) {
                let waktu = new Date();
                if (json.updated_at) {
                    const parsed = new Date(json.updated_at);
                    if (!isNaN(parsed.getTime())) waktu = parsed;
                }
                updateTime.textContent = 'Update Data: ' + waktu.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
            }
        } catch (error) {
            console.error('Gagal memuat DSE:', error);
            if (!rawData.length) {
                const table = document.getElementById('cso-stock-table');
                if (table) {
                    table.innerHTML = `<tr><td colspan="6" class="loading-text">⚠️ Gagal memuat data DSE<br><small>${escHTML(error.message)}</small></td></tr>`;
                }
                if (updateTime) updateTime.textContent = 'Update Data: Gagal memuat';
            } else {
                processAndRender(rawData);
                if (updateTime) updateTime.textContent = 'Update Data: Menggunakan data terakhir';
            }
        } finally {
            isLoadingStock = false;
        }
    };

    const fetchTambahan = async () => {
        if (isLoadingTambahan) return;
        isLoadingTambahan = true;
        try {
            const res = await fetch(TAMBAHAN_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format tambahan salah');
            tambahanData = json.data;
            localStorage.setItem('tambahan_raw_data', JSON.stringify(tambahanData));
            renderTambahanTable(normalizeRows(tambahanData));
        } catch (e) {
            console.warn('Gagal memuat tambahan:', e);
            if (tambahanData.length) renderTambahanTable(normalizeRows(tambahanData));
        } finally {
            isLoadingTambahan = false;
        }
    };

    /* =========================================================
       RENDER TAMBAHAN
    ========================================================= */
    const renderTambahanTable = rows => {
    const tableBody = document.getElementById('tambahan-table');
    if (!tableBody) return;

    if (!rows.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-text">
                    Tidak ada data tambahan.
                </td>
            </tr>`;

        if (currentTab === 'tambahan') {
            updateGrandTotal('0');

            /* Summary tambahan kosong */
            pcsSummary.adiguna = 0;
            pcsSummary.farhan = 0;
            pcsSummary.enden = 0;
            pcsSummary.pebrian = 0;
            pcsSummary.total = 0;

            updateSummaryDisplay();
        }

        return;
    }

    let html = '';
    const { dataSp, dataVdk } = splitSPVDK(rows);

    const makeRow = item => {
        const a = Number(item.adiguna || 0);
        const f = Number(item.farhan || 0);
        const e = Number(item.enden || 0);
        const p = Number(item.pebrian || 0);

        const t = a + f + e + p;

        return `
            <tr class="data-row">
                <td class="item-name-col">${escHTML(item.nama)}</td>
                <td>${formatDisplay(a)}</td>
                <td>${formatDisplay(f)}</td>
                <td>${formatDisplay(e)}</td>
                <td>${formatDisplay(p)}</td>
                <td class="total-col">${formatDisplay(t)}</td>
            </tr>`;
    };

    /* =========================================================
       TOTAL SP
    ========================================================= */

    let spA = 0;
    let spF = 0;
    let spE = 0;
    let spP = 0;

    dataSp.forEach(item => {
        spA += Number(item.adiguna || 0);
        spF += Number(item.farhan || 0);
        spE += Number(item.enden || 0);
        spP += Number(item.pebrian || 0);

        html += makeRow(item);
    });

    const spTotal = spA + spF + spE + spP;

    html += `
        <tr class="total-sp-row">
            <td class="item-name-col">TOTAL SP</td>
            <td>${formatDisplay(spA)}</td>
            <td>${formatDisplay(spF)}</td>
            <td>${formatDisplay(spE)}</td>
            <td>${formatDisplay(spP)}</td>
            <td class="total-col">${formatDisplay(spTotal)}</td>
        </tr>`;

    /* =========================================================
       TOTAL VOUCHER
    ========================================================= */

    let vdkA = 0;
    let vdkF = 0;
    let vdkE = 0;
    let vdkP = 0;

    dataVdk.forEach(item => {
        vdkA += Number(item.adiguna || 0);
        vdkF += Number(item.farhan || 0);
        vdkE += Number(item.enden || 0);
        vdkP += Number(item.pebrian || 0);
    });

    const vdkTotal = vdkA + vdkF + vdkE + vdkP;

    if (dataVdk.length) {

        html += `
            <tr class="dse-divider">
                <td colspan="6"></td>
            </tr>`;

        dataVdk.forEach(item => {
            html += makeRow(item);
        });

        html += `
            <tr class="total-voucher-row">
                <td class="item-name-col">TOTAL VOUCHER</td>
                <td>${formatDisplay(vdkA)}</td>
                <td>${formatDisplay(vdkF)}</td>
                <td>${formatDisplay(vdkE)}</td>
                <td>${formatDisplay(vdkP)}</td>
                <td class="total-col">${formatDisplay(vdkTotal)}</td>
            </tr>`;
    }

    /* =========================================================
       GRAND TOTAL TAMBAHAN
    ========================================================= */

    const grandA = spA + vdkA;
    const grandF = spF + vdkF;
    const grandE = spE + vdkE;
    const grandP = spP + vdkP;

    const grandTotal =
        grandA +
        grandF +
        grandE +
        grandP;

    /* =========================================================
       SUMMARY DSE TAMBAHAN
       
       HANYA AKTIF PADA TAB TAMBAHAN
       Mengambil langsung dari GRAND TOTAL masing-masing DSE
    ========================================================= */

    if (currentTab === 'tambahan') {

        pcsSummary.adiguna = grandA;
        pcsSummary.farhan = grandF;
        pcsSummary.enden = grandE;
        pcsSummary.pebrian = grandP;
        pcsSummary.total = grandTotal;

        updateSummaryDisplay();
    }

    /* =========================================================
       TOTAL AKHIR
    ========================================================= */

    html += `
        <tr class="total-space-row">
            <td colspan="6"></td>
        </tr>`;

    html += `
        <tr class="total-row">
            <td class="item-name-col">TOTAL</td>
            <td>${formatDisplay(grandA)}</td>
            <td>${formatDisplay(grandF)}</td>
            <td>${formatDisplay(grandE)}</td>
            <td>${formatDisplay(grandP)}</td>
            <td class="total-col">${formatDisplay(grandTotal)}</td>
        </tr>`;

    /* =========================================================
       RENDER TABLE
    ========================================================= */

    tableBody.innerHTML = html;

    if (currentTab === 'tambahan') {
        updateGrandTotalFromTable(tableBody);
        updateSummaryLabel();
        updateSummaryDisplay();
    }
};

    /* =========================================================
       PROCESS & RENDER PCS / RUPIAH
    ========================================================= */
    const processAndRender = rows => {
    rows = normalizeStockRows(rows);

    const tableBody = document.getElementById('cso-stock-table');
    if (!tableBody) return;

    const isRupiah = currentTab === 'rupiah';

    let html = '';
    const { dataSp, dataVdk } = splitSPVDK(rows);

    const getValue = (item, field) => {
        const jumlah = Number(item[field] || 0);

        if (isRupiah) {
            return jumlah * Number(item.harga || 0);
        }

        return jumlah;
    };

    const makeRow = item => {
        const a = item.adiguna != null
            ? getValue(item, 'adiguna')
            : null;

        const f = item.farhan != null
            ? getValue(item, 'farhan')
            : null;

        const e = item.enden != null
            ? getValue(item, 'enden')
            : null;

        const p = item.pebrian != null
            ? getValue(item, 'pebrian')
            : null;

        const t = item.total != null
            ? getValue(item, 'total')
            : null;

        return `
            <tr class="data-row">
                <td class="item-name-col">${escHTML(item.nama)}</td>
                <td>${formatDisplay(a, isRupiah)}</td>
                <td>${formatDisplay(f, isRupiah)}</td>
                <td>${formatDisplay(e, isRupiah)}</td>
                <td>${formatDisplay(p, isRupiah)}</td>
                <td class="total-col">${formatDisplay(t, isRupiah)}</td>
            </tr>`;
    };

    /* =========================================================
       TOTAL SP
    ========================================================= */

    let spA = 0;
    let spF = 0;
    let spE = 0;
    let spP = 0;

    dataSp.forEach(item => {
        spA += getValue(item, 'adiguna');
        spF += getValue(item, 'farhan');
        spE += getValue(item, 'enden');
        spP += getValue(item, 'pebrian');

        html += makeRow(item);
    });

    const spTotal = spA + spF + spE + spP;

    html += `
        <tr class="total-sp-row">
            <td class="item-name-col">TOTAL SP</td>
            <td>${formatDisplay(spA, isRupiah)}</td>
            <td>${formatDisplay(spF, isRupiah)}</td>
            <td>${formatDisplay(spE, isRupiah)}</td>
            <td>${formatDisplay(spP, isRupiah)}</td>
            <td class="total-col">${formatDisplay(spTotal, isRupiah)}</td>
        </tr>`;

    /* =========================================================
       TOTAL VOUCHER
    ========================================================= */

    let vdkA = 0;
    let vdkF = 0;
    let vdkE = 0;
    let vdkP = 0;

    dataVdk.forEach(item => {
        vdkA += getValue(item, 'adiguna');
        vdkF += getValue(item, 'farhan');
        vdkE += getValue(item, 'enden');
        vdkP += getValue(item, 'pebrian');
    });

    const vdkTotal = vdkA + vdkF + vdkE + vdkP;

    if (dataVdk.length) {

        html += `
            <tr class="dse-divider">
                <td colspan="6"></td>
            </tr>`;

        dataVdk.forEach(item => {
            html += makeRow(item);
        });

        html += `
            <tr class="total-voucher-row">
                <td class="item-name-col">TOTAL VOUCHER</td>
                <td>${formatDisplay(vdkA, isRupiah)}</td>
                <td>${formatDisplay(vdkF, isRupiah)}</td>
                <td>${formatDisplay(vdkE, isRupiah)}</td>
                <td>${formatDisplay(vdkP, isRupiah)}</td>
                <td class="total-col">${formatDisplay(vdkTotal, isRupiah)}</td>
            </tr>`;
    }

    /* =========================================================
       GRAND TOTAL MASING-MASING DSE
    ========================================================= */

    const grandA = spA + vdkA;
    const grandF = spF + vdkF;
    const grandE = spE + vdkE;
    const grandP = spP + vdkP;

    const grandTotal =
        grandA +
        grandF +
        grandE +
        grandP;

    /* =========================================================
       SUMMARY DSE
       
       PCS    → ambil GRAND TOTAL PCS
       RUPIAH → ambil GRAND TOTAL RUPIAH
       TAMBAHAN tidak masuk fungsi ini
    ========================================================= */

    if (currentTab === 'pcs') {

        pcsSummary.adiguna = grandA;
        pcsSummary.farhan = grandF;
        pcsSummary.enden = grandE;
        pcsSummary.pebrian = grandP;
        pcsSummary.total = grandTotal;

        updateSummaryDisplay();
    }

    if (currentTab === 'rupiah') {

        pcsSummary.adiguna = grandA;
        pcsSummary.farhan = grandF;
        pcsSummary.enden = grandE;
        pcsSummary.pebrian = grandP;
        pcsSummary.total = grandTotal;

        updateSummaryDisplay();
    }

    /* =========================================================
       TOTAL AKHIR TABLE
    ========================================================= */

    html += `
        <tr class="total-space-row">
            <td colspan="6"></td>
        </tr>`;

    html += `
        <tr class="total-row">
            <td class="item-name-col">TOTAL</td>
            <td>${formatDisplay(grandA, isRupiah)}</td>
            <td>${formatDisplay(grandF, isRupiah)}</td>
            <td>${formatDisplay(grandE, isRupiah)}</td>
            <td>${formatDisplay(grandP, isRupiah)}</td>
            <td class="total-col">${formatDisplay(grandTotal, isRupiah)}</td>
        </tr>`;

    /* =========================================================
       RENDER
    ========================================================= */

    tableBody.innerHTML = rows.length
        ? html
        : `<tr>
            <td colspan="6" class="loading-text">
                Tidak ada data stok DSE.
            </td>
        </tr>`;

    if (!rows.length) {
        updateGrandTotal('0');
        updateSummaryDisplay();
        return;
    }

    /* =========================================================
       GRAND TOTAL UTAMA
    ========================================================= */

    updateGrandTotalFromTable(tableBody);

    /* Pastikan label tetap sesuai tab */
    updateSummaryLabel();

    /* Pastikan summary tetap tampil */
    updateSummaryDisplay();
};

    /* =========================================================
       GLOBAL TAB CONTROL
    ========================================================= */
    window.switchTab = tab => {
        currentTab = String(tab || 'pcs').toLowerCase();
        document.querySelectorAll('.dse-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === currentTab);
        });

        const mainTable = document.getElementById('pcs-rupiah-table');
        const tambahanTable = document.getElementById('tambahan-dse-table');

        if (currentTab === 'tambahan') {
            if (mainTable) mainTable.style.display = 'none';
            if (tambahanTable) tambahanTable.style.display = 'table';
            if (tambahanData.length) {
                renderTambahanTable(normalizeRows(tambahanData));
            } else {
                updateGrandTotal('0');
            }
            updateSummaryDisplay();
            updateSummaryLabel();
            return;
        }

        if (mainTable) mainTable.style.display = 'table';
        if (tambahanTable) tambahanTable.style.display = 'none';

        if (rawData.length) {
            processAndRender(rawData);
        } else {
            updateGrandTotal('0');
        }

        updateSummaryDisplay();
        updateSummaryLabel();
    };

    /* =========================================================
       DOWNLOAD MODAL & EXECUTION
    ========================================================= */
    window.openDownloadModal = () => {
        const modal = document.getElementById('downloadModal');
        if (modal) modal.style.display = 'flex';
    };

    window.closeDownloadModal = () => {
        const modal = document.getElementById('downloadModal');
        if (modal) modal.style.display = 'none';
    };

    window.executeDownload = async type => {
        window.closeDownloadModal();
        const prevTab = currentTab;

        if (type === 'pcs' || type === 'rupiah') {
            currentTab = type;
            if (rawData.length) processAndRender(rawData);
        } else if (type === 'tambahan') {
            if (tambahanData.length) renderTambahanTable(normalizeRows(tambahanData));
        }

        const table = type === 'tambahan' ? document.getElementById('tambahan-dse-table') : document.getElementById('pcs-rupiah-table');
        if (!table) { currentTab = prevTab; return; }

        let container = null;
        try {
            const clone = table.cloneNode(true);
            clone.style.display = 'table';

            container = document.createElement('div');
            container.style.cssText = 'position:absolute;left:-99999px;top:0;background:#fff;padding:20px;';

            clone.querySelectorAll('th, td').forEach(c => { c.style.position = 'static'; });
            clone.style.cssText += 'width:auto;min-width:100%;max-width:none;background:#fff;';

            container.appendChild(clone);
            document.body.appendChild(container);

            await new Promise(r => setTimeout(r, 150));
            container.style.width = (clone.scrollWidth + 40) + 'px';

            if (typeof html2canvas !== 'function') throw new Error('html2canvas tidak tersedia.');

            const canvas = await html2canvas(container, { backgroundColor: '#fff', scale: 2, useCORS: true, logging: false });
            const link = document.createElement('a');
            link.download = `stok-akhir-dse-${type}-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('Download error:', e);
            alert('Gagal membuat gambar tabel.');
        } finally {
            if (container) container.remove();
            currentTab = prevTab;
            window.switchTab(currentTab);
        }
    };

    /* =========================================================
       NAVIGATION & REFRESH
    ========================================================= */
    window.goBack = () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'dashboard.html';
    };

    window.refreshDSE = async () => {
        await Promise.allSettled([fetchMaster(), fetchHarga(), fetchTambahan()]);
        if (rawData.length) processAndRender(rawData);
        if (currentTab === 'tambahan' && tambahanData.length) {
            renderTambahanTable(normalizeRows(tambahanData));
        }
        updateSummaryDisplay();
        updateSummaryLabel();
    };
    window.refreshStokDSE = window.refreshDSE;

    /* =========================================================
       INITIAL LOAD
    ========================================================= */
    document.addEventListener('DOMContentLoaded', async () => {
        updateSummaryLabel();
        loadCache();
        updateSummaryDisplay();

        await Promise.allSettled([fetchMaster(), fetchTambahan()]);

        if (currentTab === 'tambahan' && tambahanData.length) {
            renderTambahanTable(normalizeRows(tambahanData));
        }

        updateSummaryDisplay();
        updateSummaryLabel();
    });
})();
