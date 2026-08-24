/* =========================================================
   MC-SAGARANTEN
   GLOBAL LOG AKTIVITAS
   =========================================================

   Fungsi:
   1. Mengambil user yang sedang login
   2. Mencatat aktivitas halaman
   3. Mengirim data ke Google Apps Script
   4. Nama user diambil dari Master User melalui nomor HP
   5. Tidak mengganggu tampilan halaman jika API gagal

   CARA PAKAI:

   <script src="global-log.js"></script>

   Secara otomatis halaman akan dicatat.

   Untuk aktivitas khusus:

   logAktivitas('Membuka menu stok');

   Untuk download:

   logDownload('Download laporan stok');

========================================================= */


/* =========================================================
   KONFIGURASI API
========================================================= */

const GLOBAL_LOG_API_URL =
    'https://script.google.com/macros/s/AKfycbx5Vx2u52fIdnSrlUTcJIwzlwmTaYbjyHbQ01VFdAxl8F-ZX9OSbg6mcEQUNVEJxAp7/exec';


/* =========================================================
   AMBIL USER LOGIN
========================================================= */

function getGlobalLogUser(){

    const nomorHp =
        localStorage.getItem(
            'mc_sagaranten_phone'
        ) || '';


    const nama =
        localStorage.getItem(
            'mc_sagaranten_nama'
        ) || '';


    return {

        nomorHp:
            nomorHp.trim(),

        nama:
            nama.trim()

    };

}


/* =========================================================
   CEK STATUS LOGIN
========================================================= */

function isGlobalLogUserLogin(){

    const login =
        localStorage.getItem(
            'mc_sagaranten_login'
        );


    const expire =
        Number(
            localStorage.getItem(
                'mc_sagaranten_expire'
            )
        );


    /*
       Jika sistem login Anda tidak
       menggunakan expire, tetap
       izinkan jika login = true.
    */

    if(
        login !== 'true'
    ){

        return false;

    }


    /*
       Jika expire tersedia,
       cek masa berlaku.
    */

    if(
        expire &&
        Date.now() >= expire
    ){

        return false;

    }


    return true;

}


/* =========================================================
   NAMA HALAMAN
========================================================= */

function getGlobalLogPageName(){

    /*
       Prioritas:

       1. data-log-page
       2. document.title
       3. nama file HTML
    */


    const customName =
        document.body
        ?.getAttribute(
            'data-log-page'
        );


    if(
        customName &&
        customName.trim() !== ''
    ){

        return customName.trim();

    }


    if(
        document.title &&
        document.title.trim() !== ''
    ){

        return document.title.trim();

    }


    let fileName =
        window.location.pathname
        .split('/')
        .pop();


    if(
        !fileName
    ){

        fileName =
            'index.html';

    }


    return fileName;

}


/* =========================================================
   KIRIM LOG KE GOOGLE APPS SCRIPT
========================================================= */

async function kirimGlobalLog({

    aktivitas =
        'Membuka halaman',

    halaman =
        getGlobalLogPageName(),

    tipe =
        'activity'

} = {}){


    /*
       Pastikan user login
    */

    if(
        !isGlobalLogUserLogin()
    ){

        console.log(
            '[GLOBAL LOG] User belum login.'
        );

        return {

            success:false,

            message:
                'User belum login.'

        };

    }


    const user =
        getGlobalLogUser();


    /*
       Nomor HP wajib karena GS
       mencocokkan user dengan
       Master User.
    */

    if(
        !user.nomorHp
    ){

        console.warn(
            '[GLOBAL LOG] Nomor HP tidak ditemukan.'
        );

        return {

            success:false,

            message:
                'Nomor HP user tidak tersedia.'

        };

    }


    /*
       Buat parameter
    */

    const params =
        new URLSearchParams({

            type:
                'log',

            nomorHp:
                user.nomorHp,

            nama:
                user.nama,

            aktivitas:
                aktivitas,

            halaman:
                halaman,

            tipe:
                tipe

        });


    try{

        const response =
            await fetch(

                GLOBAL_LOG_API_URL +
                '?' +
                params.toString(),

                {

                    method:
                        'GET',

                    cache:
                        'no-store'

                }

            );


        const text =
            await response.text();


        let data;


        try{

            data =
                JSON.parse(
                    text
                );

        }catch(error){

            console.warn(
                '[GLOBAL LOG] Response bukan JSON:',
                text
            );

            return {

                success:false,

                message:
                    'Response API tidak valid.'

            };

        }


        if(
            data.success
        ){

            console.log(
                '[GLOBAL LOG] Berhasil:',
                data
            );

        }else{

            console.warn(
                '[GLOBAL LOG] Ditolak:',
                data
            );

        }


        return data;

    }
    catch(error){

        /*
           Error log tidak boleh
           menghentikan halaman.
        */

        console.warn(
            '[GLOBAL LOG] Gagal mengirim:',
            error
        );


        return {

            success:false,

            message:
                error.message

        };

    }

}


/* =========================================================
   FUNGSI UTAMA
   CATAT AKTIVITAS
========================================================= */

function logAktivitas(
    aktivitas =
        'Membuka halaman',
    halaman =
        getGlobalLogPageName()
){

    return kirimGlobalLog({

        aktivitas:
            aktivitas,

        halaman:
            halaman,

        tipe:
            'activity'

    });

}


/* =========================================================
   CATAT DOWNLOAD
========================================================= */

function logDownload(
    aktivitas =
        'Download data',
    halaman =
        getGlobalLogPageName()
){

    return kirimGlobalLog({

        aktivitas:
            aktivitas,

        halaman:
            halaman,

        tipe:
            'download'

    });

}


/* =========================================================
   CATAT AKSI CUSTOM
========================================================= */

function logAksi(
    aktivitas,
    halaman =
        getGlobalLogPageName()
){

    return kirimGlobalLog({

        aktivitas:
            aktivitas,

        halaman:
            halaman,

        tipe:
            'activity'

    });

}


/* =========================================================
   OTOMATIS CATAT SAAT HALAMAN DIBUKA
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function(){

        /*
           Jangan mencatat halaman
           jika user belum login.
        */

        if(
            !isGlobalLogUserLogin()
        ){

            console.log(
                '[GLOBAL LOG] Halaman dibuka oleh user yang belum login.'
            );

            return;

        }


        /*
           Ambil nama halaman
        */

        const halaman =
            getGlobalLogPageName();


        /*
           Catat aktivitas
        */

        logAktivitas(
            'Membuka halaman',
            halaman
        );

    }
);