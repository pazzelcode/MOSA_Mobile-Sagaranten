/* =========================================================
   KONFIGURASI API (Sesuaikan dengan Apps Script backend file Anda)
========================================================= */
const FILE_API_URL = 'https://script.google.com/macros/s/AKfycbxqGJfpHs5StXRy3ev0pN0i6GI-iACnBZZIfsacUnWDTf7LkEOX5Iyq5j_9MFekqhsJhw/exec';

const ADMIN_PHONE = localStorage.getItem('mc_sagaranten_phone');
const ADMIN_NUMBER = '085759695969';

/* =========================================================
   ELEMEN DOM
========================================================= */
const fileList = document.getElementById('file-list');
const modal = document.getElementById('file-modal');
const modalTitle = document.getElementById('modal-title');
const keyInput = document.getElementById('file-key');
const namaInput = document.getElementById('file-nama');
const descInput = document.getElementById('file-desc');
const urutanInput = document.getElementById('file-urutan');
const aktifInput = document.getElementById('file-aktif');
const btnSave = document.getElementById('btn-save');


let currentEditKey = null;

/* =========================================================
   PROTEKSI ADMIN
========================================================= */
function cekAdmin(){
    if(!ADMIN_PHONE || ADMIN_PHONE !== ADMIN_NUMBER){
        alert('Akses Administrator ditolak.');
        window.location.replace('index.html');
        return false;
    }
    return true;
}

