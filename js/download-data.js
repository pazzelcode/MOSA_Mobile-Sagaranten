const apiURL = "https://script.google.com/macros/s/AKfycbxqGJfpHs5StXRy3ev0pN0i6GI-iACnBZZIfsacUnWDTf7LkEOX5Iyq5j_9MFekqhsJhw/exec";

// FORMAT "5 MENIT LALU"
function timeAgo(dateString){

    if(!dateString){
        return '-';
    }

    const past =
        new Date(dateString);

    if(isNaN(past.getTime())){
        return '-';
    }

    const now =
        new Date();

    let diff =
        Math.floor(
            (now.getTime() -
             past.getTime()) / 1000
        );

    if(diff < 0){
        diff = 0;
    }

    if(diff < 60){
        return 'baru saja';
    }

    if(diff < 3600){
        return Math.floor(diff / 60)
            + ' menit lalu';
    }

    if(diff < 86400){
        return Math.floor(diff / 3600)
            + ' jam lalu';
    }

    return Math.floor(diff / 86400)
        + ' hari lalu';
}

// SET STATUS WARNA
function setDateStatus(el, dateString){
    const now = new Date();
    const fileDate = new Date(dateString);
    if(isNaN(fileDate)) return;
    const diffHour = (now - fileDate) / (1000 * 60 * 60);

    el.classList.remove('today', 'medium', 'old');

    if(diffHour <= 24){
        el.classList.add('today');
    } else if(diffHour <= 72){
        el.classList.add('medium');
    } else {
        el.classList.add('old');
    }
}

// UPDATE UI TANGGAL (DISESUAIKAN DENGAN STRUKTUR DATA ARRAY FILE)
let currentFiles = [];

function updateDatesUI(filesData){

    if(!Array.isArray(filesData)){
        return;
    }

    currentFiles = filesData;

    filesData.forEach(file => {

        const el =
            document.getElementById(
                'date-' + file.key
            );

        if(!el){
            return;
        }

        const dateVal =
            file.updatedAt;

        el.classList.remove(
            'skeleton',
            'today',
            'medium',
            'old'
        );

        if(!dateVal){

            el.innerText =
                'Update: -';

            return;
        }

        el.innerText =
            'Update: ' +
            timeAgo(dateVal);

        setDateStatus(
            el,
            dateVal
        );
    });
}

/* =========================================
   UPDATE TAMPILAN WAKTU SETIAP 1 DETIK
========================================= */

setInterval(() => {

    if(currentFiles.length){
        updateDatesUI(currentFiles);
    }

}, 1000);


/* =========================================
   CEK DATA SERVER SETIAP 30 DETIK
========================================= */

setInterval(async () => {

    const files =
        await getFilesList();

    updateDatesUI(files);

}, 30000);
// FUNCTION NOTIFIKASI
function tambahNotif(pesan){
    let logs = JSON.parse(localStorage.getItem('notif_logs') || '[]');
    logs.unshift({
        pesan: pesan,
        waktu: new Date().toLocaleString('id-ID'),
        timestamp: Date.now(),
        read: false
    });
    logs = logs.slice(0, 20);
    localStorage.setItem('notif_logs', JSON.stringify(logs));
}

// CEK PARAMETER URL DOWNLOAD SUCCESS
const params = new URLSearchParams(window.location.search);
if(params.get('download') === 'success'){
    tambahNotif('File berhasil di download.');
    window.history.replaceState({}, document.title, window.location.pathname);
}

const defaultFiles = [];

// AMBIL DAFTAR FILE DARI SERVER
async function getFilesList() {
    try {
        const response = await fetch(apiURL + '?action=get&t=' + Date.now());
        const result = await response.json();
        
        const files = Array.isArray(result) ? result : (result.data || defaultFiles);
        return files.filter(file => file.aktif !== false && file.aktif !== 'false');
    } catch (err) {
        console.error("Gagal memuat list file dari server:", err);
        return defaultFiles;
    }
}

// MENGUBAH LINK GOOGLE DRIVE AGAR AMAN DAN LANGSUNG DOWNLOAD
function getDirectDownloadUrl(originalUrl){

    if(!originalUrl){
        return '#';
    }

    originalUrl = String(originalUrl).trim();

    let fileId = null;

    /* =========================================
       /file/d/FILE_ID/view
    ========================================= */

    let match =
        originalUrl.match(
            /\/file\/d\/([a-zA-Z0-9_-]+)/
        );

    if(match){
        fileId = match[1];
    }

    /* =========================================
       ?id=FILE_ID
    ========================================= */

    if(!fileId){

        match =
            originalUrl.match(
                /[?&]id=([a-zA-Z0-9_-]+)/
            );

        if(match){
            fileId = match[1];
        }
    }

    /* =========================================
       /uc?id=FILE_ID
    ========================================= */

    if(!fileId){

        match =
            originalUrl.match(
                /\/uc\?(?:export=download&)?id=([a-zA-Z0-9_-]+)/
            );

        if(match){
            fileId = match[1];
        }
    }

    if(!fileId){
        return originalUrl;
    }

    /* =========================================
       DIRECT DOWNLOAD
    ========================================= */

    return (
        'https://drive.usercontent.google.com/download' +
        '?id=' +
        encodeURIComponent(fileId) +
        '&export=download' +
        '&confirm=t'
    );
}

