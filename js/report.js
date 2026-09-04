/* =========================================================
   MC-SAGARANTEN - DASHBOARD (COMPACT)
========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const firebaseConfig = {

    apiKey:
        "AIzaSyDxEBq9_j05HDWHHpYcvM1_AfNlZr12xYU",

    authDomain:
        "mc-sagaranten.firebaseapp.com",

    projectId:
        "mc-sagaranten",

    storageBucket:
        "mc-sagaranten.firebasestorage.app",

    messagingSenderId:
        "1055595672864",

    appId:
        "1:1055595672864:web:29dfeb6fed0f15673b5345"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const DASHBOARD_JSON_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/dashboard.json';

const formatRupiah = num => 'Rp ' + Number(num || 0).toLocaleString('id-ID');
const ambilAngka = val => (val === null || val === undefined || val === '') ? 0 : (typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d]/g, ''), 10) || 0);
const hitungPersentase = (val, total) => (!total || total <= 0) ? 0 : (val / total) * 100;

function tampilkanNamaPengguna(user) {
    const el = document.getElementById('user-name');
    if (!el) return;
    const nama = localStorage.getItem('mc_sagaranten_nama');
    el.textContent = (nama && nama.trim() !== '') ? nama.trim() : (user?.displayName || user?.email || '');
}

function tampilkanTanggal() {
    const el = document.getElementById('report-date');
    if (el) el.textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function updateCategory(cat, val, total, maxVal) {
    const pct = hitungPersentase(val, total);
    
    const valEl = document.getElementById('total-' + cat);
    if (valEl) { valEl.textContent = formatRupiah(val); valEl.classList.remove('loading'); }
    
    const pctEl = document.getElementById('percent-' + cat);
    if (pctEl) pctEl.textContent = pct.toFixed(1) + '%';
    
    const progEl = document.getElementById('progress-' + cat);
    if (progEl) progEl.style.width = Math.min(pct, 100) + '%';
    
    const chartEl = document.getElementById('chart-' + cat);
    if (chartEl) chartEl.style.width = (maxVal > 0 ? (val / maxVal) * 100 : 0) + '%';
    
    const chartValEl = document.getElementById('chart-value-' + cat);
    if (chartValEl) chartValEl.textContent = formatRupiah(val);
}

async function loadReport() {
    try {
        const res = await fetch(`${DASHBOARD_JSON_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const result = await res.json();
        if (!result.success || !Array.isArray(result.data) || !result.data.length) throw new Error('Format dashboard.json tidak valid.');

        const data = result.data[0];
        const salmo = ambilAngka(data['TOTAL PENJUALAN SALMO']);
        const sp = ambilAngka(data['SP DAN VOUCHER']);
        const paket = ambilAngka(data['ALL PAKET']);
        const hifi = ambilAngka(data['HIFI']);
        const total = salmo + sp + paket + hifi;

        const grandTotal = document.getElementById('grand-total');
        if (grandTotal) { grandTotal.textContent = formatRupiah(total); grandTotal.classList.remove('loading'); }

        const maxVal = Math.max(salmo, sp, paket, hifi);
        updateCategory('salmo', salmo, total, maxVal);
        updateCategory('sp', sp, total, maxVal);
        updateCategory('paket', paket, total, maxVal);
        updateCategory('hifi', hifi, total, maxVal);

        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate) {
            const waktu = result.updated_at ? new Date(result.updated_at) : new Date();
            lastUpdate.textContent = 'Update ' + waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        const dataKategori = [
            { nama: 'Salmo', nilai: salmo },
            { nama: 'SP & Voucher', nilai: sp },
            { nama: 'Paket', nilai: paket },
            { nama: 'Hifi', nilai: hifi }
        ].sort((a, b) => b.nilai - a.nilai);

        const terbesar = dataKategori[0];
        const insight = document.getElementById('insight-text');

        if (insight) {
            if (total > 0) {
                const kontribusi = hitungPersentase(terbesar.nilai, total).toFixed(1);
                insight.innerHTML = `Penjualan tertinggi saat ini adalah <strong>${terbesar.nama}</strong> sebesar <strong>${formatRupiah(terbesar.nilai)}</strong> dengan kontribusi <strong>${kontribusi}%</strong> dari total penjualan.`;
            } else {
                insight.textContent = 'Belum terdapat data penjualan yang dapat dianalisis.';
            }
        }
    } catch (err) {
        console.error('Gagal mengambil dashboard JSON:', err);
        document.querySelectorAll('.sales-value').forEach(el => { el.textContent = 'Error'; el.classList.remove('loading'); });
        const gt = document.getElementById('grand-total');
        if (gt) { gt.textContent = 'Error'; gt.classList.remove('loading'); }
    }
}

function updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem('notif_logs') || '[]'); } catch { logs = []; }
    const unread = logs.filter(l => l.read !== true).length;
    badge.style.display = unread > 0 ? 'flex' : 'none';
    badge.textContent = unread > 0 ? unread : '';
}

window.addEventListener('storage', e => { if (e.key === 'notif_logs') updateBadge(); });

onAuthStateChanged(auth, user => {
    if (!user) { window.location.replace('login.html'); return; }
    tampilkanNamaPengguna(user);
    tampilkanTanggal();
    updateBadge();
    loadReport();
});

window.goBack = function() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'dashboard.html';
};