/* =========================================================
   TOAST
========================================================= */
function showToast(message){
    const toast = document.getElementById('file-toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

/* =========================================================
   DATA DEFAULT (Agar file lama langsung muncul di admin)
========================================================= */
const defaultFiles = [];

/* =========================================================
   LOAD FILE DATA
========================================================= */
async function loadFilesAdmin(){
    fileList.innerHTML = `<div class="loading">Memuat daftar file...</div>`;

    try{
        const response = await fetch(FILE_API_URL + '?action=get&t=' + Date.now());
        const result = await response.json();

        // Ambil data dari server
        let dataFiles = Array.isArray(result) ? result : (result.data || []);

        // Jika server kosong, gunakan defaultFiles agar file lama langsung tampil di admin
        if(dataFiles.length === 0){
            dataFiles = defaultFiles;
        }

        renderFilesAdmin(dataFiles);

    }catch(error){
        console.error("Gagal memuat dari server, menggunakan data lokal:", error);
        // Jika gagal koneksi server, tetap tampilkan defaultFiles agar admin bisa kelola
        renderFilesAdmin(defaultFiles);
    }
}


/* =========================================================
   RENDER
========================================================= */
function renderFilesAdmin(files){
    if(!files.length){
        fileList.innerHTML = `
            <div class="file-empty">
                Belum ada data file.<br>Silakan tambahkan file unduhan pertama.
            </div>
        `;
        return;
    }

    // Urutkan berdasarkan urutan jika ada properti urutan
    files.sort((a, b) => Number(a.urutan || 1) - Number(b.urutan || 1));

    fileList.innerHTML = files.map(file => {
        const isAktif = file.aktif !== false && file.aktif !== 'false';
        return `
        <div class="file-card">
            <div class="file-card-top">
                <div class="file-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.5 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V7.5L14.5 2Z" fill="#107C41"/>
                        <path d="M14 2V5.5C14 6.3 14.7 7 15.5 7H19L14 2Z" fill="#33C481"/>
                        <path d="M8 11H13V13H8V11ZM8 14H16V16H8V14ZM8 17H16V19H8V17ZM14 11H16V13H14V11Z" fill="white"/>
                    </svg>
                </div>
                <div class="file-card-info">
                    <span class="file-card-title">${escapeHtml(file.name || file.judul)}</span>
                    <span class="file-card-desc">${escapeHtml(file.desc || file.deskripsi || '-')}</span>
                </div>
            </div>

            <div class="file-card-meta">
                <span>Key: <b>${file.key}</b> | Urutan: ${file.urutan || 1}</span>
                <span class="file-status ${isAktif ? 'active' : 'inactive'}">
                    ${isAktif ? 'AKTIF' : 'NONAKTIF'}
                </span>
            </div>

            <div class="file-actions">
                <button class="file-action edit" onclick="editFile('${file.key}')">✏️ Edit</button>
                <button class="file-action toggle" onclick="toggleFile('${file.key}', ${isAktif})">
                    ${isAktif ? '⏸ Nonaktif' : '▶ Aktifkan'}
                </button>
                <button class="file-action delete" onclick="hapusFile('${file.key}')">🗑 Hapus</button>
            </div>
        </div>
        `;
    }).join('');
}

/* =========================================================
   ESCAPE HTML
========================================================= */
function escapeHtml(value){
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* =========================================================
   MODAL CONTROLS
========================================================= */
document.getElementById('btn-add-file').addEventListener('click', () => {
    currentEditKey = null;
    modalTitle.textContent = 'Tambah Data File';
    keyInput.value = '';
    keyInput.disabled = false;
    namaInput.value = '';
    descInput.value = '';
    urutanInput.value = '1';
    aktifInput.checked = true;
    
    // Reset input file upload
    if(fileUploadInput) fileUploadInput.value = '';
    if(fileInfoLabel) fileInfoLabel.textContent = '';

    modal.classList.add('active');
});


document.getElementById('btn-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
});

function closeModal(){
    modal.classList.remove('active');
}

// Tambahkan variabel elemen file upload
const fileUploadInput = document.getElementById('file-upload');
const fileInfoLabel = document.getElementById('current-file-status');

// Fungsi bantu membaca file ke Base64
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Saat tombol Edit diklik
async function editFile(key){
    try{
        const response = await fetch(FILE_API_URL + '?action=get&t=' + Date.now());
        const result = await response.json();
        const files = Array.isArray(result) ? result : (result.data || []);
        
        const file = files.find(item => item.key === key);
        if(!file) throw new Error('Data file tidak ditemukan.');

        currentEditKey = key;
        modalTitle.textContent = 'Edit Data File';
        
        keyInput.value = file.key;
        keyInput.disabled = true;
        namaInput.value = file.name || file.judul || '';
        descInput.value = file.desc || file.deskripsi || '';
        urutanInput.value = file.urutan || 1;
        aktifInput.checked = file.aktif !== false && file.aktif !== 'false';
        
        fileUploadInput.value = ''; // Reset input file
        fileInfoLabel.textContent = file.url ? 'File lama tersimpan (Kosongkan jika tidak diganti)' : '';

        modal.classList.add('active');
    }catch(error){
        alert(error.message);
    }
}

// Saat tombol Simpan diklik
btnSave.addEventListener('click', async () => {
    const keyVal = keyInput.value.trim().toLowerCase().replace(/\s+/g, '_');
    const namaVal = namaInput.value.trim();
    const file = fileUploadInput.files[0];

    if(!keyVal || !namaVal){
        alert('Key File dan Nama File wajib diisi.');
        return;
    }

    // Jika membuat file baru, file wajib di-upload
    if(!currentEditKey && !file){
        alert('Silakan pilih file Excel yang ingin di-upload.');
        return;
    }

    btnSave.disabled = true;
    btnSave.textContent = 'Meng-upload file...';

    try{
        let fileData = null;
        let fileName = '';
        let mimeType = '';

        if(file){
            if(file.size > 10 * 1024 * 1024){
                throw new Error('Ukuran file maksimal 10 MB.');
            }
            fileData = await readFileAsDataURL(file);
            fileName = file.name;
            mimeType = file.type;
        }

        const payload = {
            action: currentEditKey ? 'update' : 'create',
            adminPhone: ADMIN_PHONE,
            key: keyVal,
            name: namaVal,
            desc: descInput.value.trim(),
            urutan: Number(urutanInput.value) || 1,
            aktif: aktifInput.checked,
            fileData: fileData,
            fileName: fileName,
            mimeType: mimeType
        };

        const response = await fetch(FILE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if(!result.success && result.status !== 'success') {
            throw new Error(result.message || 'Gagal meng-upload file.');
        }

        showToast('File berhasil di-upload dan disimpan!');
        closeModal();
        loadFilesAdmin();

    }catch(error){
        console.error(error);
        alert('Gagal memproses file:\n' + error.message);
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Simpan';
    }
});


/* =========================================================
   TOGGLE STATUS
========================================================= */
async function toggleFile(key, currentStatus){
    const actionText = currentStatus ? 'menonaktifkan' : 'mengaktifkan';
    if(!confirm(`Yakin ingin ${actionText} file ini?`)) return;

    try{
        const response = await fetch(FILE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'toggle',
                adminPhone: ADMIN_PHONE,
                key: key,
                aktif: !currentStatus
            })
        });

        const result = await response.json();
        showToast('Status file diperbarui');
        loadFilesAdmin();
    }catch(error){
        alert('Gagal mengubah status: ' + error.message);
    }
}

/* =========================================================
   HAPUS FILE
========================================================= */
async function hapusFile(key){
    if(!confirm('Yakin ingin menghapus data file ini dari sistem?')) return;

    try{
        const response = await fetch(FILE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'delete',
                adminPhone: ADMIN_PHONE,
                key: key
            })
        });

        const result = await response.json();
        showToast('File berhasil dihapus');
        loadFilesAdmin();
    }catch(error){
        alert('Gagal menghapus file: ' + error.message);
    }
}

/* =========================================================
   INIT
========================================================= */
if(cekAdmin()){
    loadFilesAdmin();
}
