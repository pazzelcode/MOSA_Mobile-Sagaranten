/*! MC-SAGARANTEN - STOK AKHIR DSE - GITHUB JSON */
(function () {
    const GITHUB_JSON_BASE = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/';
    const STOCK_JSON_URL = GITHUB_JSON_BASE + 'stok-barang-dse.json';
    const PRICE_JSON_URL = GITHUB_JSON_BASE + 'harga.json';
    const TAMBAHAN_JSON_URL = GITHUB_JSON_BASE + 'tambahan.json';

    let globalRawData = [], globalHargaData = [], globalTambahanData = [], currentTab = 'pcs';
    let isStockLoading = false, isHargaLoading = false, isTambahanLoading = false;

    const escapeHTML = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    
    const parseNum = v => {
        if (v === undefined || v === null || v === '' || v === '-') return null;
        if (typeof v === 'number') return Number.isFinite(v) ? v : null;
        let clean = String(v).trim().replace(/^"|"$/g, '');
        if (!clean || clean === '-') return null;
        clean = clean.replace(/Rp/gi, '').replace(/IDR/gi, '').trim();
        if (clean.includes(',')) clean = clean.split(',')[0];
        clean = clean.replace(/\./g, '').replace(/[^0-9-]/g, '');
        if (clean === '' || clean === '-') return null;
        const res = parseInt(clean, 10);
        return Number.isFinite(res) ? res : null;
    };

    const formatDisplay = (num, isRupiah = false) => {
        if (num === null || num === undefined) return '<span class="zero-val">-</span>';
        if (num === 0) return '0';
        const fmt = Number(num).toLocaleString('id-ID');
        return isRupiah ? `Rp ${fmt}` : fmt;
    };

    const getObjectValue = (row, names) => {
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

    const getNamaBarang = r => String(getObjectValue(r, ['JENIS BARANG', 'Jenis Barang', 'jenis barang', 'Nama Barang', 'nama barang', 'Barang', 'barang', 'Produk', 'produk', 'Item', 'item']) || '').trim();
    const getHarga = r => parseNum(getObjectValue(r, ['HARGA', 'Harga', 'harga', 'PRICE', 'Price', 'price']));

    const getAndi = r => parseNum(getObjectValue(r, ['ADIGUNA', 'Adiguna', 'adiguna', 'ANDI', 'Andi', 'andi']));
    const getFarhan = r => parseNum(getObjectValue(r, ['FARHAN', 'Farhan', 'farhan']));
    const getEnden = r => parseNum(getObjectValue(r, ['ENDEN', 'Enden', 'enden']));
    const getPebrian = r => parseNum(getObjectValue(r, ['PEBRIAN', 'Pebrian', 'pebrian']));

    const normalisasiData = raw => {
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

    const normalisasiDSERows = data => {
        if (!Array.isArray(data)) return [];
        return data.map(r => {
            const nama = getNamaBarang(r);
            const andi = getAndi(r), farhan = getFarhan(r), enden = getEnden(r), pebrian = getPebrian(r);
            const total = (andi || 0) + (farhan || 0) + (enden || 0) + (pebrian || 0);
            return { nama, andi, farhan, enden, pebrian, total };
        }).filter(r => r.nama !== '' && r.nama.toLowerCase() !== 'total');
    };

    const normalisasiTambahanRows = data => {
        if (!Array.isArray(data)) return [];
        return data.map(r => {
            const nama = getNamaBarang(r);
            const andi = parseNum(getObjectValue(r, ['ADIGUNA', 'Adiguna', 'adiguna', 'ANDI', 'Andi', 'andi']));
            const farhan = parseNum(getObjectValue(r, ['FARHAN', 'Farhan', 'farhan', 'PARHAN', 'Parhan', 'parhan']));
            const enden = parseNum(getObjectValue(r, ['ENDEN', 'Enden', 'enden']));
            const pebrian = parseNum(getObjectValue(r, ['PEBRIAN', 'Pebrian', 'pebrian']));
            const total = (andi || 0) + (farhan || 0) + (enden || 0) + (pebrian || 0);
            return { nama, andi, farhan, enden, pebrian, total };
        }).filter(r => r.nama !== '' && r.nama.toLowerCase() !== 'total');
    };

    const loadFromCache = () => {
        try {
            const cs = localStorage.getItem('dse_raw_data');
            if (cs) {
                const p = JSON.parse(cs);
                if (Array.isArray(p)) { globalRawData = p; processAndRender(globalRawData); }
            }
            const ch = localStorage.getItem('dse_harga_data');
            if (ch) { const p = JSON.parse(ch); if (Array.isArray(p)) globalHargaData = p; }
            const ct = localStorage.getItem('tambahan_raw_data');
            if (ct) {
                const p = JSON.parse(ct);
                if (Array.isArray(p)) { globalTambahanData = p; renderTambahanTable(normalisasiTambahanRows(globalTambahanData)); }
            }
        } catch (e) {}
    };

    const fetchHargaData = async () => {
        if (isHargaLoading) return globalHargaData;
        isHargaLoading = true;
        try {
            const res = await fetch(PRICE_JSON_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format salah');
            globalHargaData = json.data;
            localStorage.setItem('dse_harga_data', JSON.stringify(globalHargaData));
            return globalHargaData;
        } catch (e) {
            return globalHargaData;
        } finally {
            isHargaLoading = false;
        }
    };

    const mergeStokDenganHarga = (stokData, hargaData) => {
        const pMap = new Map();
        if (Array.isArray(hargaData)) {
            hargaData.forEach(i => {
                const n = getNamaBarang(i).toLowerCase().trim();
                if (n) pMap.set(n, getHarga(i) ?? 0);
            });
        }
        return stokData.map(item => {
            const n = String(item.nama || '').trim().toLowerCase();
            const harga = pMap.has(n) ? pMap.get(n) : 0;
            return { ...item, harga };
        });
    };

    const fetchMasterData = async () => {
        if (isStockLoading) return;
        isStockLoading = true;
        const ut = document.getElementById('updateTime');
        if (ut) ut.textContent = 'Update Data: Memuat...';
        try {
            const [sRes, hData] = await Promise.all([
                fetch(STOCK_JSON_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' }),
                fetchHargaData()
            ]);
            if (!sRes.ok) throw new Error('HTTP ' + sRes.status);
            const json = await sRes.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format salah');
            
            const objData = normalisasiData(json.data);
            const dseRows = normalisasiDSERows(objData);
            globalRawData = mergeStokDenganHarga(dseRows, hData);
            localStorage.setItem('dse_raw_data', JSON.stringify(globalRawData));
            processAndRender(globalRawData);

            if (ut) {
                let waktu = new Date();
                if (json.updated_at) {
                    const parsed = new Date(json.updated_at);
                    if (!isNaN(parsed.getTime())) waktu = parsed;
                }
                ut.textContent = 'Update Data: ' + waktu.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
            }
        } catch (e) {
            if (!globalRawData.length) {
                const tb = document.getElementById('cso-stock-table');
                if (tb) tb.innerHTML = `<tr><td colspan="6" class="loading-text">⚠️ Gagal memuat data DSE<br><small>${escapeHTML(e.message)}</small></td></tr>`;
            }
            if (ut) ut.textContent = 'Update Data: Gagal memuat';
        } finally {
            isStockLoading = false;
        }
    };

    const fetchTambahanData = async () => {
        if (isTambahanLoading) return;
        isTambahanLoading = true;
        try {
            const res = await fetch(TAMBAHAN_JSON_URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format salah');
            globalTambahanData = json.data;
            localStorage.setItem('tambahan_raw_data', JSON.stringify(globalTambahanData));
            renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        } catch (e) {
            if (globalTambahanData.length) renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        } finally {
            isTambahanLoading = false;
        }
    };

    const renderTambahanTable = rows => {
        const tb = document.getElementById('tambahan-table');
        if (!tb) return;
        if (!rows.length) {
            tb.innerHTML = `<tr><td colspan="6" class="loading-text">Tidak ada data tambahan.</td></tr>`;
            return;
        }
        let html = '', gA = 0, gF = 0, gE = 0, gP = 0, gT = 0;
        rows.forEach(i => {
            const a = Number(i.andi || 0), f = Number(i.farhan || 0), e = Number(i.enden || 0), p = Number(i.pebrian || 0), t = Number(i.total || 0);
            gA += a; gF += f; gE += e; gP += p; gT += t;
            html += `<tr class="data-row"><td class="item-name-col">${escapeHTML(i.nama)}</td><td>${formatDisplay(a)}</td><td>${formatDisplay(f)}</td><td>${formatDisplay(e)}</td><td>${formatDisplay(p)}</td><td class="total-col">${formatDisplay(t)}</td></tr>`;
        });
        html += `<tr class="total-row"><td class="item-name-col">TOTAL</td><td>${formatDisplay(gA)}</td><td>${formatDisplay(gF)}</td><td>${formatDisplay(gE)}</td><td>${formatDisplay(gP)}</td><td class="total-col">${formatDisplay(gT)}</td></tr>`;
        tb.innerHTML = html;

        const lbl = document.getElementById('dse-total-label');
        if (lbl) lbl.textContent = 'Total Tambahan';

        const sMap = { andi: gA, farhan: gF, enden: gE, pebrian: gP };
        Object.entries(sMap).forEach(([name, val]) => {
            const el = document.getElementById('summary-' + name);
            if (el) el.textContent = formatDisplay(val).replace(/<[^>]*>/g, '');
        });

        const ge = document.getElementById('dse-grand-total');
        if (ge) ge.textContent = formatDisplay(gT).replace(/<[^>]*>/g, '');
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
            if (n.toUpperCase() !== 'VDK') {
                const m = isRupiah ? Number(i.harga || 0) : 1;
                gA += (i.andi || 0) * m; gF += (i.farhan || 0) * m; gE += (i.enden || 0) * m; gP += (i.pebrian || 0) * m;
            }
            if (isVdk) dataVdk.push(i); else dataSp.push(i);
        });

        const makeRow = i => {
            const m = isRupiah ? Number(i.harga || 0) : 1;
            const a = i.andi != null ? i.andi * m : null;
            const f = i.farhan != null ? i.farhan * m : null;
            const e = i.enden != null ? i.enden * m : null;
            const p = i.pebrian != null ? i.pebrian * m : null;
            const t = i.total != null ? i.total * m : null;
            return `<tr class="data-row"><td class="item-name-col">${escapeHTML(i.nama)}</td><td>${formatDisplay(a, isRupiah)}</td><td>${formatDisplay(f, isRupiah)}</td><td>${formatDisplay(e, isRupiah)}</td><td>${formatDisplay(p, isRupiah)}</td><td class="total-col">${formatDisplay(t, isRupiah)}</td></tr>`;
        };

        dataSp.forEach(i => { html += makeRow(i); });
        if (dataVdk.length) {
            html += `<tr class="dse-divider"><td colspan="6"></td></tr>`;
            dataVdk.forEach(i => { html += makeRow(i); });
        }

        const gTot = gA + gF + gE + gP;
        const lbl = document.getElementById('dse-total-label');
        if (lbl) lbl.textContent = isRupiah ? 'Total Rupiah' : 'Total Stok';

        const sVals = [gA, gF, gE, gP];
        ['andi', 'farhan', 'enden', 'pebrian'].forEach((p, idx) => {
            const el = document.getElementById('summary-' + p);
            if (el) el.textContent = formatDisplay(sVals[idx], isRupiah).replace(/<[^>]*>/g, '');
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
        const mt = document.getElementById('pcs-rupiah-table'), tt = document.getElementById('tambahan-dse-table');
        if (tab === 'tambahan') {
            if (mt) mt.style.display = 'none';
            if (tt) tt.style.display = 'table';
            if (globalTambahanData.length) renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
            return;
        }
        if (mt) mt.style.display = 'table';
        if (tt) tt.style.display = 'none';
        if (globalRawData.length) processAndRender(globalRawData);
    };

    window.openDownloadModal = () => { const m = document.getElementById('downloadModal'); if (m) m.style.display = 'flex'; };
    window.closeDownloadModal = () => { const m = document.getElementById('downloadModal'); if (m) m.style.display = 'none'; };

    window.executeDownload = async type => {
        window.closeDownloadModal();
        const prev = currentTab;
        if (type === 'pcs' || type === 'rupiah') {
            currentTab = type;
            if (globalRawData.length) processAndRender(globalRawData);
        } else if (type === 'tambahan') {
            if (globalTambahanData.length) renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        }

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

    window.goBack = () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'dashboard.html';
    };

    window.refreshDSE = async () => {
        await Promise.allSettled([fetchMasterData(), fetchHargaData(), fetchTambahanData()]);
        if (globalRawData.length) {
            globalRawData = mergeStokDenganHarga(normalisasiDSERows(globalRawData), globalHargaData);
            processAndRender(globalRawData);
        }
        if (currentTab === 'tambahan' && globalTambahanData.length) {
            renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        }
    };
    window.refreshStokDSE = window.refreshDSE;

    document.addEventListener('DOMContentLoaded', async () => {
        loadFromCache();
        await Promise.allSettled([fetchMasterData(), fetchTambahanData()]);
        if (currentTab === 'tambahan' && globalTambahanData.length) {
            renderTambahanTable(normalisasiTambahanRows(globalTambahanData));
        }
    });
})();
