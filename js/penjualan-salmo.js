/* =========================================================
   KONFIGURASI MASTER DATA
========================================================= */

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';

const TARGET_SHEET_NAME =
'penjualan-salmo';

let salmoChart = null;


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(value){

    const number =
        Number(value) || 0;

    return (
        'Rp ' +
        number.toLocaleString('id-ID')
    );

}

/* =========================================================
   FORMAT RUPIAH SINGKAT UNTUK CHART
========================================================= */

function formatRupiahSingkat(value){

    const number =
        Number(value) || 0;

    if(number >= 1000000000){

        return (
            'Rp ' +
            (number / 1000000000)
                .toFixed(
                    number % 1000000000 === 0
                        ? 0
                        : 1
                ) +
            'M'
        );

    }

    if(number >= 1000000){

        return (
            'Rp ' +
            (number / 1000000)
                .toFixed(
                    number % 1000000 === 0
                        ? 0
                        : 1
                ) +
            'jt'
        );

    }

    if(number >= 1000){

        return (
            'Rp ' +
            (number / 1000)
                .toFixed(
                    number % 1000 === 0
                        ? 0
                        : 1
                ) +
            'rb'
        );

    }

    return 'Rp ' + number.toLocaleString('id-ID');

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

    if(
        typeof value === 'number'
    ){

        return value;

    }

    let text =
        String(value).trim();

    if(text === ''){

        return 0;

    }

    /*
       Hapus Rp, titik, spasi, dll.
       Tetap pertahankan tanda minus.
    */

    text =
        text.replace(
            /[^\d-]/g,
            ''
        );

    return (
        Number(text) || 0
    );

}


/* =========================================================
   AMBIL NAMA DSE
========================================================= */

function ambilNamaDse(row){

    if(!row){

        return '';

    }

    /*
       Coba beberapa kemungkinan
       nama header dari Google Sheet.
    */

    const kemungkinan = [

        'Nama cso',

        'Nama CSO',

        'NAMA CSO',

        'nama cso',

        'Nama Cso',

        'Nama DSE',

        'Nama dse',

        'NAMA DSE',

        'nama dse'

    ];


    for(
        const key of kemungkinan
    ){

        if(
            row[key] !== undefined &&
            row[key] !== null
        ){

            const nama =
                String(
                    row[key]
                ).trim();

            if(nama !== ''){

                return nama;

            }

        }

    }


    /*
       Fallback:
       cari header yang mengandung
       kata nama dan cso/dse.
    */

    const keys =
        Object.keys(row);


    for(
        const key of keys
    ){

        const lower =
            String(key)
            .toLowerCase()
            .trim();


        if(
            lower.includes('nama') &&
            (
                lower.includes('cso') ||
                lower.includes('dse')
            )
        ){

            const nama =
                String(
                    row[key] || ''
                ).trim();


            if(nama !== ''){

                return nama;

            }

        }

    }


    return '';

}


/* =========================================================
   AMBIL AMOUNT
========================================================= */

function ambilAmount(row){

    if(!row){

        return 0;

    }


    const kemungkinan = [

        'Amount',

        'amount',

        'AMOUNT',

        'Saldo',

        'saldo',

        'SALDO',

        'Saldo MOBO',

        'saldo mobo',

        'Total',

        'total'

    ];


    for(
        const key of kemungkinan
    ){

        if(
            row[key] !== undefined &&
            row[key] !== null &&
            row[key] !== ''
        ){

            return ambilAngka(
                row[key]
            );

        }

    }


    /*
       Fallback:
       cari kolom yang mengandung
       amount / saldo.
    */

    const keys =
        Object.keys(row);


    for(
        const key of keys
    ){

        const lower =
            String(key)
            .toLowerCase()
            .trim();


        if(
            lower.includes('amount') ||
            lower.includes('saldo')
        ){

            return ambilAngka(
                row[key]
            );

        }

    }


    return 0;

}


/* =========================================================
   KONVERSI DATA ARRAY MENJADI OBJECT
========================================================= */

