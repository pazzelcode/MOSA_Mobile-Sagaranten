/* =========================================================
   MC-SAGARANTEN - KELOLA BANNER
========================================================= */

'use strict';

const BANNER_API_URL = 'http://localhost:3000/api/banners';

const bannerList = document.getElementById('banner-list');
const modal = document.getElementById('banner-modal');
const modalTitle = document.getElementById('modal-title');
const judulInput = document.getElementById('banner-judul');
const linkInput = document.getElementById('banner-link');
const urutanInput = document.getElementById('banner-urutan');
const fileInput = document.getElementById('banner-file');
const aktifInput = document.getElementById('banner-aktif');
const previewBox = document.getElementById('form-preview');
const previewImage = document.getElementById('preview-image');
const fileInfo = document.getElementById('file-info');
const btnSave = document.getElementById('btn-save');

let currentEditId = null;

async function getAuthToken() {
    if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        throw new Error('Sesi login tidak ditemukan.');
    }
    return await window.firebaseAuth.currentUser.getIdToken();
}

async function apiRequest(url, options = {}) {
    const token = await getAuthToken();
    const headers = options.headers || {};
    headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });
    let result = null;
    try { result = await response.json(); } catch { result = null; }

    if (!response.ok) {
        throw new Error(result?.message || `HTTP ${response.status}`);
    }
    return result;
}

