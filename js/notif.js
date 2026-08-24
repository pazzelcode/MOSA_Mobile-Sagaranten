/* =========================================================
   MC-SAGARANTEN
   GLOBAL NOTIFICATION CLIENT
========================================================= */

const GLOBAL_NOTIFICATION_API =
    'https://script.google.com/macros/s/AKfycbzINzFJt38mQyqrgvzrTDechPja8b7tyoO5MMZkDmDSfw-Ftjp_y2POSAfYuP0fqi5WKw/exec';


const NOTIF_STORAGE_KEY =
    'mc_sagaranten_read_notifications';


const NOTIF_CACHE_KEY =
    'mc_sagaranten_notifications';


/* =========================================================
   AMBIL NOTIFIKASI SERVER
========================================================= */

async function fetchGlobalNotifications(){

    try{

        const response =
            await fetch(
                GLOBAL_NOTIFICATION_API +
                '?action=notifications&t=' +
                Date.now(),
                {
                    cache:'no-store'
                }
            );


        if(!response.ok){

            throw new Error(
                'HTTP ' +
                response.status
            );

        }


        const result =
            await response.json();


        if(
            !result.success
        ){

            throw new Error(
                result.message ||
                'Gagal mengambil notifikasi.'
            );

        }


        const notifications =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        localStorage.setItem(

            NOTIF_CACHE_KEY,

            JSON.stringify(
                notifications
            )

        );


        updateGlobalNotificationBadge();


        /*
           Event agar halaman lain
           bisa ikut memperbarui UI
        */

        window.dispatchEvent(
            new CustomEvent(
                'mcNotificationUpdated',
                {
                    detail:
                        notifications
                }
            )
        );


        return notifications;


    }catch(error){

        console.error(
            'Gagal mengambil notifikasi global:',
            error
        );


        return [];

    }

}


/* =========================================================
   NOTIFIKASI YANG SUDAH DIBACA
========================================================= */

function getReadNotificationIds(){

    try{

        return JSON.parse(

            localStorage.getItem(
                NOTIF_STORAGE_KEY
            ) || '[]'

        );

    }catch(error){

        return [];

    }

}


/* =========================================================
   SIMPAN SUDAH DIBACA
========================================================= */

function markNotificationAsRead(
    id
){

    if(!id){

        return;

    }


    let readIds =
        getReadNotificationIds();


    if(
        !readIds.includes(id)
    ){

        readIds.push(id);

    }


    /*
       Maksimal 200 ID
    */

    readIds =
        readIds.slice(
            -200
        );


    localStorage.setItem(

        NOTIF_STORAGE_KEY,

        JSON.stringify(
            readIds
        )

    );


    updateGlobalNotificationBadge();

}


/* =========================================================
   SEMUA SUDAH DIBACA
========================================================= */

function markAllNotificationsAsRead(){

    const notifications =
        getCachedNotifications();


    const ids =
        notifications.map(
            notification =>
                notification.id
        );


    localStorage.setItem(

        NOTIF_STORAGE_KEY,

        JSON.stringify(
            ids.slice(-200)
        )

    );


    updateGlobalNotificationBadge();

}


/* =========================================================
   CACHE
========================================================= */

function getCachedNotifications(){

    try{

        return JSON.parse(

            localStorage.getItem(
                NOTIF_CACHE_KEY
            ) || '[]'

        );

    }catch(error){

        return [];

    }

}


/* =========================================================
   HITUNG UNREAD
========================================================= */

function getUnreadNotifications(){

    const notifications =
        getCachedNotifications();


    const readIds =
        getReadNotificationIds();


    return notifications.filter(
        notification =>
            !readIds.includes(
                notification.id
            )
    );

}


/* =========================================================
   UPDATE BADGE
========================================================= */

function updateGlobalNotificationBadge(){

    const badges =
        document.querySelectorAll(
            '#notif-badge, .notif-badge'
        );


    const unread =
        getUnreadNotifications();


    badges.forEach(
        badge => {

            if(
                unread.length > 0
            ){

                badge.style.display =
                    'flex';

                badge.textContent =
                    unread.length > 99
                        ? '99+'
                        : unread.length;

            }else{

                badge.style.display =
                    'none';

                badge.textContent =
                    '';

            }

        }
    );

}


