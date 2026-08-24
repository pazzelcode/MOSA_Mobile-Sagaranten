// ==========================
// GLOBAL
// ==========================

const today = new Date();

const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
};

const dateString = today.toLocaleDateString(
    "id-ID",
    options
);

const ADMIN_WA = "6285715765848";


// ==========================
// SET TANGGAL
// ==========================

window.addEventListener('DOMContentLoaded', () => {

    const currentDateEl =
        document.getElementById("currentDate");

    if(currentDateEl){
        currentDateEl.innerText = dateString;
    }

    handleFormLock();

    const idDse =
        document.getElementById('id_dse');

    if(idDse){
        idDse.addEventListener(
            'change',
            handleFormLock
        );

        idDse.focus();
    }

    initAutoFormat();

    autoCalculate();

});


// ==========================
// CLEAN NUMBER
// ==========================

function cleanNumber(value){

    if(!value) return 0;

    return parseInt(
        value.toString().replace(/\./g,'')
    ) || 0;

}


// ==========================
// FORMAT RUPIAH
// ==========================

function formatRupiah(el){

    let numberString =
        el.value.replace(/[^,\d]/g,'');

    let split =
        numberString.split(',');

    let sisa =
        split[0].length % 3;

    let rupiah =
        split[0].substr(0,sisa);

    let ribuan =
        split[0]
        .substr(sisa)
        .match(/\d{3}/gi);

    if(ribuan){

        let separator =
            sisa ? '.' : '';

        rupiah +=
            separator +
            ribuan.join('.');

    }

    el.value = rupiah;

}


// ==========================
// AUTO FORMAT INPUT
// ==========================

function initAutoFormat(){

    const rupiahInputs =
        document.querySelectorAll('.rupiah');

    rupiahInputs.forEach(input => {

        input.addEventListener('input', function(){

            formatRupiah(this);

            calcSP();

        });

    });

}


// ==========================
// HITUNG TOTAL SP
// ==========================

function calcSP(){

    let g3 = cleanNumber(
        document.getElementById(
            'sp_3gb'
        )?.value
    );

    let zero = cleanNumber(
        document.getElementById(
            'sp_zero'
        )?.value
    );

    const total =
        g3 + zero;

    const totalEl =
        document.getElementById(
            'total_sp'
        );

    if(totalEl){

        totalEl.value =
            total.toLocaleString('id-ID');

    }

}


// ==========================
// HITUNG TOTAL VOUCHER
// ==========================

function calcVoucher(){

    let total = 0;

    const inputs =
        document.querySelectorAll('.v-input');

    inputs.forEach(input => {

        total += cleanNumber(
            input.value
        );

    });

    const totalVoucher =
        document.getElementById(
            'total_voucher'
        );

    if(totalVoucher){

        totalVoucher.value =
            total.toLocaleString('id-ID');

    }

}


// ==========================
// AUTO CALCULATE
// ==========================

function autoCalculate(){

    const spInputs = [
        'sp_3gb',
        'sp_zero'
    ];

    spInputs.forEach(id => {

        const el =
            document.getElementById(id);

        if(el){

            el.addEventListener(
                'input',
                calcSP
            );

        }

    });

    const voucherInputs =
        document.querySelectorAll('.v-input');

    voucherInputs.forEach(input => {

        input.addEventListener(
            'input',
            calcVoucher
        );

    });

}


// ==========================
// VALIDASI FORM
// ==========================

function validateForm(){

    const idDSE =
        document.getElementById(
            'id_dse'
        )?.value;

    if(!idDSE){

        alert(
            "Pilih ID DSE terlebih dahulu!"
        );

        document.getElementById(
            'id_dse'
        ).focus();

        return false;

    }

    return true;

}


// ==========================
// EXPORT EXCEL
// ==========================

function exportToExcel(){

    if(!validateForm()) return;

    const data = [

        ["KATEGORI","ITEM","VALUE"],

        ["INFO",
         "Tanggal",
         dateString],

        ["INFO",
         "ID DSE",
         document.getElementById(
            'id_dse'
         ).value],

        ["INFO",
         "PJP Today",
         document.getElementById(
            'pjp'
         ).value],

        ["SALES",
         "SP 3GB",
         cleanNumber(
            document.getElementById(
                'sp_3gb'
            ).value
         )],

        ["SALES",
         "SP Zero",
         cleanNumber(
            document.getElementById(
                'sp_zero'
            ).value
         )],

        ["SALES",
         "Total SP",
         cleanNumber(
            document.getElementById(
                'total_sp'
            ).value
         )],

        ["SALES",
         "Sellin",
         cleanNumber(
            document.getElementById(
                'sellin'
            ).value
         )]

    ];

    const ws =
        XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 20 }
    ];

    const wb =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Daily Report"
    );

    const idDSE =
        document.getElementById(
            'id_dse'
        ).value || "Tanpa_ID";

    const tanggal =
        `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;

    const fileName =
        `Daily_Report_${idDSE}_${tanggal}.xlsx`;

    XLSX.writeFile(
        wb,
        fileName
    );

    alert(
        "File Excel berhasil disimpan ke folder Download"
    );

}


// ==========================
// WHATSAPP ADMIN
// ==========================

function kirimWhatsApp(){

    if(!validateForm()) return;

    const idDSE =
        document.getElementById(
            'id_dse'
        ).value || "Tanpa_ID";

    const tanggal =
        `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;

    const fileName =
        `Daily_Report_${idDSE}_${tanggal}.xlsx`;

    const pesan =

`Berikut Terlampir.
Report Daily DSE

Nama File:
${fileName}

Silahkan kirim lampiran file report dari folder Download.

Terima kasih.`;

    window.open(

        `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(pesan)}`,

        '_blank'

    );

}


// ==========================
// LOCK FORM
// ==========================

function handleFormLock(){

    const idDseValue =
        document.getElementById(
            'id_dse'
        )?.value;

    const formElements =
        document.querySelectorAll(
            '.report-container input:not(#id_dse), .report-container select:not(#id_dse), .report-container textarea'
        );

    formElements.forEach(el => {

        if(idDseValue === ""){

            el.disabled = true;

        }else{

            el.disabled = false;

        }

    });

    const totalSP =
        document.getElementById(
            'total_sp'
        );

    if(totalSP){

        totalSP.disabled = true;

    }

    const totalVoucher =
        document.getElementById(
            'total_voucher'
        );

    if(totalVoucher){

        totalVoucher.disabled = true;

    }

}


// ==========================
// ALERT FORM TERKUNCI
// ==========================

const reportContainer =
    document.querySelector(
        '.report-container'
    );

if(reportContainer){

    reportContainer.addEventListener(
        'click',
        function(e){

            const idDseValue =
                document.getElementById(
                    'id_dse'
                )?.value;

            if(
                idDseValue === "" &&
                (
                    e.target.tagName === 'INPUT' ||
                    e.target.tagName === 'SELECT' ||
                    e.target.tagName === 'TEXTAREA'
                ) &&
                e.target.id !== 'id_dse'
            ){

                alert(
                    "Pilih ID DSE terlebih dahulu sebelum mengisi laporan!"
                );

                document.getElementById(
                    'id_dse'
                ).focus();

            }

        }
    );

}
tambahNotif({
    aktivitas: 'Form Daily berhasil dikirim',
    halaman: 'daily-form.html',
    detail: 'Laporan daily sukses dikirim'
});

function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "index.html";

    }

}