function normalisasiData(rawData){

    /*
       Pastikan data selalu array.
    */

    if(
        !rawData
    ){

        return [];

    }


    /*
       Jika data dibungkus object,
       coba ambil properti yang umum.
    */

    if(
        !Array.isArray(rawData) &&
        typeof rawData === 'object'
    ){

        if(
            Array.isArray(
                rawData.data
            )
        ){

            rawData =
                rawData.data;

        }else if(
            Array.isArray(
                rawData.rows
            )
        ){

            rawData =
                rawData.rows;

        }else if(
            Array.isArray(
                rawData.values
            )
        ){

            rawData =
                rawData.values;

        }else{

            /*
               Jika object tunggal,
               jadikan array.
            */

            rawData =
                [rawData];

        }

    }


    if(
        !Array.isArray(rawData)
    ){

        return [];

    }


    if(
        rawData.length === 0
    ){

        return [];

    }


    /*
       Jika sudah berupa object:
       [
         {
           "Nama cso":"Andi",
           "Amount":100000
         }
       ]
    */

    if(
        typeof rawData[0] === 'object' &&
        !Array.isArray(rawData[0])
    ){

        return rawData;

    }


    /*
       Jika berupa array 2 dimensi:
       [
         ["Nama cso","Amount"],
         ["Andi",100000]
       ]
    */

    if(
        Array.isArray(
            rawData[0]
        )
    ){

        const headers =
            rawData[0];


        return rawData
            .slice(1)
            .map(
                row => {

                    const object = {};


                    headers.forEach(
                        (
                            header,
                            index
                        ) => {

                            object[
                                String(
                                    header
                                ).trim()
                            ] =
                                row[index];

                        }
                    );


                    return object;

                }
            );

    }


    return [];

}


/* =========================================================
   AMBIL DATA PENJUALAN SALMO
========================================================= */