/* =========================================================
   FORMAT WAKTU
========================================================= */

function formatNotificationTime(
    value
){

    if(!value){

        return '';

    }


    const date =
        new Date(value);


    if(
        isNaN(
            date.getTime()
        )
    ){

        return value;

    }


    return date.toLocaleString(
        'id-ID',
        {
            day:'2-digit',
            month:'short',
            year:'numeric',
            hour:'2-digit',
            minute:'2-digit'
        }
    );

}


/* =========================================================
   ICON
========================================================= */

function getNotificationIcon(
    type
){

    const icons = {

        sales:'📈',

        dashboard:'📊',

        report:'📋',

        system:'⚙️',

        info:'ℹ️',

        warning:'⚠️',

        success:'✅',

        banner:'📢'

    };


    return (
        icons[type] ||
        '🔔'
    );

}


/* =========================================================
   TAMBAH NOTIFIKASI DARI SERVER
========================================================= */

async function refreshGlobalNotifications(){

    await fetchGlobalNotifications();

}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startGlobalNotificationPolling(){

    /*
       Pertama langsung cek
    */

    refreshGlobalNotifications();


    /*
       Kemudian setiap 15 detik
    */

    setInterval(

        refreshGlobalNotifications,

        15000

    );

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        updateGlobalNotificationBadge();

        startGlobalNotificationPolling();

    }
);

/* =========================================================
   POPUP/TOAST NOTIFICATION TRIGGER
========================================================= */

const TOASTED_STORAGE_KEY = 'mc_sagaranten_toasted_notifications';

// Dengarkan event saat data notifikasi baru saja ditarik dari server
window.addEventListener('mcNotificationUpdated', (e) => {
    const notifications = e.detail;
    const readIds = getReadNotificationIds();
    
    // Ambil ID notifikasi yang sudah pernah dimunculkan popup-nya
    let toastedIds = [];
    try {
        toastedIds = JSON.parse(localStorage.getItem(TOASTED_STORAGE_KEY) || '[]');
    } catch(err) {}

    let hasNewToast = false;

    // Cek satu per satu notifikasi
    notifications.forEach(notif => {
        // Jika belum dibaca DAN belum pernah di-toast
        if(!readIds.includes(notif.id) && !toastedIds.includes(notif.id)) {
            showToastPopup(notif); // Munculkan popup
            toastedIds.push(notif.id); // Tandai sudah di-toast
            hasNewToast = true;
        }
    });

    // Simpan kembali daftar yang sudah di-toast
    if(hasNewToast) {
        // Batasi memori agar tidak terlalu besar (simpan 200 id terakhir)
        toastedIds = toastedIds.slice(-200);
        localStorage.setItem(TOASTED_STORAGE_KEY, JSON.stringify(toastedIds));
    }
});

/* =========================================================
   FUNGSI MEMBUAT ELEMEN TOAST HTML
========================================================= */
function showToastPopup(notif) {
    // 1. Cek apakah container toast sudah ada di halaman, jika belum buatkan
    let container = document.querySelector('.global-notif-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'global-notif-toast-container';
        document.body.appendChild(container);
    }

    // 2. Buat elemen toast
    const toast = document.createElement('div');
    toast.className = 'global-notif-toast';
    
    toast.innerHTML = `
        <div class="toast-icon">
            ${getNotificationIcon(notif.type)}
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(notif.title)}</div>
            <div class="toast-message">${escapeHtml(notif.message)}</div>
        </div>
        <button class="toast-close">✕</button>
    `;

    // 3. Masukkan ke container
    container.appendChild(toast);

    // 4. Beri efek animasi muncul (delay sedikit agar transisi CSS berjalan)
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // 5. Fungsi hapus toast (bisa di-klik tutup atau hilang otomatis 5 detik)
    const removeToast = () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if(toast.parentElement) toast.remove();
        }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', (e) => {
        e.stopPropagation();
        removeToast();
    });

    // Hilang otomatis setelah 5 detik
    setTimeout(removeToast, 5000);

    // Jika toast di-klik, arahkan ke halaman notifikasi (opsional)
    toast.addEventListener('click', () => {
        window.location.href = 'notif.html';
    });
}

// Fungsi bantu escape HTML (hindari error karakter khusus)
function escapeHtml(value){
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
