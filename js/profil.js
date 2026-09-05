import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

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

/* =========================================================
   ELEMENTS & STATE
========================================================= */
const profileName = document.getElementById('profile-name');
const namaUser = document.getElementById('nama-user');
const nomorUser = document.getElementById('nomor-user');
const statusUser = document.getElementById('status-user');
const profileRole = document.querySelector('.profile-role');
const logoutBtn = document.getElementById('logoutBtn');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const profilePhoto = document.getElementById('profilePhoto');
const profileAvatarIcon = document.getElementById('profileAvatarIcon');
const profilePhotoSmall = document.getElementById('profilePhotoSmall');
const profileSmallIcon = document.getElementById('profileSmallIcon');
const editProfileBtn = document.getElementById('editProfileBtn');

let currentUser = null;
let profileData = null;

// Load local cache immediately to prevent delay when navigating back/forth
const cachedProfile = localStorage.getItem('profileData');
if (cachedProfile) {
    try {
        profileData = JSON.parse(cachedProfile);
        renderProfile(profileData);
    } catch (e) {
        localStorage.removeItem('profileData');
    }
}

console.log('PROFIL JS AKTIF');

/* =========================================================
   FIREBASE TOKEN
========================================================= */
async function getToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('Sesi login tidak ditemukan.');
    try {
        const token = await user.getIdToken();
        if (!token) throw new Error('Token Firebase tidak tersedia.');
        return token;
    } catch (error) {
        console.error('GET TOKEN ERROR:', error);
        throw new Error('Gagal mendapatkan sesi login Firebase.');
    }
}

/* =========================================================
   LOAD PROFILE
========================================================= */
async function loadProfile() {
    try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/users/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const result = await readJSON(response);

        if (response.status === 401) { await logout(); return; }
        if (response.status === 403) { handleInactiveAccount?.(result.message || 'Akun Anda tidak aktif.'); return; }
        if (response.status === 404) { showMessage(result.message || 'Profil pengguna tidak ditemukan.'); return; }
        if (!response.ok) throw new Error(result.message || `Gagal mengambil profil. HTTP ${response.status}`);
        if (!result || !result.user) throw new Error('Data profil tidak tersedia dari backend.');

        profileData = result.user;
        localStorage.setItem('profileData', JSON.stringify(profileData));
        renderProfile(profileData);
    } catch (error) {
        console.error('LOAD PROFILE ERROR:', error);
        if (!cachedProfile) showMessage(error.message || 'Gagal memuat profil pengguna.');
    }
}

/* =========================================================
   RENDER PROFILE
========================================================= */
function renderProfile(user) {
    if (!user) return;
    const nama = String(user.nama || 'Pengguna').trim();
    const nomorHP = String(user.nomorHP || '-').trim();
    const role = String(user.role || 'user').trim().toLowerCase();
    const status = String(user.status || 'inactive').trim().toLowerCase();
    const isActive = status === 'active';

    if (profileName) profileName.textContent = nama;
    if (namaUser) namaUser.textContent = nama;
    if (nomorUser) nomorUser.textContent = nomorHP;
    if (profileRole) profileRole.textContent = role === 'admin' ? 'ADMIN • MC-SAGARANTEN' : 'USER • MC-SAGARANTEN';
    
    if (statusUser) {
        statusUser.textContent = isActive ? 'Aktif' : 'Nonaktif';
        statusUser.classList.remove('active', 'inactive');
        statusUser.classList.add(isActive ? 'active' : 'inactive');
    }

    if (user.photoURL && String(user.photoURL).trim() !== '') {
        setProfilePhoto(String(user.photoURL).trim());
    } else {
        clearProfilePhoto();
    }
}

/* =========================================================
   PHOTO FUNCTIONS
========================================================= */
function setProfilePhoto(photoURL) {
    if (!photoURL) { clearProfilePhoto(); return; }
    if (profilePhoto) { profilePhoto.src = photoURL; profilePhoto.classList.add('has-photo'); }
    if (profileAvatarIcon) profileAvatarIcon.classList.add('hide');
    if (profilePhotoSmall) { profilePhotoSmall.src = photoURL; profilePhotoSmall.classList.add('has-photo'); }
    if (profileSmallIcon) profileSmallIcon.classList.add('hide');
}

function clearProfilePhoto() {
    if (profilePhoto) { profilePhoto.removeAttribute('src'); profilePhoto.classList.remove('has-photo'); }
    if (profileAvatarIcon) profileAvatarIcon.classList.remove('hide');
    if (profilePhotoSmall) { profilePhotoSmall.removeAttribute('src'); profilePhotoSmall.classList.remove('has-photo'); }
    if (profileSmallIcon) profileSmallIcon.classList.remove('hide');
}

if (profilePhotoInput) {
    profilePhotoInput.addEventListener('change', async function() {
        const file = this.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showMessage('File harus berupa gambar.'); this.value = ''; return; }
        if (file.size > 5 * 1024 * 1024) { showMessage('Ukuran foto maksimal 5 MB.'); this.value = ''; return; }

        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('photo', file);

            const response = await fetch(`${API_URL}/api/users/me/photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await readJSON(response);

            if (response.status === 401) { await logout(); return; }
            if (response.status === 403) { handleInactiveAccount?.(result.message || 'Akun Anda tidak aktif.'); return; }
            if (!response.ok) throw new Error(result.message || 'Gagal mengupload foto profil.');
            if (!result.photoURL) throw new Error('Cloudinary tidak mengembalikan URL foto.');

            profileData.photoURL = result.photoURL;
            localStorage.setItem('profileData', JSON.stringify(profileData));
            setProfilePhoto(result.photoURL);
            showMessage('Foto profil berhasil diperbarui.');
        } catch (error) {
            console.error('UPLOAD FOTO ERROR:', error);
            showMessage(error.message || 'Gagal mengupload foto profil.');
        } finally {
            this.value = '';
        }
    });
}

/* =========================================================
   AUTH & LOGOUT
========================================================= */
async function logout() {
    try {
        localStorage.removeItem('profileData');
        await signOut(auth);
        window.location.replace('index.html');
    } catch (error) {
        console.error('LOGOUT ERROR:', error);
        showMessage('Gagal logout. Silakan coba lagi.');
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
        if (logoutBtn.disabled) return;
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'LOGOUT...';
        await logout();
        logoutBtn.disabled = false;
        logoutBtn.textContent = 'LOGOUT';
    });
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        localStorage.removeItem('profileData');
        window.location.replace('index.html');
        return;
    }
    currentUser = user;
    await loadProfile();
});

/* =========================================================
   HELPERS & NAVIGATION
========================================================= */
async function readJSON(response) {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        return { success: false, message: 'Server memberikan response yang tidak valid.' };
    }
}

function showMessage(message) {
    console.warn('PROFILE MESSAGE:', message);
    alert(message);
}

if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        window.location.href = 'edit-profil.html';
    });
}

window.goBack = function() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'dashboard.html';
    }
};
