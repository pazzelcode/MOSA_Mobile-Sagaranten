/* =========================================================
   MASTER DATA API
========================================================= */

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';

const TARGET_SHEET_NAME =
'penjualan-paket-jupiter';


/* =========================================================
   DATA GLOBAL
========================================================= */

let currentLoadedData = [];


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(val){

    const number = parseNumber(val);

    if(number === 0){
        return '-';
    }

    return new Intl.NumberFormat(
        'id-ID'
    ).format(number);

}


/* =========================================================
   PARSE NUMBER
========================================================= */

function parseNumber(val){

    if(
        val === null ||
        val === undefined ||
        val === ''
    ){

        return 0;

    }


    if(
        typeof val === 'number'
    ){

        return val;

    }


    let text =
        String(val)
            .trim()
            .replace(/^"|"$/g,'');


    if(
        text === '-' ||
        text === ''
    ){

        return 0;

    }


    /*
       Format Indonesia
       1.500
       10.000
       1.500.000
    */

    text =
        text.replace(/\./g,'');


    /*
       Desimal koma
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
   ESCAPE HTML
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
   NORMALISASI RESPONSE API
========================================================= */

function normalisasiData(rawData){

    if(!rawData){

        return [];

    }


    /*
       API:

       {
           data:[...]
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
       API sudah object
    */

    if(
        typeof rawData[0] === 'object' &&
        !Array.isArray(rawData[0])
    ){

        return rawData;

    }


    /*
       API matrix

       [
          ["Tanggal","Paket","Outlet",...],
          [...]
       ]
    */

    if(
        Array.isArray(rawData[0])
    ){

        const headers =
            rawData[0];


        return rawData
            .slice(1)
            .map(row => {

                const object = {};


                headers.forEach(
                    (
                        header,
                        index
                    ) => {

                        if(
                            header !== null &&
                            header !== undefined &&
                            header !== ''
                        ){

                            object[
                                String(header).trim()
                            ] =
                                row[index];

                        }

                    }
                );


                return object;

            });

    }


    return [];

}


/* =========================================================
   CARI KOLOM OBJECT
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
       EXACT MATCH
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
       PARTIAL MATCH
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
   GET TANGGAL
========================================================= */

function getTanggal(row){

    return getObjectValue(
        row,
        [
            'Tanggal',
            'tanggal',
            'Tgl',
            'tgl',
            'Date',
            'date'
        ]
    );

}


/* =========================================================
   GET PAKET
========================================================= */

function getPaket(row){

    return String(

        getObjectValue(
            row,
            [
                'Paket',
                'paket',
                'Nama Paket',
                'Nama paket',
                'Produk',
                'produk',
                'Barang',
                'barang'
            ]
        ) || ''

    ).trim();

}


/* =========================================================
   GET OUTLET
========================================================= */

function getOutlet(row){

    return String(

        getObjectValue(
            row,
            [
                'Outlet',
                'outlet',
                'Nama Outlet',
                'Nama outlet'
            ]
        ) || ''

    ).trim();

}


/* =========================================================
   GET CSO
========================================================= */

function getCSO(row){

    return String(

        getObjectValue(
            row,
            [
                'CSO',
                'cso',
                'Nama CSO',
                'Nama cso',
                'DSE',
                'dse'
            ]
        ) || ''

    ).trim();

}


/* =========================================================
   GET QTY
========================================================= */

function getQty(row){

    return parseNumber(

        getObjectValue(
            row,
            [
                'Qty',
                'qty',
                'Quantity',
                'quantity',
                'Jumlah',
                'jumlah'
            ]
        )

    );

}


/* =========================================================
   GET TAGIHAN / PENGAMBILAN
========================================================= */

function getTagihan(row){

    return parseNumber(

        getObjectValue(
            row,
            [
                'Tagihan',
                'tagihan',
                'Pengambilan',
                'pengambilan',
                'Total Tagihan',
                'Total tagihan'
            ]
        )

    );

}


/* =========================================================
   GET PEMBAYARAN
========================================================= */

function getPembayaran(row){

    return parseNumber(

        getObjectValue(
            row,
            [
                'Pembayaran',
                'pembayaran',
                'Bayar',
                'bayar',
                'Total Pembayaran',
                'Total pembayaran'
            ]
        )

    );

}


/* =========================================================
   GET SELISIH
========================================================= */

function getSelisih(row){

    const value =
        getObjectValue(
            row,
            [
                'Selisih',
                'selisih',
                'Sisa',
                'sisa',
                'Sisa Belum Bayar',
                'Sisa belum bayar'
            ]
        );


    /*
       Jika kolom Selisih tidak tersedia,
       hitung otomatis.
    */

    if(
        value === '' ||
        value === null ||
        value === undefined
    ){

        return (
            getTagihan(row) -
            getPembayaran(row)
        );

    }


    return parseNumber(value);

}


/* =========================================================
   GET KETERANGAN
========================================================= */

function getKeterangan(row){

    return String(

        getObjectValue(
            row,
            [
                'Ket',
                'ket',
                'Keterangan',
                'keterangan',
                'Catatan',
                'catatan'
            ]
        ) || ''

    ).trim();

}


/* =========================================================
   NORMALISASI DATA JUPITER
========================================================= */

function normalisasiJupiterRows(
    objectData
){

    return objectData
        .map(row => {

            const tagihan =
                getTagihan(row);

            const pembayaran =
                getPembayaran(row);

            return {

                raw: row,

                tanggal:
                    getTanggal(row),

                paket:
                    getPaket(row),

                outlet:
                    getOutlet(row),

                cso:
                    getCSO(row),

                qty:
                    getQty(row),

                tagihan:
                    tagihan,

                pembayaran:
                    pembayaran,

                selisih:
                    getSelisih(row),

                keterangan:
                    getKeterangan(row)

            };

        })
        .filter(row => {

            return (
                row.paket !== '' ||
                row.outlet !== '' ||
                row.cso !== '' ||
                row.qty !== 0 ||
                row.tagihan !== 0 ||
                row.pembayaran !== 0
            );

        });

}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatDate(val){

    if(
        val === null ||
        val === undefined ||
        val === ''
    ){

        return '-';

    }


    /*
       Jika serial Excel
    */

    if(
        typeof val === 'number'
    ){

        const date =
            new Date(
                Math.round(
                    (val - 25569) *
                    86400 *
                    1000
                )
            );


        if(
            !isNaN(
                date.getTime()
            )
        ){

            return date.toLocaleDateString(
                'id-ID'
            );

        }

    }


    /*
       Jika string tanggal
    */

    const parsed =
        new Date(val);


    if(
        !isNaN(
            parsed.getTime()
        )
    ){

        return parsed.toLocaleDateString(
            'id-ID'
        );

    }


    return val;

}


/* =========================================================
   HITUNG TOTAL
========================================================= */

function calculateTotals(rows){

    const totals = {

        take: 0,

        pay: 0,

        qty: 0

    };


    rows.forEach(
        row => {

            totals.take +=
                row.tagihan;

            totals.pay +=
                row.pembayaran;

            totals.qty +=
                row.qty;

        }
    );


    return totals;

}


/* =========================================================
   UPDATE SUMMARY ATAS
========================================================= */

function updateSummary(rows){

    const totals =
        calculateTotals(rows);


    document.getElementById(
        'topTotalTake'
    ).textContent =
        'Rp ' +
        formatRupiah(
            totals.take
        );


    document.getElementById(
        'topTotalPay'
    ).textContent =
        'Rp ' +
        formatRupiah(
            totals.pay
        );


    document.getElementById(
        'topTotalSisa'
    ).textContent =
        'Rp ' +
        formatRupiah(
            totals.take -
            totals.pay
        );


    document.getElementById(
        'topTotalQty'
    ).textContent =
        totals.qty +
        ' Paket';

}


/* =========================================================
   POPULATE FILTER CSO
========================================================= */

function populateCSOFilter(rows){

    const dseFilter =
        document.getElementById(
            'dseFilter'
        );


    /*
       Hapus option CSO lama
       tetapi pertahankan ALL dan SUMMARY
    */

    dseFilter.innerHTML = `

        <option value="ALL">
            -- TAMPILKAN SEMUA DATA --
        </option>

        <option value="SUMMARY">
            -- SUMMARY PAKET JUPITER --
        </option>

    `;


    const csoList = [

        ...new Set(

            rows
                .map(
                    row => row.cso
                )
                .filter(
                    cso => cso !== ''
                )

        )

    ];


    csoList.sort();


    csoList.forEach(
        cso => {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                cso;


            option.textContent =
                cso;


            dseFilter.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderTable(
    filterValue
){

    const container =
        document.getElementById(
            'cardsListContainer'
        );


    if(!container){

        return;

    }


    let rows =
        currentLoadedData;


    /*
       FILTER CSO
    */

    if(
        filterValue !== 'ALL' &&
        filterValue !== 'SUMMARY'
    ){

        rows =
            rows.filter(
                row =>
                    row.cso ===
                    filterValue
            );

    }


    /*
       SUMMARY
    */

    if(
        filterValue === 'SUMMARY'
    ){

        renderSummaryTable(
            currentLoadedData
        );

        return;

    }


    /*
       TOTAL
    */

    let totalQty = 0;

    let totalTake = 0;

    let totalPay = 0;

    let totalSelisih = 0;


    const tableRows =
        rows.map(
            (
                row,
                index
            ) => {

                totalQty +=
                    row.qty;

                totalTake +=
                    row.tagihan;

                totalPay +=
                    row.pembayaran;

                totalSelisih +=
                    row.selisih;


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${formatDate(
                                row.tanggal
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                row.paket ||
                                '-'
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                row.outlet ||
                                '-'
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                row.cso ||
                                '-'
                            )}
                        </td>

                        <td>
                            ${row.qty}
                        </td>

                        <td>
                            ${formatRupiah(
                                row.tagihan
                            )}
                        </td>

                        <td>
                            ${formatRupiah(
                                row.pembayaran
                            )}
                        </td>

                        <td style="
                            color:
                            ${row.selisih !== 0
                                ? 'red'
                                : 'green'};
                            font-weight:700;
                        ">

                            ${formatRupiah(
                                row.selisih
                            )}

                        </td>

                        <td>
                            ${escapeHTML(
                                row.keterangan ||
                                '-'
                            )}
                        </td>

                    </tr>

                `;

            }
        )
        .join('');


    container.innerHTML = `

        <div class="table-responsive">

            <table>

                <thead>

                    <tr>

                        <th>No</th>

                        <th>Tgl</th>

                        <th>Paket</th>

                        <th>Outlet</th>

                        <th>CSO</th>

                        <th>Qty</th>

                        <th>Tagihan</th>

                        <th>Bayar</th>

                        <th>Selisih</th>

                        <th>Ket</th>

                    </tr>

                </thead>


                <tbody>

                    ${tableRows}


                    <tr style="
                        background:#f1f5f9;
                        font-weight:700;
                    ">

                        <td colspan="5">
                            TOTAL
                        </td>

                        <td>
                            ${totalQty}
                        </td>

                        <td>
                            ${formatRupiah(
                                totalTake
                            )}
                        </td>

                        <td>
                            ${formatRupiah(
                                totalPay
                            )}
                        </td>

                        <td>
                            ${formatRupiah(
                                totalSelisih
                            )}
                        </td>

                        <td>
                            -
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    `;


    container.style.display =
        'block';


    /*
       Ranking dan total gabungan
       tetap diperbarui
    */

    renderRanking(
        rows
    );

    renderTotalGabungan(
        rows
    );

}


/* =========================================================
   SUMMARY CSO
========================================================= */

function renderSummaryTable(
    rows
){

    const container =
        document.getElementById(
            'cardsListContainer'
        );


    const summary = {};


    let totalTake = 0;

    let totalPay = 0;

    let totalQty = 0;


    let totalP1 = 0;

    let totalP2 = 0;

    let totalP3 = 0;

    let totalP4 = 0;


    rows.forEach(
        row => {

            if(!row.cso){

                return;

            }


            if(
                !summary[row.cso]
            ){

                summary[row.cso] = {

                    pengambilan: 0,

                    bayar: 0,

                    p1: 0,

                    p2: 0,

                    p3: 0,

                    p4: 0,

                    total: 0

                };

            }


            summary[row.cso]
                .pengambilan +=
                    row.tagihan;


            summary[row.cso]
                .bayar +=
                    row.pembayaran;


            summary[row.cso]
                .total +=
                    row.qty;


            const paket =
                row.paket
                    .toUpperCase()
                    .replace(/\s/g,'');


            if(
                paket.includes(
                    'PAKET1'
                )
            ){

                summary[row.cso]
                    .p1 += row.qty;

                totalP1 += row.qty;

            }

            else if(
                paket.includes(
                    'PAKET2'
                )
            ){

                summary[row.cso]
                    .p2 += row.qty;

                totalP2 += row.qty;

            }

            else if(
                paket.includes(
                    'PAKET3'
                )
            ){

                summary[row.cso]
                    .p3 += row.qty;

                totalP3 += row.qty;

            }

            else if(
                paket.includes(
                    'PAKET4'
                )
            ){

                summary[row.cso]
                    .p4 += row.qty;

                totalP4 += row.qty;

            }

        }
    );


    const summaryRows =
        Object.keys(summary)
            .map(
                (
                    cso,
                    index
                ) => {

                    const s =
                        summary[cso];


                    totalTake +=
                        s.pengambilan;


                    totalPay +=
                        s.bayar;


                    totalQty +=
                        s.total;


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    cso
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    s.pengambilan
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    s.bayar
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    s.pengambilan -
                                    s.bayar
                                )}
                            </td>

                            <td>
                                ${s.p1}
                            </td>

                            <td>
                                ${s.p2}
                            </td>

                            <td>
                                ${s.p3}
                            </td>

                            <td>
                                ${s.p4}
                            </td>

                            <td style="
                                font-weight:700;
                            ">

                                ${s.total}

                            </td>

                        </tr>

                    `;

                }
            )
            .join('');


    container.innerHTML = `

        <div class="table-responsive">

            <table>

                <thead>

                    <tr>

                        <th>No</th>

                        <th>Nama CSO</th>

                        <th>Pengambilan</th>

                        <th>Pembayaran</th>

                        <th>Sisa</th>

                        <th>P1</th>

                        <th>P2</th>

                        <th>P3</th>

                        <th>P4</th>

                        <th>Total</th>

                    </tr>

                </thead>


                <tbody>

                    ${summaryRows}


                    <tr style="
                        background:#f1f5f9;
                        font-weight:700;
                    ">

                        <td colspan="2">
                            TOTAL
                        </td>

                        <td>
                            ${formatRupiah(
                                totalTake
                            )}
                        </td>

                        <td>
                            ${formatRupiah(
                                totalPay
                            )}
                        </td>

                        <td>
                            ${formatRupiah(
                                totalTake -
                                totalPay
                            )}
                        </td>

                        <td>
                            ${totalP1}
                        </td>

                        <td>
                            ${totalP2}
                        </td>

                        <td>
                            ${totalP3}
                        </td>

                        <td>
                            ${totalP4}
                        </td>

                        <td>
                            ${totalQty}
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    `;


    container.style.display =
        'block';


    renderRanking(
        rows
    );

    renderTotalGabungan(
        rows
    );

}


/* =========================================================
   RANKING CSO
========================================================= */

function renderRanking(rows){

    const rankingCard =
        document.getElementById(
            'rankingCard'
        );


    if(!rankingCard){

        return;

    }


    const ranking = {};


    rows.forEach(
        row => {

            if(!row.cso){

                return;

            }


            if(
                !ranking[row.cso]
            ){

                ranking[row.cso] = 0;

            }


            ranking[row.cso] +=
                row.qty;

        }
    );


    const sorted =
        Object.entries(
            ranking
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1] -
                a[1]
        );


    let html = `

        <div class="ranking-header">

            🏆 RANKING PENJUALAN CSO

        </div>

    `;


    if(
        sorted.length === 0
    ){

        html += `

            <div class="detail-row-item">

                <span class="label">
                    Belum ada data
                </span>

            </div>

        `;

    }


    sorted.forEach(
        (
            item,
            index
        ) => {

            const rank =
                index + 1;


            let badgeClass =
                'rank-other';


            if(
                rank === 1
            ){

                badgeClass =
                    'rank-1';

            }

            else if(
                rank === 2
            ){

                badgeClass =
                    'rank-2';

            }

            else if(
                rank === 3
            ){

                badgeClass =
                    'rank-3';

            }


            html += `

                <div class="detail-row-item">

                    <span class="label">

                        <span class="
                            rank-badge
                            ${badgeClass}
                        ">

                            ${rank}

                        </span>

                        ${escapeHTML(
                            item[0]
                        )}

                    </span>


                    <span class="val">

                        ${item[1]}
                        Paket

                    </span>

                </div>

            `;

        }
    );


    rankingCard.innerHTML =
        html;

}


/* =========================================================
   TOTAL GABUNGAN
========================================================= */

function renderTotalGabungan(
    rows
){

    const card =
        document.getElementById(
            'totalGabunganCard'
        );


    if(!card){

        return;

    }


    const totals =
        calculateTotals(
            rows
        );


    card.innerHTML = `

        <div class="total-gabungan-header">

            📦 TOTAL GABUNGAN PAKET JUPITER

        </div>


        <div class="detail-row-item">

            <span class="label">
                Total Paket
            </span>

            <span class="val">
                ${totals.qty} Paket
            </span>

        </div>


        <div class="detail-row-item">

            <span class="label">
                Total Pengambilan
            </span>

            <span class="val">
                Rp ${formatRupiah(
                    totals.take
                )}
            </span>

        </div>


        <div class="detail-row-item">

            <span class="label">
                Total Pembayaran
            </span>

            <span class="val">
                Rp ${formatRupiah(
                    totals.pay
                )}
            </span>

        </div>


        <div class="detail-row-item">

            <span class="label">
                Sisa Belum Bayar
            </span>

            <span
                class="val"
                style="color:#ef4444;"
            >

                Rp ${formatRupiah(
                    totals.take -
                    totals.pay
                )}

            </span>

        </div>

    `;

}


/* =========================================================
   PROCESS DATA
========================================================= */

function processAndRender(
    objectData
){

    const rows =
        normalisasiJupiterRows(
            objectData
        );


    if(
        rows.length === 0
    ){

        currentLoadedData = [];


        document.getElementById(
            'cardsListContainer'
        ).innerHTML = `

            <div class="table-responsive">

                <table>

                    <tbody>

                        <tr>

                            <td>
                                Data Paket Jupiter
                                tidak tersedia
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        `;


        return;

    }


    /*
       Simpan data
    */

    currentLoadedData =
        rows;


    /*
       Summary
    */

    updateSummary(
        rows
    );


    /*
       Filter CSO
    */

    populateCSOFilter(
        rows
    );


    /*
       Render default
    */

    renderTable(
        'ALL'
    );

}


/* =========================================================
   FETCH MASTER DATA API
========================================================= */

async function fetchMasterData(){

    try{

        console.log(
            '======================================'
        );


        console.log(
            '🚀 MENGAMBIL DATA PAKET JUPITER'
        );


        document.getElementById(
            'updateTime'
        ).textContent =
            'Update Data: Memuat...';


        /*
           API ACTION

           Sesuaikan action ini
           dengan nama action di Google Apps Script.
        */

        const url =
            MASTER_DATA_API_URL +
            '?action=' +
            encodeURIComponent(
                TARGET_SHEET_NAME
            ) +
            '&t=' +
            Date.now();


        console.log(
            'MASTER DATA API:',
            url
        );


        /*
           FETCH
        */

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


        /*
           JSON
        */

        const result =
            await response.json();


        console.log(
            'RESPONSE MASTER DATA:',
            result
        );


        /*
           VALIDASI
        */

        if(
            !result ||
            result.success !== true
        ){

            throw new Error(
                result?.message ||
                'API mengembalikan response gagal'
            );

        }


        /*
           NORMALISASI
        */

        const objectData =
            normalisasiData(
                result.data
            );


        console.log(
            'DATA JUPITER:',
            objectData
        );


        if(
            objectData.length === 0
        ){

            throw new Error(
                'Data Paket Jupiter kosong'
            );

        }


        /*
           RENDER
        */

        processAndRender(
            objectData
        );


        /*
           UPDATE TIME
        */

        let updateDate =
            null;


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

                updateDate =
                    parsed;

            }

        }


        if(
            !updateDate
        ){

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
                    year:'numeric',
                    }
            );


        console.log(
            '✅ DATA PAKET JUPITER BERHASIL DIMUAT'
        );

    }

    catch(error){

        console.error(
            '❌ GAGAL MENGAMBIL DATA PAKET JUPITER',
            error
        );


        document.getElementById(
            'cardsListContainer'
        ).innerHTML = `

            <div class="table-responsive">

                <table>

                    <tbody>

                        <tr>

                            <td style="
                                color:#dc2626;
                                font-weight:600;
                                padding:15px;
                            ">

                                ⚠️ Gagal memuat data:

                                ${escapeHTML(
                                    error.message
                                )}

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        `;


        document.getElementById(
            'updateTime'
        ).textContent =
            'Update Data: Gagal memuat';

    }

}


/* =========================================================
   FILTER
========================================================= */

document.getElementById(
    'dseFilter'
).addEventListener(
    'change',
    function(){

        renderTable(
            this.value
        );

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
