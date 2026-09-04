/*! MC-SAGARANTEN - PENJUALAN PAKET JUPITER */
const DATA_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/penjualan-paket-jupiter.json';
let currentLoadedData = [];

const escapeHTML = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

function parseNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    const num = Number(String(val).trim().replace(/^"|"$/g, '').replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
}

const formatRupiah = val => parseNumber(val) === 0 ? '-' : new Intl.NumberFormat('id-ID').format(parseNumber(val));

function formatDate(val) {
    if (!val) return '-';
    if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569) * 86400 * 1000));
        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('id-ID');
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('id-ID');
}

function normalisasiJupiterRows(data) {
    if (!Array.isArray(data)) return [];
    return data
        .filter(r => String(r?.['No.'] ?? '').trim().toLowerCase() !== 'total')
        .map(r => ({
            no: r?.['No.'] ?? '',
            tanggal: r?.['Tanggal'] ?? '',
            cso: String(r?.['Nama DSE'] ?? '').trim(),
            outlet: parseNumber(r?.['Outlet']),
            qty: parseNumber(r?.['Paket']),
            tagihan: parseNumber(r?.['Tagihan']),
            pembayaran: parseNumber(r?.['Pembayaran'])
        }))
        .filter(r => r.cso || r.outlet !== 0 || r.qty !== 0 || r.tagihan !== 0 || r.pembayaran !== 0);
}

const calculateTotals = rows => rows.reduce((t, r) => {
    t.outlet += r.outlet; t.qty += r.qty; t.take += r.tagihan; t.pay += r.pembayaran;
    return t;
}, { outlet: 0, qty: 0, take: 0, pay: 0 });

function updateSummary(rows) {
    const t = calculateTotals(rows);
    document.getElementById('topTotalTake').textContent = 'Rp ' + formatRupiah(t.take);
    document.getElementById('topTotalPay').textContent = 'Rp ' + formatRupiah(t.pay);
    document.getElementById('topTotalSisa').textContent = 'Rp ' + formatRupiah(t.take - t.pay);
    document.getElementById('topTotalQty').textContent = t.qty + ' Paket';
}

function populateCSOFilter(rows) {
    const filter = document.getElementById('dseFilter');
    if (!filter) return;
    filter.innerHTML = `<option value="ALL">-- TAMPILKAN SEMUA DATA --</option>`;
    [...new Set(rows.map(r => r.cso).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id')).forEach(cso => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = cso;
        filter.appendChild(opt);
    });
}

function renderTable(filterValue = 'ALL') {
    const container = document.getElementById('cardsListContainer');
    const rankingCard = document.getElementById('rankingCard');
    const totalCard = document.getElementById('totalGabunganCard');
    if (!container) return;

    if (filterValue === 'SUMMARY') {
        if (container) container.style.display = 'block';
        if (rankingCard) rankingCard.style.display = 'block';
        if (totalCard) totalCard.style.display = 'block';
        renderSummaryTable(currentLoadedData);
        return;
    }

    const isSpecificDSE = filterValue !== 'ALL';
    const rows = isSpecificDSE ? currentLoadedData.filter(r => r.cso === filterValue) : currentLoadedData;

    if (isSpecificDSE) {
        // Sembunyikan tabel dan ranking, tampilkan hanya total gabungan
        if (container) container.style.display = 'none';
        if (rankingCard) rankingCard.style.display = 'none';
        if (totalCard) {
            totalCard.style.display = 'block';
            renderTotalGabungan(rows);
        }
        return;
    }

    // Tampilkan kembali elemen jika memilih ALL
    if (container) container.style.display = 'block';
    if (rankingCard) rankingCard.style.display = 'block';
    if (totalCard) totalCard.style.display = 'block';

    const total = calculateTotals(rows);
    const body = rows.map((r, i) => {
        const sisa = r.tagihan - r.pembayaran;
        return `<tr>
            <td>${i + 1}</td><td>${formatDate(r.tanggal)}</td><td>${r.qty}</td><td>${r.outlet}</td>
            <td>${escapeHTML(r.cso || '-')}</td><td>${formatRupiah(r.tagihan)}</td><td>${formatRupiah(r.pembayaran)}</td>
            <td style="color:${sisa !== 0 ? '#dc2626' : '#16a34a'};font-weight:700;">${sisa === 0 ? 'LUNAS' : formatRupiah(sisa)}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `<div class="table-responsive"><table><thead><tr>
        <th>No</th><th>Tgl</th><th>Paket</th><th>Outlet</th><th>Nama DSE</th><th>Tagihan</th><th>Pembayaran</th><th>Sisa</th>
    </tr></thead><tbody>
        ${body || '<tr><td colspan="8">Data tidak tersedia</td></tr>'}
        <tr style="background:#f1f5f9;font-weight:700;">
            <td colspan="2">TOTAL</td><td>${total.qty}</td><td>${total.outlet}</td><td>-</td>
            <td>${formatRupiah(total.take)}</td><td>${formatRupiah(total.pay)}</td>
            <td>${total.take === total.pay ? 'LUNAS' : formatRupiah(total.take - total.pay)}</td>
        </tr>
    </tbody></table></div>`;

    renderRanking(rows);
    renderTotalGabungan(rows);
}

function renderSummaryTable(rows) {
    const container = document.getElementById('cardsListContainer');
    if (!container) return;
    const summary = {};
    rows.forEach(r => {
        if (!r.cso) return;
        if (!summary[r.cso]) summary[r.cso] = { outlet: 0, qty: 0, take: 0, pay: 0 };
        summary[r.cso].outlet += r.outlet;
        summary[r.cso].qty += r.qty;
        summary[r.cso].take += r.tagihan;
        summary[r.cso].pay += r.pembayaran;
    });

    const list = Object.entries(summary).sort((a, b) => b[1].qty - a[1].qty);
    let tOutlet = 0, tQty = 0, tTake = 0, tPay = 0;

    const body = list.map(([cso, d], i) => {
        tOutlet += d.outlet; tQty += d.qty; tTake += d.take; tPay += d.pay;
        const sisa = d.take - d.pay;
        return `<tr>
            <td>${i + 1}</td><td>${escapeHTML(cso)}</td><td>${d.outlet}</td><td>${d.qty}</td>
            <td>${formatRupiah(d.take)}</td><td>${formatRupiah(d.pay)}</td>
            <td style="color:${sisa !== 0 ? '#dc2626' : '#16a34a'};font-weight:700;">${sisa === 0 ? 'LUNAS' : formatRupiah(sisa)}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `<div class="table-responsive"><table><thead><tr>
        <th>No</th><th>Nama DSE</th><th>Outlet</th><th>Paket</th><th>Pengambilan</th><th>Pembayaran</th><th>Sisa</th>
    </tr></thead><tbody>
        ${body || '<tr><td colspan="7">Data tidak tersedia</td></tr>'}
        <tr style="background:#f1f5f9;font-weight:700;">
            <td colspan="2">TOTAL</td><td>${tOutlet}</td><td>${tQty}</td><td>${formatRupiah(tTake)}</td><td>${formatRupiah(tPay)}</td>
            <td>${tTake === tPay ? 'LUNAS' : formatRupiah(tTake - tPay)}</td>
        </tr>
    </tbody></table></div>`;
    container.style.display = 'block';
    renderRanking(rows);
    renderTotalGabungan(rows);
}

function renderRanking(rows) {
    const card = document.getElementById('rankingCard');
    if (!card) return;
    const ranking = {};
    rows.forEach(r => { if (r.cso) ranking[r.cso] = (ranking[r.cso] || 0) + r.qty; });
    const sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1]);
    let html = `<div class="ranking-header">🏆 RANKING PENJUALAN DSE</div>`;
    if (!sorted.length) html += `<div class="detail-row-item"><span class="label">Belum ada data</span></div>`;
    sorted.forEach(([cso, qty], i) => {
        const rank = i + 1;
        const badge = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
        html += `<div class="detail-row-item"><span class="label"><span class="rank-badge ${badge}">${rank}</span>${escapeHTML(cso)}</span><span class="val">${qty} Paket</span></div>`;
    });
    card.innerHTML = html;
}

