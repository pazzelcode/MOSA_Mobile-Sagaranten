/*! MC-SAGARANTEN - STOK AKHIR DSE - GITHUB JSON */
(function () {
    const BASE_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/';
    const STOCK_URL = BASE_URL + 'stok-barang-dse.json';
    const PRICE_URL = BASE_URL + 'harga.json';
    const TAMBAHAN_URL = BASE_URL + 'tambahan.json';

    let rawData = [], hargaData = [], tambahanData = [], currentTab = 'pcs';
    let isLoadingStock = false, isLoadingHarga = false, isLoadingTambahan = false;

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
        const res = parseInt(clean, 10);
        return Number.isFinite(res) ? res : null;
    };

    const formatDisplay = (num, isRupiah = false) => {
        if (num === null || num === undefined) return '<span class="zero-val">-</span>';
        if (num === 0) return '0';
        const fmt = Number(num).toLocaleString('id-ID');
        return isRupiah ? `Rp ${fmt}` : fmt;
    };

    const getObjVal = (row, names) => {
        if (!row || typeof row !== 'object') return '';
        const keys = Object.keys(row);
        for (const t of names) {
            for (const k of keys) {
                if (String(k).trim().toLowerCase() === String(t).trim().toLowerCase()) return row[k];
            }
        }
        for (const k of keys) {
            const lk = String(k).trim().toLowerCase();
            for (const t of names) {
                if (lk.includes(String(t).trim().toLowerCase())) return row[k];
            }
        }
        return '';
    };

    const getNama = r => String(getObjVal(r, ['JENIS BARANG', 'jenis barang', 'Nama Barang', 'nama barang', 'Barang', 'barang', 'Produk', 'produk', 'Item', 'item']) || '').trim();
    const getHarga = r => parseNum(getObjVal(r, ['HARGA', 'harga', 'PRICE', 'price']));
    const getAdiguna = r => parseNum(getObjVal(r, ['ADIGUNA', 'adiguna']));
    const getFarhan = r => parseNum(getObjVal(r, ['FARHAN', 'farhan', 'PARHAN', 'parhan']));
    const getEnden = r => parseNum(getObjVal(r, ['ENDEN', 'enden']));
    const getPebrian = r => parseNum(getObjVal(r, ['PEBRIAN', 'pebrian']));

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

    const normalizeDSE = data => {
        if (!Array.isArray(data)) return [];
        return data.map(r => {
            const nama = getNama(r), adiguna = getAdiguna(r), farhan = getFarhan(r), enden = getEnden(r), pebrian = getPebrian(r);
            const total = (adiguna || 0) + (farhan || 0) + (enden || 0) + (pebrian || 0);
            return { nama, adiguna, farhan, enden, pebrian, total };
        }).filter(r => r.nama !== '' && r.nama.toLowerCase() !== 'total');
    };

    const normalizeTambahan = data => {
        if (!Array.isArray(data)) return [];
        return data.map(r => {
            const nama = getNama(r), adiguna = getAdiguna(r), farhan = getFarhan(r), enden = getEnden(r), pebrian = getPebrian(r);
            const total = (adiguna || 0) + (farhan || 0) + (enden || 0) + (pebrian || 0);
            return { nama, adiguna, farhan, enden, pebrian, total };
        }).filter(r => r.nama !== '' && r.nama.toLowerCase() !== 'total');
    };

    const loadCache = () => {
        try {
            const cs = localStorage.getItem('dse_raw_data');
            if (cs) { const p = JSON.parse(cs); if (Array.isArray(p)) { rawData = p; processAndRender(rawData); } }
            const ch = localStorage.getItem('dse_harga_data');
            if (ch) { const p = JSON.parse(ch); if (Array.isArray(p)) hargaData = p; }
            const ct = localStorage.getItem('tambahan_raw_data');
            if (ct) { const p = JSON.parse(ct); if (Array.isArray(p)) { tambahanData = p; renderTambahanTable(normalizeTambahan(tambahanData)); } }
        } catch (e) {}
    };

    const fetchHarga = async () => {
        if (isLoadingHarga) return hargaData;
        isLoadingHarga = true;
        try {
            const res = await fetch(PRICE_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format salah');
            hargaData = json.data;
            localStorage.setItem('dse_harga_data', JSON.stringify(hargaData));
            return hargaData;
        } catch (e) {
            return hargaData;
        } finally {
            isLoadingHarga = false;
        }
    };

    const mergeHarga = (stok, harga) => {
        const map = new Map();
        if (Array.isArray(harga)) {
            harga.forEach(i => {
                const n = getNama(i).toLowerCase().trim();
                if (n) map.set(n, getHarga(i) ?? 0);
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
        const ut = document.getElementById('updateTime');
        if (ut) ut.textContent = 'Update Data: Memuat...';
        try {
            const [sRes, hData] = await Promise.all([
                fetch(STOCK_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' }),
                fetchHarga()
            ]);
            if (!sRes.ok) throw new Error('HTTP ' + sRes.status);
            const json = await sRes.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format salah');
            rawData = mergeHarga(normalizeDSE(normalizeData(json.data)), hData);
            localStorage.setItem('dse_raw_data', JSON.stringify(rawData));
            processAndRender(rawData);
            if (ut) {
                let waktu = new Date();
                if (json.updated_at) {
                    const p = new Date(json.updated_at);
                    if (!isNaN(p.getTime())) waktu = p;
                }
                ut.textContent = 'Update Data: ' + waktu.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
            }
        } catch (e) {
            if (!rawData.length) {
                const tb = document.getElementById('cso-stock-table');
                if (tb) tb.innerHTML = `<tr><td colspan="6" class="loading-text">⚠️ Gagal memuat data DSE<br><small>${escHTML(e.message)}</small></td></tr>`;
            }
            if (ut) ut.textContent = 'Update Data: Gagal memuat';
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
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format salah');
            tambahanData = json.data;
            localStorage.setItem('tambahan_raw_data', JSON.stringify(tambahanData));
            renderTambahanTable(normalizeTambahan(tambahanData));
        } catch (e) {
            if (tambahanData.length) renderTambahanTable(normalizeTambahan(tambahanData));
        } finally {
            isLoadingTambahan = false;
        }
    };

    const renderTambahanTable = rows => {
    const tb = document.getElementById('tambahan-table');
    if (!tb) return;

    if (!rows.length) {
        tb.innerHTML = `
            <tr>
                <td colspan="6" class="loading-text">
                    Tidak ada data tambahan.
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    /* =========================================
       TOTAL KESELURUHAN
    ========================================= */

    let gA = 0;
    let gF = 0;
    let gE = 0;
    let gP = 0;

    /* =========================================
       PEMISAH SP / VDK
    ========================================= */

    const dataSp = [];
    const dataVdk = [];

    let isVdk = false;

    rows.forEach(i => {

        const nama = String(i.nama || '').trim();

        if (!nama) return;

        if (nama.toUpperCase() === 'VDK') {
            isVdk = true;
            return;
        }

        const a = Number(i.adiguna || 0);
        const f = Number(i.farhan || 0);
        const e = Number(i.enden || 0);
        const p = Number(i.pebrian || 0);

        gA += a;
        gF += f;
        gE += e;
        gP += p;

        if (isVdk) {
            dataVdk.push(i);
        } else {
            dataSp.push(i);
        }
    });

    /* =========================================
       FUNGSI BARIS
    ========================================= */

    const makeRow = i => {

        const a = Number(i.adiguna || 0);
        const f = Number(i.farhan || 0);
        const e = Number(i.enden || 0);
        const p = Number(i.pebrian || 0);

        const t = a + f + e + p;

        return `
            <tr class="data-row">

                <td class="item-name-col">
                    ${escHTML(i.nama)}
                </td>

                <td>
                    ${formatDisplay(a)}
                </td>

                <td>
                    ${formatDisplay(f)}
                </td>

                <td>
                    ${formatDisplay(e)}
                </td>

                <td>
                    ${formatDisplay(p)}
                </td>

                <td class="total-col">
                    ${formatDisplay(t)}
                </td>

            </tr>
        `;
    };

    /* =========================================
       DATA SP
    ========================================= */

    dataSp.forEach(i => {
        html += makeRow(i);
    });

    /* =========================================
       TOTAL SP
    ========================================= */

    let spA = 0;
    let spF = 0;
    let spE = 0;
    let spP = 0;

    dataSp.forEach(i => {

        spA += Number(i.adiguna || 0);
        spF += Number(i.farhan || 0);
        spE += Number(i.enden || 0);
        spP += Number(i.pebrian || 0);

    });

    const spTotal = spA + spF + spE + spP;

    html += `
        <tr class="total-sp-row">

            <td class="item-name-col">
                TOTAL SP
            </td>

            <td>
                ${formatDisplay(spA)}
            </td>

            <td>
                ${formatDisplay(spF)}
            </td>

            <td>
                ${formatDisplay(spE)}
            </td>

            <td>
                ${formatDisplay(spP)}
            </td>

            <td class="total-col">
                ${formatDisplay(spTotal)}
            </td>

        </tr>
    `;

    /* =========================================
       PEMISAH SP → VDK
    ========================================= */

    if (dataVdk.length) {

        html += `
            <tr class="dse-divider">
                <td colspan="6"></td>
            </tr>
        `;

        dataVdk.forEach(i => {
            html += makeRow(i);
        });
    }

    /* =========================================
       TOTAL KESELURUHAN
    ========================================= */

    const gT = gA + gF + gE + gP;

    html += `
        <tr class="total-row">

            <td class="item-name-col">
                TOTAL
            </td>

            <td>
                ${formatDisplay(gA)}
            </td>

            <td>
                ${formatDisplay(gF)}
            </td>

            <td>
                ${formatDisplay(gE)}
            </td>

            <td>
                ${formatDisplay(gP)}
            </td>

            <td class="total-col">
                ${formatDisplay(gT)}
            </td>

        </tr>
    `;

    tb.innerHTML = html;

    /* =========================================
       UPDATE SUMMARY
    ========================================= */

    const lbl = document.getElementById('dse-total-label');

    if (lbl) {
        lbl.textContent = 'Total Tambahan';
    }

    Object.entries({
        adiguna: gA,
        farhan: gF,
        enden: gE,
        pebrian: gP
    }).forEach(([name, val]) => {

        const el = document.getElementById('summary-' + name);

        if (el) {
            el.textContent =
                formatDisplay(val).replace(/<[^>]*>/g, '');
        }

    });

    const ge = document.getElementById('dse-grand-total');

    if (ge) {
        ge.textContent =
            formatDisplay(gT).replace(/<[^>]*>/g, '');
    }
};

    const processAndRender = rows => {
        if (!Array.isArray(rows)) rows = [];
        let html = '', gA = 0, gF = 0, gE = 0, gP = 0;
        const dataSp = [], dataVdk = [];
        let isVdk = false;
        const isRupiah = currentTab === 'rupiah';

        rows.forEach(i => {
            const n = String(i.nama || '').trim();
            if (!n) return;
            if (n.toUpperCase() === 'VDK') isVdk = true;
            if (!isVdk) {
                const m = isRupiah ? Number(i.harga || 0) : 1;
                gA += (i.adiguna || 0) * m;
                gF += (i.farhan || 0) * m;
                gE += (i.enden || 0) * m;
                gP += (i.pebrian || 0) * m;
            }
            (isVdk ? dataVdk : dataSp).push(i);
        });

        const makeRow = i => {
            const m = isRupiah ? Number(i.harga || 0) : 1;
            const a = i.adiguna != null ? i.adiguna * m : null;
            const f = i.farhan != null ? i.farhan * m : null;
            const e = i.enden != null ? i.enden * m : null;
            const p = i.pebrian != null ? i.pebrian * m : null;
            const t = i.total != null ? i.total * m : null;
            return `<tr class="data-row"><td class="item-name-col">${escHTML(i.nama)}</td><td>${formatDisplay(a, isRupiah)}</td><td>${formatDisplay(f, isRupiah)}</td><td>${formatDisplay(e, isRupiah)}</td><td>${formatDisplay(p, isRupiah)}</td><td class="total-col">${formatDisplay(t, isRupiah)}</td></tr>`;
        };

        /* =========================================
   TABEL SP
========================================= */

dataSp.forEach(i => {
    html += makeRow(i);
});

/* =========================================
   TOTAL SP
========================================= */

let spA = 0;
let spF = 0;
let spE = 0;
let spP = 0;

dataSp.forEach(i => {
    const m = isRupiah ? Number(i.harga || 0) : 1;

    spA += (Number(i.adiguna) || 0) * m;
    spF += (Number(i.farhan) || 0) * m;
    spE += (Number(i.enden) || 0) * m;
    spP += (Number(i.pebrian) || 0) * m;
});

const spTotal = spA + spF + spE + spP;

/* Baris TOTAL SP */
html += `
<tr class="total-sp-row">
    <td class="item-name-col">TOTAL SP</td>
    <td>${formatDisplay(spA, isRupiah)}</td>
    <td>${formatDisplay(spF, isRupiah)}</td>
    <td>${formatDisplay(spE, isRupiah)}</td>
    <td>${formatDisplay(spP, isRupiah)}</td>
    <td class="total-col">${formatDisplay(spTotal, isRupiah)}</td>
</tr>
`;

/* =========================================
   PEMISAH SP → VDK
========================================= */

if (dataVdk.length) {
    html += `<tr class="dse-divider"><td colspan="6"></td></tr>`;
    dataVdk.forEach(i => {
        html += makeRow(i);
    });
}

        const gTot = gA + gF + gE + gP;
        const lbl = document.getElementById('dse-total-label');
        if (lbl) lbl.textContent = isRupiah ? 'Total Rupiah' : 'Total Stok';

        [gA, gF, gE, gP].forEach((val, idx) => {
            const el = document.getElementById('summary-' + ['adiguna', 'farhan', 'enden', 'pebrian'][idx]);
            if (el) el.textContent = formatDisplay(val, isRupiah).replace(/<[^>]*>/g, '');
        });

        const gtEl = document.getElementById('dse-grand-total');
        if (gtEl) gtEl.textContent = formatDisplay(gTot, isRupiah).replace(/<[^>]*>/g, '');

        html += `<tr class="total-row"><td class="item-name-col">TOTAL</td><td>${formatDisplay(gA, isRupiah)}</td><td>${formatDisplay(gF, isRupiah)}</td><td>${formatDisplay(gE, isRupiah)}</td><td>${formatDisplay(gP, isRupiah)}</td><td class="total-col">${formatDisplay(gTot, isRupiah)}</td></tr>`;

        const tb = document.getElementById('cso-stock-table');
        if (tb) tb.innerHTML = rows.length ? html : `<tr><td colspan="6" class="loading-text">Tidak ada data stok DSE.</td></tr>`;
    };

    window.switchTab = tab => {
        currentTab = tab;
        document.querySelectorAll('.dse-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === tab);
        });
        const mt = document.getElementById('pcs-rupiah-table');
        const tt = document.getElementById('tambahan-dse-table');
        if (tab === 'tambahan') {
            if (mt) mt.style.display = 'none';
            if (tt) tt.style.display = 'table';
            if (tambahanData.length) renderTambahanTable(normalizeTambahan(tambahanData));
            return;
        }
        if (mt) mt.style.display = 'table';
        if (tt) tt.style.display = 'none';
        if (rawData.length) processAndRender(rawData);
    };

    window.openDownloadModal = () => { const m = document.getElementById('downloadModal'); if (m) m.style.display = 'flex'; };
    window.closeDownloadModal = () => { const m = document.getElementById('downloadModal'); if (m) m.style.display = 'none'; };

    window.executeDownload = async type => {
        window.closeDownloadModal();
        const prev = currentTab;
        if (type === 'pcs' || type === 'rupiah') { currentTab = type; if (rawData.length) processAndRender(rawData); }
        else if (type === 'tambahan' && tambahanData.length) renderTambahanTable(normalizeTambahan(tambahanData));

        const table = type === 'tambahan' ? document.getElementById('tambahan-dse-table') : document.getElementById('pcs-rupiah-table');
        if (!table) { currentTab = prev; return; }
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
            alert('Gagal membuat gambar tabel.');
        } finally {
            if (container) container.remove();
            currentTab = prev;
            window.switchTab(currentTab);
        }
    };

    window.goBack = () => { if (window.history.length > 1) window.history.back(); else window.location.href = 'dashboard.html'; };

    window.refreshDSE = async () => {
        await Promise.allSettled([fetchMaster(), fetchHarga(), fetchTambahan()]);
        if (rawData.length) {
            rawData = mergeHarga(normalizeDSE(rawData), hargaData);
            processAndRender(rawData);
        }
        if (currentTab === 'tambahan' && tambahanData.length) renderTambahanTable(normalizeTambahan(tambahanData));
    };
    window.refreshStokDSE = window.refreshDSE;

    document.addEventListener('DOMContentLoaded', async () => {
        loadCache();
        await Promise.allSettled([fetchMaster(), fetchTambahan()]);
        if (currentTab === 'tambahan' && tambahanData.length) renderTambahanTable(normalizeTambahan(tambahanData));
    });
})();
