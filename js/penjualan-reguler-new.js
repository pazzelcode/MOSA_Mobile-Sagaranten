/* =========================================================
   MASTER DATA API
========================================================= */

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';

const TARGET_SHEET_NAME =
'penjualan-reguler-new';


/* =========================================================
   HELPER
========================================================= */

function escapeHTML(value){

    return String(value ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');

}


/* =========================================================
   NORMALIZE HEADER
========================================================= */

function normalizeHeader(value){

    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g,' ')
        .replace(/[_-]+/g,' ')
        .trim();

}


/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProductName(value){

    return String(value ?? '')
        .trim()
        .replace(/\s+/g,' ')
        .toUpperCase();

}


/* =========================================================
   PARSE NUMBER
========================================================= */

function parseNumber(value){

    if(
        value === null ||
        value === undefined ||
        value === ''
    ){

        return 0;

    }


    if(typeof value === 'number'){

        return Number.isFinite(value)
            ? value
            : 0;

    }


    let text =
        String(value)
            .trim()
            .replace(/^"|"$/g,'');


    if(
        text === '' ||
        text === '-'
    ){

        return 0;

    }


    /*
     * Format:
     * 10.000,50
     */

    if(
        text.includes('.') &&
        text.includes(',')
    ){

        text =
            text
                .replace(/\./g,'')
                .replace(',','.');

    }

    /*
     * Format:
     * 10,50
     */

    else if(
        text.includes(',')
    ){

        text =
            text.replace(',','.');

    }

    /*
     * Format:
     * 10.000
     */

    else if(
        text.includes('.')
    ){

        const parts =
            text.split('.');


        if(
            parts.length > 1 &&
            parts.slice(1)
                .every(
                    part => part.length === 3
                )
        ){

            text =
                text.replace(/\./g,'');

        }

    }


    const number =
        Number(text);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(value){

    const number =
        parseNumber(value);


    if(number === 0){

        return `<span class="zero-val">-</span>`;

    }


    return number.toLocaleString(
        'id-ID'
    );

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(value){

    const number =
        parseNumber(value);


    if(number === 0){

        return `<span class="zero-val">-</span>`;

    }


    return 'Rp ' +
        number.toLocaleString(
            'id-ID'
        );

}


/* =========================================================
   NORMALISASI RESPONSE
========================================================= */

function normalisasiData(rawData){

    if(!rawData){

        return [];

    }


    /*
     * Jika response:
     * {data: [...]}
     */

    if(
        !Array.isArray(rawData) &&
        typeof rawData === 'object'
    ){

        if(Array.isArray(rawData.data)){

            rawData =
                rawData.data;

        }

        else if(Array.isArray(rawData.rows)){

            rawData =
                rawData.rows;

        }

        else if(Array.isArray(rawData.values)){

            rawData =
                rawData.values;

        }

        else{

            rawData =
                [rawData];

        }

    }


    if(!Array.isArray(rawData)){

        return [];

    }


    if(rawData.length === 0){

        return [];

    }


    /*
     * Sudah berupa object
     */

    if(
        typeof rawData[0] === 'object' &&
        !Array.isArray(rawData[0])
    ){

        return rawData;

    }


    /*
     * Array:
     *
     * [
     *   [header...],
     *   [data...]
     * ]
     */

    if(Array.isArray(rawData[0])){

        const headers =
            rawData[0];


        return rawData
            .slice(1)
            .map(row => {

                const object = {};


                headers.forEach(
                    (header,index) => {

                        object[
                            String(header ?? '').trim()
                        ] =
                            row[index];

                    }
                );


                return object;

            });

    }


    return [];

}


/* =========================================================
   GET OBJECT VALUE
========================================================= */

function getObjectValue(
    row,
    candidates
){

    if(!row){

        return '';

    }


    const keys =
        Object.keys(row);


    /*
     * EXACT NORMALIZED
     */

    for(
        const candidate of candidates
    ){

        const target =
            normalizeHeader(candidate);


        for(
            const key of keys
        ){

            if(
                normalizeHeader(key) === target
            ){

                return row[key];

            }

        }

    }


    /*
     * PARTIAL
     */

    for(
        const candidate of candidates
    ){

        const target =
            normalizeHeader(candidate);


        for(
            const key of keys
        ){

            const current =
                normalizeHeader(key);


            if(
                current.includes(target)
            ){

                return row[key];

            }

        }

    }


    return '';

}


/* =========================================================
   GET PRODUCT
========================================================= */

function getProduk(row){

    return String(

        getObjectValue(
            row,
            [
                'Nama Barang',
                'Produk',
                'Barang',
                'Item',
                'SP'
            ]
        ) || ''

    ).trim();

}


/* =========================================================
   DAILY
========================================================= */

function getAndiDaily(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Andi'
            ]
        )
    );

}


