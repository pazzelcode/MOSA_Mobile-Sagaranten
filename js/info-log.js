/* =========================================================
   MC-SAGARANTEN
   INFO LOG + MASTER USER
========================================================= */


/* =========================================================
   KONFIGURASI GS LOG
========================================================= */

const LOG_API_URL =
'https://script.google.com/macros/s/AKfycbzQA1y3722q1bQXKCvJaNedZ71tFNNVMFYyCNl_ak6JgGI3v0HFoY-xAhKvdTAKdp4/exec';


/* =========================================================
   IDENTITAS USER LOGIN
========================================================= */

function getLoginUser(){

    const nomorHp =
        localStorage.getItem('mc_sagaranten_phone') || '';

    const nama =
        localStorage.getItem('mc_sagaranten_nama') || '';

    return {
        nomorHp,
        nama
    };

}


/* =========================================================
   CEK LOGIN
========================================================= */

function cekLogin(){

    const login =
        localStorage.getItem('mc_sagaranten_login');

    const expire =
        Number(
            localStorage.getItem('mc_sagaranten_expire')
        );


    if(
        login !== 'true' ||
        !expire ||
        Date.now() >= expire
    ){

        localStorage.removeItem('mc_sagaranten_login');
        localStorage.removeItem('mc_sagaranten_phone');
        localStorage.removeItem('mc_sagaranten_nama');
        localStorage.removeItem('mc_sagaranten_login_time');
        localStorage.removeItem('mc_sagaranten_expire');

        window.location.replace('login.html');

        return false;
    }


    return true;

}


/* =========================================================
   TANGGAL HARI INI
========================================================= */

function getTodayKey(){

    const d = new Date();

    const yyyy =
        d.getFullYear();

    const mm =
        String(d.getMonth() + 1)
        .padStart(2,'0');

    const dd =
        String(d.getDate())
        .padStart(2,'0');

    return `${yyyy}-${mm}-${dd}`;

}


/* =========================================================
   CATAT VISITOR
========================================================= */

function countVisitorOncePerDay(){

    const today =
        getTodayKey();

    const lastVisit =
        localStorage.getItem('last_visit_date');


    if(lastVisit === today){

        return;

    }


    localStorage.setItem(
        'last_visit_date',
        today
    );


    fetch(
        LOG_API_URL +
        '?type=visitor'
    )
    .then(response => response.text())
    .then(result => {

        console.log(
            'VISITOR LOG:',
            result
        );

    })
    .catch(error => {

        console.log(
            'Visitor log error:',
            error
        );

    });

}


/* =========================================================
   TAMPILKAN USER LOGIN
========================================================= */

function tampilkanUserLogin(){

    const user =
        getLoginUser();


    const userName =
        document.getElementById(
            'setting-user-name'
        );


    const userBadge =
        document.getElementById(
            'setting-user-badge'
        );


    if(userName){

        userName.textContent =
            user.nama
            ? 'Login sebagai ' + user.nama
            : 'User tidak diketahui';

    }


    if(userBadge){

        userBadge.textContent =
            'Aktif';

    }


    console.log(
        'USER LOGIN:',
        user
    );

}


/* =========================================================
   CATAT AKTIVITAS USER
========================================================= */

