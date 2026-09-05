/* =========================================================
   MC-SAGARANTEN - SETTING
========================================================= */

'use strict';

const BACKEND_API_URL = 'https://mc-sagaranten-backend.vercel.app';
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

import('https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js')
.then(async ({ initializeApp }) => {
    const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    let app;

    try {
        app = initializeApp(firebaseConfig);
    } catch (error) {
        console.warn('Firebase app mungkin sudah aktif:', error.message);
    }

    const auth = getAuth();
    window.firebaseAuth = auth;
    console.log('SETTING FIREBASE AUTH AKTIF');

    onAuthStateChanged(auth, async user => {
        if (!user) {
            console.warn('SETTING: User belum login');
            tampilkanUserOffline();
            return;
        }
        console.log('SETTING AUTH:', user.uid);
        await loadUserProfile(user);
    });
})
.catch(error => {
    console.error('SETTING FIREBASE ERROR:', error);
    tampilkanUserOffline();
});

const nameElement = document.getElementById('setting-user-name');
const badgeElement = document.getElementById('setting-user-badge');

async function loadUserProfile(user) {
    if (!user) {
        tampilkanUserOffline();
        return;
    }

    try {
        const token = await user.getIdToken();
        console.log('SETTING: Mengambil profil dari backend...');

        const response = await fetch(`${BACKEND_API_URL}/api/users/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        let result = null;
        try { result = await response.json(); } catch (error) { result = null; }

        if (!response.ok) throw new Error(result?.message || `HTTP ${response.status}`);
        if (!result || !result.success) throw new Error(result?.message || 'Profil user tidak ditemukan.');

        const profile = result.data || result.user || result.profile || {};
        const nama = profile.nama || user.displayName || 'Pengguna';
        const role = profile.role || 'user';
        const status = profile.status || 'inactive';

        if (nameElement) nameElement.textContent = 'Login sebagai ' + nama;

        if (badgeElement) {
            if (status === 'active') {
                badgeElement.textContent = formatRole(role);
                badgeElement.classList.remove('inactive');
                badgeElement.classList.add('active');
            } else {
                badgeElement.textContent = 'NONAKTIF';
                badgeElement.classList.remove('active');
                badgeElement.classList.add('inactive');
            }
        }

        localStorage.setItem('mc_sagaranten_nama', nama);
        localStorage.setItem('mc_sagaranten_role', role);
        localStorage.setItem('mc_sagaranten_status', status);

        console.log('SETTING PROFILE:', { uid: user.uid, nama, role, status });
    } catch (error) {
        console.error('SETTING PROFILE ERROR:', error);
        if (nameElement) nameElement.textContent = user.displayName || 'Pengguna';
        if (badgeElement) badgeElement.textContent = 'TERHUBUNG';
    }
}

function formatRole(role) {
    const roleMap = { admin: 'ADMIN', manager: 'MANAGER', supervisor: 'SUPERVISOR', dse: 'DSE', user: 'USER' };
    return roleMap[String(role).toLowerCase()] || String(role || 'USER').toUpperCase();
}

function tampilkanUserOffline() {
    const cachedNama = localStorage.getItem('mc_sagaranten_nama');
    const cachedRole = localStorage.getItem('mc_sagaranten_role');
    const cachedStatus = localStorage.getItem('mc_sagaranten_status');

    if (nameElement) {
        nameElement.textContent = cachedNama ? 'Login sebagai ' + cachedNama : 'Menunggu autentikasi...';
    }

    if (badgeElement) {
        if (cachedStatus === 'active') {
            badgeElement.textContent = formatRole(cachedRole);
        } else {
            badgeElement.textContent = cachedStatus ? cachedStatus.toUpperCase() : 'USER';
        }
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker aktif'))
        .catch(error => console.log('SW gagal', error));
}

let deferredPrompt = null;
const installSection = document.getElementById('install-section');
const btnInstall = document.getElementById('btn-install');

function checkAppInstalled() {
    if (!btnInstall) return false;
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        btnInstall.innerText = 'Terinstall';
        btnInstall.style.background = '#64748b';
        btnInstall.style.cursor = 'default';
        btnInstall.disabled = true;
        return true;
    }
    return false;
}

window.addEventListener('DOMContentLoaded', () => { checkAppInstalled(); });

window.addEventListener('beforeinstallprompt', event => {
    if (checkAppInstalled()) return;
    event.preventDefault();
    deferredPrompt = event;
    if (installSection) installSection.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
    if (!btnInstall) return;
    btnInstall.innerText = 'Terinstall';
    btnInstall.style.background = '#64748b';
    btnInstall.disabled = true;
    deferredPrompt = null;
});

if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
        btnInstall.innerText = 'Memproses...';
        btnInstall.style.opacity = '0.7';

        if (!deferredPrompt) {
            alert('Install aplikasi belum didukung atau aplikasi sudah terinstall.');
            btnInstall.innerText = 'Install';
            btnInstall.style.opacity = '1';
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            btnInstall.innerText = 'Berhasil Diinstall';
            btnInstall.style.background = '#64748b';
        } else {
            btnInstall.innerText = 'Install';
            btnInstall.style.opacity = '1';
        }
        deferredPrompt = null;
    });
}

const clearCacheButton = document.getElementById('clear-cache');
if (clearCacheButton) {
    clearCacheButton.addEventListener('click', () => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
            alert('Cache berhasil dibersihkan! Aplikasi akan dimuat ulang.');
            setTimeout(() => { window.location.reload(); }, 500);
        } else {
            alert('Service Worker tidak aktif.');
        }
    });
}

window.goBack = function() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'dashboard.html';
    }
};
