/*! MC-SAGARANTEN - PENJUALAN SALMO */
(function () {
    const URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/penjualan-salmo.json';
    let salmoChart = null;

    const formatRupiah = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
    const formatRupiahSingkat = n => {
        const num = Number(n) || 0;
        if (num >= 1e9) return 'Rp ' + (num / 1e9).toFixed(num % 1e9 === 0 ? 0 : 1) + 'M';
        if (num >= 1e6) return 'Rp ' + (num / 1e6).toFixed(num % 1e6 === 0 ? 0 : 1) + 'jt';
        if (num >= 1e3) return 'Rp ' + (num / 1e3).toFixed(num % 1e3 === 0 ? 0 : 1) + 'rb';
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    const ambilAngka = v => {
        if (v == null || v === '' || v === '-') return 0;
        if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
        let t = String(v).trim().replace(/Rp/gi, '').replace(/IDR/gi, '').trim();
        t = t.replace(/\./g, '').replace(/,/g, '').replace(/[^\d-]/g, '');
        return Number(t) || 0;
    };

    const escapeHTML = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const ambilNamaDse = r => {
        if (!r) return '';
        const keys = ['Nama cso', 'Nama CSO', 'NAMA CSO', 'nama cso', 'Nama Cso', 'Nama DSE', 'Nama dse', 'NAMA DSE', 'nama dse'];
        for (const k of keys) if (r[k] != null) { const n = String(r[k]).trim(); if (n) return n; }
        for (const k of Object.keys(r)) {
            const l = k.toLowerCase().trim();
            if (l.includes('nama') && (l.includes('cso') || l.includes('dse'))) { const n = String(r[k] || '').trim(); if (n) return n; }
        }
        return '';
    };

    const ambilAmount = r => {
        if (!r) return 0;
        const keys = ['Amount', 'amount', 'AMOUNT', 'Saldo', 'saldo', 'SALDO', 'Saldo MOBO', 'saldo mobo'];
        for (const k of keys) if (r[k] != null && r[k] !== '') return ambilAngka(r[k]);
        for (const k of Object.keys(r)) {
            const l = k.toLowerCase().trim();
            if (l.includes('amount') || l.includes('saldo')) return ambilAngka(r[k]);
        }
        return 0;
    };

    const setUpdateTime = ua => {
        const el = document.getElementById('updateTime');
        if (!el) return;
        let w = new Date();
        if (ua) {
            const p = new Date(ua);
            if (!isNaN(p.getTime())) w = p;
        }
        el.textContent = 'Update Data: ' + w.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const setLoading = () => {
        const ut = document.getElementById('updateTime');
        if (ut) ut.textContent = 'Update Data: Memuat...';
        const pod = document.getElementById('podium');
        if (pod) pod.innerHTML = '<div class="loading">Memuat data...</div>';
        const rank = document.getElementById('rankingList');
        if (rank) rank.innerHTML = '<div class="loading">Memuat data...</div>';
    };

    const tampilError = msg => {
        console.error('[Penjualan Salmo]', msg);
        const ut = document.getElementById('updateTime');
        if (ut) ut.textContent = 'Update Data: Gagal memuat';
        const pod = document.getElementById('podium');
        if (pod) pod.innerHTML = `<div class="error-box"><strong>Gagal mengambil data</strong><br><br>${escapeHTML(msg)}</div>`;
        const rank = document.getElementById('rankingList');
        if (rank) rank.innerHTML = `<div class="error-box">${escapeHTML(msg)}</div>`;
    };

    const updateDataFromJSON = async () => {
        setLoading();
        try {
            const res = await fetch(URL + '?t=' + Date.now(), { method: 'GET', cache: 'no-store' });
            if (!res.ok) throw new Error('GitHub Pages HTTP ' + res.status);
            const text = await res.text();
            if (!text || !text.trim()) throw new Error('File penjualan-salmo.json kosong.');
            
            let json;
            try { json = JSON.parse(text); } catch (e) { throw new Error('Response bukan JSON valid.'); }

            if (!json || json.success !== true || !Array.isArray(json.data)) {
                throw new Error(json?.message || 'Format JSON tidak valid.');
            }

            const data = json.data.map(r => ({ ...r, __nama: ambilNamaDse(r), __amount: ambilAmount(r) }))
                .filter(r => {
                    const n = String(r.__nama || '').trim();
                    const l = n.toLowerCase();
                    const a = Number(r.__amount) || 0;
                    return n && l !== 'grand total' && l !== 'total' && a > 0;
                });

            if (!data.length) throw new Error('Tidak ada data DSE valid.');
            data.sort((a, b) => b.__amount - a.__amount);

            const total = data.reduce((s, r) => s + r.__amount, 0);

            if (document.getElementById('grandTotal')) document.getElementById('grandTotal').textContent = formatRupiah(total);
            if (document.getElementById('totalDse')) document.getElementById('totalDse').textContent = data.length + ' DSE';
            if (document.getElementById('topDse')) document.getElementById('topDse').textContent = data[0]?.__nama || '-';
            if (document.getElementById('rankingCount')) document.getElementById('rankingCount').textContent = data.length + ' DSE';

            setUpdateTime(json.updated_at);
            renderPodium(data);
            renderRanking(data, total);
            createChart(data);
        } catch (e) {
            tampilError(e.message || 'Terjadi kesalahan.');
        }
    };

    const renderPodium = data => {
        const pod = document.getElementById('podium');
        if (!pod) return;
        const top = data.slice(0, 3);
        if (!top.length) { pod.innerHTML = '<div class="loading">Tidak ada data.</div>'; return; }
        pod.innerHTML = [1, 0, 2].filter(i => top[i]).map(i => {
            const r = top[i], rank = i + 1, m = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
            return `<div class="podium-item ${rank === 1 ? 'first' : ''}"><div class="podium-medal">${m}</div><div class="podium-name">${escapeHTML(r.__nama)}</div><div class="podium-amount">${formatRupiah(r.__amount)}</div></div>`;
        }).join('');
    };

    const renderRanking = (data, total) => {
        const c = document.getElementById('rankingList');
        if (!c) return;
        c.innerHTML = '';
        data.forEach((r, idx) => {
            const nama = r.__nama || '-', amount = Number(r.__amount) || 0;
            const pct = total > 0 ? (amount / total) * 100 : 0;
            const rank = idx + 1, rc = rank <= 3 ? 'r' + rank : '';
            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.innerHTML = `<div class="ranking-top"><div class="rank-number ${rc}">${rank}</div><div class="rank-info"><div class="rank-name">${escapeHTML(nama)}</div><div class="rank-amount">${formatRupiah(amount)}</div></div><div class="rank-percent">${pct.toFixed(1)}%</div></div><div class="progress"><div class="progress-bar" style="width:${Math.min(pct, 100)}%"></div></div>`;
            c.appendChild(item);
        });
    };

    const createChart = data => {
        const canvas = document.getElementById('salmoChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (salmoChart) { salmoChart.destroy(); salmoChart = null; }
        salmoChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.map(r => r.__nama || '-'),
                datasets: [{ label: 'Saldo MOBO', data: data.map(r => r.__amount || 0), backgroundColor: '#2563eb', borderRadius: 7, borderSkipped: false }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + formatRupiah(ctx.raw) } } },
                scales: {
                    x: { beginAtZero: true, ticks: { callback: v => formatRupiahSingkat(v), font: { size: 9 } } },
                    y: { ticks: { font: { size: 10, weight: '600' } } }
                }
            }
        });
    };

   window.registerGlobalRefresh('Penjualan Salmo', updateDataFromJSON);

window.goBack = () => {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'dashboard.html';
    }
};

document.addEventListener('DOMContentLoaded', () => updateDataFromJSON(), { once: true });
})();