function catatAktivitas(){

    const user =
        getLoginUser();


    if(!user.nomorHp){

        console.log(
            'Nomor HP user tidak tersedia.'
        );

        return;

    }


    const halaman =
        document.title ||
        'Info Log Aktivitas';


    /*
       GS BARU menggunakan:

       type=log

       BUKAN:

       type=activity
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
                'Membuka halaman',

            halaman:
                halaman

        });


    fetch(
        LOG_API_URL +
        '?' +
        params.toString()
    )
    .then(response => response.text())
    .then(result => {

        console.log(
            'AKTIVITAS LOG:',
            result
        );

    })
    .catch(error => {

        console.error(
            'Gagal mencatat aktivitas:',
            error
        );

    });

}


/* =========================================================
   AMBIL DATA LOG DARI GS
========================================================= */

async function loadLog(){

    try{

        console.log(
            'Mengambil data log...'
        );


        /*
           PENTING:

           Gunakan type=logs

           karena GS Anda menyediakan
           action "logs".
        */

        const response =
            await fetch(
                LOG_API_URL +
                '?type=logs'
            );


        if(!response.ok){

            throw new Error(
                'HTTP Error ' +
                response.status
            );

        }


        const raw =
            await response.text();


        console.log(
            'RAW DATA LOG:',
            raw
        );


        let data;


        try{

            data =
                JSON.parse(raw);

        }catch(error){

            throw new Error(
                'Response GS bukan JSON.'
            );

        }


        console.log(
            'DATA LOG:',
            data
        );


        /* =================================================
           CEK RESPONSE
        ================================================= */

        if(data.success === false){

            throw new Error(
                data.message ||
                'API mengembalikan error.'
            );

        }


        /* =================================================
           AMBIL ARRAY LOG
        ================================================= */

        let logs = [];


        /*
           Format 1:

           {
             success:true,
             logs:[]
           }
        */

        if(Array.isArray(data.logs)){

            logs =
                data.logs;

        }


        /*
           Format 2:

           {
             success:true,
             data:{
                 logs:[]
             }
           }
        */

        else if(
            data.data &&
            Array.isArray(data.data.logs)
        ){

            logs =
                data.data.logs;

        }


        /*
           Format 3:

           {
             success:true,
             rows:[]
           }
        */

        else if(Array.isArray(data.rows)){

            logs =
                data.rows;

        }


        /*
           Format 4:

           response langsung array
        */

        else if(Array.isArray(data)){

            logs =
                data;

        }


        console.log(
            'JUMLAH LOG:',
            logs.length
        );


        /* =================================================
           STATISTIK
        ================================================= */

        let totalVisitor = 0;
        let totalDownload = 0;


        /*
           Jika GS mengirim stats
        */

        if(data.stats){

            totalVisitor =
                Number(
                    data.stats.totalVisitor || 0
                );

            totalDownload =
                Number(
                    data.stats.totalDownload || 0
                );

        }


        /*
           Jika tidak ada stats,
           coba hitung dari log.
        */

        if(
            totalVisitor === 0 ||
            totalDownload === 0
        ){

            logs.forEach(row => {

                const aktivitas =
                    String(
                        row.Aktivitas ||
                        row.aktivitas ||
                        row.Aksi ||
                        row.aksi ||
                        ''
                    )
                    .toLowerCase();


                if(
                    aktivitas.includes('visitor') ||
                    aktivitas.includes('pengunjung')
                ){

                    totalVisitor++;

                }


                if(
                    aktivitas.includes('download') ||
                    aktivitas.includes('unduh')
                ){

                    totalDownload++;

                }

            });

        }


        /* =================================================
           TAMPILKAN TOTAL VISITOR
        ================================================= */

        const totalVisitorElement =
            document.getElementById(
                'totalVisitor'
            );


        if(totalVisitorElement){

            totalVisitorElement.innerText =
                totalVisitor;

        }


        /* =================================================
           TAMPILKAN TOTAL DOWNLOAD
        ================================================= */

        const totalDownloadElement =
            document.getElementById(
                'totalDownload'
            );


        if(totalDownloadElement){

            totalDownloadElement.innerText =
                totalDownload;

        }


        /* =================================================
           JUMLAH LOG
        ================================================= */

        const todayLogElement =
            document.getElementById(
                'todayLogCount'
            );


        if(todayLogElement){

            todayLogElement.innerText =
                logs.length;

        }


        /* =================================================
           SORTIR LOG TERBARU
        ================================================= */

        logs.sort(
            (a,b) => {

                const dateA =
                    new Date(
                        a.Waktu ||
                        a.waktu ||
                        a.Timestamp ||
                        a.timestamp ||
                        0
                    );

                const dateB =
                    new Date(
                        b.Waktu ||
                        b.waktu ||
                        b.Timestamp ||
                        b.timestamp ||
                        0
                    );

                return dateB - dateA;

            }
        );


        /* =================================================
           UPDATE TERAKHIR
        ================================================= */

        const lastUpdateElement =
            document.getElementById(
                'lastUpdate'
            );


        if(lastUpdateElement){

            if(logs.length > 0){

                lastUpdateElement.innerText =
                    logs[0].Waktu ||
                    logs[0].waktu ||
                    logs[0].Timestamp ||
                    logs[0].timestamp ||
                    '-';

            }else{

                lastUpdateElement.innerText =
                    '-';

            }

        }


        /* =================================================
           TABEL LOG
        ================================================= */

        const body =
            document.getElementById(
                'logBody'
            );


        if(!body){

            return;

        }


        if(logs.length === 0){

            body.innerHTML = `
                <tr>
                    <td
                        colspan="3"
                        class="empty-state"
                    >
                        Belum ada log aktivitas
                    </td>
                </tr>
            `;

            return;

        }


        /*
           Maksimal 20 log terbaru
        */

        body.innerHTML =
            logs
            .slice(0,20)
            .map(row => {

                const waktu =
                    row.Waktu ||
                    row.waktu ||
                    row.Timestamp ||
                    row.timestamp ||
                    '-';


                const user =
                    row.Nama ||
                    row.nama ||
                    row.User ||
                    row.user ||
                    row.NomorHp ||
                    row.nomorHp ||
                    '-';


                const aktivitas =
                    row.Aktivitas ||
                    row.aktivitas ||
                    row.Aksi ||
                    row.aksi ||
                    '-';


                const halaman =
                    row.Halaman ||
                    row.halaman ||
                    '-';


                return `

                    <tr>

                        <td>
                            ${escapeHTML(waktu)}
                        </td>

                        <td>

                            <div>
                                ${escapeHTML(user)}
                            </div>

                            <div
                                style="
                                    font-size:10px;
                                    color:#64748b;
                                    margin-top:3px;
                                "
                            >
                                ${escapeHTML(aktivitas)}
                            </div>

                        </td>

                        <td>
                            ${escapeHTML(halaman)}
                        </td>

                    </tr>

                `;

            })
            .join('');


    }catch(error){

        console.error(
            'LOAD LOG ERROR:',
            error
        );


        const body =
            document.getElementById(
                'logBody'
            );


        if(body){

            body.innerHTML = `

                <tr>

                    <td
                        colspan="3"
                        class="empty-state"
                    >
                        Gagal memuat data log
                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value){

    return String(value ?? '')

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );

}


/* =========================================================
   BACK BUTTON
========================================================= */

function goBack(){

    if(history.length > 1){

        history.back();

    }else{

        window.location.href =
            'dashboard.html';

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function(){

        /*
           1. Cek login
        */

        if(!cekLogin()){

            return;

        }


        /*
           2. Tampilkan user
        */

        tampilkanUserLogin();


        /*
           3. Catat bahwa user membuka
              halaman Info Log
        */

        catatAktivitas();


        /*
           4. Catat visitor
        */

        countVisitorOncePerDay();


        /*
           5. Ambil semua data log
        */

        loadLog();

    }
);
      
function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "dashboard.html";

    }

}
