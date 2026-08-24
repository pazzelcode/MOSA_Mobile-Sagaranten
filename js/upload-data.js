/* =========================================================
   KONFIGURASI
========================================================= */

const API_URL =
    'https://script.google.com/macros/s/AKfycbzINzFJt38mQyqrgvzrTDechPja8b7tyoO5MMZkDmDSfw-Ftjp_y2POSAfYuP0fqi5WKw/exec';


/* =========================================================
   KONFIGURASI ADMIN
========================================================= */

const NOMOR_ADMIN = [
    '085759695969'
];


/* =========================================================
   CEK AKSES ADMIN
========================================================= */

function cekAksesAdmin(){

    const nomorLogin =
        String(
            localStorage.getItem(
                'mc_sagaranten_phone'
            ) || ''
        ).trim();


    console.log(
        'Nomor login:',
        nomorLogin
    );


    console.log(
        'Nomor admin:',
        NOMOR_ADMIN
    );


    return NOMOR_ADMIN.includes(
        nomorLogin
    );

}


/* =========================================================
   PROTEKSI LOGIN
========================================================= */

function cekLogin(){

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


    /*
       Jika belum login
       atau login sudah expired
    */

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


        return false;

    }


    return true;

}


/* =========================================================
   PROTEKSI HALAMAN ADMIN
========================================================= */

function proteksiHalamanAdmin(){

    /*
       Cek login terlebih dahulu
    */

    if(!cekLogin()){

        return false;

    }


    /*
       Kemudian cek nomor admin
    */

    if(!cekAksesAdmin()){

        alert(
            'Akses hanya untuk administrator.'
        );


        window.location.replace(
            'index.html'
        );


        return false;

    }


    return true;

}


/* =========================================================
   NAMA PENGGUNA
========================================================= */

function getNamaPengguna(){

    const nama =
        localStorage.getItem(
            'mc_sagaranten_nama'
        );


    if(
        nama &&
        nama.trim() !== ''
    ){

        return nama.trim();

    }


    return 'Administrator';

}


/* =========================================================
   ELEMENT
========================================================= */

const excelFile =
    document.getElementById(
        'excelFile'
    );


const uploadArea =
    document.getElementById(
        'uploadArea'
    );


const fileName =
    document.getElementById(
        'fileName'
    );


const uploadButton =
    document.getElementById(
        'uploadButton'
    );


const progressWrapper =
    document.getElementById(
        'progressWrapper'
    );


const progressValue =
    document.getElementById(
        'progressValue'
    );


const progressText =
    document.getElementById(
        'progressText'
    );


const progressPercent =
    document.getElementById(
        'progressPercent'
    );


const statusCard =
    document.getElementById(
        'statusCard'
    );


let selectedFile = null;


/* =========================================================
   UPDATE BUTTON
========================================================= */

function updateUploadButton(){

    if(!uploadButton){

        return;

    }


    uploadButton.disabled =
        !selectedFile;

}


/* =========================================================
   FORMAT UKURAN FILE
========================================================= */

function formatBytes(bytes){

    if(
        !bytes ||
        bytes === 0
    ){

        return '0 Bytes';

    }


    const units = [
        'Bytes',
        'KB',
        'MB',
        'GB'
    ];


    const i =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        bytes /
        Math.pow(
            1024,
            i
        )
    ).toFixed(2)
    + ' ' +
    units[i];

}


/* =========================================================
   SET FILE
========================================================= */