// RESET DOWNLOAD HARIAN
async function resetDownloadHarian(){
    const today = new Date().toLocaleDateString('id-ID');
    const lastReset = localStorage.getItem('download_reset_date');

    if(lastReset !== today){
        const files = await getFilesList();
        files.forEach(file => {
            localStorage.setItem('download_' + file.key, 0);
        });
        localStorage.setItem('download_reset_date', today);
    }
}

// LOAD TOTAL DOWNLOAD
async function loadDownloadCount(){
    const files = await getFilesList();

    files.forEach(file => {
        const total = localStorage.getItem('download_' + file.key) || 0;
        const el = document.getElementById('count-' + file.key);

        if(el){
            el.innerText = 'Download: ' + total + 'x';
        }
    });
}

// RENDER HTML FILE LIST SECARA DINAMIS
async function renderFileList() {
    const container = document.getElementById('file-container');
    if(!container) return;
    
    container.innerHTML = '<div class="loading" style="text-align:center; padding:20px; color:#64748b;">Memuat daftar file...</div>';
    
    const files = await getFilesList();
    let html = '';

    if(files.length === 0){
        container.innerHTML = '<div class="file-empty" style="text-align:center; padding:20px; color:#94a3b8;">Belum ada file unduhan tersedia.</div>';
        return;
    }

    files.forEach(file => {
        const totalDownload = localStorage.getItem('download_' + file.key) || 0;
        const downloadUrl = getDirectDownloadUrl(file.url);
        
        html += `
        <div class="file-item">
            <div class="file-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.5 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V7.5L14.5 2Z" fill="#107C41"/>
                    <path d="M14 2V5.5C14 6.3 14.7 7 15.5 7H19L14 2Z" fill="#33C481"/>
                    <path d="M8 11H13V13H8V11ZM8 14H16V16H8V14ZM8 17H16V19H8V17ZM14 11H16V13H14V11Z" fill="white"/>
                </svg>
            </div>
            <div class="file-info">
                <span class="file-name">${file.name || file.judul}</span>
                <span class="file-desc">${file.desc || file.deskripsi || ''}</span>
                <span class="update-date skeleton" id="date-${file.key}">Memuat...</span>
                <span class="download-count" id="count-${file.key}">Download: ${totalDownload}x</span>
            </div>
            <a
    href="${downloadUrl}"
    class="btn-download"
    download
    onclick="handleDownload(event,'${file.key}')"
>
    <svg viewBox="0 0 24 24" fill="none">
        <path
            d="M12 3V15M12 15L7 10M12 15L17 10M5 21H19"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>

    <span class="btn-text">
        Download
    </span>
</a>
        </div>`;
    });
    
    container.innerHTML = html;
    
    // Perbarui tanggal menggunakan data list files yang sudah ditarik
    updateDatesUI(files);
}

// HANDLE DOWNLOAD & COUNTER
function handleDownload(event, key){

    const btn =
        event.currentTarget;

    const text =
        btn.querySelector('.btn-text');

    setTimeout(() => {

        let total =
            parseInt(
                localStorage.getItem(
                    'download_' + key
                ) || 0
            );

        total++;

        localStorage.setItem(
            'download_' + key,
            total
        );

        const countEl =
            document.getElementById(
                'count-' + key
            );

        if(countEl){

            countEl.innerText =
                'Download: ' +
                total +
                'x';

        }

        tambahNotif(
            'File berhasil di download.'
        );

        btn.classList.add('success');

        text.innerText =
            'Berhasil';

        setTimeout(() => {

            btn.classList.remove(
                'success'
            );

            text.innerText =
                'Download';

        }, 2000);

    }, 300);

}

// INISIALISASI UTAMA
document.addEventListener('DOMContentLoaded', async () => {
    await renderFileList();
    await resetDownloadHarian();
    await loadDownloadCount();
});

// AUTO REFRESH KONTROL 30 DETIK
setInterval(async () => {
    const files = await getFilesList();
    updateDatesUI(files);
}, 30000);
