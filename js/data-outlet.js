/* =========================================================
DATA OUTLET
MC-SAGARANTEN
SOURCE : GITHUB PAGES JSON
========================================================= */

/* =========================================================
KONFIGURASI
========================================================= */

const DATA_OUTLET_JSON_URL =
'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/data-outlet.json';

/* =========================================================
STATE
========================================================= */

let outletData = [];
let filteredOutletData = [];

let currentFilter = 'all';
let currentSearch = '';

/* =========================================================
ELEMENT
========================================================= */

const outletList =
document.getElementById('outlet-list');

const outletEmpty =
document.getElementById('outlet-empty');

const searchInput =
document.getElementById('outlet-search');

const clearSearchButton =
document.getElementById('clear-search');

const refreshButton =
document.getElementById('refresh-button');

const totalOutletElement =
document.getElementById('total-outlet');

const totalAktifElement =
document.getElementById('total-aktif');

const totalNonaktifElement =
document.getElementById('total-nonaktif');

const filterButtons =
document.querySelectorAll('.filter-button');

const dseSummaryList =
document.getElementById('dse-summary-list');
/* =========================================================
NORMALIZE VALUE
========================================================= */

function normalizeValue(value) {

if (value === null || value === undefined) {
    return '';
}

return String(value).trim();

}