function setSelectedFile(file){

    if(!file){

        selectedFile =
            null;


        fileName.textContent =
            '';


        fileName.style.display =
            'none';


        updateUploadButton();


        return;

    }


    const extension =
        file.name
        .split('.')
        .pop()
        .toLowerCase();


    /*
       Validasi format Excel
    */

    if(
        extension !== 'xlsx' &&
        extension !== 'xls'
    ){

        alert(
            'Silakan pilih file Excel .xlsx atau .xls.'
        );


        excelFile.value =
            '';


        selectedFile =
            null;


        fileName.textContent =
            '';


        fileName.style.display =
            'none';


        updateUploadButton();


        return;

    }


    /*
       Simpan file
    */

    selectedFile =
        file;


    /*
       Tampilkan nama file
    */

    fileName.textContent =
        '📄 ' +
        file.name +
        ' (' +
        formatBytes(
            file.size
        ) +
        ')';


    fileName.style.display =
        'block';


    updateUploadButton();

}


/* =========================================================
   KLIK AREA UPLOAD
========================================================= */

uploadArea.addEventListener(
    'click',
    function(){

        excelFile.click();

    }
);


/* =========================================================
   KEYBOARD
========================================================= */

uploadArea.addEventListener(
    'keydown',
    function(event){

        if(
            event.key === 'Enter' ||
            event.key === ' '
        ){

            event.preventDefault();


            excelFile.click();

        }

    }
);


/* =========================================================
   FILE CHANGE
========================================================= */

excelFile.addEventListener(
    'change',
    function(){

        const file =
            this.files[0];


        setSelectedFile(
            file
        );

    }
);


/* =========================================================
   DRAG OVER
========================================================= */

uploadArea.addEventListener(
    'dragover',
    function(event){

        event.preventDefault();


        uploadArea.classList.add(
            'dragging'
        );

    }
);


/* =========================================================
   DRAG LEAVE
========================================================= */

uploadArea.addEventListener(
    'dragleave',
    function(){

        uploadArea.classList.remove(
            'dragging'
        );

    }
);


/* =========================================================
   DROP
========================================================= */

uploadArea.addEventListener(
    'drop',
    function(event){

        event.preventDefault();


        uploadArea.classList.remove(
            'dragging'
        );


        const file =
            event
            .dataTransfer
            .files[0];


        setSelectedFile(
            file
        );

    }
);


/* =========================================================
   STATUS
========================================================= */

function tampilkanStatus(
    type,
    title,
    message
){

    statusCard.className =
        'status-card ' +
        type;


    statusCard.innerHTML = `

        <div class="status-title">
            ${title}
        </div>

        <div>
            ${message}
        </div>

    `;

}


/* =========================================================
   PROGRESS
========================================================= */

function setProgress(
    percent,
    text
){

    progressValue.style.width =
        percent + '%';


    progressPercent.textContent =
        percent + '%';


    progressText.textContent =
        text;

}


/* =========================================================
   UPLOAD DATA
========================================================= */

