/* =========================================================
   MC-SAGARANTEN - KELOLA PROGRAM OUTLET
========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

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

const API_URL = 'https://mc-sagaranten-backend.vercel.app';

let programs = [];
let editId = null;
let currentUser = null;
let isLoading = false;

const programList = document.getElementById('program-list');
const modal = document.getElementById('program-modal');
const form = document.getElementById('program-form');
const modalTitle = document.getElementById('modal-title');
const fileInput = document.getElementById('gambar');
const preview = document.getElementById('form-preview');
const previewImage = document.getElementById('preview-image');
const saveButton = document.getElementById('save-program');

console.log('KELOLA PROGRAM OUTLET JS AKTIF');

async function getToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
    try {
        const token = await user.getIdToken();
        if (!token) throw new Error('Token Firebase tidak tersedia.');
        return token;
    } catch (error) {
        console.error('GET TOKEN ERROR:', error);
        throw new Error('Gagal mendapatkan sesi login Firebase.');
    }
}

async function readJSON(response) {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch (error) {
        console.error('INVALID JSON RESPONSE:', text);
        return { success: false, message: 'Server memberikan response yang tidak valid.' };
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

async function loadPrograms() {
    if (isLoading) return;
    isLoading = true;

    try {
        programList.innerHTML = '<div class="loading">Memuat program...</div>';
        const response = await fetch(`${API_URL}/api/programs`);
        const result = await readJSON(response);

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Gagal mengambil data program.');
        }

        programs = Array.isArray(result.data) ? result.data : [];
        renderPrograms();
    } catch (error) {
        console.error('LOAD PROGRAM ERROR:', error);
        programList.innerHTML = `<div class="empty">⚠️<br><br>${escapeHtml(error.message || 'Gagal memuat data.')}</div>`;
    } finally {
        isLoading = false;
    }
}

function renderPrograms() {
    if (!Array.isArray(programs) || !programs.length) {
        programList.innerHTML = '<div class="empty">🏪<br><br>Belum ada Program Outlet.</div>';
        return;
    }

    programList.innerHTML = programs.map(program => {
        return `
            <article class="program-card">
                <div class="program-preview">
                    ${program.imageUrl ? `<img src="${escapeHtml(program.imageUrl)}" alt="${escapeHtml(program.judul)}" loading="lazy">` : '<div class="image-empty">🏪</div>'}
                </div>
                <div class="program-body">
                    <div class="program-title">${escapeHtml(program.judul)}</div>
                    <div class="program-desc">${escapeHtml(program.deskripsi)}</div>
                    <div class="program-meta">
                        <span class="program-order">Urutan #${Number(program.urutan || 0)}</span>
                        <span class="status ${program.aktif ? 'active' : 'inactive'}">${program.aktif ? 'AKTIF' : 'NONAKTIF'}</span>
                    </div>
                    ${program.link && program.link !== '#' ? `<a href="${escapeHtml(program.link)}" target="_blank" rel="noopener noreferrer" class="program-link">🔗 Lihat Link</a>` : ''}
                    <div class="program-actions">
                        <button class="program-action edit" type="button" data-action="edit" data-id="${escapeHtml(program.id)}">✏️ Edit</button>
                        <button class="program-action toggle" type="button" data-action="toggle" data-id="${escapeHtml(program.id)}">${program.aktif ? '⏸ Nonaktif' : '▶ Aktifkan'}</button>
                        <button class="program-action delete" type="button" data-action="delete" data-id="${escapeHtml(program.id)}">🗑 Hapus</button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

if (programList) {
    programList.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        const id = button.dataset.id;
        if (!id) return;

        if (action === 'edit') editProgram(id);
        if (action === 'toggle') toggleProgram(id);
        if (action === 'delete') deleteProgram(id);
    });
}

function openAddModal() {
    editId = null;
    modalTitle.textContent = 'Tambah Program Outlet';
    form.reset();
    document.getElementById('aktif').checked = true;
    document.getElementById('urutan').value = programs.length + 1;
    preview.classList.remove('active');
    previewImage.src = '';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function editProgram(id) {
    const program = programs.find(item => String(item.id) === String(id));
    if (!program) {
        showToast('Program tidak ditemukan.');
        return;
    }

    editId = program.id;
    modalTitle.textContent = 'Edit Program Outlet';
    document.getElementById('judul').value = program.judul || '';
    document.getElementById('deskripsi').value = program.deskripsi || '';
    document.getElementById('link').value = program.link || '';
    document.getElementById('urutan').value = program.urutan || 1;
    document.getElementById('aktif').checked = program.aktif === true;
    fileInput.value = '';

    if (program.imageUrl) {
        previewImage.src = program.imageUrl;
        preview.classList.add('active');
    } else {
        previewImage.src = '';
        preview.classList.remove('active');
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('cancel-modal').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Format gambar harus JPG, PNG, atau WEBP.');
        this.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran gambar maksimal 5 MB.');
        this.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        previewImage.src = event.target.result;
        preview.classList.add('active');
    };
    reader.readAsDataURL(file);
});

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentUser) {
        showToast('Sesi login tidak ditemukan.');
        return;
    }

    try {
        saveButton.disabled = true;
        saveButton.textContent = 'Menyimpan...';

        const token = await getToken();
        const file = fileInput.files[0];
        const formData = new FormData();

        formData.append('judul', document.getElementById('judul').value.trim());
        formData.append('deskripsi', document.getElementById('deskripsi').value.trim());
        formData.append('link', document.getElementById('link').value.trim());
        formData.append('urutan', document.getElementById('urutan').value || 1);
        formData.append('aktif', document.getElementById('aktif').checked);
        if (file) formData.append('image', file);

        let url = editId ? `${API_URL}/api/programs/${encodeURIComponent(editId)}` : `${API_URL}/api/programs`;
        let method = editId ? 'PATCH' : 'POST';

        const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const result = await readJSON(response);

        if (response.status === 401) throw new Error('Sesi login tidak valid. Silakan login kembali.');
        if (response.status === 403) throw new Error(result.message || 'Anda tidak memiliki akses administrator.');
        if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menyimpan program outlet.');

        const judulYangDisimpan = document.getElementById('judul').value.trim();
        const isProgramBaru = editId === null;

        closeModal();
        showToast(result.message || 'Program berhasil disimpan.');
        await loadPrograms();
        await kirimNotifikasiProgram(judulYangDisimpan, isProgramBaru);
    } catch (error) {
        console.error('SAVE PROGRAM ERROR:', error);
        showToast(error.message || 'Gagal menyimpan program.');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Simpan';
    }
});

async function toggleProgram(id) {
    const program = programs.find(item => String(item.id) === String(id));
    if (!program) {
        showToast('Program tidak ditemukan.');
        return;
    }

    const action = program.aktif ? 'menonaktifkan' : 'mengaktifkan';
    if (!confirm(`Yakin ingin ${action} program "${program.judul}"?`)) return;

    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/programs/${encodeURIComponent(id)}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await readJSON(response);

        if (response.status === 401) throw new Error('Sesi login tidak valid.');
        if (response.status === 403) throw new Error(result.message || 'Anda tidak memiliki akses administrator.');
        if (!response.ok || !result.success) throw new Error(result.message || 'Gagal mengubah status program.');

        showToast(result.message);
        await loadPrograms();
    } catch (error) {
        console.error('TOGGLE PROGRAM ERROR:', error);
        showToast(error.message || 'Gagal mengubah status program.');
    }
}

async function deleteProgram(id) {
    const program = programs.find(item => String(item.id) === String(id));
    if (!program) {
        showToast('Program tidak ditemukan.');
        return;
    }

    if (!confirm(`Hapus program "${program.judul}"?\n\nGambar program juga akan dihapus dari Cloudinary.`)) return;

    try {
        const token = await getToken();
        const button = document.querySelector(`[data-action="delete"][data-id="${cssEscape(id)}"]`);
        if (button) {
            button.disabled = true;
            button.textContent = 'Menghapus...';
        }

        const response = await fetch(`${API_URL}/api/programs/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await readJSON(response);

        if (response.status === 401) throw new Error('Sesi login tidak valid.');
        if (response.status === 403) throw new Error(result.message || 'Anda tidak memiliki akses administrator.');
        if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menghapus program.');

        showToast(result.message || 'Program berhasil dihapus.');
        await loadPrograms();
    } catch (error) {
        console.error('DELETE PROGRAM ERROR:', error);
        showToast(error.message || 'Gagal menghapus program.');
    }
}

function cssEscape(value) {
    return String(value).replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

document.getElementById('add-program').addEventListener('click', openAddModal);

async function kirimNotifikasiProgram(judulProgram, isBaru) {

    const NOTIF_API_URL =
        'https://mc-sagaranten-backend.vercel.app/api/notifications';

    const notifTitle =
        isBaru
            ? 'Program Outlet Baru! 🏪'
            : 'Update Program Outlet 🏪';

    const notifMessage =
        isBaru
            ? `Ada program baru nih: "${judulProgram}". Yuk cek detailnya sekarang!`
            : `Informasi pada program "${judulProgram}" baru saja diperbarui oleh Admin.`;

    try {

        const token = await getToken();

        if (!token) {
            throw new Error(
                'Token Firebase tidak tersedia'
            );
        }

        const payloadNotif = {

            title: notifTitle,

            message: notifMessage,

            type: 'program',

            targetType: 'all',

            data: {
                url: 'program-outlet.html'
            }

        };

        const response = await fetch(
            NOTIF_API_URL,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },

                body: JSON.stringify(
                    payloadNotif
                )
            }
        );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                `HTTP ${response.status}`
            );

        }

        console.log(
            '✅ NOTIFIKASI PROGRAM TERKIRIM:',
            result
        );

    } catch (error) {

        console.error(
            '❌ GAGAL KIRIM NOTIFIKASI PROGRAM:',
            error
        );

    }
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        console.warn('SESI LOGIN TIDAK DITEMUKAN');
        window.location.replace('index.html');
        return;
    }

    currentUser = user;
    console.log('USER LOGIN:', user.uid);

    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await readJSON(response);

        if (response.status === 401) {
            alert(result.message || 'Sesi login tidak valid.');
            window.location.replace('index.html');
            return;
        }

        if (response.status === 403) {
            alert(result.message || 'Anda tidak memiliki akses administrator.');
            window.location.replace('dashboard.html');
            return;
        }

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memverifikasi akses administrator.');
        }

        console.log('AKSES ADMIN VALID');
        await loadPrograms();
    } catch (error) {
        console.error('PROGRAM AUTH ERROR:', error);
        programList.innerHTML = `<div class="empty">⚠️<br><br>${escapeHtml(error.message || 'Backend tidak dapat diakses.')}</div>`;
        showToast(error.message || 'Backend tidak dapat diakses.');
    }
});