function renderTotalGabungan(rows) {
    const card = document.getElementById('totalGabunganCard');
    if (!card) return;
    const total = calculateTotals(rows);
    const sisa = total.take - total.pay;
    card.innerHTML = `
        <div class="total-gabungan-header">📦 TOTAL GABUNGAN PAKET</div>
        <div class="detail-row-item"><span class="label">Total Outlet</span><span class="val">${total.outlet} Outlet</span></div>
        <div class="detail-row-item"><span class="label">Total Paket</span><span class="val">${total.qty} Paket</span></div>
        <div class="detail-row-item"><span class="label">Total Pengambilan</span><span class="val">Rp ${formatRupiah(total.take)}</span></div>
        <div class="detail-row-item"><span class="label">Total Pembayaran</span><span class="val">Rp ${formatRupiah(total.pay)}</span></div>
        <div class="detail-row-item"><span class="label">Sisa Belum Bayar</span><span class="val" style="color:${sisa !== 0 ? '#ef4444' : '#16a34a'};">${sisa === 0 ? 'LUNAS' : 'Rp ' + formatRupiah(sisa)}</span></div>
    `;
}

function processAndRender(data) {
    const rows = normalisasiJupiterRows(data);
    if (!rows.length) {
        currentLoadedData = [];
        document.getElementById('cardsListContainer').innerHTML = `<div class="table-responsive"><table><tbody><tr><td>Data Paket Jupiter tidak tersedia</td></tr></tbody></table></div>`;
        document.getElementById('rankingCard').innerHTML = '';
        document.getElementById('totalGabunganCard').innerHTML = '';
        return;
    }
    currentLoadedData = rows;
    updateSummary(rows);
    populateCSOFilter(rows);
    renderTable('ALL');
}

async function fetchMasterData() {
    const updateTime = document.getElementById('updateTime');
    try {
        if (updateTime) updateTime.textContent = 'Update Data: Memuat...';
        const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { method: 'GET', cache: 'no-store' });
        if (!res.ok) throw new Error(`Gagal mengambil JSON. HTTP ${res.status}`);
        const result = await res.json();
        if (!result || result.success !== true) throw new Error(result?.message || 'Format JSON tidak valid');
        if (!Array.isArray(result.data)) throw new Error('Properti data pada JSON bukan array');

        processAndRender(result.data);
        let updateDate = result.updated_at ? new Date(result.updated_at) : new Date();
        if (isNaN(updateDate.getTime())) updateDate = new Date();
        if (updateTime) {
            updateTime.textContent = 'Update Data: ' + updateDate.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    } catch (error) {
        document.getElementById('cardsListContainer').innerHTML = `<div class="table-responsive"><table><tbody><tr><td style="color:#dc2626;font-weight:600;padding:15px;">⚠️ Gagal memuat data: ${escapeHTML(error.message)}</td></tr></tbody></table></div>`;
        document.getElementById('rankingCard').innerHTML = '';
        document.getElementById('totalGabunganCard').innerHTML = '';
        if (updateTime) updateTime.textContent = 'Update Data: Gagal memuat';
    }
}

document.getElementById('dseFilter')?.addEventListener('change', function() { renderTable(this.value); });
document.addEventListener('DOMContentLoaded', fetchMasterData);