uploadButton.addEventListener(
    'click',
    async function(){

        /*
           Cek admin lagi sebelum upload
        */

        if(!cekAksesAdmin()){

            alert(
                'Akses hanya untuk administrator.'
            );


            window.location.replace(
                'index.html'
            );


            return;

        }


        /*
           Cek file
        */

        if(!selectedFile){

            alert(
                'Silakan pilih file Excel terlebih dahulu.'
            );


            return;

        }


        /*
           Konfirmasi
        */

        const yakin =
            confirm(

                'Upload file ini sebagai Master Data?\n\n' +

                selectedFile.name +

                '\n\n' +

                'Data lama akan digantikan.'

            );


        if(!yakin){

            return;

        }


        /*
           Disable button
        */

        uploadButton.disabled =
            true;


        /*
           Tampilkan progress
        */

        progressWrapper.style.display =
            'block';


        statusCard.className =
            'status-card';


        setProgress(
            10,
            'Membaca file Excel...'
        );


        try{

            /* =====================================
               FILE → BASE64
            ===================================== */

            const base64 =
                await fileToBase64(
                    selectedFile
                );


            setProgress(
                30,
                'Mengirim file ke server...'
            );


            /* =====================================
               DATA UPLOAD
            ===================================== */

            const uploadData = {

                fileName:
                    selectedFile.name,

                fileData:
                    base64,

                uploadedBy:
                    getNamaPengguna()

            };


            console.log(
                'Mengirim data upload...'
            );


            /* =====================================
               REQUEST KE GOOGLE APPS SCRIPT
            ===================================== */

            const response =
                await fetch(
                    API_URL,
                    {

                        method:
                            'POST',

                        headers:{
                            'Content-Type':
                                'text/plain;charset=utf-8'
                        },

                        body:
                            JSON.stringify(
                                uploadData
                            )

                    }
                );


            setProgress(
                70,
                'Memproses Master Data...'
            );


            /* =====================================
               RESPONSE SERVER
            ===================================== */

            const text =
                await response.text();


            console.log(
                'SERVER RESPONSE:',
                text
            );


            let result;


            try{

                result =
                    JSON.parse(
                        text
                    );

            }catch(error){

                console.error(
                    'JSON ERROR:',
                    error
                );


                throw new Error(
                    'Server mengembalikan response yang tidak valid.'
                );

            }


            /* =====================================
               CEK HASIL
            ===================================== */

            if(!result.success){

                throw new Error(
                    result.message ||
                    'Upload gagal.'
                );

            }


            /* =====================================
               PROGRESS SELESAI
            ===================================== */

            setProgress(
                100,
                'Upload selesai.'
            );


            /* =====================================
               HASIL SHEET
            ===================================== */

            let sheetHTML =
                '';


            if(
                result.sheets &&
                result.sheets.length
            ){

                sheetHTML =
                    '<div class="sheet-list">';


                result.sheets.forEach(
                    sheet => {

                        sheetHTML += `

                            <div class="sheet-item">

                                <span class="sheet-name">
                                    📄 ${escapeHTML(
                                        sheet.name
                                    )}
                                </span>

                                <span class="sheet-count">
                                    ${Number(
                                        sheet.rows || 0
                                    ).toLocaleString('id-ID')}
                                    baris
                                </span>

                            </div>

                        `;

                    }
                );


                sheetHTML +=
                    '</div>';

            }


            /* =====================================
               STATUS SUKSES
            ===================================== */

            tampilkanStatus(

                'success',

                '✓ DATA BERHASIL DIPERBARUI',

                `
                Master Data berhasil diupload.

                <br><br>

                <strong>File:</strong>
                ${escapeHTML(
                    result.fileName ||
                    selectedFile.name
                )}

                <br>

                <strong>Upload oleh:</strong>
                ${escapeHTML(
                    result.uploadedBy ||
                    getNamaPengguna()
                )}

                <br>

                <strong>Versi:</strong>
                ${escapeHTML(
                    result.version ||
                    '-'
                )}

                ${sheetHTML}
                `

            );

const namaFileTerupload = result.fileName || selectedFile.name;
            const namaAdminUpload = result.uploadedBy || getNamaPengguna();
            kirimNotifikasiOtomatis(namaFileTerupload, namaAdminUpload);
          
            /* =====================================
               RESET FILE
            ===================================== */

            excelFile.value =
                '';


            selectedFile =
                null;


            fileName.textContent =
                '';


            fileName.style.display =
                'none';


            updateUploadButton();


            /* =====================================
               LOAD MASTER INFO
            ===================================== */

            await loadMasterInfo();


        }catch(error){

            console.error(
                'UPLOAD ERROR:',
                error
            );


            setProgress(
                0,
                'Upload gagal.'
            );


            tampilkanStatus(

                'error',

                '✕ UPLOAD GAGAL',

                escapeHTML(
                    error.message
                )

            );

        }finally{

            updateUploadButton();

        }

    }
);


/* =========================================================
   FILE TO BASE64
========================================================= */

