import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';

import {
    getAuth,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';


/* =========================================================
   FIREBASE
========================================================= */

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


const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(app);


/* =========================================================
   API
========================================================= */

const API_URL =
    'https://mc-sagaranten-backend.vercel.app';


/* =========================================================
   ELEMENT
========================================================= */

const namaInput =
    document.getElementById(
        'namaInput'
    );


const nomorInput =
    document.getElementById(
        'nomorInput'
    );


const roleValue =
    document.getElementById(
        'roleValue'
    );


const statusValue =
    document.getElementById(
        'statusValue'
    );


const saveBtn =
    document.getElementById(
        'saveBtn'
    );


const cancelBtn =
    document.getElementById(
        'cancelBtn'
    );


const backBtn =
    document.getElementById(
        'backBtn'
    );


/* =========================================================
   STATE
========================================================= */

let currentUser =
    null;

let profileData =
    null;


/* =========================================================
   LOG
========================================================= */

console.log(
    'EDIT PROFIL JS AKTIF'
);


/* =========================================================
   TOKEN
========================================================= */

async function getToken(){

    const user =
        auth.currentUser;


    if(!user){

        throw new Error(
            'Sesi login tidak ditemukan.'
        );

    }


    const token =
        await user.getIdToken();


    if(!token){

        throw new Error(
            'Token Firebase tidak tersedia.'
        );

    }


    return token;

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile(){

    try{

        console.log(
            'MENGAMBIL PROFIL EDIT...'
        );


        const token =
            await getToken();


        const response =
            await fetch(
                `${API_URL}/api/users/me`,
                {

                    method:
                        'GET',

                    headers:{
                        'Authorization':
                            `Bearer ${token}`
                    }

                }
            );


        const result =
            await readJSON(
                response
            );


        console.log(
            'HASIL PROFIL EDIT:',
            response.status,
            result
        );


        if(
            response.status === 401
        ){

            alert(
                'Sesi login telah berakhir.'
            );


            window.location.replace(
                'index.html'
            );


            return;

        }


        if(
            response.status === 403
        ){

            alert(
                result.message ||
                'Akun Anda tidak aktif.'
            );


            window.location.replace(
                'profil.html'
            );


            return;

        }


        if(
            !response.ok
        ){

            throw new Error(
                result.message ||
                'Gagal mengambil profil.'
            );

        }


        if(
            !result.user
        ){

            throw new Error(
                'Data profil tidak tersedia.'
            );

        }


        profileData =
            result.user;


        renderProfile(
            profileData
        );


        console.log(
            'PROFIL EDIT BERHASIL DIMUAT'
        );

    }catch(error){

        console.error(
            'LOAD EDIT PROFILE ERROR:',
            error
        );


        alert(
            error.message ||
            'Gagal memuat profil.'
        );

    }

}


/* =========================================================
   RENDER PROFILE
========================================================= */

function renderProfile(
    user
){

    if(!user){

        return;

    }


    namaInput.value =
        user.nama || '';


    nomorInput.value =
        user.nomorHP || '';


    roleValue.textContent =
        formatRole(
            user.role
        );


    statusValue.textContent =
        formatStatus(
            user.status
        );

}


/* =========================================================
   FORMAT ROLE
========================================================= */

function formatRole(
    role
){

    return String(
        role || 'user'
    ).toUpperCase();

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
    status
){

    return String(
        status || 'inactive'
    ).toLowerCase() === 'active'
        ? 'Aktif'
        : 'Nonaktif';

}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveProfile(){

    try{

        const nama =
            String(
                namaInput.value || ''
            ).trim();


        const nomorHP =
            String(
                nomorInput.value || ''
            ).replace(
                /\D/g,
                ''
            );


        /* =========================================
           VALIDASI NAMA
        ========================================= */

        if(!nama){

            alert(
                'Nama wajib diisi.'
            );


            namaInput.focus();

            return;

        }


        if(nama.length < 2){

            alert(
                'Nama minimal 2 karakter.'
            );


            namaInput.focus();

            return;

        }


        /* =========================================
           VALIDASI NOMOR
        ========================================= */

        if(
            nomorHP.length < 10
        ){

            alert(
                'Nomor HP tidak valid.'
            );


            nomorInput.focus();

            return;

        }


        if(
            nomorHP.length > 15
        ){

            alert(
                'Nomor HP terlalu panjang.'
            );


            nomorInput.focus();

            return;

        }


        /* =========================================
           DISABLE BUTTON
        ========================================= */

        saveBtn.disabled =
            true;


        saveBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i><span>MENYIMPAN...</span>';


        console.log(
            'MENYIMPAN PROFIL...'
        );


        /* =========================================
           TOKEN
        ========================================= */

        const token =
            await getToken();


        /* =========================================
           REQUEST BACKEND
        ========================================= */

        const response =
            await fetch(
                `${API_URL}/api/users/me`,
                {

                    method:
                        'PATCH',

                    headers:{
                        'Authorization':
                            `Bearer ${token}`,

                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            nama,

                            nomorHP

                        })

                }
            );


        const result =
            await readJSON(
                response
            );


        console.log(
            'HASIL UPDATE PROFIL:',
            response.status,
            result
        );


        /* =========================================
           ERROR
        ========================================= */

        if(
            response.status === 409
        ){

            throw new Error(
                result.message ||
                'Nomor HP sudah digunakan.'
            );

        }


        if(
            response.status === 401
        ){

            throw new Error(
                'Sesi login tidak valid.'
            );

        }


        if(
            !response.ok
        ){

            throw new Error(
                result.message ||
                'Gagal memperbarui profil.'
            );

        }


        /* =========================================
           BERHASIL
        ========================================= */

        console.log(
            'PROFIL BERHASIL DIPERBARUI'
        );


        alert(
            result.message ||
            'Profil berhasil diperbarui.'
        );


        /*
        =========================================
        KEMBALI KE PROFIL
        =========================================
        */

        window.location.href =
            'profil.html';


    }catch(error){

        console.error(
            'SAVE PROFILE ERROR:',
            error
        );


        alert(
            error.message ||
            'Gagal menyimpan profil.'
        );


        saveBtn.disabled =
            false;


        saveBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i><span>SIMPAN</span>';

    }

}


/* =========================================================
   READ JSON
========================================================= */

async function readJSON(
    response
){

    const text =
        await response.text();


    if(!text){

        return {};

    }


    try{

        return JSON.parse(
            text
        );

    }catch(error){

        console.error(
            'INVALID JSON:',
            text
        );


        return {

            success:
                false,

            message:
                'Response server tidak valid.'

        };

    }

}


/* =========================================================
   BUTTON SIMPAN
========================================================= */

if(saveBtn){

    saveBtn.addEventListener(
        'click',
        saveProfile
    );

}


/* =========================================================
   BUTTON BATAL
========================================================= */

if(cancelBtn){

    cancelBtn.addEventListener(
        'click',
        function(){

            window.location.href =
                'profil.html';

        }
    );

}


/* =========================================================
   BUTTON BACK
========================================================= */

if(backBtn){

    backBtn.addEventListener(
        'click',
        function(){

            window.location.href =
                'profil.html';

        }
    );

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        console.log(
            'EDIT AUTH STATE:',
            user
                ? user.uid
                : 'TIDAK LOGIN'
        );


        if(!user){

            window.location.replace(
                'index.html'
            );

            return;

        }


        currentUser =
            user;


        await loadProfile();

    }
);