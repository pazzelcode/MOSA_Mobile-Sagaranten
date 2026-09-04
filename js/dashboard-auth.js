/* =========================================
   MC-SAGARANTEN - DASHBOARD AUTH GUARD
========================================= */

import {
    initializeApp,
    getApps,
    getApp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
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

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function redirectKeLogin() {
    console.warn('AKSES DASHBOARD DITOLAK - BELUM LOGIN');
    window.location.replace('index.html');
}

onAuthStateChanged(auth, async user => {
    console.log('DASHBOARD AUTH:', user ? user.uid : 'BELUM LOGIN');
  window.firebaseAuth = auth;

window.dispatchEvent(
    new CustomEvent('firebase-auth-ready')
);
    if (!user) return redirectKeLogin();

    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists()) return redirectKeLogin();

        const data = snap.data();
        const status = String(data.status || '').toLowerCase().trim();

        if (status !== 'active') return redirectKeLogin();

        console.log('AKSES DASHBOARD DIIZINKAN:', { uid: user.uid, nama: data.nama || '', role: data.role || 'user', status });

        localStorage.setItem('mc_sagaranten_uid', user.uid);
        localStorage.setItem('mc_sagaranten_phone', data.nomorHP || '');
        localStorage.setItem('mc_sagaranten_nama', data.nama || '');
        localStorage.setItem('mc_sagaranten_role', data.role || 'user');
        localStorage.setItem('mc_sagaranten_status', status);
    } catch (error) {
        console.error('DASHBOARD AUTH ERROR:', error);
        redirectKeLogin();
    }
});