function fileToBase64(file){

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();


            reader.onload =
                function(){

                    try{

                        const result =
                            reader.result;


                        const parts =
                            result.split(',');


                        const base64 =
                            parts[1];


                        if(!base64){

                            reject(
                                new Error(
                                    'File tidak dapat dibaca.'
                                )
                            );


                            return;

                        }


                        resolve(
                            base64
                        );

                    }catch(error){

                        reject(
                            error
                        );

                    }

                };


            reader.onerror =
                function(){

                    reject(
                        new Error(
                            'Gagal membaca file Excel.'
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   LOAD MASTER INFO
========================================================= */

async function loadMasterInfo(){

    const status =
        document.getElementById(
            'masterStatus'
        );


    const file =
        document.getElementById(
            'masterFile'
        );


    const user =
        document.getElementById(
            'masterUser'
        );


    const time =
        document.getElementById(
            'masterTime'
        );


    const version =
        document.getElementById(
            'masterVersion'
        );


    try{

        const response =
            await fetch(
                API_URL +
                '?action=info&t=' +
                Date.now()
            );


        if(!response.ok){

            throw new Error(
                'Server tidak dapat dihubungi.'
            );

        }


        const result =
            await response.json();


        if(!result.success){

            status.textContent =
                'Belum tersedia';


            status.style.color =
                '#64748b';


            return;

        }


        status.textContent =
            '🟢 Aktif';


        status.style.color =
            '#059669';


        file.textContent =
            result.fileName ||
            '-';


        user.textContent =
            result.uploadedBy ||
            '-';


        time.textContent =
            formatTanggal(
                result.uploadedAt
            );


        version.textContent =
            result.version ||
            '-';

    }catch(error){

        console.error(
            'MASTER INFO ERROR:',
            error
        );


        status.textContent =
            'Tidak dapat terhubung';


        status.style.color =
            '#dc2626';

    }

}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(value){

    if(!value){

        return '-';

    }


    const date =
        new Date(
            value
        );


    if(
        Number.isNaN(
            date.getTime()
        )
    ){

        return String(
            value
        );

    }


    return date.toLocaleString(
        'id-ID',
        {

            day:
                '2-digit',

            month:
                'long',

            year:
                'numeric',

            hour:
                '2-digit',

            minute:
                '2-digit'

        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value){

    return String(
        value ?? ''
    )

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
   INIT
========================================================= */

(function init(){

    /*
       Proteksi halaman dijalankan
       paling awal.
    */

    const bolehMasuk =
        proteksiHalamanAdmin();


    if(!bolehMasuk){

        return;

    }


    /*
       Admin valid.
       Sekarang load data.
    */

    console.log(
        '✓ Akses administrator diterima.'
    );


    console.log(
        '✓ Nama:',
        getNamaPengguna()
    );


    console.log(
        '✓ Nomor:',
        localStorage.getItem(
            'mc_sagaranten_phone'
        )
    );


    loadMasterInfo();


    updateUploadButton();

})();
  
/* =========================================================
   KIRIM NOTIFIKASI OTOMATIS (GLOBAL)
========================================================= */
async function kirimNotifikasiOtomatis(namaFile, namaAdmin) {
    const NOTIF_API_URL = 'https://script.google.com/macros/s/AKfycbzINzFJt38mQyqrgvzrTDechPja8b7tyoO5MMZkDmDSfw-Ftjp_y2POSAfYuP0fqi5WKw/exec';

    const payloadNotif = {
        action: 'create_notification',
        data: {
            title: 'Pembaruan Sistem 🚀',
            message: `Admin ${namaAdmin} baru saja memperbarui Master Data (${namaFile}). Data terbaru sudah tersedia!`,
            type: 'system',
            url: 'index.html',
            createdAt: new Date().toISOString()
        }
    };

    try {
        await fetch(NOTIF_API_URL, {
            method: 'POST',
            // ---> TAMBAHKAN HEADERS INI <---
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payloadNotif)
        });
        
        console.log("Notifikasi update data telah dipancarkan ke seluruh pengguna.");
    } catch (error) {
        console.error("Gagal memancarkan notifikasi:", error);
    }
}
