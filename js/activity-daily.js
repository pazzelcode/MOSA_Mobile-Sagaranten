/*! MC-SAGARANTEN - ACTIVITY DAILY */
(function () {
    const ACTIVITY_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/activity-daily.json';
    const SALMO_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/penjualan-salmo.json';
    
    let lastHash = null, isFirst = true, isLoading = false, salmoMap = {};
    const $ = id => document.getElementById(id);
    const moboList = $('activity-mobo-list'), fisikList = $('activity-fisik-list'), paketList = $('activity-paket-list'), dateEl = $('activity-date');

    const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    
    const num = v => {
        if (v === null || v === undefined || v === '') return 0;
        if (typeof v === 'number') return v;
        let s = String(v).trim();
        if (!s) return 0;
        s = s.replace(/[^\d,.-]/g, '');
        if (s.includes('.') && !s.includes(',')) return Number(s.replace(/\./g, '')) || 0;
        if (s.includes(',') && !s.includes('.')) return Number(s.replace(/,/g, '')) || 0;
        return Number(s.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const rupiah = v => 'Rp ' + num(v).toLocaleString('id-ID');
    const angka = v => num(v).toLocaleString('id-ID');
    const normalizeDSE = v => String(v ?? '').trim().replace(/\s+/g, ' ').replace(/[.,]/g, '').toUpperCase();
    const namaKey = v => normalizeDSE(v);

    const DSE_ALIAS = {
        'PARHAN': 'MUHAMMAD PARHAN',
        'ENDEN': 'M ENDEN ABDUL LATIF',
        'PEBRIAN': 'PEBRIAN SAHRI RAMDANI',
        'ADIGUNA': 'ADIGUNA'
    };

    const showMsg = html => [moboList, fisikList, paketList].forEach(el => { if (el) el.innerHTML = html; });
    const tampilkanLoading = () => showMsg('<div class="activity-loading">Memuat data...</div>');
    const tampilkanKosong = () => showMsg('<div class="activity-empty">Tidak ada aktivitas hari ini.</div>');
    const tampilkanError = e => console.warn('[Activity Daily] Gagal diperbarui.', e?.message || e);

    const normalize = data => !Array.isArray(data) ? [] : data.map(i => ({
        tanggal: i['TANGGAL'] ?? i.tanggal ?? '',
        dse: i['DSE'] ?? i.dse ?? '',
        saldoMobo: num(i['SALDO MOBO'] ?? i.saldo_mobo ?? i.saldoMobo),
        sp: num(i['SP'] ?? i.sp),
        voucher: num(i['VOUCHER'] ?? i.voucher),
        totalSPVoucher: num(i['TOTAL SP VOUCHER'] ?? i.total_sp_voucher ?? i.totalSPVoucher),
        namaPaket: i['NAMA PAKET'] ?? i.nama_paket ?? i.namaPaket ?? '',
        jumlahPaket: num(i['JUMLAH PAKET'] ?? i.jumlah_paket ?? i.jumlahPaket),
        paketRupiah: num(i['PAKET RUPIAH'] ?? i.paket_rupiah ?? i.paketRupiah)
    }));

    const normalizeSalmo = data => !Array.isArray(data) ? [] : data.map(i => {
        const dse = i['Nama cso'] ?? i['NAMA CSO'] ?? i['Nama CSO'] ?? i['nama cso'] ?? i['nama_cso'] ?? i['namaCso'] ?? i['CSO'] ?? i['cso'] ?? '';
        return { dse: String(dse).trim(), saldo: num(i['Amount'] ?? i['AMOUNT'] ?? i['amount']) };
    });

    const loadSalmo = async () => {
        try {
            const res = await fetch(SALMO_URL + '?t=' + Date.now(), { cache: 'no-store' });
            if (!res.ok) throw new Error('SALMO HTTP ' + res.status);
            const json = await res.json();
            let rawData = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : []);
            const data = normalizeSalmo(rawData);
            salmoMap = {};
            data.forEach(item => {
                const key = namaKey(item.dse);
                if (!key || key === 'GRAND TOTAL') return;
                salmoMap[key] = (salmoMap[key] || 0) + num(item.saldo);
            });
            Object.keys(DSE_ALIAS).forEach(aliasName => {
                const targetName = namaKey(DSE_ALIAS[aliasName]);
                if (salmoMap[targetName] !== undefined) salmoMap[aliasName] = salmoMap[targetName];
            });
        } catch (e) {
            console.warn('[Activity Daily] Gagal memuat penjualan-salmo.json:', e?.message || e);
            salmoMap = {};
        }
    };

    const getTotalSalmoDSE = dse => {
        const key = namaKey(dse);
        if (salmoMap[key] !== undefined) return salmoMap[key];
        const target = DSE_ALIAS[key];
        if (target && salmoMap[namaKey(target)] !== undefined) return salmoMap[namaKey(target)];
        return 0;
    };

    const render = raw => {
        const data = normalize(raw);
        if (!data.length) {
            tampilkanKosong();
            if (dateEl) dateEl.textContent = 'Tidak ada data';
            return;
        }
        let tMobo = 0, tSP = 0, tVoucher = 0, tSPV = 0, tPaket = 0, tPaketRp = 0;
        data.forEach(i => {
            tMobo += i.saldoMobo;
            tSP += i.sp;
            tVoucher += i.voucher;
            tSPV += i.totalSPVoucher;
            tPaket += i.jumlahPaket;
            tPaketRp += i.paketRupiah;
        });
        if (dateEl) {
            const tgl = data[0]?.tanggal || '';
            const d = new Date(tgl);
            dateEl.textContent = !isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : tgl;
        }
        let moboHTML = '', fisikHTML = '', paketHTML = '';
        data.forEach(i => {
            const dse = esc(i.dse || '-');
            const totalSalmoDSE = getTotalSalmoDSE(i.dse);
            moboHTML += `<div class="activity-row"><div class="activity-dse"><div class="activity-dse-name">👤 ${dse}</div><div class="activity-dse-sub" style="margin-top:4px;color:#2563eb;font-weight:700;font-size:11px;">${rupiah(totalSalmoDSE)}</div><div class="activity-dse-sub" style="color:#64748b;font-size:8px;margin-top:1px;">Total Salmo</div></div><div class="activity-value"><div class="activity-value-main" style="color:#16a34a;">${rupiah(i.saldoMobo)}</div><div class="activity-value-sub">penjualan hari ini</div></div></div>`;
            fisikHTML += `<div class="activity-row activity-fisik-row"><div class="activity-dse"><div class="activity-dse-name">👤 ${dse}</div><div class="activity-dse-sub">Penjualan fisik</div></div><div class="activity-fisik-values"><div class="activity-fisik-item"><div class="activity-fisik-label">SP</div><div class="activity-fisik-number">${angka(i.sp)}</div></div><div class="activity-fisik-item"><div class="activity-fisik-label">Voucher</div><div class="activity-fisik-number">${angka(i.voucher)}</div></div><div class="activity-fisik-item" style="min-width:75px;"><div class="activity-fisik-label">Total</div><div class="activity-fisik-number" style="color:#16a34a;">${rupiah(i.totalSPVoucher)}</div></div></div></div>`;
            paketHTML += `<div class="activity-paket-row activity-row"><div class="activity-paket-top"><div class="activity-paket-name">📦 ${esc(i.namaPaket || 'Paket')}</div><div class="activity-paket-dse">${dse}</div></div><div class="activity-paket-bottom"><div class="activity-paket-pcs">${angka(i.jumlahPaket)} PAKET</div><div class="activity-paket-rupiah">${rupiah(i.paketRupiah)}</div></div></div>`;
        });
        moboHTML += `<div class="activity-total"><div class="activity-total-label">Total Saldo</div><div class="activity-total-value" style="color:#16a34a;">${rupiah(tMobo)}</div></div>`;
        fisikHTML += `<div class="activity-total activity-fisik-total"><div class="activity-total-label">Total</div><div class="activity-fisik-values"><div class="activity-fisik-item"><div class="activity-fisik-number">${angka(tSP)}</div></div><div class="activity-fisik-item"><div class="activity-fisik-number">${angka(tVoucher)}</div></div><div class="activity-fisik-item" style="min-width:75px;"><div class="activity-fisik-number" style="color:#16a34a;">${rupiah(tSPV)}</div></div></div></div>`;
        paketHTML += `<div class="activity-total"><div class="activity-total-label">Total Paket</div><div class="activity-total-value">${angka(tPaket)} PAKET · ${rupiah(tPaketRp)}</div></div>`;
        if (moboList) moboList.innerHTML = moboHTML;
        if (fisikList) fisikList.innerHTML = fisikHTML;
        if (paketList) paketList.innerHTML = paketHTML;
    };

    const loadData = async () => {
        if (isLoading) return;
        isLoading = true;
        try {
            if (isFirst) tampilkanLoading();
            const [activityRes] = await Promise.all([
                fetch(ACTIVITY_URL + '?t=' + Date.now(), { cache: 'no-store' }),
                loadSalmo()
            ]);
            if (!activityRes.ok) throw new Error('ACTIVITY HTTP ' + activityRes.status);
            const json = await activityRes.json();
            if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('Format activity-daily tidak valid');
            const data = json.data;
            if (!data.length) {
                if (lastHash !== 'EMPTY') { tampilkanKosong(); lastHash = 'EMPTY'; }
                if (dateEl) dateEl.textContent = 'Tidak ada data';
                isFirst = false;
                return;
            }
            const hash = JSON.stringify(normalize(data));
            if (!isFirst && hash === lastHash) { render(data); return; }
            lastHash = hash;
            render(data);
            isFirst = false;
        } catch (e) {
            tampilkanError(e);
        } finally {
            isLoading = false;
        }
    };

    const init = () => loadData();
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, { once: true }) : init();
})();
