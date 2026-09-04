/* =========================================================
   KONFIGURASI
========================================================= */

const OUTLET_JSON_URL =
    'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/data-outlet.json';

const STORAGE_KEY =
    'mc_sagaranten_data_md';


/* =========================================================
   STATE
========================================================= */

let outletData = [];
let dseList = [];
let mdData = [];

let inputData = {
    idDse:'',
    namaDse:'',
    idOutlet:'',
    namaOutlet:'',
    ukuranBanner:''
};

let toastTimer;


/* =========================================================
   LOAD OUTLET
========================================================= */

async function loadOutletData(){

    const loading =
        document.getElementById('dataLoading');

    try{

        const response =
            await fetch(
                OUTLET_JSON_URL + '?t=' + Date.now()
            );

        if(!response.ok){
            throw new Error('HTTP ' + response.status);
        }

        const json =
            await response.json();

        if(!json || !Array.isArray(json.data)){
            throw new Error('Format JSON tidak valid');
        }

        outletData =
            json.data.map(item => ({
                idOutlet:String(item['ID OUTLET'] ?? '').trim(),
                namaOutlet:String(item['NAMA OUTLET'] ?? '').trim(),
                idDse:String(item['ID DSE'] ?? '').trim(),
                namaDse:String(item['NAMA DSE'] ?? '').trim()
            }))
            .filter(item => item.idOutlet);

        buildDseList();
        populateDseSelect();
        loadSavedData();

        loading.style.display = 'none';

    }catch(error){

        console.error(
            'Gagal mengambil data outlet:',
            error
        );

        loading.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            Gagal mengambil data outlet.
        `;
    }
}


/* =========================================================
   DSE LIST
========================================================= */

function buildDseList(){

    const map = new Map();

    outletData.forEach(item => {

        if(!item.idDse || !item.namaDse) return;

        if(!map.has(item.idDse)){
            map.set(
                item.idDse,
                {
                    idDse:item.idDse,
                    namaDse:item.namaDse
                }
            );
        }

    });

    dseList =
        [...map.values()].sort(
            (a,b) =>
                a.namaDse.localeCompare(
                    b.namaDse,
                    'id'
                )
        );
}


/* =========================================================
   DSE SELECT
========================================================= */

function populateDseSelect(){

    const select =
        document.getElementById('inputDse');

    select.innerHTML =
        '<option value="">Pilih Nama DSE</option>';

    dseList.forEach(dse => {

        const option =
            document.createElement('option');

        option.value = dse.idDse;
        option.textContent = dse.namaDse;

        select.appendChild(option);
    });
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadSavedData(){

    try{

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if(saved){

            const parsed =
                JSON.parse(saved);

            mdData =
                Array.isArray(parsed)
                ? parsed
                : [];
        }

    }catch(error){

        console.error(
            'Gagal membaca data lokal:',
            error
        );

        mdData = [];
    }

    renderTable();
}


function saveData(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(mdData)
    );
}


/* =========================================================
   FORM DSE
========================================================= */

function handleDseChange(){

    const select =
        document.getElementById('inputDse');

    const info =
        document.getElementById('inputDseInfo');

    const dse =
        dseList.find(
            item =>
                item.idDse === select.value
        );

    inputData.idDse =
        dse ? dse.idDse : '';

    inputData.namaDse =
        dse ? dse.namaDse : '';

    inputData.idOutlet = '';
    inputData.namaOutlet = '';

    document.getElementById(
        'inputIdOutlet'
    ).value = '';

    document.getElementById(
        'inputNamaOutlet'
    ).value = '';

    document.getElementById(
        'inputOutletSuggestions'
    ).innerHTML = '';

    document.getElementById(
        'inputOutletSuggestions'
    ).classList.remove('show');

    if(dse){

        info.innerHTML = `
            ID DSE:
            <strong>${escapeHtml(dse.idDse)}</strong>
        `;

        info.classList.add('show');

    }else{

        info.innerHTML = '';
        info.classList.remove('show');
    }
}


/* =========================================================
   SEARCH OUTLET
========================================================= */

function searchInputOutlet(keyword){

    const box =
        document.getElementById(
            'inputOutletSuggestions'
        );

    keyword =
        String(keyword)
        .trim()
        .toLowerCase();

    if(keyword.length < 2){

        box.innerHTML = '';
        box.classList.remove('show');

        return;
    }

    const results =
        outletData
        .filter(item => {

            if(
                inputData.idDse &&
                item.idDse !== inputData.idDse
            ){
                return false;
            }

            return (
                item.idOutlet.toLowerCase().includes(keyword) ||
                item.namaOutlet.toLowerCase().includes(keyword)
            );
        })
        .slice(0,12);

    if(!results.length){

        box.innerHTML = `
            <div class="suggestion-empty">
                <i class="fa-solid fa-circle-info"></i>
                Outlet tidak ditemukan
            </div>
        `;

        box.classList.add('show');

        return;
    }

    box.innerHTML =
        results.map(item => `
            <button
                type="button"
                class="outlet-suggestion"
                data-outlet-id="${escapeHtml(item.idOutlet)}"
            >
                <span class="outlet-id">
                    ${escapeHtml(item.idOutlet)}
                </span>

                <span class="outlet-name">
                    ${escapeHtml(item.namaOutlet)}
                </span>
            </button>
        `).join('');

    box.classList.add('show');
}


/* =========================================================
   SELECT OUTLET
========================================================= */

function selectInputOutlet(idOutlet){

    const outlet =
        outletData.find(
            item =>
                item.idOutlet === idOutlet
        );

    if(!outlet) return;

    inputData.idDse =
        outlet.idDse;

    inputData.namaDse =
        outlet.namaDse;

    inputData.idOutlet =
        outlet.idOutlet;

    inputData.namaOutlet =
        outlet.namaOutlet;

    const dseSelect =
        document.getElementById('inputDse');

    dseSelect.value =
        outlet.idDse;

    const info =
        document.getElementById('inputDseInfo');

    info.innerHTML = `
        ID DSE:
        <strong>${escapeHtml(outlet.idDse)}</strong>
    `;

    info.classList.add('show');

    document.getElementById(
        'inputIdOutlet'
    ).value = outlet.idOutlet;

    document.getElementById(
        'inputNamaOutlet'
    ).value = outlet.namaOutlet;

    const box =
        document.getElementById(
            'inputOutletSuggestions'
        );

    box.innerHTML = '';
    box.classList.remove('show');
}


/* =========================================================
   SAVE FORM
========================================================= */

function saveCurrentData(){

    const ukuran =
        document.getElementById(
            'inputUkuran'
        ).value.trim();

    if(!inputData.idDse){

        showToast(
            'Silakan pilih DSE terlebih dahulu'
        );

        return;
    }

    if(!inputData.idOutlet){

        showToast(
            'Silakan pilih outlet terlebih dahulu'
        );

        return;
    }

    if(!inputData.namaOutlet){

        showToast(
            'Nama outlet belum tersedia'
        );

        return;
    }

    if(!ukuran){

        showToast(
            'Ukuran banner wajib diisi'
        );

        return;
    }

    mdData.push({
        id:
            Date.now() +
            Math.floor(Math.random() * 1000),

        idDse:
            inputData.idDse,

        namaDse:
            inputData.namaDse,

        idOutlet:
            inputData.idOutlet,

        namaOutlet:
            inputData.namaOutlet,

        ukuranBanner:
            ukuran
    });

    saveData();
    renderTable();
    resetInputForm();

    showToast(
        'Data MD berhasil disimpan'
    );
}


/* =========================================================
   RESET FORM
========================================================= */

function resetInputForm(){

    inputData = {
        idDse:'',
        namaDse:'',
        idOutlet:'',
        namaOutlet:'',
        ukuranBanner:''
    };

    document.getElementById(
        'inputDse'
    ).value = '';

    document.getElementById(
        'inputDseInfo'
    ).innerHTML = '';

    document.getElementById(
        'inputDseInfo'
    ).classList.remove('show');

    document.getElementById(
        'inputIdOutlet'
    ).value = '';

    document.getElementById(
        'inputNamaOutlet'
    ).value = '';

    document.getElementById(
        'inputUkuran'
    ).value = '';

    const box =
        document.getElementById(
            'inputOutletSuggestions'
        );

    box.innerHTML = '';
    box.classList.remove('show');
}


/* =========================================================
   TABLE
========================================================= */

function renderTable(){

    const tbody =
        document.getElementById('mdTableBody');

    const empty =
        document.getElementById('emptyTable');

    const wrapper =
        document.getElementById('tableWrapper');

    const count =
        document.getElementById('dataCount');

    count.textContent =
        `${mdData.length} data`;

    if(!mdData.length){

        empty.style.display = 'block';
        wrapper.style.display = 'none';
        tbody.innerHTML = '';

        return;
    }

    empty.style.display = 'none';
    wrapper.style.display = 'block';

    tbody.innerHTML =
        mdData.map(
            (item,index) => `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    <input
                        class="table-input"
                        value="${escapeHtml(item.idDse)}"
                        oninput="
                            editTableData(
                                ${item.id},
                                'idDse',
                                this.value
                            )
                        "
                    >
                </td>

                <td>
                    <input
                        class="table-input"
                        value="${escapeHtml(item.namaDse)}"
                        oninput="
                            editTableData(
                                ${item.id},
                                'namaDse',
                                this.value
                            )
                        "
                    >
                </td>

                <td>
                    <input
                        class="table-input"
                        value="${escapeHtml(item.idOutlet)}"
                        oninput="
                            editTableData(
                                ${item.id},
                                'idOutlet',
                                this.value
                            )
                        "
                    >
                </td>

                <td>
                    <input
                        class="table-input"
                        value="${escapeHtml(item.namaOutlet)}"
                        oninput="
                            editTableData(
                                ${item.id},
                                'namaOutlet',
                                this.value
                            )
                        "
                    >
                </td>

                <td>
                    <input
                        class="table-input"
                        value="${escapeHtml(item.ukuranBanner)}"
                        oninput="
                            editTableData(
                                ${item.id},
                                'ukuranBanner',
                                this.value
                            )
                        "
                    >
                </td>

                <td>
                    <div class="table-actions">

                        <button
                            type="button"
                            class="table-action delete"
                            onclick="
                                deleteTableData(${item.id})
                            "
                            title="Hapus"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>

            </tr>
        `
        )
        .join('');
}


/* =========================================================
   EDIT TABLE
========================================================= */

function editTableData(
    id,
    field,
    value
){

    const item =
        mdData.find(
            data =>
                data.id === id
        );

    if(!item) return;

    value =
        String(value ?? '').trim();

    item[field] = value;

    /*
     * Jika ID Outlet diubah,
     * sinkronkan data dari JSON
     */

    if(field === 'idOutlet'){

        const outlet =
            outletData.find(
                data =>
                    data.idOutlet === value
            );

        if(outlet){

            item.idDse =
                outlet.idDse;

            item.namaDse =
                outlet.namaDse;

            item.idOutlet =
                outlet.idOutlet;

            item.namaOutlet =
                outlet.namaOutlet;

            renderTable();
        }
    }

    saveData();
}


/* =========================================================
   DELETE TABLE
========================================================= */

function deleteTableData(id){

    if(
        !confirm(
            'Hapus data pengajuan ini?'
        )
    ){
        return;
    }

    mdData =
        mdData.filter(
            item =>
                item.id !== id
        );

    saveData();
    renderTable();

    showToast(
        'Data berhasil dihapus'
    );
}


/* =========================================================
   BATAL
========================================================= */

function cancelInput(){

    resetInputForm();

    showToast(
        'Form telah dikosongkan'
    );
}


/* =========================================================
   PLUS BUTTON
========================================================= */

function focusInputForm(){

    resetInputForm();

    document.getElementById(
        'inputCard'
    ).scrollIntoView({
        behavior:'smooth',
        block:'center'
    });

    setTimeout(() => {

        document.getElementById(
            'inputDse'
        ).focus();

    },400);
}


/* =========================================================
   EXPORT EXCEL
========================================================= */

function exportToExcel(){

    if(!mdData.length){

        showToast(
            'Belum ada data untuk diekspor'
        );

        return;
    }

    if(typeof XLSX === 'undefined'){

        showToast(
            'Library Excel belum tersedia'
        );

        return;
    }

    const exportData =
        mdData.map(
            (item,index) => ({

                'NO':
                    index + 1,

                'ID DSE':
                    item.idDse,

                'NAMA DSE':
                    item.namaDse,

                'ID OUTLET':
                    item.idOutlet,

                'NAMA OUTLET':
                    item.namaOutlet,

                'UKURAN BANNER':
                    item.ukuranBanner
            })
        );

    const worksheet =
        XLSX.utils.json_to_sheet(
            exportData
        );

    worksheet['!cols'] = [
        {wch:6},
        {wch:16},
        {wch:28},
        {wch:16},
        {wch:30},
        {wch:20}
    ];

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Data MD'
    );

    const tanggal =
        new Date()
        .toISOString()
        .slice(0,10);

    XLSX.writeFile(
        workbook,
        `DATA-MD-${tanggal}.xlsx`
    );

    showToast(
        'Excel berhasil dibuat'
    );
}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(value){

    return String(value ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message){

    const toast =
        document.getElementById('toast');

    toast.textContent =
        message;

    toast.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(
            () => {
                toast.classList.remove('show');
            },
            2500
        );
}


/* =========================================================
   BACK
========================================================= */

function goBack(){

    if(
        document.referrer &&
        document.referrer !== location.href
    ){
        history.back();
    }else{
        location.href =
            'dashboard.html';
    }
}


/* =========================================================
   CLOSE SUGGESTION
========================================================= */

document.addEventListener(
    'click',
    event => {

        if(
            !event.target.closest('.form-group')
        ){

            document
                .querySelectorAll(
                    '.outlet-suggestions'
                )
                .forEach(
                    box =>
                        box.classList.remove('show')
                );
        }
    }
);


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const dseSelect =
            document.getElementById(
                'inputDse'
            );

        const outletInput =
            document.getElementById(
                'inputIdOutlet'
            );

        const ukuranInput =
            document.getElementById(
                'inputUkuran'
            );

        const saveButton =
            document.getElementById(
                'saveButton'
            );

        const cancelButton =
            document.getElementById(
                'cancelButton'
            );

        const exportButton =
            document.getElementById(
                'exportExcelButton'
            );

        const plusButton =
            document.getElementById(
                'addPageButton'
            );


        /* DSE */

        dseSelect.addEventListener(
            'change',
            handleDseChange
        );


        /* OUTLET */

        outletInput.addEventListener(
            'input',
            function(){

                inputData.idOutlet =
                    this.value.trim();

                inputData.namaOutlet =
                    '';

                document.getElementById(
                    'inputNamaOutlet'
                ).value = '';

                searchInputOutlet(
                    this.value
                );
            }
        );


        /* SELECT OUTLET */

        document
            .getElementById(
                'inputOutletSuggestions'
            )
            .addEventListener(
                'click',
                event => {

                    const button =
                        event.target.closest(
                            '.outlet-suggestion'
                        );

                    if(!button) return;

                    selectInputOutlet(
                        button.dataset.outletId
                    );
                }
            );


        /* UKURAN */

        ukuranInput.addEventListener(
            'input',
            function(){

                inputData.ukuranBanner =
                    this.value;
            }
        );


        /* BUTTON */

        saveButton.addEventListener(
            'click',
            saveCurrentData
        );

        cancelButton.addEventListener(
            'click',
            cancelInput
        );

        exportButton.addEventListener(
            'click',
            exportToExcel
        );

        plusButton.addEventListener(
            'click',
            focusInputForm
        );


        /* LOAD */

        loadOutletData();

    }
);