async function updateDataFromSpreadsheet(){

    try{

        console.log(
            '======================================'
        );

        console.log(
            'MENGAMBIL DATA PENJUALAN SALMO'
        );


        const updateTime =
            document.getElementById(
                'updateTime'
            );


        if(updateTime){

            updateTime.textContent =
                'Update Data: Memuat...';

        }


        /* =================================================
           URL MASTER DATA API
        ================================================= */

        const url =
            MASTER_DATA_API_URL +
            '?action=penjualan-salmo&t=' +
            Date.now();


        console.log(
            'MASTER DATA API:',
            MASTER_DATA_API_URL
        );

        console.log(
            'ACTION:',
            'penjualan-salmo'
        );

        console.log(
            'URL:',
            url
        );


        /* =================================================
           FETCH
        ================================================= */

        const response =
            await fetch(
                url,
                {
                    method:'GET',
                    cache:'no-store'
                }
            );


        if(
            !response.ok
        ){

            throw new Error(
                'API Spreadsheet gagal. HTTP ' +
                response.status
            );

        }


        /* =================================================
           BACA JSON
        ================================================= */

        const result =
            await response.json();


        console.log(
            '======================================'
        );

        console.log(
            'RESPONSE MASTER DATA:',
            result
        );


        /* =================================================
           CEK RESPONSE
        ================================================= */

        if(
            !result ||
            result.success !== true
        ){

            throw new Error(
                result?.message ||
                'Master Data API mengembalikan response gagal.'
            );

        }


        /* =================================================
           AMBIL DATA
        ================================================= */

        let rawData =
            result.data;


        console.log(
            'RAW DATA:',
            rawData
        );


        /* =================================================
           NORMALISASI
        ================================================= */

        const objectData =
            normalisasiData(
                rawData
            );


        console.log(
            'DATA SETELAH NORMALISASI:',
            objectData
        );


        /* =================================================
           CEK DATA
        ================================================= */

        if(
            objectData.length === 0
        ){

            throw new Error(
                'Data sheet penjualan-salmo kosong atau format data tidak dikenali.'
            );

        }


        /* =================================================
           FILTER DATA DSE
        ================================================= */

        const data =
            objectData
                .map(
                    row => {

                        return {

                            ...row,

                            __nama:
                                ambilNamaDse(
                                    row
                                ),

                            __amount:
                                ambilAmount(
                                    row
                                )

                        };

                    }
                )
                .filter(
                    row => {

                        const nama =
                            String(
                                row.__nama ||
                                ''
                            ).trim();


                        const amount =
                            Number(
                                row.__amount
                            ) || 0;


                        /*
                           Buang:
                           - baris kosong
                           - Grand Total
                           - total
                           - amount 0
                        */

                        const namaLower =
                            nama.toLowerCase();


                        return (

                            nama !== ''

                            &&

                            namaLower !==
                            'grand total'

                            &&

                            namaLower !==
                            'total'

                            &&

                            amount > 0

                        );

                    }
                );


        console.log(
            'DATA DSE SETELAH FILTER:',
            data
        );


        /* =================================================
           SORT TERBESAR
        ================================================= */

        data.sort(
            (
                a,
                b
            ) => {

                return (
                    b.__amount -
                    a.__amount
                );

            }
        );


        console.log(
            'DATA SETELAH SORT:',
            data
        );


        /* =================================================
           CEK DATA AKHIR
        ================================================= */

        if(
            data.length === 0
        ){

            throw new Error(
                'Tidak ada data DSE dengan saldo lebih dari 0 pada sheet penjualan-salmo.'
            );

        }


        /* =================================================
           TOTAL SALDO
        ================================================= */

        const total =
            data.reduce(
                (
                    sum,
                    row
                ) => {

                    return (
                        sum +
                        row.__amount
                    );

                },
                0
            );


        console.log(
            'TOTAL SALDO:',
            total
        );


        console.log(
            'JUMLAH DSE:',
            data.length
        );


        /* =================================================
           UPDATE GRAND TOTAL
        ================================================= */

        const grandTotal =
            document.getElementById(
                'grandTotal'
            );


        if(grandTotal){

            grandTotal.textContent =
                formatRupiah(
                    total
                );

        }


        /* =================================================
           UPDATE JUMLAH DSE
        ================================================= */

        const totalDse =
            document.getElementById(
                'totalDse'
            );


        if(totalDse){

            totalDse.textContent =
                data.length +
                ' DSE';

        }


        /* =================================================
           TOP DSE
        ================================================= */

        const topDse =
            document.getElementById(
                'topDse'
            );


        if(topDse){

            topDse.textContent =
                data[0].__nama ||
                '-';

        }


        /* =================================================
           RANKING COUNT
        ================================================= */

        const rankingCount =
            document.getElementById(
                'rankingCount'
            );


        if(rankingCount){

            rankingCount.textContent =
                data.length +
                ' DSE';

        }


        /* =================================================
           WAKTU UPDATE
        ================================================= */

        if(updateTime){

            let waktu =
                new Date();


            /*
               Jika Apps Script mengirim updatedAt
               gunakan waktu tersebut.
            */

            if(
                result.updatedAt
            ){

                const parsed =
                    new Date(
                        result.updatedAt
                    );


                if(
                    !isNaN(
                        parsed.getTime()
                    )
                ){

                    waktu =
                        parsed;

                }

            }


            updateTime.textContent =
                'Update Data: ' +
                waktu.toLocaleString(
                    'id-ID',
                    {
                        day:'2-digit',
                        month:'long',
                        year:'numeric',
                        }
                );

        }


        /* =================================================
           RENDER PODIUM
        ================================================= */

        renderPodium(
            data
        );


        /* =================================================
           RENDER RANKING
        ================================================= */

        renderRanking(
            data,
            total
        );


        /* =================================================
           RENDER CHART
        ================================================= */

        createChart(
            data
        );


        console.log(
            '======================================'
        );

        console.log(
            '✅ PENJUALAN SALMO BERHASIL DIMUAT'
        );

        console.log(
            '======================================'
        );


    }catch(error){

        console.error(
            '======================================'
        );

        console.error(
            '❌ GAGAL MENGAMBIL DATA SPREADSHEET'
        );

        console.error(
            'Nama:',
            error.name
        );

        console.error(
            'Pesan:',
            error.message
        );

        console.error(
            'Stack:',
            error.stack
        );

        console.error(
            '======================================'
        );


        /* =================================================
           ERROR UPDATE TIME
        ================================================= */

        const updateTime =
            document.getElementById(
                'updateTime'
            );


        if(updateTime){

            updateTime.textContent =
                'Update Data: Gagal memuat';

        }


        /* =================================================
           ERROR PODIUM
        ================================================= */

        const podium =
            document.getElementById(
                'podium'
            );


        if(podium){

            podium.innerHTML = `

                <div class="error-box">

                    <strong>
                        Gagal mengambil data
                    </strong>

                    <br><br>

                    ${error.message}

                </div>

            `;

        }


        /* =================================================
           ERROR RANKING
        ================================================= */

        const rankingList =
            document.getElementById(
                'rankingList'
            );


        if(rankingList){

            rankingList.innerHTML = `

                <div class="error-box">

                    ${error.message}

                </div>

            `;

        }

    }

}


/* =========================================================
   PODIUM
========================================================= */

