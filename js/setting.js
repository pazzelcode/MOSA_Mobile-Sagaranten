if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker aktif'))
    .catch(err => console.log('SW gagal', err));
}

let deferredPrompt;

const installSection = document.getElementById('install-section');
const btnInstall = document.getElementById('btn-install');

// Deteksi apakah aplikasi sudah terinstall
window.addEventListener('appinstalled', () => {
    btnInstall.innerText = 'Terinstall';
    btnInstall.style.background = '#64748b';
    btnInstall.disabled = true;
});

// Menangkap event install PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    btnInstall.style.display = 'inline-block';
});

// Tombol install diklik
btnInstall.addEventListener('click', async () => {

    // Efek loading
    btnInstall.innerText = 'Memproses...';
    btnInstall.style.opacity = '0.7';

    if (deferredPrompt) {

        // Menampilkan popup install
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

    } else {

        // Jika browser tidak mendukung
        alert('Install aplikasi belum didukung atau aplikasi sudah terinstall.');

        btnInstall.innerText = 'Install';
        btnInstall.style.opacity = '1';
    }
});
document.getElementById('clear-cache').addEventListener('click', () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Mengirim pesan ke service worker
        navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
        alert('Cache berhasil dibersihkan! Aplikasi akan dimuat ulang.');
        
        // Opsional: Reload halaman
        setTimeout(() => { window.location.reload(); }, 500);
    } else {
        alert('Service Worker tidak aktif.');
    }
});
// Fungsi untuk mengecek apakah PWA sudah terinstall/berjalan sebagai standalone
function checkAppInstalled() {
    // Jika window.matchMedia mengembalikan true untuk display-mode: standalone
    // Berarti aplikasi sudah terinstall dan dijalankan dari homescreen
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        btnInstall.innerText = 'Terinstall';
        btnInstall.style.background = '#64748b';
        btnInstall.style.cursor = 'default';
        btnInstall.disabled = true;
        return true;
    }
    return false;
}

// 1. Cek saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    checkAppInstalled();
});

// 2. Tetap pertahankan event appinstalled untuk perubahan real-time tanpa refresh
window.addEventListener('appinstalled', () => {
    btnInstall.innerText = 'Terinstall';
    btnInstall.style.background = '#64748b';
    btnInstall.disabled = true;
});

// 3. Logika beforeinstallprompt tetap seperti semula
window.addEventListener('beforeinstallprompt', (e) => {
    // Jika sudah terinstall, jangan tampilkan apa-apa
    if (checkAppInstalled()) return;
    
    e.preventDefault();
    deferredPrompt = e;
    installSection.style.display = 'flex'; // Pastikan section t
});

/* =========================================================
   IDENTITAS USER LOGIN
========================================================= */

function loadSettingUser(){

    const nameElement =
        document.getElementById(
            'setting-user-name'
        );

    const badgeElement =
        document.getElementById(
            'setting-user-badge'
        );


    if(!nameElement){

        return;

    }


    /*
       Nama sudah disimpan ketika login berhasil
    */

    const nama =
        localStorage.getItem(
            'mc_sagaranten_nama'
        );


    if(
        nama &&
        nama.trim() !== ''
    ){

        nameElement.textContent =
            'Login sebagai ' + nama;

        if(badgeElement){

            badgeElement.textContent =
                'AKTIF';

        }

    }else{

        nameElement.textContent =
            'Identitas user tidak ditemukan';

        if(badgeElement){

            badgeElement.textContent =
                'Guest';

        }

    }

}


/* =========================================================
   LOAD
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    loadSettingUser
);

function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "index.html";

    }

}