/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHTML(value) {

return normalizeValue(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

/* =========================================================
FORMAT ID OUTLET
========================================================= */

function formatOutletId(value) {

if (
    value === null ||
    value === undefined ||
    value === ''
) {
    return '-';
}

return String(value);

}

/* =========================================================
LOAD DATA
========================================================= */

async function loadOutletData(showLoading = true) {

try {

    if (showLoading) {
        showLoadingState();
    }

    const response = await fetch(
        `${DATA_OUTLET_JSON_URL}?t=${Date.now()}`,
        {
            method: 'GET',
            cache: 'no-store'
        }
    );

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    const json = await response.json();


    /* =================================================
       VALIDASI JSON
    ================================================= */

    if (!json || !Array.isArray(json.data)) {
        throw new Error(
            'Format JSON data-outlet tidak valid.'
        );
    }


    /* =================================================
       SIMPAN DATA
    ================================================= */

    outletData = json.data.map(item => ({

        idOutlet:
            item['ID OUTLET'],

        namaOutlet:
            item['NAMA OUTLET'],

        idDse:
            item['ID DSE'],

        namaDse:
            item['NAMA DSE'],

        /*
         * STATUS BELUM ADA DI JSON
         *
         * Untuk sementara dikosongkan.
         */

        status: ''

    }));


    /* =================================================
       UPDATE SUMMARY
    ================================================= */

    updateSummary();
    updateDSESummary();

    /* =========================================================
   SUMMARY OUTLET PER DSE
========================================================= */

function updateDSESummary() {
    if (!dseSummaryList) return;

    const dseMap = {};
    outletData.forEach(outlet => {
        const idDse = normalizeValue(outlet.idDse) || 'TANPA DSE';
        const namaDse = normalizeValue(outlet.namaDse) || 'Tanpa Nama DSE';
        
        if (!dseMap[idDse]) {
            dseMap[idDse] = { idDse, namaDse, total: 0 };
        }
        dseMap[idDse].total++;
    });

    const dseOrder = ['SKBPLARA04', 'SKBPLARA08', 'SKBPLARA11', 'DSESGRN01'];
    const dseList = Object.values(dseMap).sort((a, b) => {
        const iA = dseOrder.indexOf(a.idDse);
        const iB = dseOrder.indexOf(b.idDse);

        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1;
        if (iB !== -1) return 1;
        
        return a.idDse.localeCompare(b.idDse, 'id', { numeric: true, sensitivity: 'base' });
    });

    if (dseList.length === 0) {
        dseSummaryList.innerHTML = `<div class="dse-summary-empty">Belum ada data DSE</div>`;
        return;
    }

    dseSummaryList.innerHTML = dseList.map(dse => `
        <div class="dse-summary-card">
            <div class="dse-summary-icon">👤</div>
            <div class="dse-summary-info">
                <div class="dse-summary-name">${escapeHTML(dse.namaDse)}</div>
                <div class="dse-summary-code">${escapeHTML(dse.idDse)}</div>
            </div>
            <div class="dse-summary-total">
                <strong>${dse.total.toLocaleString('id-ID')}</strong>
                <span>OUTLET</span>
            </div>
        </div>
    `).join('');
}

  
    /* =================================================
       FILTER + RENDER
    ================================================= */

    applyFilter();


} catch (error) {

    console.error(
        'Gagal mengambil data outlet:',
        error
    );

    showErrorState(
        'Gagal mengambil data outlet',
        'Periksa koneksi internet atau URL JSON GitHub Pages.'
    );

}

}

/* =========================================================
UPDATE SUMMARY
========================================================= */

function updateSummary() {

/*
 * TOTAL OUTLET
 *
 * Mengikuti jumlah data yang benar-benar
 * diterima dari JSON.
 */

const total =
    outletData.length;


/*
 * STATUS SENGAJA 0
 *
 * Karena JSON saat ini belum memiliki
 * kolom STATUS.
 */

const aktif = 0;

const nonaktif = 0;


if (totalOutletElement) {
    totalOutletElement.textContent =
        total.toLocaleString('id-ID');
}

if (totalAktifElement) {
    totalAktifElement.textContent =
        aktif.toLocaleString('id-ID');
}

if (totalNonaktifElement) {
    totalNonaktifElement.textContent =
        nonaktif.toLocaleString('id-ID');
}

}

/* =========================================================
APPLY FILTER
========================================================= */

function applyFilter() {

let result = [...outletData];


/* =====================================================
   FILTER STATUS
===================================================== */

if (currentFilter === 'aktif') {

    /*
     * STATUS BELUM TERSEDIA.
     * Jadi hasil sengaja kosong.
     */

    result = [];

}

else if (currentFilter === 'nonaktif') {

    /*
     * STATUS BELUM TERSEDIA.
     * Jadi hasil sengaja kosong.
     */

    result = [];

}


/* =====================================================
   SEARCH
===================================================== */

/* =========================================================
SEARCH
Bisa mencari berdasarkan:

- ID OUTLET
- NAMA OUTLET
- ID DSE
- NAMA DSE
  ========================================================= */

if (currentSearch !== '') {

const keyword =
    normalizeValue(currentSearch)
        .toLowerCase()
        .replace(/\s+/g, '');


result = result.filter(outlet => {

    const idOutlet =
        normalizeValue(
            outlet.idOutlet
        )
        .toLowerCase()
        .replace(/\s+/g, '');


    const namaOutlet =
        normalizeValue(
            outlet.namaOutlet
        )
        .toLowerCase();


    const idDse =
        normalizeValue(
            outlet.idDse
        )
        .toLowerCase();


    const namaDse =
        normalizeValue(
            outlet.namaDse
        )
        .toLowerCase();


    return (

        /* ==============================
           CARI ID OUTLET
        ============================== */

        idOutlet.includes(keyword)


        ||

        /* ==============================
           CARI NAMA OUTLET
        ============================== */

        namaOutlet.includes(
            currentSearch.toLowerCase()
        )


        ||

        /* ==============================
           CARI ID DSE
        ============================== */

        idDse.includes(
            currentSearch.toLowerCase()
        )


        ||

        /* ==============================
           CARI NAMA DSE
        ============================== */

        namaDse.includes(
            currentSearch.toLowerCase()
        )

    );

});

}

filteredOutletData = result;

renderOutletList();

}

/* =========================================================
RENDER OUTLET
========================================================= */

function renderOutletList() {

if (!outletList) {
    return;
}


/* =====================================================
   EMPTY
===================================================== */

if (filteredOutletData.length === 0) {

    outletList.innerHTML = '';

    if (outletEmpty) {
        outletEmpty.style.display = 'block';
    }

    return;

}


if (outletEmpty) {
    outletEmpty.style.display = 'none';
}


/* =====================================================
   RENDER
===================================================== */

outletList.innerHTML =
    filteredOutletData
        .map(renderOutletCard)
        .join('');

}

/* =========================================================
OUTLET CARD
========================================================= */

function renderOutletCard(outlet) {

const idOutlet =
    formatOutletId(
        outlet.idOutlet
    );

const namaOutlet =
    normalizeValue(
        outlet.namaOutlet
    ) || 'Nama Outlet';

const idDse =
    normalizeValue(
        outlet.idDse
    ) || '-';

const namaDse =
    normalizeValue(
        outlet.namaDse
    ) || '-';


/*
 * STATUS SENGAJA BELUM DITAMPILKAN
 *
 * Karena data JSON belum mempunyai
 * field status.
 */


return `

    <article
        class="outlet-card"
        data-id-outlet="${escapeHTML(idOutlet)}"
    >

        <div class="outlet-card-header">


            <!-- ICON -->

            <div class="outlet-avatar">
                🏪
            </div>


            <!-- MAIN -->

            <div class="outlet-main">

                <div class="outlet-name">
                    ${escapeHTML(namaOutlet)}
                </div>

                <div class="outlet-code">
                    ID OUTLET:
                    ${escapeHTML(idOutlet)}
                </div>

            </div>


        </div>


        <!-- DETAILS -->

        <div class="outlet-details">


            <div class="outlet-detail">

                <div class="outlet-detail-label">
                    ID DSE
                </div>

                <div class="outlet-detail-value">
                    ${escapeHTML(idDse)}
                </div>

            </div>


            <div class="outlet-detail">

                <div class="outlet-detail-label">
                    NAMA DSE
                </div>

                <div class="outlet-detail-value">
                    ${escapeHTML(namaDse)}
                </div>

            </div>


        </div>


    </article>

`;

}

/* =========================================================
SEARCH
========================================================= */

function handleSearch() {

currentSearch =
    normalizeValue(
        searchInput?.value
    );

updateClearButton();

applyFilter();

}

/* =========================================================
CLEAR SEARCH
========================================================= */

function clearSearch() {

if (!searchInput) {
    return;
}

searchInput.value = '';

currentSearch = '';

updateClearButton();

applyFilter();

searchInput.focus();

}

/* =========================================================
CLEAR BUTTON
========================================================= */

function updateClearButton() {

if (!clearSearchButton) {
    return;
}

if (currentSearch !== '') {

    clearSearchButton.style.display =
        'flex';

} else {

    clearSearchButton.style.display =
        'none';

}

}

/* =========================================================
FILTER BUTTON
========================================================= */

function handleFilter(filter) {

currentFilter = filter;


filterButtons.forEach(button => {

    const buttonFilter =
        button.dataset.filter;

    button.classList.toggle(
        'active',
        buttonFilter === currentFilter
    );

});


applyFilter();

}

/* =========================================================
LOADING STATE
========================================================= */

function showLoadingState() {

if (!outletList) {
    return;
}

if (outletEmpty) {
    outletEmpty.style.display = 'none';
}


outletList.innerHTML = `

    <div class="outlet-loading">

        <div class="outlet-skeleton"></div>
        <div class="outlet-skeleton"></div>
        <div class="outlet-skeleton"></div>
        <div class="outlet-skeleton"></div>

    </div>

`;

}

/* =========================================================
ERROR STATE
========================================================= */

function showErrorState(
title = 'Terjadi kesalahan',
description = 'Data tidak dapat dimuat.'
) {

if (!outletList) {
    return;
}


if (outletEmpty) {
    outletEmpty.style.display = 'none';
}


outletList.innerHTML = `

    <div class="outlet-error">

        <div class="outlet-error-icon">
            ⚠️
        </div>

        <div class="outlet-error-title">
            ${escapeHTML(title)}
        </div>

        <div class="outlet-error-desc">
            ${escapeHTML(description)}
        </div>

    </div>

`;

}

/* =========================================================
REFRESH
========================================================= */

async function refreshOutletData() {

if (!refreshButton) {
    await loadOutletData(true);
    return;
}


refreshButton.disabled = true;

refreshButton.style.opacity = '0.6';

refreshButton.style.transform =
    'rotate(360deg)';


try {

    await loadOutletData(true);

} finally {

    setTimeout(() => {

        refreshButton.disabled = false;

        refreshButton.style.opacity = '1';

        refreshButton.style.transform =
            '';

    }, 300);

}

}

/* =========================================================
EVENT LISTENER
========================================================= */

/* SEARCH */

if (searchInput) {

searchInput.addEventListener(
    'input',
    handleSearch
);

}

/* CLEAR */

if (clearSearchButton) {

clearSearchButton.addEventListener(
    'click',
    clearSearch
);

}

/* REFRESH */

if (refreshButton) {

refreshButton.addEventListener(
    'click',
    refreshOutletData
);

}

/* FILTER */

filterButtons.forEach(button => {

button.addEventListener(
    'click',
    () => {

        handleFilter(
            button.dataset.filter
        );

    }
);

});

/* =========================================================
INITIAL LOAD
========================================================= */

document.addEventListener(
'DOMContentLoaded',
() => {

    loadOutletData(true);

}

);