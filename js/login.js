/* =========================================
   FIREBASE LOGIN - MC-SAGARANTEN
========================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

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

const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const togglePassword = document.getElementById('togglePassword');
const loginError = document.getElementById('loginError');
const errorText = document.getElementById('errorText');

function bersihkanNomorHP(nomor) {
    return String(nomor || '').replace(/\D/g, '').trim();
}

function tampilkanError(pesan) {
    errorText.textContent = pesan;
    loginError.classList.add('show');
}

function sembunyikanError() {
    loginError.classList.remove('show');
}

function mulaiLoading() {
    loginButton.classList.add('loading');
}

function selesaiLoading() {
    loginButton.classList.remove('loading');
}

phoneInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
    sembunyikanError();
});

passwordInput.addEventListener('input', sembunyikanError);

togglePassword.addEventListener('click', function() {
    const icon = this.querySelector('i');
    const tampil = passwordInput.type === 'password';
    passwordInput.type = tampil ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !tampil);
    icon.classList.toggle('fa-eye-slash', tampil);
    this.setAttribute('aria-label', tampil ? 'Sembunyikan password' : 'Tampilkan password');
});

function simpanDataUser(user, data) {
    localStorage.setItem('mc_sagaranten_uid', user.uid);
    localStorage.setItem('mc_sagaranten_phone', data.nomorHP || '');
    localStorage.setItem('mc_sagaranten_nama', data.nama || '');
    localStorage.setItem('mc_sagaranten_role', data.role || 'user');
    localStorage.setItem('mc_sagaranten_status', data.status || 'active');
}

function hapusDataUser() {
    ['mc_sagaranten_login', 'mc_sagaranten_uid', 'mc_sagaranten_phone', 'mc_sagaranten_nama', 'mc_sagaranten_role', 'mc_sagaranten_status', 'mc_sagaranten_login_time', 'mc_sagaranten_expire'].forEach(key => localStorage.removeItem(key));
}

async function prosesLogin() {
    sembunyikanError();
    const nomorHP = bersihkanNomorHP(phoneInput.value);
    const password = String(passwordInput.value || '');

    if (nomorHP.length < 10) {
        tampilkanError('Nomor HP tidak valid.');
        phoneInput.focus();
        return;
    }

    if (password.length < 8) {
        tampilkanError('Password minimal 8 karakter.');
        passwordInput.focus();
        return;
    }

    const email = `${nomorHP}@mc-sagaranten.local`;
    mulaiLoading();

    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        const userSnapshot = await getDoc(doc(db, 'users', user.uid));
        if (!userSnapshot.exists()) {
            await signOut(auth);
            tampilkanError('Data profil pengguna tidak ditemukan.');
            selesaiLoading();
            return;
        }

        const data = userSnapshot.data();
        const status = String(data.status || '').toLowerCase().trim();

        if (status !== 'active') {
            await signOut(auth);
            hapusDataUser();
            tampilkanError('Akun Anda sedang dinonaktifkan.');
            selesaiLoading();
            return;
        }

        const nama = data.nama || '';
        const nomor = data.nomorHP || nomorHP;
        const role = data.role || 'user';

        simpanDataUser(user, { nama, nomorHP: nomor, role, status });

        if (typeof logAktivitas === 'function') {
            try { logAktivitas('Login berhasil', 'Login | MC-SAGARANTEN'); } catch (e) { console.warn('Gagal mencatat log:', e); }
        }

        window.location.replace('dashboard.html');
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                tampilkanError('Nomor HP atau password salah.');
                break;
            case 'auth/user-not-found':
                tampilkanError('Nomor HP belum terdaftar.');
                break;
            case 'auth/invalid-email':
                tampilkanError('Nomor HP tidak valid.');
                break;
            case 'auth/user-disabled':
                tampilkanError('Akun ini telah dinonaktifkan.');
                break;
            case 'auth/too-many-requests':
                tampilkanError('Terlalu banyak percobaan login. Silakan coba lagi nanti.');
                break;
            case 'auth/network-request-failed':
                tampilkanError('Tidak dapat terhubung ke server. Periksa koneksi internet.');
                break;
            default:
                tampilkanError('Login gagal. Silakan coba lagi.');
        }
    }
    selesaiLoading();
}

loginButton.addEventListener('click', prosesLogin);
phoneInput.addEventListener('keydown', e => { if (e.key === 'Enter') passwordInput.focus(); });
passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') prosesLogin(); });

onAuthStateChanged(auth, async user => {
    if (!user) {
        hapusDataUser();
        return;
    }

    try {
        const snapshot = await getDoc(doc(db, 'users', user.uid));
        if (!snapshot.exists()) {
            await signOut(auth);
            hapusDataUser();
            return;
        }

        const data = snapshot.data();
        const status = String(data.status || '').toLowerCase().trim();

        if (status !== 'active') {
            await signOut(auth);
            hapusDataUser();
            tampilkanError('Akun Anda sedang dinonaktifkan.');
            return;
        }

        simpanDataUser(user, data);
        window.location.replace('dashboard.html');
    } catch (error) {
        console.error('AUTH CHECK ERROR:', error);
        await signOut(auth);
        hapusDataUser();
    }
});