function showToast(message) {
    const toast = document.getElementById('banner-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const FALLBACK_IMAGE = 'data:image/svg+xml;charset=utf-8,' +
    '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 150%22%3E' +
    '%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3f4f6%22/%3E' +
    '%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2214%22 font-family=%22sans-serif%22%3E' +
    'Gagal Memuat Gambar' +
    '%3C/text%3E%3C/svg%3E';

function handleImageError(img) {
    if (!img) return;
    img.onerror = null;
    img.src = FALLBACK_IMAGE;
}

async function loadBanners() {
    bannerList.innerHTML = '<div class="loading">Memuat banner...</div>';
    try {
        const result = await apiRequest(`${BANNER_API_URL}?t=${Date.now()}`, { method: 'GET', cache: 'no-store' });
        renderBanners(result.data || []);
    } catch (error) {
        console.error('LOAD BANNER ERROR:', error);
        bannerList.innerHTML = `<div class="banner-empty">Gagal memuat banner.<br><br>${escapeHtml(error.message)}</div>`;
    }
}

function renderBanners(banners) {
    if (!Array.isArray(banners)) {
        bannerList.innerHTML = '<div class="banner-empty">Data banner tidak valid.</div>';
        return;
    }

    if (!banners.length) {
        bannerList.innerHTML = '<div class="banner-empty">Belum ada banner.<br>Silakan tambahkan banner pertama.</div>';
        return;
    }

    banners.sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0));

    bannerList.innerHTML = banners.map(banner => {
        const statusAktif = banner.aktif === true;
        const imgUrl = banner.imageUrl || banner.gambar || '';
        return `
            <div class="banner-card">
                <div class="banner-preview">
                    <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(banner.judul)}" loading="lazy" decoding="async" onerror="handleImageError(this)">
                </div>
                <div class="banner-card-body">
                    <div class="banner-card-title">${escapeHtml(banner.judul)}</div>
                    <div class="banner-card-meta">
                        <div class="banner-order">Urutan: ${escapeHtml(banner.urutan)}</div>
                        <div class="banner-status ${statusAktif ? 'active' : 'inactive'}">${statusAktif ? 'AKTIF' : 'NONAKTIF'}</div>
                    </div>
                    <div class="banner-actions">
                        <button class="banner-action edit" onclick="editBanner('${escapeHtml(banner.id)}')">✏️ Edit</button>
                        <button class="banner-action toggle" onclick="toggleBanner('${escapeHtml(banner.id)}', ${statusAktif})">${statusAktif ? '⏸ Nonaktif' : '▶ Aktifkan'}</button>
                        <button class="banner-action delete" onclick="hapusBanner('${escapeHtml(banner.id)}')">🗑 Hapus</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

document.getElementById('btn-add-banner').addEventListener('click', () => {
    currentEditId = null;
    modalTitle.textContent = 'Tambah Banner';
    judulInput.value = '';
    linkInput.value = '#';
    urutanInput.value = '1';
    aktifInput.checked = true;
    fileInput.value = '';
    previewImage.removeAttribute('src');
    previewBox.classList.remove('active');
    fileInfo.textContent = 'Maksimal 5 MB.';
    modal.classList.add('active');
});

document.getElementById('btn-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

function closeModal() {
    modal.classList.remove('active');
}

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 5 MB.');
        fileInput.value = '';
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Format gambar harus JPG, PNG, atau WEBP.');
        fileInput.value = '';
        return;
    }

    fileInfo.textContent = file.name;
    const reader = new FileReader();
    reader.onload = event => {
        previewImage.src = event.target.result;
        previewBox.classList.add('active');
    };
    reader.readAsDataURL(file);
});

async function editBanner(id) {
    try {
        const result = await apiRequest(`${BANNER_API_URL}?t=${Date.now()}`, { method: 'GET', cache: 'no-store' });
        const banner = (result.data || []).find(item => String(item.id) === String(id));

        if (!banner) throw new Error('Banner tidak ditemukan.');

        currentEditId = id;
        modalTitle.textContent = 'Edit Banner';
        judulInput.value = banner.judul || '';
        linkInput.value = banner.link || '#';
        urutanInput.value = banner.urutan || 1;
        aktifInput.checked = banner.aktif === true;
        fileInput.value = '';
        previewImage.src = banner.imageUrl || banner.gambar || '';
        previewImage.onerror = function () { handleImageError(this); };
        previewBox.classList.add('active');
        fileInfo.textContent = 'Kosongkan jika tidak ingin mengganti gambar.';
        modal.classList.add('active');
    } catch (error) {
        console.error('EDIT BANNER ERROR:', error);
        alert(error.message || 'Gagal membuka banner.');
    }
}

btnSave.addEventListener('click', async () => {
    if (!judulInput.value.trim()) {
        alert('Judul banner wajib diisi.');
        judulInput.focus();
        return;
    }

    if (currentEditId === null && !fileInput.files[0]) {
        alert('Gambar banner wajib dipilih.');
        return;
    }

    btnSave.disabled = true;
    btnSave.textContent = 'Menyimpan...';

    try {
        const formData = new FormData();
        formData.append('judul', judulInput.value.trim());
        formData.append('link', linkInput.value.trim() || '#');
        formData.append('urutan', String(Number(urutanInput.value) || 1));
        formData.append('aktif', aktifInput.checked ? 'true' : 'false');

        const file = fileInput.files[0];
        if (file) {
            formData.append('image', file);
        }

        const isNew = currentEditId === null;
        let result;

        if (isNew) {
            result = await apiRequest(BANNER_API_URL, { method: 'POST', body: formData });
        } else {
            result = await apiRequest(`${BANNER_API_URL}/${encodeURIComponent(currentEditId)}`, { method: 'PATCH', body: formData });
        }

        showToast(result.message || 'Banner berhasil disimpan.');
        closeModal();
        await loadBanners();
    } catch (error) {
        console.error('SAVE BANNER ERROR:', error);
        alert(error.message || 'Gagal menyimpan banner.');
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Simpan';
    }
});

async function toggleBanner(id, currentStatus) {
    const action = currentStatus ? 'menonaktifkan' : 'mengaktifkan';
    if (!confirm(`Yakin ingin ${action} banner ini?`)) return;

    try {
        const result = await apiRequest(`${BANNER_API_URL}/${encodeURIComponent(id)}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        showToast(result.message || 'Status banner berhasil diubah.');
        await loadBanners();
    } catch (error) {
        console.error('TOGGLE BANNER ERROR:', error);
        alert(error.message || 'Gagal mengubah status banner.');
    }
}

async function hapusBanner(id) {
    if (!confirm('Yakin ingin menghapus banner ini?\n\nGambar banner juga akan dihapus dari Cloudinary.')) return;

    try {
        const result = await apiRequest(`${BANNER_API_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        showToast(result.message || 'Banner berhasil dihapus.');
        await loadBanners();
    } catch (error) {
        console.error('DELETE BANNER ERROR:', error);
        alert(error.message || 'Gagal menghapus banner.');
    }
}

async function initBannerAdmin() {
    try {
        if (!window.firebaseAuth) {
            throw new Error('Firebase Auth belum tersedia.');
        }
        await loadBanners();
    } catch (error) {
        console.error('INIT BANNER ERROR:', error);
        bannerList.innerHTML = `<div class="banner-empty">${escapeHtml(error.message)}</div>`;
    }
}

function startBannerAdmin() {

    if (
        window.firebaseAuth &&
        window.firebaseAuth.currentUser
    ) {

        initBannerAdmin();

        return;
    }


    window.addEventListener(
        'firebase-auth-ready',
        () => {

            initBannerAdmin();

        },
        { once: true }
    );

}


/* =========================================================
   INIT
========================================================= */

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        startBannerAdmin
    );

} else {

    startBannerAdmin();

}

window.editBanner = editBanner;
window.toggleBanner = toggleBanner;
window.hapusBanner = hapusBanner;
window.handleImageError = handleImageError;
