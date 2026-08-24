/* =========================================================
   LOGIN PROTECTION
========================================================= */

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
    loginStatus !== 'true' ||
    !loginExpire ||
    Date.now() >= loginExpire
){

    localStorage.removeItem(
        'mc_sagaranten_login'
    );

    localStorage.removeItem(
        'mc_sagaranten_phone'
    );

    localStorage.removeItem(
        'mc_sagaranten_login_time'
    );

    localStorage.removeItem(
        'mc_sagaranten_expire'
    );

    window.location.replace(
        'login.html'
    );

}



/* =========================================================
   API
========================================================= */

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';



/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(number){

    return 'Rp ' +
        Number(number || 0)
        .toLocaleString('id-ID');

}



/* =========================================================
   AMBIL ANGKA
========================================================= */

function ambilAngka(value){

    if(
        value === null ||
        value === undefined ||
        value === ''
    ){

        return 0;

    }


    return parseInt(
        String(value)
        .replace(/[^\d]/g,''),
        10
    ) || 0;

}



/* =========================================================
   NAMA PENGGUNA
========================================================= */

function tampilkanNamaPengguna(){

    const element =
        document.getElementById(
            'user-name'
        );


    if(!element){

        return;

    }


    const nama =
        localStorage.getItem(
            'mc_sagaranten_nama'
        );


    if(
        nama &&
        nama.trim() !== ''
    ){

        element.textContent =
            nama.trim();

    }

}



/* =========================================================
   TANGGAL
========================================================= */

function tampilkanTanggal(){

    const now =
        new Date();


    const tanggal =
        now.toLocaleDateString(
            'id-ID',
            {
                day:'numeric',
                month:'short',
                year:'numeric'
            }
        );


    const element =
        document.getElementById(
            'report-date'
        );


    if(element){

        element.textContent =
            tanggal;

    }

}



/* =========================================================
   PERSENTASE
========================================================= */

function hitungPersentase(
    nilai,
    total
){

    if(
        !total ||
        total <= 0
    ){

        return 0;

    }


    return (
        nilai / total
    ) * 100;

}



/* =========================================================
   UPDATE CARD
========================================================= */

function updateCategory(
    category,
    value,
    total,
    maxValue
){

    const percent =
        hitungPersentase(
            value,
            total
        );


    const percentRounded =
        percent.toFixed(1);


    /* =========================================
       VALUE
    ========================================= */

    const valueElement =
        document.getElementById(
            'total-' + category
        );


    if(valueElement){

        valueElement.textContent =
            formatRupiah(value);

        valueElement.classList.remove(
            'loading'
        );

    }


    /* =========================================
       PERCENT
    ========================================= */

    const percentElement =
        document.getElementById(
            'percent-' + category
        );


    if(percentElement){

        percentElement.textContent =
            percentRounded + '%';

    }


    /* =========================================
       PROGRESS
    ========================================= */

    const progressElement =
        document.getElementById(
            'progress-' + category
        );


    if(progressElement){

        progressElement.style.width =
            percent + '%';

    }


    /* =========================================
       CHART
    ========================================= */

    const chartElement =
        document.getElementById(
            'chart-' + category
        );


    if(chartElement){

        let chartPercent = 0;


        if(maxValue > 0){

            chartPercent =
                (
                    value /
                    maxValue
                ) * 100;

        }


        chartElement.style.width =
            chartPercent + '%';

    }


    /* =========================================
       CHART VALUE
    ========================================= */

    const chartValueElement =
        document.getElementById(
            'chart-value-' + category
        );


    if(chartValueElement){

        chartValueElement.textContent =
            formatRupiah(value);

    }

}



/* =========================================================
   LOAD REPORT
========================================================= */

