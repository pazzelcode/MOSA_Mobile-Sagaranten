/* =========================================================
   MASTER DATA API
========================================================= */

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';

const TARGET_SHEET_NAME =
'penjualan-hifi';


/* =========================================================
   DATA GUDANG
========================================================= */

let gudangDataMap = [];


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(angka){

    const number =
        parseNumber(angka);

    if(number === 0){
        return '-';
    }

    return 'Rp ' +
        new Intl.NumberFormat(
            'id-ID'
        ).format(number);

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

    text =
        text.replace(/\./g,'');

    text =
        text.replace(',', '.');

    const number =
        Number(text);

    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   FORMAT ANGKA
========================================================= */

function formatNumber(value){

    const number =
        parseNumber(value);

    if(number === 0){
        return '-';
    }

    return number.toLocaleString(
        'id-ID'
    );

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
   NORMALISASI DATA API
========================================================= */

function normalisasiData(rawData){

    if(!rawData){
        return [];
    }

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

    if(
        typeof rawData[0] === 'object' &&
        !Array.isArray(rawData[0])
    ){

        return rawData;

    }

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
                            String(header).trim()
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
    kemungkinan
){

    if(!row){
        return '';
    }

    const keys =
        Object.keys(row);

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
   PARSE TANGGAL
========================================================= */

function parseExcelDate(value){

    if(
        value === null ||
        value === undefined ||
        value === ''
    ){
        return '-';
    }

    if(value === '-'){
        return '-';
    }

    if(typeof value === 'string'){

        const text =
            value.trim();

        if(
            /^\d{4}-\d{2}-\d{2}$/.test(text)
        ){
            return text;
        }

        const date =
            new Date(text);

        if(!isNaN(date.getTime())){

            return formatDate(
                date
            );

        }

        return text;

    }

    if(
        typeof value === 'number' &&
        typeof XLSX !== 'undefined'
    ){

        const dateObj =
            XLSX.SSF.parse_date_code(
                value
            );

        if(dateObj){

            const day =
                String(
                    dateObj.d
                ).padStart(2,'0');

            const month =
                String(
                    dateObj.m
                ).padStart(2,'0');

            const year =
                dateObj.y;

            return `${year}-${month}-${day}`;

        }

    }

    return String(value);

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
   GET DATA HI-FI
========================================================= */

function getHiFiData(row){

    return {

        no:
            getObjectValue(
                row,
                [
                    'No',
                    'no'
                ]
            ),

        barang:
            String(
                getObjectValue(
                    row,
                    [
                        'Barang',
                        'barang',
                        'Produk',
                        'produk'
                    ]
                ) || '-'
            ).trim(),

        jumlah:
            parseNumber(
                getObjectValue(
                    row,
                    [
                        'Jumlah',
                        'jumlah',
                        'Qty',
                        'qty'
                    ]
                )
            ),

        nomor:
            String(
                getObjectValue(
                    row,
                    [
                        'Nomor Hifi',
                        'Nomor HIFI',
                        'Nomor HiFi',
                        'nomor hifi'
                    ]
                ) || '-'
            ).trim(),

        iccid:
            String(
                getObjectValue(
                    row,
                    [
                        'ICCID',
                        'iccid'
                    ]
                ) || '-'
            ).trim(),

        imei:
            String(
                getObjectValue(
                    row,
                    [
                        'IMEI Devices',
                        'IMEI Device',
                        'IMEI',
                        'imei'
                    ]
                ) || '-'
            ).trim(),

        nama:
            String(
                getObjectValue(
                    row,
                    [
                        'Nama',
                        'nama'
                    ]
                ) || ''
            )
            .trim()
            .toUpperCase(),

        harga:
            parseNumber(
                getObjectValue(
                    row,
                    [
                        'Harga',
                        'harga'
                    ]
                )
            ),

        tglAmbil:
            parseExcelDate(
                getObjectValue(
                    row,
                    [
                        'Tgl Ambil',
                        'Tanggal Ambil',
                        'tgl ambil'
                    ]
                )
            ),

        tglBayar:
            parseExcelDate(
                getObjectValue(
                    row,
                    [
                        'Tgl Bayar',
                        'Tanggal Bayar',
                        'tgl bayar'
                    ]
                )
            ),

        keterangan:
            String(
                getObjectValue(
                    row,
                    [
                        'Keterangan',
                        'keterangan',
                        'Status',
                        'status'
                    ]
                ) || ''
            ).trim()

    };

}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderHiFiDashboard(
    objectData
){

    const tbody =
        document.getElementById(
            'tableBody'
        );

    const hifiFilter =
        document.getElementById(
            'hifiFilter'
        );

    if(!tbody || !hifiFilter){

        console.error(
            'Element dashboard tidak ditemukan'
        );

        return;

    }

    tbody.innerHTML = '';

    gudangDataMap = [];

    hifiFilter.innerHTML = `
        <option value="ALL">
            -- TAMPILKAN SEMUA DATA --
        </option>
    `;

    const listNamaFilter =
        new Set();

    let totalStok = 0;

    let dseSudahBayarCount = 0;

    let sisaOnHandDSE = 0;

    let segelGudangCount = 0;

    let sisaTagihanNominal = 0;

    let sisaTagihanQty = 0;

    const data =
        objectData.map(
            row =>
                getHiFiData(row)
        );

    data.forEach(
        row => {

            const {
                no,
                barang,
                jumlah,
                nomor,
                iccid,
                imei,
                nama,
                harga,
                tglAmbil,
                tglBayar,
                keterangan
            } = row;

            totalStok +=
                jumlah;

            if(
                nama &&
                nama !== 'GUDANG' &&
                nama !== 'STOK GUDANG'
            ){

                listNamaFilter.add(
                    nama
                );

            }

            const statusText =
                keterangan === ''
                    ? '-'
                    : keterangan;

            const ketLower =
                statusText.toLowerCase();

            let badgeClass =
                'badge-status';

            if(
                ketLower.includes(
                    'stok gudang'
                )
            ){

                badgeClass +=
                    ' badge-segel';

            }

            else if(
                ketLower.includes(
                    'on hand dse'
                )
            ){

                badgeClass +=
                    ' badge-onhand';

            }

            else if(
                ketLower.includes(
                    'terjual'
                ) ||
                ketLower.includes(
                    'lunas'
                )
            ){

                badgeClass +=
                    ' badge-terjual-sukses';

            }

            else if(
                ketLower.includes(
                    'reture'
                )
            ){

                badgeClass +=
                    ' badge-status-danger';

            }

            else{

                badgeClass +=
                    ' badge-sold';

            }

            if(
                nama !== 'STOK GUDANG'
            ){

                if(
                    ketLower.includes(
                        'stok gudang'
                    )
                ){

                    segelGudangCount +=
                        jumlah;

                    gudangDataMap.push({

                        barang:
                            barang,

                        noHifi:
                            nomor,

                        imei:
                            imei,

                        iccid:
                            iccid,

                        qty:
                            jumlah

                    });

                }

                else if(
                    ketLower.includes(
                        'reward'
                    ) ||
                    ketLower.includes(
                        'reture'
                    )
                ){

                    // Tidak dihitung

                }

                else if(
                    ketLower.includes(
                        'terjual'
                    ) ||
                    ketLower.includes(
                        'lunas'
                    )
                ){

                    dseSudahBayarCount +=
                        jumlah;

                }

                else if(
                    ketLower.includes(
                        'on hand dse'
                    )
                ){

                    sisaOnHandDSE +=
                        jumlah;

                    sisaTagihanNominal +=
                        harga;

                    sisaTagihanQty +=
                        jumlah;

                }

            }

            else{

                segelGudangCount +=
                    jumlah;

                gudangDataMap.push({

                    barang:
                        barang,

                    noHifi:
                        nomor,

                    imei:
                        imei,

                    iccid:
                        iccid,

                    qty:
                        jumlah

                });

            }

            const hasData =

                barang !== '-' ||

                nomor !== '-' ||

                iccid !== '-' ||

                imei !== '-' ||

                nama !== '' ||

                harga > 0 ||

                jumlah > 0;

            if(!hasData){
                return;
            }

            const tr =
                document.createElement(
                    'tr'
                );

            tr.className =
    'row-item';

tr.setAttribute(
    'data-nama',
    nama
);

tr.setAttribute(
    'data-keterangan',
    ketLower
);

            tr.innerHTML = `

                <td
                    class="text-center"
                    data-label="No"
                >
                    ${escapeHTML(no)}
                </td>

                <td
                    class="text-center"
                    data-label="Barang"
                >
                    ${escapeHTML(barang)}
                </td>

                <td
                    class="qty-col"
                    data-label="Jumlah"
                >
                    ${formatNumber(jumlah)}
                </td>

                <td
                    class="text-center"
                    data-label="Nomor Hifi"
                >
                    ${escapeHTML(nomor)}
                </td>

                <td
                    class="text-center mono-col"
                    data-label="ICCID"
                >
                    ${escapeHTML(iccid)}
                </td>

                <td
                    class="text-center mono-col"
                    data-label="IMEI Devices"
                >
                    ${escapeHTML(imei)}
                </td>

                <td
                    class="text-left"
                    data-label="Nama"
                >
                    ${escapeHTML(nama || '-')}
                </td>

                <td
                    class="text-right currency-col"
                    data-label="Harga"
                >
                    ${
                        harga
                            ? formatRupiah(harga)
                            : '-'
                    }
                </td>

                <td
                    class="text-center"
                    data-label="Tgl Ambil"
                >
                    ${escapeHTML(tglAmbil)}
                </td>

                <td
                    class="text-center"
                    data-label="Tgl Bayar"
                >
                    ${escapeHTML(tglBayar)}
                </td>

                <td
                    class="text-center"
                    data-label="Keterangan"
                >
                    <span
                        class="${badgeClass}"
                    >
                        ${escapeHTML(statusText)}
                    </span>
                </td>

            `;

            tbody.appendChild(
                tr
            );

        }
    );

    /* =====================================================
       FILTER DSE
    ===================================================== */

    Array.from(
        listNamaFilter
    )
    .sort()
    .forEach(
        namaDse => {

            const opt =
                document.createElement(
                    'option'
                );

            opt.value =
                namaDse;

            opt.textContent =
                namaDse;

            hifiFilter.appendChild(
                opt
            );

        }
    );

    /* =====================================================
       FILTER GUDANG
    ===================================================== */

    const optGudang =
        document.createElement(
            'option'
        );

    optGudang.value =
        'GUDANG';

    optGudang.textContent =
        'GUDANG (STOK SEGEL)';

    hifiFilter.appendChild(
        optGudang
    );

    /* =====================================================
       TOTAL ROW
    ===================================================== */

    const totalTr =
        document.createElement(
            'tr'
        );

    totalTr.className =
        'total-row';

    totalTr.id =
        'defaultTotalRow';

    totalTr.innerHTML = `

        <td
            class="text-left"
            colspan="4"
        >
            TOTAL SISA TAGIHAN
        </td>

        <td
            class="qty-col"
            id="bottomTotalQty"
        >
            ${formatNumber(
                sisaTagihanQty
            )} Unit
        </td>

        <td colspan="6"></td>

    `;

    tbody.appendChild(
        totalTr
    );

    /* =====================================================
       UPDATE SUMMARY
    ===================================================== */

    const totalUnit =
        document.getElementById(
            'topTotalUnit'
        );

    const totalTerjual =
        document.getElementById(
            'topTotalTerjual'
        );

    const totalSold =
        document.getElementById(
            'topTotalSold'
        );

    const totalSegel =
        document.getElementById(
            'topTotalSegel'
        );

    const totalOmset =
        document.getElementById(
            'topTotalOmset'
        );

    if(totalUnit){

        totalUnit.textContent =
            `${formatNumber(
                totalStok
            )} Unit`;

    }

    if(totalTerjual){

        totalTerjual.textContent =
            `${formatNumber(
                dseSudahBayarCount
            )} Unit`;

    }

    if(totalSold){

        totalSold.textContent =
            `${formatNumber(
                sisaOnHandDSE
            )} Unit`;

    }

    if(totalSegel){

        totalSegel.textContent =
            `${formatNumber(
                segelGudangCount
            )} Unit`;

    }

    if(totalOmset){

        totalOmset.textContent =
            formatRupiah(
                sisaTagihanNominal
            );

    }

    setupHifiFilterListener();

}


/* =========================================================
   FILTER HI-FI
   DSE + GUDANG
========================================================= */

function setupHifiFilterListener(){

    const hifiFilter =
        document.getElementById('hifiFilter');

    const tbody =
        document.getElementById('tableBody');

    if(!hifiFilter || !tbody){

        console.error(
            '❌ Filter atau tableBody tidak ditemukan'
        );

        return;

    }


    /*
     * HAPUS LISTENER LAMA
     */

    hifiFilter.onchange = null;


    /*
     * LISTENER FILTER
     */

    hifiFilter.addEventListener(
        'change',
        function(){

            const selected =
                String(this.value || '')
                    .trim()
                    .toUpperCase();


            console.log(
                '🔎 FILTER:',
                selected
            );


            const rows =
                tbody.querySelectorAll(
                    'tr.row-item'
                );


            console.log(
                '📊 JUMLAH ROW:',
                rows.length
            );


            rows.forEach(
                row => {

                    const nama =
                        String(
                            row.getAttribute(
                                'data-nama'
                            ) || ''
                        )
                        .trim()
                        .toUpperCase();


                    const keterangan =
                        String(
                            row.getAttribute(
                                'data-keterangan'
                            ) || ''
                        )
                        .trim()
                        .toLowerCase();


                    /*
                     * GUDANG
                     *
                     * Nama kosong dianggap gudang.
                     *
                     * Selain itu status
                     * STOK GUDANG juga dianggap gudang.
                     */

                    const gudang =
                        nama === '' ||
                        nama === '-' ||
                        nama === 'GUDANG' ||
                        nama === 'STOK GUDANG' ||
                        keterangan.includes(
                            'stok gudang'
                        );


                    let tampil =
                        false;


                    /*
                     * SEMUA
                     */

                    if(
                        selected === 'ALL'
                    ){

                        tampil =
                            true;

                    }


                    /*
                     * GUDANG
                     */

                    else if(
                        selected === 'GUDANG'
                    ){

                        tampil =
                            gudang;

                    }


                    /*
                     * DSE
                     */

                    else{

                        tampil =
                            !gudang &&
                            nama === selected;

                    }


                    /*
                     * PAKAI !important
                     * agar tidak dikalahkan CSS
                     */

                    if(tampil){

                        row.style.setProperty(
                            'display',
                            'table-row',
                            'important'
                        );

                    }

                    else{

                        row.style.setProperty(
                            'display',
                            'none',
                            'important'
                        );

                    }

                }
            );


            /*
             * TOTAL ROW
             */

            const totalRow =
                document.getElementById(
                    'defaultTotalRow'
                );


            if(totalRow){

                if(
                    selected === 'ALL'
                ){

                    totalRow.style.setProperty(
                        'display',
                        'table-row',
                        'important'
                    );

                }

                else{

                    totalRow.style.setProperty(
                        'display',
                        'none',
                        'important'
                    );

                }

            }

        }
    );


    console.log(
        '✅ FILTER HIFI AKTIF'
    );

}


/* =========================================================
   FETCH MASTER DATA API
   JANGAN DIUBAH
========================================================= */

async function fetchMasterData(){

    try{

        console.log(
            '======================================'
        );

        console.log(
            '🚀 MENGAMBIL DATA PENJUALAN HIFI AIR'
        );

        const updateTime =
            document.getElementById(
                'updateTime'
            );

        if(updateTime){

            updateTime.textContent =
                'Update Data: Memuat...';

        }

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

        console.log(
            'RESPONSE:',
            result
        );

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

        console.log(
            'DATA HIFI AIR:',
            objectData
        );

        if(objectData.length === 0){

            throw new Error(
                'Data HiFi Air kosong'
            );

        }

        renderHiFiDashboard(
            objectData
        );

        /* =================================================
           UPDATE DATE
           HANYA TANGGAL
        ================================================= */

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

        if(updateTime){

            updateTime.innerHTML =
                'Update Data: ' +
                formatUpdateDate(
                    updateDate
                ) +
                '';

        }

        console.log(
            '✅ DATA HIFI AIR BERHASIL DIMUAT'
        );

    }

    catch(error){

        console.error(
            '❌ GAGAL MENGAMBIL DATA HIFI AIR',
            error
        );

        const updateTime =
            document.getElementById(
                'updateTime'
            );

        if(updateTime){

            updateTime.textContent =
                'Update Data: Gagal memuat';

        }

        const tbody =
            document.getElementById(
                'tableBody'
            );

        if(tbody){

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="11"
                        class="loading-text"
                    >
                        ⚠️ Gagal memuat data:
                        ${escapeHTML(
                            error.message
                        )}
                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   DOWNLOAD TABEL SEBAGAI GAMBAR
========================================================= */

async function downloadHifiTableImage(){

    const button =
        document.getElementById(
            'downloadTableBtn'
        );

    const table =
        document.getElementById(
            'hifiTable'
        );

    if(!table){

        alert(
            'Tabel belum tersedia.'
        );

        return;

    }

    if(
        typeof html2canvas ===
        'undefined'
    ){

        alert(
            'Library download gambar belum tersedia.'
        );

        return;

    }

    const rows =
        table.querySelectorAll(
            'tbody tr'
        );

    if(rows.length === 0){

        alert(
            'Belum ada data yang dapat didownload.'
        );

        return;

    }

    const originalHTML =
        button
            ? button.innerHTML
            : '';

    if(button){

        button.disabled =
            true;

        button.innerHTML =
            '⏳ Memproses...';

    }

    let wrapper = null;

    try{

        wrapper =
            document.createElement(
                'div'
            );

        wrapper.className =
            'hifi-download-clone';

        const title =
            document.createElement(
                'div'
            );

        title.className =
            'hifi-download-title';

        title.textContent =
            'REKAPITULASI PENJUALAN HIFI AIR';

        wrapper.appendChild(
            title
        );

        const subtitle =
            document.createElement(
                'div'
            );

        subtitle.className =
            'hifi-download-subtitle';

        subtitle.textContent =
            'Data Monitor Penjualan HiFi Air Mei 2026';

        wrapper.appendChild(
            subtitle
        );

        const clonedTable =
            table.cloneNode(
                true
            );

        /*
           Tampilkan semua baris
        */

        clonedTable
            .querySelectorAll(
                'tr'
            )
            .forEach(
                row => {

                    row.style.display =
                        'table-row';

                }
            );

        clonedTable
            .querySelectorAll(
                'td, th'
            )
            .forEach(
                cell => {

                    cell.style.display =
                        'table-cell';

                    cell.style.whiteSpace =
                        'nowrap';

                    cell.style.visibility =
                        'visible';

                }
            );

        clonedTable
            .querySelectorAll(
                '.badge-status'
            )
            .forEach(
                badge => {

                    badge.style.display =
                        'inline-block';

                }
            );

        wrapper.appendChild(
            clonedTable
        );

        const footer =
            document.createElement(
                'div'
            );

        footer.className =
            'hifi-download-footer';

        footer.textContent =
            'Generated from MC Sagaranten • ' +
            formatUpdateDate(
                new Date()
            );

        wrapper.appendChild(
            footer
        );

        document.body.appendChild(
            wrapper
        );

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    300
                )
        );

        const canvas =
            await html2canvas(
                wrapper,
                {
                    backgroundColor:'#ffffff',

                    scale:
                        Math.min(
                            2,
                            window.devicePixelRatio ||
                            1
                        ),

                    useCORS:true,

                    allowTaint:true,

                    logging:false,

                    imageTimeout:0

                }
            );

        const link =
            document.createElement(
                'a'
            );

        const date =
            new Date();

        const dateString =
            date
                .toISOString()
                .slice(
                    0,
                    10
                );

        link.download =
            `Rekap-Penjualan-HiFi-Air-${dateString}.png`;

        link.href =
            canvas.toDataURL(
                'image/png',
                1.0
            );

        link.click();

    }

    catch(error){

        console.error(
            'Gagal membuat gambar tabel:',
            error
        );

        alert(
            'Gagal membuat gambar tabel. ' +
            'Silakan coba lagi.'
        );

    }

    finally{

        if(wrapper){

            wrapper.remove();

        }

        if(button){

            button.disabled =
                false;

            button.innerHTML =
                originalHTML;

        }

    }

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        /*
           AMBIL DATA PERTAMA
        */

        fetchMasterData();

    }
);

/* =========================================================
   BACK BUTTON
========================================================= */

function goBack(){

    if(
        window.history.length > 1
    ){

        window.history.back();

    }

    else{

        window.location.href =
            'index.html';

    }

}
