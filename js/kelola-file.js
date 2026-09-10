/* =========================================================
   MC-SAGARANTEN - KELOLA FILE ADMIN (OPTIMIZED FOR MOBILE)
========================================================= */
const FILE_API_URL = 'https://script.google.com/macros/s/AKfycbxqGJfpHs5StXRy3ev0pN0i6GI-iACnBZZIfsacUnWDTf7LkEOX5Iyq5j_9MFekqhsJhw/exec';
const ADMIN_PHONE = localStorage.getItem('mc_sagaranten_phone');
const ADMIN_NUMBER = '085759695969';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const fileList = document.getElementById('file-list');
const modal = document.getElementById('file-modal');
const modalTitle = document.getElementById('modal-title');
const keyInput = document.getElementById('file-key');
const namaInput = document.getElementById('file-nama');
const descInput = document.getElementById('file-desc');
const urutanInput = document.getElementById('file-urutan');
const aktifInput = document.getElementById('file-aktif');
const btnSave = document.getElementById('btn-save');
const fileUploadInput = document.getElementById('file-upload');
const fileInfoLabel = document.getElementById('current-file-status');
let currentEditKey = null;

const ALLOWED_FILE_TYPES = {
    '.xlsx': { label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    '.xls': { label: 'Excel', mime: 'application/vnd.ms-excel' },
    '.pdf': { label: 'PDF', mime: 'application/pdf' },
    '.zip': { label: 'ZIP', mime: 'application/zip' }
};

// Helper File
function getFileExtension(fileName) {
    if(!fileName) return '';
    const parts = fileName.split('.');
    return parts.length < 2 ? '' : '.' + parts.pop().toLowerCase();
}

function getFileType(fileName) {
    return ALLOWED_FILE_TYPES[getFileExtension(fileName)] || null;
}

function formatFileSize(bytes) {
    if(!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? mb.toFixed(2) + ' MB' : Math.ceil(bytes / 1024) + ' KB';
}

function getFileIcon(fileName) {
    const ext = getFileExtension(fileName);
    if(ext === '.pdf') return '<div class="file-card-icon pdf"><i class="fa-solid fa-file-pdf"></i></div>';
    if(ext === '.zip') return '<div class="file-card-icon zip"><i class="fa-solid fa-file-zipper"></i></div>';
    return '<div class="file-card-icon excel"><i class="fa-solid fa-file-excel"></i></div>';
}

function cekAdmin() {
    if(!ADMIN_PHONE || ADMIN_PHONE !== ADMIN_NUMBER){
        alert('Akses Administrator ditolak.');
        window.location.replace('dashboard.html');
        return false;
    }
    return true;
}

function showToast(message) {
    const toast = document.getElementById('file-toast');
    if(!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Load & Render Data
async function loadFilesAdmin() {
    fileList.innerHTML = '<div class="loading">Memuat daftar file...</div>';
    try {
        const response = await fetch(FILE_API_URL + '?action=get&t=' + Date.now());
        if(!response.ok) throw new Error('Server error: ' + response.status);
        const result = await response.json();
        let dataFiles = Array.isArray(result) ? result : (result.data || []);
        renderFilesAdmin(dataFiles);
    } catch(error) {
        console.error('Gagal memuat:', error);
        renderFilesAdmin([]);
    }
}

function renderFilesAdmin(files) {
    if(!files.length){
        fileList.innerHTML = '<div class="file-empty">Belum ada data file.<br>Silakan tambahkan file unduhan pertama.</div>';
        return;
    }
    files = [...files].sort((a, b) => Number(a.urutan || 1) - Number(b.urutan || 1));

    fileList.innerHTML = files.map(file => {
        const isAktif = file.aktif !== false && file.aktif !== 'false';
        const fileName = file.name || file.judul || '';
        const fileDesc = file.desc || file.deskripsi || '-';
        const fileKey = file.key || '';
        const urutan = file.urutan || 1;
        const extension = getFileExtension(fileName);
        const typeInfo = getFileType(fileName);
        const typeLabel = typeInfo ? typeInfo.label : (extension ? extension.toUpperCase() : 'FILE');

        return `
        <div class="file-card">
            <div class="file-card-top">
                ${getFileIcon(fileName)}
                <div class="file-card-info">
                    <span class="file-card-title">${escapeHtml(fileName)}</span>
                    <span class="file-card-desc">${escapeHtml(fileDesc)}</span>
                </div>
            </div>
            <div class="file-card-meta">
                <span>Key: <b>${escapeHtml(fileKey)}</b> | ${typeLabel} | Urutan: ${escapeHtml(urutan)}</span>
                <span class="file-status ${isAktif ? 'active' : 'inactive'}">${isAktif ? 'AKTIF' : 'NONAKTIF'}</span>
            </div>
            <div class="file-actions">
                <button class="file-action edit" onclick="editFile('${escapeJs(fileKey)}')">✏️ Edit</button>
                <button class="file-action toggle" onclick="toggleFile('${escapeJs(fileKey)}', ${isAktif})">${isAktif ? '⏸ Nonaktif' : '▶ Aktifkan'}</button>
                <button class="file-action delete" onclick="hapusFile('${escapeJs(fileKey)}')">🗑 Hapus</button>
            </div>
        </div>`;
    }).join('');
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeJs(value) {
    return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Gagal membaca file.'));
        reader.readAsDataURL(file);
    });
}

function validateFile(file) {
    if(!file) return { valid: false, message: 'Tidak ada file yang dipilih.' };
    const fileType = getFileType(file.name);
    if(!fileType) return { valid: false, message: 'Jenis file tidak didukung. Gunakan Excel, PDF, atau ZIP.' };
    if(file.size > MAX_FILE_SIZE) return { valid: false, message: 'Ukuran maksimal 10 MB. Ukuran saat ini: ' + formatFileSize(file.size) };
    return { valid: true, type: fileType };
}

// Event Listeners & Modals
if(fileUploadInput){
    fileUploadInput.addEventListener('change', () => {
        const file = fileUploadInput.files[0];
        if(!file) { if(fileInfoLabel) fileInfoLabel.textContent = ''; return; }
        const validation = validateFile(file);
        if(!validation.valid){
            alert(validation.message);
            fileUploadInput.value = '';
            if(fileInfoLabel) fileInfoLabel.textContent = '';
            return;
        }
        if(fileInfoLabel) fileInfoLabel.textContent = `${validation.type.label} • ${file.name} • ${formatFileSize(file.size)}`;
    });
}

const btnAddFile = document.getElementById('btn-add-file');
if(btnAddFile){
    btnAddFile.addEventListener('click', () => {
        currentEditKey = null;
        modalTitle.textContent = 'Tambah Data File';
        keyInput.value = ''; keyInput.disabled = false;
        namaInput.value = ''; descInput.value = '';
        urutanInput.value = '1'; aktifInput.checked = true;
        if(fileUploadInput) fileUploadInput.value = '';
        if(fileInfoLabel) fileInfoLabel.textContent = '';
        modal.classList.add('active');
    });
}

const btnCancel = document.getElementById('btn-cancel');
if(btnCancel) btnCancel.addEventListener('click', closeModal);
if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
function closeModal() { if(modal) modal.classList.remove('active'); }

async function editFile(key) {
    try {
        const response = await fetch(FILE_API_URL + '?action=get&t=' + Date.now());
        if(!response.ok) throw new Error('Gagal mengambil data.');
        const result = await response.json();
        const files = Array.isArray(result) ? result : (result.data || []);
        const file = files.find(item => String(item.key) === String(key));
        if(!file) throw new Error('Data file tidak ditemukan.');

        currentEditKey = key;
        modalTitle.textContent = 'Edit Data File';
        keyInput.value = file.key || '';
        keyInput.disabled = true;
        namaInput.value = file.name || file.judul || '';
        descInput.value = file.desc || file.deskripsi || '';
        urutanInput.value = file.urutan || 1;
        aktifInput.checked = file.aktif !== false && file.aktif !== 'false';
        if(fileUploadInput) fileUploadInput.value = '';
        if(fileInfoLabel){
            fileInfoLabel.textContent = file.url ? 'File lama tersimpan • Kosongkan jika tidak diganti' : '';
        }
        modal.classList.add('active');
    } catch(error) {
        console.error(error);
        alert(error.message);
    }
}

if(btnSave){
    btnSave.addEventListener('click', async () => {
        const keyVal = keyInput.value.trim().toLowerCase().replace(/\s+/g, '_');
        const namaVal = namaInput.value.trim();
        const file = fileUploadInput ? fileUploadInput.files[0] : null;

        if(!keyVal || !namaVal){ alert('Key File dan Nama File wajib diisi.'); return; }
        if(!currentEditKey && !file){ alert('Silakan pilih file yang ingin di-upload.'); return; }
        if(file){
            const validation = validateFile(file);
            if(!validation.valid){ alert(validation.message); return; }
        }

        btnSave.disabled = true;
        btnSave.textContent = 'Meng-upload file...';

        try {
            let fileData = null, fileName = '', mimeType = '';
            if(file){
                fileData = await readFileAsDataURL(file);
                fileName = file.name;
                mimeType = file.type || getFileType(file.name).mime;
            }

            const payload = {
                action: currentEditKey ? 'update' : 'create',
                adminPhone: ADMIN_PHONE,
                key: keyVal,
                name: namaVal,
                desc: descInput.value.trim(),
                urutan: Number(urutanInput.value) || 1,
                aktif: aktifInput.checked,
                fileData, fileName, mimeType
            };

            const response = await fetch(FILE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            if(!response.ok) throw new Error('Server HTTP error: ' + response.status);
            const result = await response.json();
            if(!result.success && result.status !== 'success'){
                throw new Error(result.message || 'Gagal menyimpan file.');
            }

            showToast(currentEditKey ? 'File berhasil diperbarui!' : 'File berhasil di-upload!');
            closeModal();
            currentEditKey = null;
            await loadFilesAdmin();
        } catch(error) {
            console.error('Gagal:', error);
            alert('Gagal memproses file:\n\n' + error.message);
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Simpan';
        }
    });
}

async function toggleFile(key, currentStatus) {
    if(!confirm(`Yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} file ini?`)) return;
    try {
        const response = await fetch(FILE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'toggle', adminPhone: ADMIN_PHONE, key, aktif: !currentStatus })
        });
        if(!response.ok) throw new Error('Server error');
        const result = await response.json();
        if(!result.success && result.status !== 'success') throw new Error(result.message || 'Gagal mengubah status.');
        showToast('Status file diperbarui');
        await loadFilesAdmin();
    } catch(error) {
        alert('Gagal mengubah status:\n' + error.message);
    }
}

async function hapusFile(key) {
    if(!confirm('Yakin ingin menghapus data file ini dari sistem?')) return;
    try {
        const response = await fetch(FILE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'delete', adminPhone: ADMIN_PHONE, key })
        });
        if(!response.ok) throw new Error('Server error');
        const result = await response.json();
        if(!result.success && result.status !== 'success') throw new Error(result.message || 'Gagal menghapus.');
        showToast('File berhasil dihapus');
        await loadFilesAdmin();
    } catch(error) {
        alert('Gagal menghapus file:\n' + error.message);
    }
}

if(cekAdmin()) loadFilesAdmin();
