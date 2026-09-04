/* =========================================================
   MC-SAGARANTEN - INFO LOG (Firebase Auth + Firestore + Sheet)
========================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDxEBq9_j05HDWHHpYcvM1_AfNlZr12xYU",
    authDomain: "mc-sagaranten.firebaseapp.com",
    projectId: "mc-sagaranten",
    storageBucket: "mc-sagaranten.firebasestorage.app",
    messagingSenderId: "1055595672864",
    appId: "1:1055595672864:web:29dfeb6fed0f15673b5345"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const LOG_API_URL = 'https://script.google.com/macros/s/AKfycbwh36xToebaJtd4pB1y6y5H0zDTTQR1Ss_JnvXfD685BGf03g6c02k7AIGBy7qgfQ7naA/exec';
const USER_COLLECTION = 'users';
const MAX_LOG = 20;

let currentUser = null;
let currentProfile = null;

const $ = id => document.getElementById(id);

function escapeHTML(value){
    return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function goBack(){
    if(window.history.length > 1) window.history.back();
    else window.location.href = 'dashboard.html';
}
window.goBack = goBack;

async function getUserProfile(user){
    if(!user?.uid) return null;
    try{
        const snapshot = await getDoc(doc(db, USER_COLLECTION, user.uid));
        if(!snapshot.exists()) return null;
        const data = snapshot.data();
        return {
            uid: user.uid,
            email: user.email || '',
            nama: data.nama || data.name || user.displayName || '',
            nomorHp: data.nomorHp || data.phone || data.noHp || '',
            role: data.role || 'user',
            status: data.status || 'active'
        };
    }catch(error){
        console.error('Gagal mengambil profil Firestore:', error);
        return null;
    }
}

function userAktif(profile){
    if(!profile) return false;
    const status = String(profile.status || '').trim().toLowerCase();
    return status === 'active' || status === 'aktif' || status === '';
}

function tampilkanUserLogin(){
    if(!currentProfile) return;
    if($('setting-user-name')) $('setting-user-name').textContent = currentProfile.nama ? 'Login sebagai ' + currentProfile.nama : 'User tidak diketahui';
    if($('setting-user-badge')) $('setting-user-badge').textContent = currentProfile.status || 'active';
}

async function catatAktivitas(aktivitas = 'Membuka halaman'){
    if(!currentUser || !currentProfile) return;
    const params = new URLSearchParams({
        type: 'log',
        uid: currentUser.uid,
        email: currentProfile.email,
        nomorHp: currentProfile.nomorHp,
        nama: currentProfile.nama,
        role: currentProfile.role,
        status: currentProfile.status,
        aktivitas,
        halaman: document.title || 'Info Log Aktivitas'
    });
    try{
        await fetch(`${LOG_API_URL}?${params.toString()}`);
    }catch(error){
        console.error('Gagal mengirim log:', error);
    }
}

async function countVisitorOncePerDay(){
    if(!currentUser || !currentProfile) return;
    const today = new Date().toISOString().slice(0,10);
    const visitorKey = `mc_log_visitor_${currentUser.uid}`;
    if(localStorage.getItem(visitorKey) === today) return;

    const params = new URLSearchParams({
        type: 'visitor',
        uid: currentUser.uid,
        email: currentProfile.email,
        nomorHp: currentProfile.nomorHp,
        nama: currentProfile.nama,
        role: currentProfile.role,
        status: currentProfile.status,
        halaman: document.title || 'Info Log Aktivitas'
    });
    try{
        await fetch(`${LOG_API_URL}?${params.toString()}`);
        localStorage.setItem(visitorKey, today);
    }catch(error){
        console.error('Visitor log error:', error);
    }
}

async function loadLog(){
    try{
        const response = await fetch(`${LOG_API_URL}?type=logs`);
        if(!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const data = JSON.parse(await response.text());
        if(data.success === false) throw new Error(data.message || 'API error');

        let logs = [];
        if(Array.isArray(data.logs)) logs = data.logs;
        else if(data.data && Array.isArray(data.data.logs)) logs = data.data.logs;
        else if(Array.isArray(data.rows)) logs = data.rows;
        else if(Array.isArray(data)) logs = data;

        let totalVisitor = Number(data.stats?.totalVisitor || 0);
        let totalDownload = Number(data.stats?.totalDownload || 0);

        if(!data.stats){
            totalVisitor = 0;
            totalDownload = 0;
            logs.forEach(row => {
                const akt = String(row.Aktivitas || row.aktivitas || row.Aksi || row.aksi || '').toLowerCase();
                if(akt.includes('visitor') || akt.includes('pengunjung')) totalVisitor++;
                if(akt.includes('download') || akt.includes('unduh')) totalDownload++;
            });
        }

        if($('totalVisitor')) $('totalVisitor').textContent = totalVisitor;
        if($('totalDownload')) $('totalDownload').textContent = totalDownload;

        logs.sort((a,b) => {
            const dateA = new Date(a.Waktu || a.waktu || a.Timestamp || a.timestamp || 0);
            const dateB = new Date(b.Waktu || b.waktu || b.Timestamp || b.timestamp || 0);
            return dateB - dateA;
        });

        const today = new Date().toISOString().slice(0,10);
        const todayLogs = logs.filter(row => {
            const waktu = row.Waktu || row.waktu || row.Timestamp || row.timestamp || '';
            if(!waktu) return false;
            const date = new Date(waktu);
            return !isNaN(date) && date.toISOString().slice(0,10) === today;
        });

        if($('todayLogCount')) $('todayLogCount').textContent = todayLogs.length;
        if($('lastUpdate')) $('lastUpdate').textContent = logs.length ? (logs[0].Waktu || logs[0].waktu || logs[0].Timestamp || logs[0].timestamp || '-') : '-';

        renderLogs(logs);
    }catch(error){
        console.error('LOAD LOG ERROR:', error);
        if($('logBody')) $('logBody').innerHTML = `<tr><td colspan="3" class="empty-state">Gagal memuat data log</td></tr>`;
    }
}

function renderLogs(logs){
    const body = $('logBody');
    if(!body) return;
    if(!logs.length){
        body.innerHTML = `<tr><td colspan="3" class="empty-state">Belum ada log aktivitas</td></tr>`;
        return;
    }
    body.innerHTML = logs.slice(0, MAX_LOG).map(row => {
        const waktu = row.Waktu || row.waktu || row.Timestamp || row.timestamp || '-';
        const user = row.Nama || row.nama || row.User || row.user || row.NomorHp || row.nomorHp || '-';
        const aktivitas = row.Aktivitas || row.aktivitas || row.Aksi || row.aksi || '-';
        const halaman = row.Halaman || row.halaman || '-';
        return `
            <tr>
                <td>${escapeHTML(waktu)}</td>
                <td>
                    <div>${escapeHTML(user)}</div>
                    <div style="font-size:10px; color:#64748b; margin-top:3px;">${escapeHTML(aktivitas)}</div>
                </td>
                <td>${escapeHTML(halaman)}</td>
            </tr>
        `;
    }).join('');
}

function initializeInfoLog(){
    onAuthStateChanged(auth, async user => {
        if(!user){
            window.location.replace('login.html');
            return;
        }
        currentUser = user;
        currentProfile = await getUserProfile(user);

        if(!currentProfile){
            alert('Profil pengguna tidak ditemukan.');
            return;
        }
        if(!userAktif(currentProfile)){
            alert('Akun Anda tidak aktif.');
            window.location.replace('login.html');
            return;
        }

        tampilkanUserLogin();
        await catatAktivitas('Membuka halaman');
        await countVisitorOncePerDay();
        await loadLog();
    }, error => {
        console.error('FIREBASE AUTH ERROR:', error);
    });
}

document.addEventListener('DOMContentLoaded', initializeInfoLog);
