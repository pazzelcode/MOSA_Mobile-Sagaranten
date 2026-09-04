/*! MC-SAGARANTEN - STOK GUDANG */
(function () {
    const URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/stok-gudang.json';
    const $ = id => document.getElementById(id);

    const formatNumber = val => Number(val || 0).toLocaleString('id-ID');
    const formatUpdateDate = d => (!d || isNaN(d.getTime())) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const parseExcelNumber = v => {
        if (v === null || v === undefined || v === '') return 0;
        if (typeof v === 'number') return v;
        let str = String(v).trim();
        if (!str) return 0;
        str = str.replace(/\s/g, '').replace(/[^\d,.-]/g, '');
        if (str.includes('.') && !str.includes(',')) str = str.replace(/\./g, '');
        str = str.replace(',', '.');
        const num = Number(str);
        return Number.isFinite(num) ? num : 0;
    };

    const setText = (id, val) => { const el = $(id); if (el) el.textContent = formatNumber(val); };
    const escapeHTML = val => String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const normalisasiStockData = res => {
        if (!res || !Array.isArray(res.data)) return [];
        return res.data.map(r => {
            if (!r || typeof r !== 'object') return null;
            const nama = String(r['nama barang'] ?? r['Nama Barang'] ?? r.nama ?? '').trim();
            const segel = parseExcelNumber(r['segel'] ?? r['Segel'] ?? 0);
            const sellIn = parseExcelNumber(r['sellin'] ?? r['sell-in'] ?? r['sell in'] ?? r['Sell-In'] ?? r['Sell In'] ?? 0);
            const totalStok = parseExcelNumber(r['total stok'] ?? r['Total Stok'] ?? r.total ?? (segel + sellIn));
            return { nama, segel, sellIn, totalStok };
        }).filter(r => r && r.nama !== '');
    };

    const splitStockData = rows => {
        const sp = [], voucher = [];
        let vStarted = false;
        rows.forEach(r => {
            const nama = String(r.nama || '').trim();
            if (!nama) return;
            if (nama.toUpperCase() === 'VDK') vStarted = true;
            if (!vStarted) sp.push(r); else voucher.push(r);
        });
        return { sp, voucher };
    };

    const updateGlobalSummary = () => {
        const spSegel = parseExcelNumber($('sp-footer-segel')?.textContent);
        const spSellIn = parseExcelNumber($('sp-footer-sellin')?.textContent);
        const spTotal = spSegel + spSellIn;

        const vSegel = parseExcelNumber($('voucher-footer-segel')?.textContent);
        const vSellIn = parseExcelNumber($('voucher-footer-sellin')?.textContent);
        const vTotal = vSegel + vSellIn;

        const gSegel = spSegel + vSegel;
        const gSellIn = spSellIn + vSellIn;
        const gTotal = spTotal + vTotal;

        setText('summary-sp-segel', spSegel);
        setText('summary-sp-sellin', spSellIn);
        setText('summary-sp', spTotal);

        setText('summary-voucher-segel', vSegel);
        setText('summary-voucher-sellin', vSellIn);
        setText('summary-voucher', vTotal);

        setText('summary-grand-segel', gSegel);
        setText('summary-grand-sellin', gSellIn);
        setText('summary-grand-total', gTotal);
    };

    const showTableError = (tblId, msg) => {
        const tbody = $(tblId);
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="loading-text">⚠️ ${escapeHTML(msg)}</td></tr>`;
    };

    const renderSP = rows => {
        const tbody = $('sp-data-table');
        if (!tbody) return;
        let html = '', tSegel = 0, tSellIn = 0;
        rows.forEach(r => {
            const nama = String(r.nama || '').trim();
            if (!nama) return;
            const segel = Number(r.segel) || 0, sellIn = Number(r.sellIn) || 0, total = segel + sellIn;
            tSegel += segel; tSellIn += sellIn;
            html += `<tr><td class="item-name-col">${escapeHTML(nama)}</td><td>${formatNumber(segel)}</td><td>${formatNumber(sellIn)}</td><td>${formatNumber(total)}</td></tr>`;
        });
        if (!html) html = `<tr><td colspan="4" class="empty-text">Data SP tidak tersedia</td></tr>`;
        tbody.innerHTML = html;
        const tSP = tSegel + tSellIn;
        setText('sp-total', tSP);
        setText('sp-segel-total', tSegel);
        setText('sp-sellin-total', tSellIn);
        setText('sp-total-summary', tSP);
        setText('sp-footer-segel', tSegel);
        setText('sp-footer-sellin', tSellIn);
        setText('sp-footer-total', tSP);
        updateGlobalSummary();
    };

    const renderVoucher = rows => {
        const tbody = $('voucher-data-table');
        if (!tbody) return;
        let html = '', tSegel = 0, tSellIn = 0;
        rows.forEach(r => {
            const nama = String(r.nama || '').trim();
            if (!nama) return;
            const segel = Number(r.segel) || 0, sellIn = Number(r.sellIn) || 0, total = segel + sellIn;
            tSegel += segel; tSellIn += sellIn;
            html += `<tr><td class="item-name-col">${escapeHTML(nama)}</td><td>${formatNumber(segel)}</td><td>${formatNumber(sellIn)}</td><td>${formatNumber(total)}</td></tr>`;
        });
        if (!html) html = `<tr><td colspan="4" class="empty-text">Data Voucher tidak tersedia</td></tr>`;
        tbody.innerHTML = html;
        const tVoucher = tSegel + tSellIn;
        setText('voucher-total', tVoucher);
        setText('voucher-segel-total', tSegel);
        setText('voucher-sellin-total', tSellIn);
        setText('voucher-total-summary', tVoucher);
        setText('voucher-footer-segel', tSegel);
        setText('voucher-footer-sellin', tSellIn);
        setText('voucher-footer-total', tVoucher);
        updateGlobalSummary();
    };

    const fetchStockData = async () => {
        const updateTime = $('updateTime');
        if (updateTime) updateTime.textContent = 'Update Data: Memuat...';
        try {
            const res = await fetch(URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' });
            if (!res.ok) throw new Error('GitHub Pages JSON gagal. HTTP ' + res.status);
            const json = await res.json();
            if (!json || json.success !== true) throw new Error(json?.message || 'Format stok-gudang.json tidak valid.');
            if (!Array.isArray(json.data)) throw new Error('Property "data" bukan array.');
            if (!json.data.length) throw new Error('Data stok-gudang kosong.');

            const stockRows = normalisasiStockData(json);
            if (!stockRows.length) throw new Error('Tidak ditemukan data stok barang.');

            const sections = splitStockData(stockRows);
            renderSP(sections.sp);
            renderVoucher(sections.voucher);

            if (updateTime) {
                let waktu = new Date();
                if (json.updated_at) {
                    const parsed = new Date(json.updated_at);
                    if (!isNaN(parsed.getTime())) waktu = parsed;
                }
                updateTime.textContent = 'Update Data: ' + formatUpdateDate(waktu);
            }
        } catch (err) {
            console.error('[Stok Gudang] ❌ Gagal:', err);
            if (updateTime) updateTime.textContent = 'Update Data: Gagal memuat';
            showTableError('sp-data-table', 'Gagal mengambil data SP: ' + err.message);
            showTableError('voucher-data-table', 'Gagal mengambil data Voucher: ' + err.message);
        }
    };

    window.goBack = () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'dashboard.html';
    };

    window.refreshStokGudang = fetchStockData;
    window.loadStokGudang = fetchStockData;

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fetchStockData, { once: true }) : fetchStockData();
})();
