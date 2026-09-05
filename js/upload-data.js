/* =========================================================
   MC-SAGARANTEN - UPLOAD DATA
========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDxEBq9_j05HDWHHpYcvM1_AfNlZr12xYU",
    authDomain: "mc-sagaranten.firebaseapp.com",
    projectId: "mc-sagaranten",
    storageBucket: "mc-sagaranten.firebasestorage.app",
    messagingSenderId: "1055595672864",
    appId: "1:1055595672864:web:29dfeb6fed0f15673b5345"
};

const BACKEND_URL = 'https://mc-sagaranten-backend.vercel.app';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const excelFile = document.getElementById('excelFile');
const uploadArea = document.getElementById('uploadArea');
const fileName = document.getElementById('fileName');
const uploadButton = document.getElementById('uploadButton');
const progressWrapper = document.getElementById('progressWrapper');
const progressValue = document.getElementById('progressValue');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const statusCard = document.getElementById('statusCard');

let selectedFile = null;
let currentUser = null;
let currentUserData = null;

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateUploadButton() {
    if (!uploadButton) return;
    uploadButton.disabled = !selectedFile || !currentUser;
}

function tampilkanStatus(type, title, message) {
    statusCard.className = 'status-card ' + type;
    statusCard.innerHTML = `
        <div class="status-title">${title}</div>
        <div>${message}</div>
    `;
}

function setProgress(percent, text) {
    progressValue.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
    progressText.textContent = text;
}

function setSelectedFile(file) {
    if (!file) {
        selectedFile = null;
        fileName.textContent = '';
        fileName.style.display = 'none';
        updateUploadButton();
        return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
        alert('Silakan pilih file Excel .xlsx atau .xls.');
        excelFile.value = '';
        selectedFile = null;
        fileName.textContent = '';
        fileName.style.display = 'none';
        updateUploadButton();
        return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Ukuran file maksimal 20 MB.');
        excelFile.value = '';
        selectedFile = null;
        fileName.textContent = '';
        fileName.style.display = 'none';
        updateUploadButton();
        return;
    }

    selectedFile = file;
    fileName.textContent = '📄 ' + file.name + ' (' + formatBytes(file.size) + ')';
    fileName.style.display = 'block';
    updateUploadButton();
}

uploadArea.addEventListener('click', () => { excelFile.click(); });

uploadArea.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        excelFile.click();
    }
});

excelFile.addEventListener('change', function () {
    setSelectedFile(this.files[0]);
});

uploadArea.addEventListener('dragover', event => {
    event.preventDefault();
    uploadArea.classList.add('dragging');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragging');
});

uploadArea.addEventListener('drop', event => {
    event.preventDefault();
    uploadArea.classList.remove('dragging');
    const file = event.dataTransfer.files[0];
    setSelectedFile(file);
});

async function loadCurrentUserData(user) {
    if (!user) throw new Error('Pengguna belum login.');

    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) throw new Error('Data akun tidak ditemukan.');

    const data = snapshot.data();
    const role = String(data.role || '').trim().toLowerCase();
    const status = String(data.status || '').trim().toLowerCase();

    if (role !== 'admin') throw new Error('Akses hanya untuk administrator.');
    if (status !== 'active') throw new Error('Akun Anda tidak aktif.');

    currentUserData = data;
    return data;
}

async function loadMasterInfo() {
    const status = document.getElementById('masterStatus');
    const file = document.getElementById('masterFile');
    const user = document.getElementById('masterUser');
    const time = document.getElementById('masterTime');
    const version = document.getElementById('masterVersion');

    try {
        const response = await fetch(BACKEND_URL + '/api/data/info?t=' + Date.now());
        const result = await response.json();

        if (!response.ok || !result.success) {
            status.textContent = 'Belum tersedia';
            status.style.color = '#64748b';
            return;
        }

        status.textContent = '🟢 Aktif';
        status.style.color = '#059669';
        file.textContent = result.fileName || '-';
        user.textContent = result.uploadedBy || '-';
        time.textContent = formatTanggal(result.uploadedAt);
        version.textContent = result.version || '-';
    } catch (error) {
        console.error('MASTER INFO ERROR:', error);
        status.textContent = 'Backend tidak terhubung';
        status.style.color = '#dc2626';
    }
}

function formatTanggal(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

uploadButton.addEventListener('click', async () => {
    if (!currentUser) {
        alert('Sesi login tidak ditemukan.');
        return;
    }

    if (!selectedFile) {
        alert('Silakan pilih file Excel terlebih dahulu.');
        return;
    }

    try {
        await loadCurrentUserData(currentUser);
    } catch (error) {
        alert(error.message);
        return;
    }

    const yakin = confirm(
        'Upload file ini sebagai Master Data?\n\n' +
        selectedFile.name +
        '\n\n' +
        'Semua JSON pada folder data/ yang memiliki sheet dengan nama yang sama akan diperbarui.'
    );

    if (!yakin) return;

    uploadButton.disabled = true;
    progressWrapper.style.display = 'block';
    statusCard.className = 'status-card';
    statusCard.innerHTML = '';

    setProgress(5, 'Menyiapkan upload...');

    try {
        setProgress(15, 'Memverifikasi akun Firebase...');
        const idToken = await currentUser.getIdToken(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        setProgress(25, 'Mengirim file Excel ke backend...');

        const response = await fetch(BACKEND_URL + '/api/data/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
            body: formData
        });

        setProgress(65, 'Backend sedang memproses Excel...');
        const text = await response.text();
        let result;

        try {
            result = JSON.parse(text);
        } catch {
            throw new Error('Backend mengembalikan response yang tidak valid.');
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Upload Master Data gagal.');
        }

        setProgress(90, 'Memperbarui informasi Master Data...');

        let sheetHTML = '';
        if (Array.isArray(result.sheets) && result.sheets.length) {
            sheetHTML = '<div class="sheet-list">';
            result.sheets.forEach(sheet => {
                sheetHTML += `
                    <div class="sheet-item">
                        <span class="sheet-name">📄 ${escapeHTML(sheet.name)}</span>
                        <span class="sheet-count">${Number(sheet.rows || 0).toLocaleString('id-ID')} baris</span>
                    </div>
                `;
            });
            sheetHTML += '</div>';
        }

        setProgress(100, 'Upload selesai.');
        tampilkanStatus(
            'success',
            '✓ DATA BERHASIL DIPERBARUI',
            `
            Master Data berhasil dikonversi dan dikirim ke GitHub.
            <br><br>
            <strong>File:</strong> ${escapeHTML(result.fileName || selectedFile.name)}
            <br>
            <strong>Upload oleh:</strong> ${escapeHTML(result.uploadedBy || 'Administrator')}
            <br>
            <strong>Versi:</strong> ${escapeHTML(result.version || '-')}
            <br>
            <strong>Total Sheet:</strong> ${Number(result.totalSheets || 0).toLocaleString('id-ID')}
            ${sheetHTML}
            `
        );

        excelFile.value = '';
        selectedFile = null;
        fileName.textContent = '';
        fileName.style.display = 'none';
        updateUploadButton();

        await loadMasterInfo();
    } catch (error) {
        console.error('UPLOAD ERROR:', error);
        setProgress(0, 'Upload gagal.');
        tampilkanStatus('error', '✕ UPLOAD GAGAL', escapeHTML(error.message));
    } finally {
        updateUploadButton();
    }
});

onAuthStateChanged(auth, async user => {
    console.log('UPLOAD DATA AUTH STATE:', user ? user.uid : 'BELUM LOGIN');
    currentUser = user;

    if (!user) {
        currentUserData = null;
        updateUploadButton();
        window.location.replace('index.html');
        return;
    }

    try {
        await loadCurrentUserData(user);
        console.log('✓ Admin Firebase terverifikasi');
        console.log('UID:', user.uid);
        console.log('Nama:', currentUserData.nama || currentUserData.name || '-');
        console.log('Role:', currentUserData.role);
        console.log('Status:', currentUserData.status);

        updateUploadButton();
        await loadMasterInfo();
    } catch (error) {
        console.error('AUTH ACCESS ERROR:', error);
        currentUserData = null;
        updateUploadButton();
        tampilkanStatus('error', '✕ AKSES DITOLAK', escapeHTML(error.message));
        setTimeout(() => { window.location.replace('dashboard.html'); }, 1500);
    }
});