function getParhanDaily(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Parhan',
                'Farhan'
            ]
        )
    );

}


function getEndenDaily(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Enden'
            ]
        )
    );

}


function getPebrianDaily(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Pebrian'
            ]
        )
    );

}


/* =========================================================
   HARGA
========================================================= */

function getHarga(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Harga',
                'harga'
            ]
        )
    );

}


/* =========================================================
   TOTAL PCS DARI SHEET
========================================================= */

function getSheetTotalPCS(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Total PCS',
                'Total Pcs',
                'total pcs'
            ]
        )
    );

}


/* =========================================================
   AMOUNT
========================================================= */

function getAmount(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Amount',
                'amount'
            ]
        )
    );

}


/* =========================================================
   TOTAL RP DARI SHEET
========================================================= */

function getSheetTotalRp(row){

    return parseNumber(
        getObjectValue(
            row,
            [
                'Total Rp',
                'Total RP',
                'Total Rupiah',
                'Amount Rp'
            ]
        )
    );

}


/* =========================================================
   WEEKLY VALUE
========================================================= */

function getWeeklyValue(
    row,
    user,
    week
){

    const candidates = [

        `${user} w${week}`,

        `${user} W${week}`,

        `${user} - w${week}`,

        `${user} - W${week}`,

        `${user}-w${week}`,

        `${user}-W${week}`,

        `${user}  w${week}`,

        `${user}  W${week}`,

        `w${week} ${user}`,

        `W${week} ${user}`,

        `w${week}-${user}`,

        `W${week}-${user}`

    ];


    return parseNumber(
        getObjectValue(
            row,
            candidates
        )
    );

}


/* =========================================================
   WEEKLY DSE
========================================================= */

function getWeeklyUserData(
    row,
    user
){

    const W1 =
        getWeeklyValue(
            row,
            user,
            1
        );


    const W2 =
        getWeeklyValue(
            row,
            user,
            2
        );


    const W3 =
        getWeeklyValue(
            row,
            user,
            3
        );


    const W4 =
        getWeeklyValue(
            row,
            user,
            4
        );


    const total =
        W1 +
        W2 +
        W3 +
        W4;


    return {

        W1,
        W2,
        W3,
        W4,
        total

    };

}


/* =========================================================
   WEEKLY DATA
========================================================= */

function getWeeklyData(row){

    const result = {

        Andi:
            getWeeklyUserData(
                row,
                'Andi'
            ),

        Parhan:
            getWeeklyUserData(
                row,
                'Parhan'
            ),

        Enden:
            getWeeklyUserData(
                row,
                'Enden'
            ),

        Pebrian:
            getWeeklyUserData(
                row,
                'Pebrian'
            )

    };


    result.grand =

        result.Andi.total +

        result.Parhan.total +

        result.Enden.total +

        result.Pebrian.total;


    /*
     * Amount Weekly
     *
     * Jika Amount ada di sheet,
     * gunakan nilai tersebut.
     *
     * Jika kosong,
     * hitung Total Weekly × Harga.
     */

    const harga =
        getHarga(row);


    const amountSheet =
        getAmount(row);


    result.amount =
        amountSheet > 0
            ? amountSheet
            : result.grand * harga;


    return result;

}


/* =========================================================
   KATEGORI SP
========================================================= */

const PRODUK_SP = [

    'SP ZERO',

    'SP 3GB INJEK',

    'SP 3GB ORI',

    'SP 9GB',

    'SP 10GB'

];


/* =========================================================
   KATEGORI VOUCHER
========================================================= */