function renderPodium(data){

    const podium =
        document.getElementById(
            'podium'
        );


    if(!podium){

        return;

    }


    const top =
        data.slice(
            0,
            3
        );


    if(
        top.length === 0
    ){

        podium.innerHTML =
            '<div class="loading">Tidak ada data.</div>';

        return;

    }


    /*
       Posisi:

       Juara 2 | Juara 1 | Juara 3
    */

    const order =
        [1,0,2];


    podium.innerHTML =
        order
            .filter(
                index =>
                    top[index]
            )
            .map(
                index => {

                    const row =
                        top[index];


                    const rank =
                        index + 1;


                    const nama =
                        row.__nama ||
                        '-';


                    const amount =
                        row.__amount ||
                        0;


                    const medal =
                        rank === 1
                            ? '🥇'
                            : rank === 2
                                ? '🥈'
                                : '🥉';


                    return `

                        <div
                            class="
                                podium-item
                                ${rank === 1
                                    ? 'first'
                                    : ''}
                            "
                        >

                            <div class="podium-medal">
                                ${medal}
                            </div>

                            <div class="podium-name">
                                ${nama}
                            </div>

                            <div class="podium-amount">
                                ${formatRupiah(amount)}
                            </div>

                        </div>

                    `;

                }
            )
            .join('');

}


/* =========================================================
   RANKING
========================================================= */

function renderRanking(
    data,
    total
){

    const container =
        document.getElementById(
            'rankingList'
        );


    if(!container){

        return;

    }


    container.innerHTML =
        '';


    data.forEach(
        (
            row,
            index
        ) => {

            const nama =
                row.__nama ||
                '-';


            const amount =
                row.__amount ||
                0;


            const percent =
                total > 0
                    ? (
                        amount /
                        total *
                        100
                    )
                    : 0;


            const rank =
                index + 1;


            const item =
                document.createElement(
                    'div'
                );


            item.className =
                'ranking-item';


            const rankClass =
                rank <= 3
                    ? 'r' + rank
                    : '';


            item.innerHTML = `

                <div class="ranking-top">

                    <div
                        class="
                            rank-number
                            ${rankClass}
                        "
                    >
                        ${rank}
                    </div>


                    <div class="rank-info">

                        <div class="rank-name">
                            ${nama}
                        </div>

                        <div class="rank-amount">
                            ${formatRupiah(amount)}
                        </div>

                    </div>


                    <div class="rank-percent">
                        ${percent.toFixed(1)}%
                    </div>

                </div>


                <div class="progress">

                    <div
                        class="progress-bar"
                        style="
                            width:${Math.min(
                                percent,
                                100
                            )}%
                        "
                    ></div>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   CHART
========================================================= */

function createChart(data){

    const canvas =
        document.getElementById(
            'salmoChart'
        );


    if(!canvas){

        return;

    }


    /*
       Pastikan Chart.js tersedia.
    */

    if(
        typeof Chart === 'undefined'
    ){

        console.error(
            'Chart.js belum tersedia.'
        );

        return;

    }


    const ctx =
        canvas.getContext(
            '2d'
        );


    if(
        salmoChart
    ){

        salmoChart.destroy();

        salmoChart =
            null;

    }


    const labels =
        data.map(
            row =>
                row.__nama ||
                '-'
        );


    const values =
        data.map(
            row =>
                row.__amount ||
                0
        );


    salmoChart =
        new Chart(
            ctx,
            {

                type:'bar',

                data:{

                    labels:labels,

                    datasets:[{

                        label:
                            'Saldo MOBO',

                        data:values,

                        backgroundColor:
                            '#2563eb',

                        borderRadius:7,

                        borderSkipped:false

                    }]

                },


                options:{

                    responsive:true,

                    maintainAspectRatio:false,

                    indexAxis:'y',


                    plugins:{

                        legend:{

                            display:false

                        },


                        tooltip:{

                            callbacks:{

                                label:
                                    function(
                                        context
                                    ){

                                        return (
                                            ' ' +
                                            formatRupiah(
                                                context.raw
                                            )
                                        );

                                    }

                            }

                        }

                    },


                    scales:{

                        x:{

                            beginAtZero:true,

                            ticks:{

    callback:
        function(value){

            return formatRupiahSingkat(
                value
            );

        },

    font:{

        size:9

    }

}

                        },


                        y:{

                            ticks:{

                                font:{

                                    size:10,

                                    weight:'600'

                                }

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function(){

        console.log(
            '🚀 PENJUALAN-SALMO DIMULAI'
        );

        console.log(
            'Target Sheet:',
            TARGET_SHEET_NAME
        );

        updateDataFromSpreadsheet();

    }
);
function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "dashboard.html";

    }

}
