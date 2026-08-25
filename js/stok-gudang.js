/* =========================================================
   KONFIGURASI MASTER DATA
========================================================= */

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';

const TARGET_SHEET_NAME =
'stok-gudang';


/* =========================================================
   FORMAT ANGKA
========================================================= */

function formatNumber(value){

    return Number(value || 0)
        .toLocaleString('id-ID');

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(date){

    if(
        !date ||
        isNaN(date.getTime())
    ){
        return '-';
    }

    const day =
        String(
            date.getDate()
        ).padStart(2,'0');

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2,'0');

    const year =
        date.getFullYear();

    return `${year}-${month}-${day}`;

}


/* =========================================================
   FORMAT UPDATE DATE
   TANPA JAM
========================================================= */

function formatUpdateDate(date){

    if(
        !date ||
        isNaN(date.getTime())
    ){
        return '-';
    }

    return date.toLocaleDateString(
        'id-ID',
        {
            day:'2-digit',
            month:'long',
            year:'numeric'
        }
    );

}


/* =========================================================
   PARSE ANGKA
========================================================= */

function parseExcelNumber(value){

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
        String(value)
            .trim()
            .replace(/\s/g,'');


    /*
       Format Indonesia:

       1.950
       2.500
       10.000
    */

    text =
        text.replace(/\./g,'');


    /*
       Desimal:

       1.950,50
    */

    text =
        text.replace(',', '.');


    const number =
        Number(text);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   UPDATE ELEMENT
========================================================= */

function setText(
    id,
    value
){

    const element =
        document.getElementById(id);


    if(element){

        element.textContent =
            formatNumber(value);

    }

}


/* =========================================================
   CARI NILAI KOLOM OBJECT
========================================================= */

function getObjectValue(
    row,
    kemungkinan
){

    if(!row){

        return '';

    }


    const keys =
        Object.keys(row);


    /*
       Coba exact match
    */

    for(
        const namaKolom of kemungkinan
    ){

        for(
            const key of keys
        ){

            if(
                String(key)
                    .trim()
                    .toLowerCase()
                ===
                String(namaKolom)
                    .trim()
                    .toLowerCase()
            ){

                return row[key];

            }

        }

    }


    /*
       Coba partial match
    */

    for(
        const key of keys
    ){

        const lowerKey =
            String(key)
                .trim()
                .toLowerCase();


        for(
            const namaKolom of kemungkinan
        ){

            const target =
                String(namaKolom)
                    .trim()
                    .toLowerCase();


            if(
                lowerKey.includes(target)
            ){

                return row[key];

            }

        }

    }


    return '';

}


/* =========================================================
   AMBIL NAMA BARANG DARI OBJECT
========================================================= */

function ambilNamaBarang(
    row
){

    return String(
        getObjectValue(
            row,
            [
                'Nama Barang',
                'Nama barang',
                'nama barang',
                'Barang',
                'barang',
                'Produk',
                'produk',
                'Nama Produk',
                'Nama produk',
                'Item',
                'item'
            ]
        ) || ''
    ).trim();

}


/* =========================================================
   AMBIL SEGEL DARI OBJECT
========================================================= */

function ambilSegel(
    row
){

    return parseExcelNumber(
        getObjectValue(
            row,
            [
                'Segel',
                'segel',
                'Stok Segel',
                'stok segel'
            ]
        )
    );

}


/* =========================================================
   AMBIL SELL-IN DARI OBJECT
========================================================= */

function ambilSellIn(
    row
){

    return parseExcelNumber(
        getObjectValue(
            row,
            [
                'Sell-In',
                'Sell In',
                'Sellin',
                'sell-in',
                'sell in',
                'sellin',
                'Stok Sell-In',
                'stok sell-in'
            ]
        )
    );

}


/* =========================================================
   NORMALISASI DATA MASTER API
========================================================= */

function normalisasiData(
    rawData
){

    if(!rawData){

        return [];

    }


    /*
       Jika API mengirim:

       {
           data: [...]
       }
    */

    if(
        !Array.isArray(rawData) &&
        typeof rawData === 'object'
    ){

        if(
            Array.isArray(rawData.data)
        ){

            rawData =
                rawData.data;

        }

        else if(
            Array.isArray(rawData.rows)
        ){

            rawData =
                rawData.rows;

        }

        else if(
            Array.isArray(rawData.values)
        ){

            rawData =
                rawData.values;

        }

        else{

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
       Jika API sudah mengirim OBJECT
    */

    if(
        typeof rawData[0] === 'object' &&
        !Array.isArray(rawData[0])
    ){

        return rawData;

    }


    /*
       Jika API mengirim MATRIX
    */

    if(
        Array.isArray(rawData[0])
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
   KONVERSI DATA OBJECT KE BARIS STOCK
========================================================= */

function normalisasiStockRows(
    objectData
){

    return objectData
        .map(
            row => {

                return {

                    nama:
                        ambilNamaBarang(
                            row
                        ),

                    segel:
                        ambilSegel(
                            row
                        ),

                    sellIn:
                        ambilSellIn(
                            row
                        )

                };

            }
        )
        .filter(
            row => {

                return (
                    row.nama !== ''
                );

            }
        );

}


/* =========================================================
   PISAH SP DAN VOUCHER
========================================================= */

function splitStockData(
    rows
){

    const sp = [];

    const voucher = [];


    let voucherStarted =
        false;


    rows.forEach(
        row => {

            const nama =
                String(
                    row.nama || ''
                ).trim();


            if(
                nama === ''
            ){

                return;

            }


            /*
               VDK menjadi awal Voucher
            */

            if(
                nama.toUpperCase() ===
                'VDK'
            ){

                voucherStarted =
                    true;

            }


            /*
               Sebelum VDK = SP
               Mulai VDK = Voucher
            */

            if(
                !voucherStarted
            ){

                sp.push(row);

            }

            else{

                voucher.push(row);

            }

        }
    );


    console.log(
        'DATA SP:',
        sp
    );


    console.log(
        'DATA VOUCHER:',
        voucher
    );


    return {

        sp,
        voucher

    };

}


/* =========================================================
   AMBIL DATA STOK DARI MASTER DATA
========================================================= */

async function fetchMasterData(){

    try{

        console.log(
            '======================================'
        );


        console.log(
            '🚀 MENGAMBIL DATA STOK GUDANG'
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
            '?action=stok-gudang&t=' +
            Date.now();


        console.log(
            'MASTER DATA API:',
            MASTER_DATA_API_URL
        );


        console.log(
            'ACTION:',
            'stok-gudang'
        );


        console.log(
            'URL:',
            url
        );


        /* =================================================
           FETCH API
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
                'Master Data API gagal. HTTP ' +
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
           AMBIL RAW DATA
        ================================================= */

        const rawData =
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
            'DATA OBJECT:',
            objectData
        );


        if(
            objectData.length === 0
        ){

            throw new Error(
                'Data sheet stok-gudang kosong atau format tidak dikenali.'
            );

        }


        /* =================================================
           NORMALISASI STOCK
        ================================================= */

        const stockRows =
            normalisasiStockRows(
                objectData
            );


        console.log(
            'DATA STOCK:',
            stockRows
        );


        if(
            stockRows.length === 0
        ){

            throw new Error(
                'Tidak ditemukan data stok barang.'
            );

        }


        /* =================================================
           PISAH SP DAN VOUCHER
        ================================================= */

        const sections =
            splitStockData(
                stockRows
            );


        /* =================================================
           RENDER SP
        ================================================= */

        renderSP(
            sections.sp
        );


        /* =================================================
           RENDER VOUCHER
        ================================================= */

        renderVoucher(
            sections.voucher
        );


        /* =================================================
           UPDATE DATA
           TANPA JAM
        ================================================= */

        if(updateTime){

            let waktu =
                new Date();


            /*
               Jika Apps Script mengirim
               updatedAt gunakan waktu tersebut.
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
                formatUpdateDate(
                    waktu
                );

        }


        console.log(
            '======================================'
        );


        console.log(
            '✅ STOK GUDANG BERHASIL DIMUAT'
        );


        console.log(
            'SP:',
            sections.sp.length
        );


        console.log(
            'Voucher:',
            sections.voucher.length
        );


        console.log(
            '======================================'
        );


    }
    catch(error){

        console.error(
            '======================================'
        );


        console.error(
            '❌ GAGAL MENGAMBIL DATA STOK GUDANG'
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
           UPDATE STATUS
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
           ERROR SP
        ================================================= */

        showTableError(
            'sp-data-table',
            'Gagal mengambil data SP: ' +
            error.message
        );


        /* =================================================
           ERROR VOUCHER
        ================================================= */

        showTableError(
            'voucher-data-table',
            'Gagal mengambil data Voucher: ' +
            error.message
        );

    }

}

/* =========================================================
   UPDATE SUMMARY GLOBAL
========================================================= */

function updateGlobalSummary(){

    /* =====================================================
       AMBIL TOTAL SP
    ===================================================== */

    const spSegel =
        Number(
            document
                .getElementById(
                    'sp-footer-segel'
                )
                ?.textContent
                .replace(/\./g,'')
        ) || 0;


    const spSellIn =
        Number(
            document
                .getElementById(
                    'sp-footer-sellin'
                )
                ?.textContent
                .replace(/\./g,'')
        ) || 0;


    const spTotal =
        spSegel +
        spSellIn;


    /* =====================================================
       AMBIL TOTAL VOUCHER
    ===================================================== */

    const voucherSegel =
        Number(
            document
                .getElementById(
                    'voucher-footer-segel'
                )
                ?.textContent
                .replace(/\./g,'')
        ) || 0;


    const voucherSellIn =
        Number(
            document
                .getElementById(
                    'voucher-footer-sellin'
                )
                ?.textContent
                .replace(/\./g,'')
        ) || 0;


    const voucherTotal =
        voucherSegel +
        voucherSellIn;


    /* =====================================================
       GRAND TOTAL
    ===================================================== */

    const grandSegel =
        spSegel +
        voucherSegel;


    const grandSellIn =
        spSellIn +
        voucherSellIn;


    const grandTotal =
        spTotal +
        voucherTotal;


    /* =====================================================
       SUMMARY SP
    ===================================================== */

    setText(
        'summary-sp-segel',
        spSegel
    );


    setText(
        'summary-sp-sellin',
        spSellIn
    );


    setText(
        'summary-sp',
        spTotal
    );


    /* =====================================================
       SUMMARY VOUCHER
    ===================================================== */

    setText(
        'summary-voucher-segel',
        voucherSegel
    );


    setText(
        'summary-voucher-sellin',
        voucherSellIn
    );


    setText(
        'summary-voucher',
        voucherTotal
    );


    /* =====================================================
       GRAND SUMMARY
    ===================================================== */

    setText(
        'summary-grand-segel',
        grandSegel
    );


    setText(
        'summary-grand-sellin',
        grandSellIn
    );


    setText(
        'summary-grand-total',
        grandTotal
    );

}
/* =========================================================
   RENDER SP
========================================================= */

function renderSP(
    rows
){

    const tbody =
        document.getElementById(
            'sp-data-table'
        );


    if(!tbody){

        return;

    }


    let html = '';

    let totalSegel = 0;

    let totalSellIn = 0;


    rows.forEach(
        row => {

            const namaBarang =
                String(
                    row.nama || ''
                ).trim();


            if(
                !namaBarang
            ){

                return;

            }


            const segel =
                Number(
                    row.segel
                ) || 0;


            const sellIn =
                Number(
                    row.sellIn
                ) || 0;


            const total =
                segel +
                sellIn;


            totalSegel +=
                segel;


            totalSellIn +=
                sellIn;


            html += `

                <tr>

                    <td class="item-name-col">
                        ${escapeHTML(
                            namaBarang
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            segel
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            sellIn
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            total
                        )}
                    </td>

                </tr>

            `;

        }
    );


    if(!html){

        html = `

            <tr>

                <td
                    colspan="4"
                    class="empty-text"
                >
                    Data SP tidak tersedia
                </td>

            </tr>

        `;

    }


    tbody.innerHTML =
        html;


    const totalSP =
        totalSegel +
        totalSellIn;


    /* =================================================
       HEADER
    ================================================= */

    setText(
        'sp-total',
        totalSP
    );


    /* =================================================
       SUMMARY
    ================================================= */

    setText(
        'sp-segel-total',
        totalSegel
    );


    setText(
        'sp-sellin-total',
        totalSellIn
    );


    setText(
        'sp-total-summary',
        totalSP
    );


    /* =================================================
       FOOTER
    ================================================= */

    setText(
        'sp-footer-segel',
        totalSegel
    );


    setText(
        'sp-footer-sellin',
        totalSellIn
    );


    setText(
        'sp-footer-total',
        totalSP
    );


    console.log(
        'TOTAL SP:',
        {
            segel:totalSegel,
            sellIn:totalSellIn,
            total:totalSP
        }
    );
updateGlobalSummary();
}


/* =========================================================
   RENDER VOUCHER
========================================================= */

function renderVoucher(
    rows
){

    const tbody =
        document.getElementById(
            'voucher-data-table'
        );


    if(!tbody){

        return;

    }


    let html = '';

    let totalSegel = 0;

    let totalSellIn = 0;


    rows.forEach(
        row => {

            const namaBarang =
                String(
                    row.nama || ''
                ).trim();


            if(
                !namaBarang
            ){

                return;

            }


            const segel =
                Number(
                    row.segel
                ) || 0;


            const sellIn =
                Number(
                    row.sellIn
                ) || 0;


            const total =
                segel +
                sellIn;


            totalSegel +=
                segel;


            totalSellIn +=
                sellIn;


            html += `

                <tr>

                    <td class="item-name-col">
                        ${escapeHTML(
                            namaBarang
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            segel
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            sellIn
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            total
                        )}
                    </td>

                </tr>

            `;

        }
    );


    if(!html){

        html = `

            <tr>

                <td
                    colspan="4"
                    class="empty-text"
                >
                    Data Voucher tidak tersedia
                </td>

            </tr>

        `;

    }


    tbody.innerHTML =
        html;


    const totalVoucher =
        totalSegel +
        totalSellIn;


    /* =================================================
       HEADER
    ================================================= */

    setText(
        'voucher-total',
        totalVoucher
    );


    /* =================================================
       SUMMARY
    ================================================= */

    setText(
        'voucher-segel-total',
        totalSegel
    );


    setText(
        'voucher-sellin-total',
        totalSellIn
    );


    setText(
        'voucher-total-summary',
        totalVoucher
    );


    /* =================================================
       FOOTER
    ================================================= */

    setText(
        'voucher-footer-segel',
        totalSegel
    );


    setText(
        'voucher-footer-sellin',
        totalSellIn
    );


    setText(
        'voucher-footer-total',
        totalVoucher
    );


    console.log(
        'TOTAL VOUCHER:',
        {
            segel:totalSegel,
            sellIn:totalSellIn,
            total:totalVoucher
        }
    );
updateGlobalSummary();
}


/* =========================================================
   ERROR TABLE
========================================================= */

function showTableError(
    tableId,
    message
){

    const tbody =
        document.getElementById(
            tableId
        );


    if(!tbody){

        return;

    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="4"
                class="loading-text"
            >
                ⚠️ ${escapeHTML(
                    message
                )}
            </td>

        </tr>

    `;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
){

    return String(value)

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
   START
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function(){

        console.log(
            '🚀 STOK-GUDANG DIMULAI'
        );


        console.log(
            'Target Sheet:',
            TARGET_SHEET_NAME
        );


        /*
           Data hanya diambil sekali
           saat halaman pertama kali dibuka.
        */

        fetchMasterData();

    }
);

function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "dashboard.html";

    }

}