const PRODUK_VCR = [

    'VDK',

    'VOUCHER 3GB 14HR',

    'VOUCHER 2,5GB',

    'FREEDOM INTERNET 3 GB',

    'VOUCHER 3.5GB 5HR',

    'VOUCHER 5GB 5HR',

    'VOUCHER 7GB 7HR',

    'FI 6GB',

    'FI 1.5GB/1D',

    'FI 3GB/1D',

    'FI 3GB/3D',

    'FI 5GB/2D',

    'FI 5GB/3D'

];


/* =========================================================
   CATEGORY
========================================================= */

function getProductCategory(productName){

    const product =
        normalizeProductName(
            productName
        );


    if(
        PRODUK_SP.includes(product)
    ){

        return 'SP';

    }


    if(
        PRODUK_VCR.includes(product)
    ){

        return 'VCR';

    }


    return null;

}


/* =========================================================
   NORMALISASI PENJUALAN
========================================================= */

function normalisasiPenjualanRows(
    objectData
){

    return objectData

        .map(row => {

            const produk =
                getProduk(row);


            const upper =
                normalizeProductName(
                    produk
                );


            return {

                raw: row,

                produk,

                isSection:
                    upper === 'SP' ||
                    upper === 'VOUCHER',

                isTotalSP:
                    upper === 'TOTAL SP',

                isTotalVoucher:
                    upper === 'TOTAL VOUCHER',

                andi:
                    getAndiDaily(row),

                parhan:
                    getParhanDaily(row),

                enden:
                    getEndenDaily(row),

                pebrian:
                    getPebrianDaily(row),

                harga:
                    getHarga(row),

                totalPCS:
                    getSheetTotalPCS(row),

                totalRp:
                    getSheetTotalRp(row),

                amount:
                    getAmount(row)

            };

        })

        .filter(
            row =>
                row.produk !== ''
        );

}


/* =========================================================
   RENDER DSE SUMMARY
========================================================= */

