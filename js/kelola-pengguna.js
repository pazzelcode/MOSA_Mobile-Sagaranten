/* =========================================================
   MC-SAGARANTEN - KELOLA PENGGUNA
   User Management
   Backend : Vercel Express API
========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDxEBq9_j05HDWHHpYcvM1",
    authDomain: "mc-sagaranten.firebaseapp.com",
    projectId: "mc-sagaranten",
    storageBucket: "mc-sagaranten.firebasestorage.app",
    messagingSenderId: "1007024870526",
    appId: "1:1007024870526:web:placeholder"
};

let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    console.warn('Firebase app sudah tersedia.');
    app = undefined;
}

const auth = getAuth(app);
const API_URL = 'https://mc-sagaranten-backend.vercel.app';

let allUsers = [];
let filteredUsers = [];
let editingUser = null;
let currentToken = null;

const userList = document.getElementById('user-list');
const searchInput = document.getElementById('user-search-input');
const btnAddUser = document.getElementById('btn-add-user');
const userModal = document.getElementById('user-modal');
const detailModal = document.getElementById('detail-modal');
const modalTitle = document.getElementById('modal-title');
const userNama = document.getElementById('user-nama');
const userPhone = document.getElementById('user-phone');
const userPassword = document.getElementById('user-password');
const userRole = document.getElementById('user-role');
const userStatus = document.getElementById('user-status');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const btnDetailClose = document.getElementById('btn-detail-close');
const userDetail = document.getElementById('user-detail');
const userToast = document.getElementById('user-toast');
const totalUsers = document.getElementById('total-users');
const activeUsers = document.getElementById('active-users');
const adminUsers = document.getElementById('admin-users');

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message, type = 'success') {
    if (!userToast) return;
    userToast.textContent = message;
    userToast.className = 'user-toast show';
    userToast.style.background = type === 'error' ? '#dc2626' : '#0f172a';
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        userToast.classList.remove('show');
    }, 3000);
}

async function getToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('Sesi login tidak ditemukan.');
    return await user.getIdToken(true);
}

async function apiRequest(endpoint, options = {}) {
    const token = currentToken || await getToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            'Authorization': `Bearer ${token}`
        }
    });

    let result = null;
    try {
        result = await response.json();
    } catch {
        result = null;
    }

    if (!response.ok) {
        throw new Error(result?.message || result?.error || `Request gagal (${response.status})`);
    }
    return result;
}

function normalizeUser(user) {
    return {
        uid: user.uid || user.id || '',
        nama: user.nama || user.name || 'Tanpa Nama',
        nomorHP: user.nomorHP || user.nomorHp || user.phone || user.phoneNumber || '',
        role: String(user.role || 'user').toLowerCase(),
        status: String(user.status || 'active').toLowerCase(),
        photoURL: user.photoURL || user.photoUrl || user.photo || '',
        createdAt: user.createdAt || user.created_at || null
    };
}

async function loadUsers() {
    try {
        renderLoading();
        currentToken = await getToken();
        const result = await apiRequest('/api/users');

        if (Array.isArray(result)) {
            allUsers = result;
        } else if (Array.isArray(result?.users)) {
            allUsers = result.users;
        } else if (Array.isArray(result?.data)) {
            allUsers = result.data;
        } else {
            allUsers = [];
        }

        allUsers = allUsers.map(normalizeUser);
        updateSummary();
        applySearch();
    } catch (error) {
        console.error('❌ Gagal memuat pengguna:', error);
        userList.innerHTML = `
            <div class="loading">
                ❌ Gagal memuat pengguna.<br>
                <small>${escapeHTML(error.message)}</small>
            </div>
        `;
        showToast(error.message || 'Gagal memuat pengguna.', 'error');
    }
}

function updateSummary() {
    if (totalUsers) totalUsers.textContent = allUsers.length;
    if (activeUsers) activeUsers.textContent = allUsers.filter(user => user.status === 'active').length;
    if (adminUsers) adminUsers.textContent = allUsers.filter(user => user.role === 'admin').length;
}

function applySearch() {
    const keyword = String(searchInput?.value || '').trim().toLowerCase();
    if (!keyword) {
        filteredUsers = [...allUsers];
    } else {
        filteredUsers = allUsers.filter(user => {
            const nama = String(user.nama).toLowerCase();
            const nomor = String(user.nomorHP).toLowerCase();
            const role = String(user.role).toLowerCase();
            return nama.includes(keyword) || nomor.includes(keyword) || role.includes(keyword);
        });
    }
    renderUsers();
}

function renderLoading() {
    if (!userList) return;
    userList.innerHTML = `<div class="loading">Memuat pengguna...</div>`;
}

function renderUsers() {
    if (!userList) return;
    if (filteredUsers.length === 0) {
        userList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-users"></i>
                Tidak ada pengguna ditemukan.
            </div>
        `;
        return;
    }
    userList.innerHTML = filteredUsers.map(renderUserCard).join('');
}

function renderUserCard(user) {
    const isAdmin = user.role === 'admin';
    const isActive = user.status === 'active';
    const initial = String(user.nama || '?').trim().charAt(0).toUpperCase();

    let avatarHTML;
    if (user.photoURL) {
        avatarHTML = `
            <img src="${escapeHTML(user.photoURL)}" alt="${escapeHTML(user.nama)}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;">${escapeHTML(initial)}</span>
        `;
    } else {
        avatarHTML = `<span>${escapeHTML(initial)}</span>`;
    }

    return `
        <article class="user-card" data-uid="${escapeHTML(user.uid)}">
            <div class="user-card-main">
                <div class="user-avatar">${avatarHTML}</div>
                <div class="user-info">
                    <div class="user-name">${escapeHTML(user.nama)}</div>
                    <div class="user-phone">${escapeHTML(user.nomorHP || '-')}</div>
                    <div class="user-meta">
                        <span class="user-role">${isAdmin ? 'ADMIN' : 'USER'}</span>
                        <span class="user-status ${isActive ? 'active' : 'inactive'}">${isActive ? 'AKTIF' : 'NONAKTIF'}</span>
                    </div>
                </div>
            </div>
            <div class="user-actions">
                <button type="button" class="user-action" data-action="detail" data-uid="${escapeHTML(user.uid)}">Detail</button>
                <button type="button" class="user-action" data-action="edit" data-uid="${escapeHTML(user.uid)}">Edit</button>
                <button type="button" class="user-action delete" data-action="delete" data-uid="${escapeHTML(user.uid)}">Hapus</button>
            </div>
        </article>
    `;
}

function openAddModal() {
    editingUser = null;
    if (modalTitle) modalTitle.textContent = 'Tambah Pengguna';
    clearForm();
    if (userPassword) userPassword.required = true;
    if (btnSave) btnSave.textContent = 'Simpan';
    showModal(userModal);
}

function openEditModal(uid) {
    const user = allUsers.find(item => item.uid === uid);
    if (!user) {
        showToast('Data pengguna tidak ditemukan.', 'error');
        return;
    }
    editingUser = user;
    if (modalTitle) modalTitle.textContent = 'Edit Pengguna';
    if (userNama) userNama.value = user.nama || '';
    if (userPhone) userPhone.value = user.nomorHP || '';
    if (userPassword) {
        userPassword.value = '';
        userPassword.required = false;
        userPassword.placeholder = 'Kosongkan jika tidak diubah';
    }
    if (userRole) userRole.value = user.role === 'admin' ? 'admin' : 'user';
    if (userStatus) userStatus.value = user.status === 'inactive' ? 'inactive' : 'active';
    if (btnSave) btnSave.textContent = 'Simpan Perubahan';
    showModal(userModal);
}

function clearForm() {
    if (userNama) userNama.value = '';
    if (userPhone) userPhone.value = '';
    if (userPassword) {
        userPassword.value = '';
        userPassword.placeholder = 'Minimal 8 karakter';
    }
    if (userRole) userRole.value = 'user';
    if (userStatus) userStatus.value = 'active';
}

function showModal(modal) {
    if (modal) modal.classList.add('show');
}

function closeModal(modal) {
    if (modal) modal.classList.remove('show');
}

async function saveUser() {
    const nama = userNama?.value.trim() || '';
    const nomorHP = userPhone?.value.trim() || '';
    const password = userPassword?.value || '';
    const role = userRole?.value || 'user';
    const status = userStatus?.value || 'active';

    if (!nama) {
        showToast('Nama pengguna wajib diisi.', 'error');
        userNama?.focus();
        return;
    }

    if (!nomorHP) {
        showToast('Nomor HP wajib diisi.', 'error');
        userPhone?.focus();
        return;
    }

    const cleanPhone = nomorHP.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        showToast('Nomor HP minimal 10 digit.', 'error');
        userPhone?.focus();
        return;
    }

    if (!editingUser && password.length < 8) {
        showToast('Password minimal 8 karakter.', 'error');
        userPassword?.focus();
        return;
    }

    if (editingUser && password && password.length < 8) {
        showToast('Password baru minimal 8 karakter.', 'error');
        userPassword?.focus();
        return;
    }

    try {
        setSaveLoading(true);
        let endpoint = '/api/users';
        let method = 'POST';
        const body = { nama, nomorHP: cleanPhone, role, status };

        if (!editingUser) {
            body.password = password;
        } else {
            endpoint = `/api/users/${encodeURIComponent(editingUser.uid)}`;
            method = 'PUT';
            if (password) body.password = password;
        }

        const result = await apiRequest(endpoint, {
            method,
            body: JSON.stringify(body)
        });

        closeModal(userModal);
        const wasEditing = Boolean(editingUser);
        editingUser = null;
        showToast(result?.message || (wasEditing ? 'Pengguna berhasil diperbarui.' : 'Pengguna berhasil ditambahkan.'));
        await loadUsers();
    } catch (error) {
        console.error('❌ Gagal menyimpan pengguna:', error);
        showToast(error.message || 'Gagal menyimpan pengguna.', 'error');
    } finally {
        setSaveLoading(false);
    }
}

function setSaveLoading(loading) {
    if (!btnSave) return;
    btnSave.disabled = loading;
    if (loading) {
        btnSave.textContent = 'Menyimpan...';
    } else {
        btnSave.textContent = editingUser ? 'Simpan Perubahan' : 'Simpan';
    }
}

function openDetailModal(uid) {
    const user = allUsers.find(item => item.uid === uid);
    if (!user) {
        showToast('Data pengguna tidak ditemukan.', 'error');
        return;
    }

    const created = formatDate(user.createdAt);
    const roleText = user.role === 'admin' ? 'Administrator' : 'User';
    const statusText = user.status === 'active' ? 'Aktif' : 'Nonaktif';

    if (userDetail) {
        userDetail.innerHTML = `
            <div class="user-detail">
                <div class="user-detail-row">
                    <span class="user-detail-label">Nama</span>
                    <strong class="user-detail-value">${escapeHTML(user.nama)}</strong>
                </div>
                <div class="user-detail-row">
                    <span class="user-detail-label">Nomor HP</span>
                    <strong class="user-detail-value">${escapeHTML(user.nomorHP || '-')}</strong>
                </div>
                <div class="user-detail-row">
                    <span class="user-detail-label">Role</span>
                    <strong class="user-detail-value">${escapeHTML(roleText)}</strong>
                </div>
                <div class="user-detail-row">
                    <span class="user-detail-label">Status</span>
                    <strong class="user-detail-value">${escapeHTML(statusText)}</strong>
                </div>
                <div class="user-detail-row">
                    <span class="user-detail-label">UID</span>
                    <strong class="user-detail-value">${escapeHTML(user.uid || '-')}</strong>
                </div>
                <div class="user-detail-row">
                    <span class="user-detail-label">Dibuat</span>
                    <strong class="user-detail-value">${escapeHTML(created)}</strong>
                </div>
            </div>
        `;
    }
    showModal(detailModal);
}

async function deleteUser(uid) {
    const user = allUsers.find(item => item.uid === uid);
    if (!user) {
        showToast('Data pengguna tidak ditemukan.', 'error');
        return;
    }

    if (auth.currentUser && auth.currentUser.uid === uid) {
        showToast('Akun yang sedang digunakan tidak dapat dihapus.', 'error');
        return;
    }

    const confirmed = confirm(`Hapus pengguna "${user.nama}"?\n\nNomor HP: ${user.nomorHP}\nRole: ${user.role}\n\nTindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;

    const button = userList.querySelector(`[data-action="delete"][data-uid="${CSS.escape(uid)}"]`);
    try {
        if (button) {
            button.disabled = true;
            button.textContent = 'Menghapus...';
        }

        const result = await apiRequest(`/api/users/${encodeURIComponent(uid)}`, { method: 'DELETE' });
        showToast(result?.message || 'Pengguna berhasil dihapus.');
        await loadUsers();
    } catch (error) {
        console.error('❌ Gagal menghapus pengguna:', error);
        showToast(error.message || 'Gagal menghapus pengguna.', 'error');
        if (button) {
            button.disabled = false;
            button.textContent = 'Hapus';
        }
    }
}

function formatDate(value) {
    if (!value) return '-';
    try {
        if (typeof value === 'object' && value.seconds !== undefined) {
            return new Date(Number(value.seconds) * 1000).toLocaleString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return '-';
    }
}

if (searchInput) searchInput.addEventListener('input', applySearch);
if (btnAddUser) btnAddUser.addEventListener('click', openAddModal);
if (btnCancel) btnCancel.addEventListener('click', () => { editingUser = null; closeModal(userModal); });
if (btnSave) btnSave.addEventListener('click', saveUser);
if (btnDetailClose) btnDetailClose.addEventListener('click', () => closeModal(detailModal));

if (userList) {
    userList.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        const uid = button.dataset.uid;
        if (!uid) return;

        if (action === 'detail') openDetailModal(uid);
        else if (action === 'edit') openEditModal(uid);
        else if (action === 'delete') deleteUser(uid);
    });
}

if (userModal) userModal.addEventListener('click', event => { if (event.target === userModal) closeModal(userModal); });
if (detailModal) detailModal.addEventListener('click', event => { if (event.target === detailModal) closeModal(detailModal); });

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    closeModal(userModal);
    closeModal(detailModal);
});

onAuthStateChanged(auth, async user => {
    if (!user) {
        console.warn('⚠️ User belum login.');
        return;
    }
    try {
        currentToken = await user.getIdToken(true);
        console.log('✅ Auth pengguna aktif:', user.uid);
        await loadUsers();
    } catch (error) {
        console.error('❌ Gagal memuat sesi:', error);
        showToast('Sesi autentikasi bermasalah.', 'error');
    }
});

window.MCSagarantenUserAdmin = {
    loadUsers, openAddModal, openEditModal, openDetailModal, deleteUser,
    get users() { return allUsers; }
};

console.log('✅ MC-SAGARANTEN Kelola Pengguna aktif');