async function loadReport(){

    try{

        const response =
            await fetch(

                MASTER_DATA_API_URL +
                '?action=dashboard&t=' +
                Date.now()

            );


        if(!response.ok){

            throw new Error(
                'HTTP ' +
                response.status
            );

        }


        const result =
            await response.json();


        if(!result.success){

            throw new Error(
                result.message ||
                'Gagal mengambil data.'
            );

        }


        const dashboard =
            result.data || {};


        /* =========================================
           DATA
        ========================================= */

        const salmo =
            ambilAngka(
                dashboard.totalPenjualanSalmo
            );


        const sp =
            ambilAngka(
                dashboard.spDanVoucher
            );


        const paket =
            ambilAngka(
                dashboard.allPaket
            );


        const hifi =
            ambilAngka(
                dashboard.hifi
            );


        /* =========================================
           TOTAL
        ========================================= */

        const total =
            salmo +
            sp +
            paket +
            hifi;


        const grandTotal =
            document.getElementById(
                'grand-total'
            );


        if(grandTotal){

            grandTotal.textContent =
                formatRupiah(total);

            grandTotal.classList.remove(
                'loading'
            );

        }


        /* =========================================
           MAX CHART
        ========================================= */

        const maxValue =
            Math.max(
                salmo,
                sp,
                paket,
                hifi
            );


        /* =========================================
           UPDATE 4 KATEGORI
        ========================================= */

        updateCategory(
            'salmo',
            salmo,
            total,
            maxValue
        );


        updateCategory(
            'sp',
            sp,
            total,
            maxValue
        );


        updateCategory(
            'paket',
            paket,
            total,
            maxValue
        );


        updateCategory(
            'hifi',
            hifi,
            total,
            maxValue
        );


        /* =========================================
           LAST UPDATE
        ========================================= */

        const lastUpdate =
            document.getElementById(
                'last-update'
            );


        if(lastUpdate){

            const waktu =
                new Date()
                .toLocaleTimeString(
                    'id-ID',
                    {
                        hour:'2-digit',
                        minute:'2-digit',
                        second:'2-digit'
                    }
                );


            lastUpdate.textContent =
                'Update ' + waktu;

        }


        /* =========================================
           INSIGHT
        ========================================= */

        const dataKategori = [

            {
                nama:'Salmo',
                nilai:salmo
            },

            {
                nama:'SP & Voucher',
                nilai:sp
            },

            {
                nama:'Paket',
                nilai:paket
            },

            {
                nama:'Hifi',
                nilai:hifi
            }

        ];


        dataKategori.sort(
            (a,b) =>
                b.nilai - a.nilai
        );


        const terbesar =
            dataKategori[0];


        const insight =
            document.getElementById(
                'insight-text'
            );


        if(insight){

            if(total > 0){

                const kontribusi =
                    hitungPersentase(
                        terbesar.nilai,
                        total
                    ).toFixed(1);


                insight.innerHTML =

                    'Penjualan tertinggi saat ini adalah ' +

                    '<strong>' +
                    terbesar.nama +
                    '</strong>' +

                    ' sebesar ' +

                    '<strong>' +
                    formatRupiah(
                        terbesar.nilai
                    ) +
                    '</strong>' +

                    ' dengan kontribusi ' +

                    '<strong>' +
                    kontribusi +
                    '%</strong>' +

                    ' dari total penjualan.';

            }else{

                insight.innerHTML =
                    'Belum terdapat data penjualan yang dapat dianalisis.';

            }

        }


        console.log(
            'REPORT:',
            {
                salmo,
                sp,
                paket,
                hifi,
                total
            }
        );


    }catch(error){

        console.error(
            'Gagal mengambil report:',
            error
        );


        document
            .querySelectorAll(
                '.sales-value'
            )
            .forEach(
                element => {

                    element.textContent =
                        'Error';

                    element.classList.remove(
                        'loading'
                    );

                }
            );


        const grandTotal =
            document.getElementById(
                'grand-total'
            );


        if(grandTotal){

            grandTotal.textContent =
                'Error';

            grandTotal.classList.remove(
                'loading'
            );

        }

    }

}



/* =========================================================
   NOTIFICATION BADGE
========================================================= */

function updateBadge(){

    const badge =
        document.getElementById(
            'notif-badge'
        );


    if(!badge){

        return;

    }


    let logs = [];


    try{

        logs =
            JSON.parse(
                localStorage.getItem(
                    'notif_logs'
                ) || '[]'
            );

    }catch(error){

        logs = [];

    }


    const unread =
        logs.filter(
            log =>
                log.read !== true
        ).length;


    if(unread > 0){

        badge.style.display =
            'flex';

        badge.textContent =
            unread;

    }else{

        badge.style.display =
            'none';

        badge.textContent =
            '';

    }

}



/* =========================================================
   STORAGE EVENT
========================================================= */

window.addEventListener(
    'storage',
    event => {

        if(
            event.key ===
            'notif_logs'
        ){

            updateBadge();

        }

    }
);



/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        tampilkanNamaPengguna();

        tampilkanTanggal();

        updateBadge();

        loadReport();

    }
);

/* =========================================================
   TOMBOL KEMBALI
========================================================= */

function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = 'index.html';

    }

}