function renderDSESummary(
    user,
    data
){

    const sp =
        document.getElementById(
            `summary${user}SP`
        );


    const vcr =
        document.getElementById(
            `summary${user}VCR`
        );


    const rp =
        document.getElementById(
            `summary${user}Rp`
        );


    if(sp){

        sp.textContent =
            data.sp.toLocaleString(
                'id-ID'
            ) +
            ' PCS';

    }


    if(vcr){

        vcr.textContent =
            data.vcr.toLocaleString(
                'id-ID'
            ) +
            ' PCS';

    }


    if(rp){

        rp.textContent =
            data.rp.toLocaleString(
                'id-ID'
            );

    }

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary(rows){

    let totalPCS = 0;

    let totalRp = 0;


    let productCount = 0;


    const dse = {

        Andi:{
            sp:0,
            vcr:0,
            rp:0
        },

        Parhan:{
            sp:0,
            vcr:0,
            rp:0
        },

        Enden:{
            sp:0,
            vcr:0,
            rp:0
        },

        Pebrian:{
            sp:0,
            vcr:0,
            rp:0
        }

    };


    rows.forEach(row => {

        if(
            row.isSection ||
            row.isTotalSP ||
            row.isTotalVoucher
        ){

            return;

        }


        const category =
            getProductCategory(
                row.produk
            );


        if(!category){

            return;

        }


        productCount++;


        /*
         * ANDI
         */

        if(category === 'SP'){

            dse.Andi.sp +=
                row.andi;

            dse.Parhan.sp +=
                row.parhan;

            dse.Enden.sp +=
                row.enden;

            dse.Pebrian.sp +=
                row.pebrian;

        }


        if(category === 'VCR'){

            dse.Andi.vcr +=
                row.andi;

            dse.Parhan.vcr +=
                row.parhan;

            dse.Enden.vcr +=
                row.enden;

            dse.Pebrian.vcr +=
                row.pebrian;

        }


        dse.Andi.rp +=
            row.andi *
            row.harga;


        dse.Parhan.rp +=
            row.parhan *
            row.harga;


        dse.Enden.rp +=
            row.enden *
            row.harga;


        dse.Pebrian.rp +=
            row.pebrian *
            row.harga;


        const pcs =
            row.andi +
            row.parhan +
            row.enden +
            row.pebrian;


        totalPCS +=
            pcs;


        totalRp +=
            pcs *
            row.harga;

    });


    /*
     * HERO
     */

    const heroPCS =
        document.getElementById(
            'heroTotalPCS'
        );


    const heroRp =
        document.getElementById(
            'heroTotalRp'
        );


    const heroProducts =
        document.getElementById(
            'heroProductCount'
        );


    if(heroPCS){

        heroPCS.textContent =
            totalPCS.toLocaleString(
                'id-ID'
            );

    }


    if(heroRp){

        heroRp.textContent =
            'Rp ' +
            totalRp.toLocaleString(
                'id-ID'
            );

    }


    if(heroProducts){

        heroProducts.textContent =
            productCount.toLocaleString(
                'id-ID'
            );

    }


    renderDSESummary(
        'Andi',
        dse.Andi
    );


    renderDSESummary(
        'Parhan',
        dse.Parhan
    );


    renderDSESummary(
        'Enden',
        dse.Enden
    );


    renderDSESummary(
        'Pebrian',
        dse.Pebrian
    );

}


/* =========================================================
   BUILD TOTAL DATA
========================================================= */

function getTotalRowData(row){

    const weekly =
        getWeeklyData(
            row.raw
        );


    /*
     * TOTAL PER DSE
     *
     * Diambil dari W1-W4,
     * bukan kolom Total yang duplikat.
     */

    const andi =
        weekly.Andi.total;


    const parhan =
        weekly.Parhan.total;


    const enden =
        weekly.Enden.total;


    const pebrian =
        weekly.Pebrian.total;


    const totalPCS =
        andi +
        parhan +
        enden +
        pebrian;


    const harga =
        row.harga;


    /*
     * Total Rp
     *
     * Prioritas:
     *
     * 1. Total Rp dari sheet
     * 2. Total PCS × Harga
     */

    const sheetRp =
        row.totalRp;


    const totalRp =
        sheetRp > 0
            ? sheetRp
            : totalPCS * harga;


    return {

        andi,

        parhan,

        enden,

        pebrian,

        totalPCS,

        harga,

        totalRp

    };

}


/* =========================================================
   PROCESS + RENDER
========================================================= */

function processAndRender(
    objectData
){

    const rows =
        normalisasiPenjualanRows(
            objectData
        );


    if(rows.length === 0){

        document.getElementById(
            'bodyDaily'
        ).innerHTML = `

            <tr>
                <td
                    colspan="8"
                    class="loading-text"
                >
                    Data penjualan tidak tersedia
                </td>
            </tr>

        `;

        return;

    }


    /*
     * SUMMARY
     */

    updateSummary(rows);


    /*
     * DAILY HEADER
     */

    document.getElementById(
        'headDaily'
    ).innerHTML = `

        <tr>

            <th>Produk</th>

            <th>Andi</th>

            <th>Parhan</th>

            <th>Enden</th>

            <th>Pebrian</th>

            <th>Total PCS</th>

            <th>Harga</th>

            <th>Total Rp</th>

        </tr>

    `;


    let htmlDaily = '';

    let htmlTotal = '';

    let htmlWeekly = '';


    let runningPCS = 0;

    let runningRp = 0;


    let keptWeeklyTotalRow = false;


    rows.forEach(row => {

        /*
         * =========================================
         * SECTION
         * =========================================
         */

        if(row.isSection){

            runningPCS = 0;

            runningRp = 0;


            htmlDaily += `

                <tr class="section-row">

                    <td colspan="8">
                        ${escapeHTML(row.produk)}
                    </td>

                </tr>

            `;


            htmlTotal += `

                <tr class="section-row">

                    <td colspan="8">
                        ${escapeHTML(row.produk)}
                    </td>

                </tr>

            `;


            htmlWeekly += `

                <tr class="section-row">

                    <td colspan="24">
                        ${escapeHTML(row.produk)}
                    </td>

                </tr>

            `;


            return;

        }


        /*
         * =========================================
         * TOTAL VOUCHER
         * =========================================
         */

        if(row.isTotalVoucher){

            if(keptWeeklyTotalRow){

                return;

            }


            keptWeeklyTotalRow =
                true;

        }


        /*
         * =========================================
         * DAILY CALCULATION
         * =========================================
         */

        const linePCS =
            row.andi +
            row.parhan +
            row.enden +
            row.pebrian;


        const lineRp =
            linePCS *
            row.harga;


        const isTotal =
            row.isTotalSP ||
            row.isTotalVoucher;


        if(!isTotal){

            runningPCS +=
                linePCS;


            runningRp +=
                lineRp;

        }


        const dailyPCS =
            isTotal
                ? (
                    row.totalPCS ||
                    runningPCS
                )
                : linePCS;


        const dailyRp =
            isTotal
                ? (
                    row.totalRp ||
                    runningRp
                )
                : lineRp;


        const rowClass =
            isTotal
                ? 'total-row'
                : '';


        /*
         * =========================================
         * DAILY
         * =========================================
         */

        htmlDaily += `

            <tr class="${rowClass}">

                <td>
                    ${escapeHTML(row.produk)}
                </td>

                <td>
                    ${formatNumber(row.andi)}
                </td>

                <td>
                    ${formatNumber(row.parhan)}
                </td>

                <td>
                    ${formatNumber(row.enden)}
                </td>

                <td>
                    ${formatNumber(row.pebrian)}
                </td>

                <td>
                    ${formatNumber(dailyPCS)}
                </td>

                <td>
                    ${
                        isTotal
                            ? '-'
                            : formatNumber(row.harga)
                    }
                </td>

                <td>
                    ${formatRupiah(dailyRp)}
                </td>

            </tr>

        `;


        /*
         * =========================================
         * TOTAL TAB
         * =========================================
         */

        const totalData =
            getTotalRowData(
                row
            );


        htmlTotal += `

            <tr class="${rowClass}">

                <td>
                    ${escapeHTML(row.produk)}
                </td>

                <td>
                    ${formatNumber(
                        totalData.andi
                    )}
                </td>

                <td>
                    ${formatNumber(
                        totalData.parhan
                    )}
                </td>

                <td>
                    ${formatNumber(
                        totalData.enden
                    )}
                </td>

                <td>
                    ${formatNumber(
                        totalData.pebrian
                    )}
                </td>

                <td>
                    ${formatNumber(
                        totalData.totalPCS
                    )}
                </td>

                <td>
                    ${formatNumber(
                        totalData.harga
                    )}
                </td>

                <td>
                    ${formatRupiah(
                        totalData.totalRp
                    )}
                </td>

            </tr>

        `;


        /*
         * =========================================
         * WEEKLY
         * =========================================
         */

        const weekly =
            getWeeklyData(
                row.raw
            );


        const users = [

            'Andi',
            'Parhan',
            'Enden',
            'Pebrian'

        ];


        let weeklyHTML = '';


        users.forEach(user => {

            weeklyHTML += `

                <td class="weekly-num">
                    ${formatNumber(
                        weekly[user].W1
                    )}
                </td>

                <td class="weekly-num">
                    ${formatNumber(
                        weekly[user].W2
                    )}
                </td>

                <td class="weekly-num">
                    ${formatNumber(
                        weekly[user].W3
                    )}
                </td>

                <td class="weekly-num">
                    ${formatNumber(
                        weekly[user].W4
                    )}
                </td>

                <td class="
                    weekly-total-cell
                    weekly-num
                ">
                    ${formatNumber(
                        weekly[user].total
                    )}
                </td>

            `;

        });


        htmlWeekly += `

            <tr class="${rowClass}">

                <td>
                    ${escapeHTML(row.produk)}
                </td>

                ${weeklyHTML}

                <td class="
                    weekly-grand-total
                    weekly-num
                ">
                    ${formatNumber(
                        weekly.grand
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.harga
                    )}
                </td>

                <td>
                    ${formatRupiah(
                        weekly.amount
                    )}
                </td>

            </tr>

        `;


        /*
         * =========================================
         * PEMISAH
         * =========================================
         */

        if(isTotal){

            htmlDaily += `

                <tr class="empty-row">
                    <td colspan="8"></td>
                </tr>

            `;


            htmlTotal += `

                <tr class="empty-row">
                    <td colspan="8"></td>
                </tr>

            `;


            htmlWeekly += `

                <tr class="empty-row">
                    <td colspan="24"></td>
                </tr>

            `;

        }

    });


    /*
     * =========================================
     * INSERT
     * =========================================
     */

    document.getElementById(
        'bodyDaily'
    ).innerHTML =
        htmlDaily;


    document.getElementById(
        'bodyTotal'
    ).innerHTML =
        htmlTotal;


    document.getElementById(
        'bodyWeekly'
    ).innerHTML =
        htmlWeekly;

}


/* =========================================================
   FETCH API
========================================================= */

async function fetchMasterData(){

    try{

        document.getElementById(
            'updateTime'
        ).textContent =
            'Update Data: Memuat...';


        document.getElementById(
            'heroStatus'
        ).textContent =
            'SYNC';


        const url =
            MASTER_DATA_API_URL +
            '?action=' +
            TARGET_SHEET_NAME +
            '&t=' +
            Date.now();


        const response =
            await fetch(
                url,
                {
                    method:'GET',
                    cache:'no-store'
                }
            );


        if(!response.ok){

            throw new Error(
                'Master Data API gagal. HTTP ' +
                response.status
            );

        }


        const result =
            await response.json();


        if(
            !result ||
            result.success !== true
        ){

            throw new Error(
                result?.message ||
                'API mengembalikan response gagal'
            );

        }


        const objectData =
            normalisasiData(
                result.data
            );


        if(objectData.length === 0){

            throw new Error(
                'Data penjualan kosong'
            );

        }


        processAndRender(
            objectData
        );


        /*
         * UPDATE TIME
         */

        let updateDate =
            null;


        if(result.updatedAt){

            const parsed =
                new Date(
                    result.updatedAt
                );


            if(
                !isNaN(
                    parsed.getTime()
                )
            ){

                updateDate =
                    parsed;

            }

        }


        if(!updateDate){

            updateDate =
                new Date();

        }


        document.getElementById(
            'updateTime'
        ).textContent =
            'Update Data: ' +
            updateDate.toLocaleString(
                'id-ID',
                {
                    day:'2-digit',
                    month:'long',
                    year:'numeric'
                }
            );


        document.getElementById(
            'heroStatus'
        ).textContent =
            'LIVE';

    }

    catch(error){

        console.error(
            'Gagal mengambil data penjualan:',
            error
        );


        document.getElementById(
            'heroStatus'
        ).textContent =
            'ERROR';


        document.getElementById(
            'bodyDaily'
        ).innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="loading-text"
                >

                    ⚠️ Gagal memuat data:
                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;


        document.getElementById(
            'bodyTotal'
        ).innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="loading-text"
                >

                    ⚠️ Gagal memuat data

                </td>

            </tr>

        `;


        document.getElementById(
            'bodyWeekly'
        ).innerHTML = `

            <tr>

                <td
                    colspan="24"
                    class="loading-text"
                >

                    ⚠️ Gagal memuat data

                </td>

            </tr>

        `;


        document.getElementById(
            'updateTime'
        ).textContent =
            'Update Data: Gagal memuat';

    }

}


/* =========================================================
   SHOW TAB
========================================================= */

function showTab(type){

    const wrappers = {

        daily:
            document.getElementById(
                'wrapperDaily'
            ),

        weekly:
            document.getElementById(
                'wrapperWeekly'
            ),

        total:
            document.getElementById(
                'wrapperTotal'
            )

    };


    const buttons = {

        daily:
            document.getElementById(
                'btnDaily'
            ),

        weekly:
            document.getElementById(
                'btnWeekly'
            ),

        total:
            document.getElementById(
                'btnTotal'
            )

    };


    Object.values(
        wrappers
    ).forEach(
        wrapper => {

            if(wrapper){

                wrapper.style.display =
                    'none';

            }

        }
    );


    Object.values(
        buttons
    ).forEach(
        button => {

            if(button){

                button.classList.remove(
                    'active'
                );

            }

        }
    );


    if(wrappers[type]){

        wrappers[type].style.display =
            'block';

    }


    if(buttons[type]){

        buttons[type].classList.add(
            'active'
        );

    }

}

/* =========================================================  
   DOWNLOAD TABLE AS IMAGE  
   FULL TABLE - TIDAK MEMOTONG BARIS BAWAH  
========================================================= */  
  
async function downloadTableAsImage(  
    tableId,  
    fileName,  
    title  
){  
  
    const table =  
        document.getElementById(  
            tableId  
        );  
  
  
    if(!table){  
  
        throw new Error(  
            `Tabel ${tableId} tidak ditemukan`  
        );  
  
    }  
  
  
    /* =====================================================  
     * CLONE TABLE  
     * ===================================================== */  
  
    const clone =  
        table.cloneNode(true);  
  
  
    /* =====================================================  
     * CONTAINER EXPORT  
     * ===================================================== */  
  
    const container =  
        document.createElement(  
            'div'  
        );  
  
  
    container.style.position =  
        'absolute';  
  
    container.style.left =  
        '-999999px';  
  
    container.style.top =  
        '0';  
  
    container.style.background =  
        '#ffffff';  
  
    container.style.padding =  
        '30px';  
  
    container.style.boxSizing =  
        'border-box';  
  
    container.style.display =  
        'block';  
  
    container.style.overflow =  
        'visible';  
  
    container.style.height =  
        'auto';  
  
    container.style.width =  
        Math.max(  
            table.scrollWidth,  
            table.offsetWidth,  
            1000  
        ) +  
        'px';  
  
  
    /* =====================================================  
     * JUDUL & SUBTITLE  
     * ===================================================== */  
  
    const titleElement =  
        document.createElement(  
            'div'  
        );  
  
    titleElement.textContent =  
        'PENJUALAN FISIK — ' +  
        String(title || '').toUpperCase();  
  
    titleElement.style.display =  
        'block';  
    titleElement.style.width =  
        '100%';  
    titleElement.style.whiteSpace =  
        'nowrap';  
    titleElement.style.fontFamily =  
        'Arial, Helvetica, sans-serif';  
    titleElement.style.fontSize =  
        '26px';  
    titleElement.style.fontWeight =  
        '700';  
    titleElement.style.color =  
        '#0f172a';  
    titleElement.style.margin =  
        '0';  
    titleElement.style.padding =  
        '0 0 10px 0';  
  
  
    const subtitleElement =  
        document.createElement(  
            'div'  
        );  
  
    subtitleElement.textContent =  
        'Monitoring penjualan SP & Voucher DSE';  
  
    subtitleElement.style.display =  
        'block';  
    subtitleElement.style.width =  
        '100%';  
    subtitleElement.style.whiteSpace =  
        'nowrap';  
    subtitleElement.style.fontFamily =  
        'Arial, Helvetica, sans-serif';  
    subtitleElement.style.fontSize =  
        '14px';  
    subtitleElement.style.color =  
        '#64748b';  
    subtitleElement.style.margin =  
        '0';  
    subtitleElement.style.padding =  
        '0 0 22px 0';  
  
  
    /* =====================================================  
     * PAKSA TABLE & SEMUA ELEMEN TAMPIL FULL  
     * ===================================================== */  
  
    clone.style.display =  
        'table';  
    clone.style.visibility =  
        'visible';  
    clone.style.opacity =  
        '1';  
    clone.style.height =  
        'auto';  
    clone.style.minHeight =  
        '0';  
    clone.style.maxHeight =  
        'none';  
    clone.style.overflow =  
        'visible';  
    clone.style.width =  
        Math.max(  
            table.scrollWidth,  
            table.offsetWidth,  
            1000  
        ) +  
        'px';  
  
  
    clone.querySelectorAll('tbody, tr, td, th').forEach(el => {  
        el.style.visibility = 'visible';  
        el.style.opacity = '1';  
        el.style.overflow = 'visible';  
        el.style.maxHeight = 'none';  
        if (el.tagName === 'TR') el.style.display = 'table-row';  
        if (el.tagName === 'TBODY') el.style.display = 'table-row-group';  
    });  
  
  
    container.appendChild(titleElement);  
    container.appendChild(subtitleElement);  
    container.appendChild(clone);  
  
    document.body.appendChild(container);  
  
  
    try{  
  
        await new Promise(  
            resolve => {  
                requestAnimationFrame(  
                    () => {  
                        requestAnimationFrame(  
                            () => {  
                                setTimeout(resolve, 150);  
                            }  
                        );  
                    }  
                );  
            }  
        );  
  
  
        const rect =  
            container.getBoundingClientRect();  
  
        const width =  
            Math.ceil(  
                Math.max(  
                    container.scrollWidth,  
                    rect.width  
                )  
            );  
  
        /* =====================================================  
         * PENAMBAHAN BUFFER AMAN DI SINI (+ 150px)  
         * ===================================================== */  
        const height =  
            Math.ceil(  
                Math.max(  
                    container.scrollHeight,  
                    container.offsetHeight,  
                    clone.offsetTop +  
                    clone.offsetHeight +  
                    150  // <-- Buffer ekstra agar baris terbawah tidak terpotong  
                )  
            );  
  
  
        const canvas =  
            await html2canvas(  
                container,  
                {  
                    backgroundColor: '#ffffff',  
                    scale: Math.min(window.devicePixelRatio || 2, 2),  
                    useCORS: true,  
                    allowTaint: false,  
                    logging: false,  
                    width: width,  
                    height: height,  
                    windowWidth: width,  
                    windowHeight: height,  
                    scrollX: 0,  
                    scrollY: 0  
                }  
            );  
  
  
        const link =  
            document.createElement('a');  
  
        link.download =  
            fileName + '.png';  
  
        link.href =  
            canvas.toDataURL('image/png', 1.0);  
  
        document.body.appendChild(link);  
        link.click();  
        document.body.removeChild(link);  
  
    }  
    finally{  
        if(container.parentNode){  
            container.parentNode.removeChild(container);  
        }  
    }  
}


/* =========================================================
   DOWNLOAD MODAL
========================================================= */

function openDownloadModal(){

    const modal =
        document.getElementById(
            'downloadModal'
        );

    if(!modal){

        return;

    }

    modal.style.display =
        'flex';

}


function closeDownloadModal(){

    const modal =
        document.getElementById(
            'downloadModal'
        );

    if(!modal){

        return;

    }

    modal.style.display =
        'none';

}


/* =========================================================
   DOWNLOAD PILIHAN
========================================================= */

async function executeDownload(type){

    const modal =
        document.getElementById(
            'downloadModal'
        );


    /*
     * Tutup modal
     */

    closeDownloadModal();


    /*
     * Tentukan tabel
     */

    let tableId = '';
    let fileName = '';
    let title = '';


    if(type === 'daily'){

        tableId =
            'tableDaily';

        fileName =
            'penjualan-fisik-daily';

        title =
            'Daily';

    }


    else if(type === 'weekly'){

        tableId =
            'tableWeekly';

        fileName =
            'penjualan-fisik-weekly';

        title =
            'Weekly';

    }


    else if(type === 'total'){

        tableId =
            'tableTotal';

        fileName =
            'penjualan-fisik-total';

        title =
            'Total';

    }


    else{

        return;

    }


    /*
     * Tombol utama
     */

    const button =
        document.getElementById(
            'btnDownload'
        );


    if(button){

        button.disabled =
            true;

        button.innerHTML = `

            <span class="download-icon">
                ⏳
            </span>

            <span>
                Membuat ${title}...
            </span>

        `;

    }


    try{

        await downloadTableAsImage(
            tableId,
            fileName,
            title
        );


        /*
         * Sukses
         */

        if(button){

            button.innerHTML = `

                <span class="download-icon">
                    ✓
                </span>

                <span>
                    Berhasil
                </span>

            `;

        }


    }

    catch(error){

        console.error(
            'Gagal download:',
            error
        );


        if(button){

            button.innerHTML = `

                <span class="download-icon">
                    ⚠️
                </span>

                <span>
                    Gagal
                </span>

            `;

        }


        alert(
            'Gagal membuat gambar tabel.\n\n' +
            error.message
        );

    }


    finally{

        setTimeout(
            () => {

                if(button){

                    button.disabled =
                        false;

                    button.innerHTML = `

                        <span class="download-icon">
                            ↓
                        </span>

                        <span>
                            Download Gambar
                        </span>

                    `;

                }

            },
            1200
        );

    }

}


/* =========================================================
   KLIK AREA GELAP = TUTUP MODAL
========================================================= */

document.addEventListener(
    'click',
    function(event){

        const modal =
            document.getElementById(
                'downloadModal'
            );


        if(
            modal &&
            event.target === modal
        ){

            closeDownloadModal();

        }

    }
);


/* =========================================================
   ESC = TUTUP MODAL
========================================================= */

document.addEventListener(
    'keydown',
    function(event){

        if(
            event.key === 'Escape'
        ){

            closeDownloadModal();

        }

    }
);
/* =========================================================
   START
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        fetchMasterData();

    }
);


/* =========================================================
   BACK
========================================================= */

function goBack(){

    if(
        window.history.length > 1
    ){

        window.history.back();

    }

    else{

        window.location.href =
            'dashboard.html';

    }

}
