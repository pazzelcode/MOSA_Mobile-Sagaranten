/* =========================================
   FIREBASE DASHBOARD
   MC-SAGARANTEN
========================================= */

import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';

import {
    getAuth,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

import {
    getFirestore,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';


/* =========================================
   FIREBASE CONFIG
========================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyDxEBq9_j05HDWHHpYcvM1_AfNlZr12xYU",

    authDomain:
        "mc-sagaranten.firebaseapp.com",

    projectId:
        "mc-sagaranten",

    storageBucket:
        "mc-sagaranten.firebasestorage.app",

    messagingSenderId:
        "1055595672864",

    appId:
        "1:1055595672864:web:29dfeb6fed0f15673b5345"

};


/* =========================================
   INITIALIZE FIREBASE
========================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================
   DEBUG
========================================= */

console.log(
    '[Firebase Dashboard] Firebase berhasil diinisialisasi'
);

console.log(
    '[Firebase Dashboard] Project:',
    firebaseConfig.projectId
);


/* =========================================
   GLOBAL USER STATE
========================================= */

let currentUser = null;
let currentUserProfile = null;


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(auth, async (user) => {

    console.log(
        '[Firebase Dashboard] Auth State:',
        user ? user.uid : 'TIDAK LOGIN'
    );


    /* =====================================
       USER BELUM LOGIN
    ===================================== */

    if (!user) {

        currentUser = null;
        currentUserProfile = null;

        console.warn(
            '[Firebase Dashboard] Tidak ada user yang login'
        );

        return;
    }


    /* =====================================
       USER LOGIN
    ===================================== */

    currentUser = user;

    console.log(
        '[Firebase Dashboard] User login:',
        user.email
    );


    try {

        /* ================================
           AMBIL DOKUMEN USERS
        ================================= */

        const userRef =
            doc(
                db,
                'users',
                user.uid
            );

        const userSnap =
            await getDoc(userRef);


        /* ================================
           PROFILE TIDAK ADA
        ================================= */

        if (!userSnap.exists()) {

            console.error(
                '[Firebase Dashboard] Dokumen users tidak ditemukan:',
                user.uid
            );

            return;
        }


        /* ================================
           PROFILE ADA
        ================================= */

        const data =
            userSnap.data();


        currentUserProfile = {

            uid:
                user.uid,

            nama:
                data.nama || '',

            nomorHP:
                data.nomorHP || '',

            role:
                data.role || 'user',

            status:
                data.status || 'inactive'

        };


        /* ================================
           DEBUG PROFILE
        ================================= */

        console.log(
            '[Firebase Dashboard] Profile:',
            currentUserProfile
        );

        console.log(
            '[Firebase Dashboard] Role:',
            currentUserProfile.role
        );

        console.log(
            '[Firebase Dashboard] Status:',
            currentUserProfile.status
        );


        /* ================================
           CEK STATUS
        ================================= */

        if (
            currentUserProfile.status !==
            'active'
        ) {

            console.warn(
                '[Firebase Dashboard] Akun tidak aktif'
            );

            return;
        }


        /* ================================
           AKUN AKTIF
        ================================= */

        console.log(
            '[Firebase Dashboard] Akun aktif'
        );


        /* ================================
           UPDATE NAMA DASHBOARD
        ================================= */

        const userName =
            document.getElementById(
                'user-name'
            );

        if (
            userName &&
            currentUserProfile.nama
        ) {

            userName.textContent =
                currentUserProfile.nama;

        }


        /* ================================
           ADMIN MENU
        ================================= */

        const adminMenu =
            document.getElementById(
                'admin-menu'
            );

        if (adminMenu) {

            if(
    String(currentUserProfile.role)
        .toLowerCase()
        .trim() === 'admin'
){

    adminMenu.style.display = 'block';

    console.log(
        '[Firebase Dashboard] Admin menu: AKTIF'
    );

}else{

    adminMenu.style.display = 'none';

    console.log(
        '[Firebase Dashboard] Admin menu: DISEMBUNYIKAN'
    );

}

        }


    } catch (error) {

        console.error(
            '[Firebase Dashboard] Gagal mengambil profile:',
            error
        );

    }

});


/* =========================================
   GET CURRENT USER
========================================= */

export function getCurrentUser() {

    return currentUser;

}


/* =========================================
   GET CURRENT USER PROFILE
========================================= */

export function getCurrentUserProfile() {

    return currentUserProfile;

}


/* =========================================
   GET FIREBASE ID TOKEN
========================================= */

export async function getFirebaseToken() {

    if (!currentUser) {

        throw new Error(
            'User belum login'
        );

    }

    return await currentUser.getIdToken();

}


/* =========================================
   EXPORT FIREBASE INSTANCE
========================================= */

export {

    app,
    auth,
    db

};