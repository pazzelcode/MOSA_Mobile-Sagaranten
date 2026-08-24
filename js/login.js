/* =========================================
   GOOGLE APPS SCRIPT API
========================================= */

const LOGIN_API_URL =
    'https://script.google.com/macros/s/AKfycbyCOwWScZuRNkICrYkuWbaT4-e81IUsDoLNzF2VTyLiCa5hmDR3UJbHprB_wTH6wZnv_Q/exec';


/* =========================================
   ELEMENT
========================================= */

const phoneInput =
    document.getElementById(
        'phone'
    );

const pinInput =
    document.getElementById(
        'pin'
    );

const loginButton =
    document.getElementById(
        'loginButton'
    );

const togglePin =
    document.getElementById(
        'togglePin'
    );

const loginError =
    document.getElementById(
        'loginError'
    );

const errorText =
    document.getElementById(
        'errorText'
    );


/* =========================================
   BERSIHKAN NOMOR
========================================= */

function bersihkanNomorHP(
    nomor
){

    return String(
        nomor || ''
    )
    .replace(
        /\D/g,
        ''
    )
    .trim();

}


/* =========================================
   ERROR
========================================= */

function tampilkanError(
    pesan
){

    errorText.textContent =
        pesan;

    loginError.classList.add(
        'show'
    );

}

function sembunyikanError(){

    loginError.classList.remove(
        'show'
    );

}


/* =========================================
   INPUT NOMOR
========================================= */

phoneInput.addEventListener(
    'input',
    function(){

        this.value =
            this.value
            .replace(
                /\D/g,
                ''
            );

        sembunyikanError();

    }
);


/* =========================================
   INPUT PIN
========================================= */

pinInput.addEventListener(
    'input',
    function(){

        this.value =
            this.value
            .replace(
                /\D/g,
                ''
            )
            .slice(
                0,
                6
            );

        sembunyikanError();

    }
);


/* =========================================
   TAMPIL / SEMBUNYIKAN PIN
========================================= */

togglePin.addEventListener(
    'click',
    function(){

        const icon =
            this.querySelector('i');

        if(
            pinInput.type === 'password'
        ){

            pinInput.type = 'text';

            icon.classList.remove(
                'fa-eye'
            );

            icon.classList.add(
                'fa-eye-slash'
            );

            this.setAttribute(
                'aria-label',
                'Sembunyikan PIN'
            );

        }else{

            pinInput.type = 'password';

            icon.classList.remove(
                'fa-eye-slash'
            );

            icon.classList.add(
                'fa-eye'
            );

            this.setAttribute(
                'aria-label',
                'Tampilkan PIN'
            );

        }

    }
);

/* =========================================
   LOGIN
========================================= */

async function prosesLogin(){

    sembunyikanError();


    const nomorHP =
        bersihkanNomorHP(
            phoneInput.value
        );

    const pin =
        String(
            pinInput.value || ''
        );


    /* =====================================
       VALIDASI NOMOR
    ===================================== */

    if(
        nomorHP.length < 10
    ){

        tampilkanError(
            'Nomor HP tidak valid.'
        );

        phoneInput.focus();

        return;

    }


    /* =====================================
       VALIDASI PIN
    ===================================== */

    if(
        pin.length !== 6
    ){

        tampilkanError(
            'PIN harus terdiri dari 6 digit.'
        );

        pinInput.focus();

        return;

    }


    /* =====================================
       LOADING
    ===================================== */

    loginButton.classList.add(
        'loading'
    );


    try{


        /* =================================
           KIRIM KE GOOGLE APPS SCRIPT
        ================================= */

        const response = await fetch(LOGIN_API_URL,{
    method:'POST',
    headers:{
        'Content-Type':'text/plain;charset=utf-8'
    },
    body:JSON.stringify({
        nomorHP: nomorHP,
        pin: pin
    })
});

const text = await response.text();

console.log('RESPON SERVER:', text);

let result;

try{
    result = JSON.parse(text);
}catch(error){

    console.error('RESPON BUKAN JSON:', text);

    throw new Error(
        'Server mengembalikan data yang tidak valid.'
    );
}


        /* =================================
           LOGIN GAGAL
        ================================= */

        if(
            !result.success
        ){

            tampilkanError(
                result.message ||
                'Nomor HP atau PIN salah.'
            );

            loginButton.classList.remove(
                'loading'
            );

            return;

        }


        /* =================================
           LOGIN BERHASIL
        ================================= */

        const sekarang =
            Date.now();

        const tujuhHari =
            7 *
            24 *
            60 *
            60 *
            1000;

        const waktuKadaluarsa =
            sekarang +
            tujuhHari;


        /*
           SIMPAN SESI 7 HARI
        */

        localStorage.setItem(
            'mc_sagaranten_login',
            'true'
        );

        localStorage.setItem(
            'mc_sagaranten_phone',
            nomorHP
        );

        localStorage.setItem(
            'mc_sagaranten_nama',
            result.nama || ''
        );

        localStorage.setItem(
            'mc_sagaranten_login_time',
            String(
                sekarang
            )
        );

        localStorage.setItem(
            'mc_sagaranten_expire',
            String(
                waktuKadaluarsa
            )
        );

      /* =================================
   CATAT LOGIN BERHASIL
================================= */

if (typeof logAktivitas === 'function') {

    logAktivitas(
        'Login berhasil',
        'Login | MC-SAGARANTEN'
    );

}

        /* =================================
           MASUK DASHBOARD
        ================================= */

        setTimeout(
            () => {

                window.location.replace(
                    'index.html'
                );

            },
            500
        );


    }catch(error){

        console.error(
            'LOGIN ERROR:',
            error
        );


        tampilkanError(
    'ERROR: ' + error.message
);


        loginButton.classList.remove(
            'loading'
        );

    }

}


/* =========================================
   KLIK LOGIN
========================================= */

loginButton.addEventListener(
    'click',
    prosesLogin
);


/* =========================================
   ENTER
========================================= */

phoneInput.addEventListener(
    'keydown',
    function(event){

        if(
            event.key === 'Enter'
        ){

            pinInput.focus();

        }

    }
);


pinInput.addEventListener(
    'keydown',
    function(event){

        if(
            event.key === 'Enter'
        ){

            prosesLogin();

        }

    }
);


/* =========================================
   CEK SESI LOGIN
========================================= */

const loginStatus =
    localStorage.getItem(
        'mc_sagaranten_login'
    );

const loginExpire =
    Number(
        localStorage.getItem(
            'mc_sagaranten_expire'
        )
    );


if(
    loginStatus === 'true' &&
    loginExpire &&
    Date.now() < loginExpire
){

    window.location.replace(
        'index.html'
    );

}else{

    localStorage.removeItem(
        'mc_sagaranten_login'
    );

    localStorage.removeItem(
        'mc_sagaranten_phone'
    );

    localStorage.removeItem(
        'mc_sagaranten_nama'
    );

    localStorage.removeItem(
        'mc_sagaranten_login_time'
    );

    localStorage.removeItem(
        'mc_sagaranten_expire'
    );

}
