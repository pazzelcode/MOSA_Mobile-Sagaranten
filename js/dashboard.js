/* =========================================
   PROTEKSI LOGIN - 7 HARI
========================================= */

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
        'index.html'
    );

}
const WEB_APP_URL =
'https://script.google.com/macros/s/AKfycbycTtyL4b5552GxsliBL_L08AgHBGLVVbk0k3crT_AXQe7Jw6GWMKS6FZ1PHjTrXIaL5w/exec';
  
const EXCEL_FILE_URL =
'https://docs.google.com/spreadsheets/d/19Owu6Q9ICW2RB9wosm-FQFlBMLdRJTHDrVAToPhhGbg/export?format=xlsx';

let lastDashboardSignature = null;
let isFirstDashboardLoad = true;

/* =========================================
   NAMA PENGGUNA LOGIN
========================================= */

function tampilkanNamaPengguna(){

    const namaElement =
        document.getElementById('user-name');

    if(!namaElement){
        return;
    }

    /*
       Ambil nama dari localStorage
    */
    const nama =
        localStorage.getItem(
            'mc_sagaranten_nama'
        );

    if(nama && nama.trim() !== ''){

        namaElement.textContent =
            nama.trim();

    }else{

        namaElement.textContent =
            'Pengguna';

    }

}

/* =========================================
   CEK AKUN ADMIN
========================================= */

function cekAksesAdmin(){

    const nomorLogin =
        localStorage.getItem(
            'mc_sagaranten_phone'
        );

    const nomorAdmin = [
        '085759695969'
    ];

    const adminMenu =
        document.getElementById(
            'admin-menu'
        );

    if(!adminMenu){
        return;
    }

    if(
        nomorLogin &&
        nomorAdmin.includes(
            nomorLogin.trim()
        )
    ){

        adminMenu.style.display =
            'block';

    }else{

        adminMenu.style.display =
            'none';

    }

}
/* =========================================
   LOG AKTIVITAS
========================================= */

async function kirimLog(
    aktivitas,
    halaman = window.location.pathname
){

    try{

        const response = await fetch(
            WEB_APP_URL,
            {
                method:'POST',

                headers:{
                    'Content-Type':
                    'text/plain;charset=utf-8'
                },

                body:JSON.stringify({
                    aktivitas:aktivitas,
                    halaman:halaman,
                    device:navigator.userAgent
                })
            }
        );

        const result = await response.text();

        console.log(
            'HASIL LOG:',
            result
        );

    }catch(error){

        console.log(
            'Gagal kirim log:',
            error
        );

    }

}


/* =========================================
   FORMAT RUPIAH
========================================= */

function formatRupiah(number){

    return "Rp " +
        Number(number || 0)
        .toLocaleString('id-ID');

}


/* =========================================
   AMBIL ANGKA
========================================= */

function ambilAngka(value){

    if(
        value === null ||
        value === undefined ||
        value === ''
    ){
        return 0;
    }

    return parseInt(
        String(value)
        .replace(/[^\d]/g,''),
        10
    ) || 0;

}

const MASTER_DATA_API_URL =
'https://script.google.com/macros/s/AKfycbyUTB9KwjzJ8q3WrOBNwMxIu6f_0A_PHBb2h36pYy6tItdSeN5CA-4MI0YZC86_qSxWCQ/exec';

async function updateDashboardData(){

    try{

        console.log(
            '================================='
        );

        console.log(
            'MENGAMBIL DATA DASHBOARD'
        );

        const response =
            await fetch(
                MASTER_DATA_API_URL +
                '?action=dashboard&t=' +
                Date.now()
            );

        if(!response.ok){

            throw new Error(
                'HTTP ' +
                response.status
            );

        }

        const result =
            await response.json();

        console.log(
            'RESPON DASHBOARD:',
            result
        );

        if(!result.success){

            throw new Error(
                result.message ||
                'Gagal mengambil data Dashboard.'
            );

        }

        const dashboard =
            result.data;

        const grandTotal =
            ambilAngka(
                dashboard.totalPenjualanSalmo
            );

        const totalSPVoucher =
            ambilAngka(
                dashboard.spDanVoucher
            );

        const totalPaket =
            ambilAngka(
                dashboard.allPaket
            );

        const totalHifi =
            ambilAngka(
                dashboard.hifi
            );

        console.log(
            '================================='
        );

        console.log(
            'TOTAL PENJUALAN SALMO:',
            grandTotal
        );

        console.log(
            'SP DAN VOUCHER:',
            totalSPVoucher
        );

        console.log(
            'ALL PAKET:',
            totalPaket
        );

        console.log(
            'HIFI:',
            totalHifi
        );

        console.log(
            '================================='
        );

        /* =====================================
           DETEKSI PERUBAHAN
        ===================================== */

        const dashboardSignature =
            JSON.stringify({

                salmo:
                    grandTotal,

                spVoucher:
                    totalSPVoucher,

                paket:
                    totalPaket,

                hifi:
                    totalHifi

            });

        if(
            !isFirstDashboardLoad &&
            lastDashboardSignature !==
            dashboardSignature
        ){

            console.log(
                'PERUBAHAN DATA DASHBOARD TERDETEKSI'
            );

            tambahNotif(
                'Data Dashboard berubah. Silakan periksa data terbaru.'
            );

            showToast(
                'Data Dashboard berubah'
            );

        }

        lastDashboardSignature =
            dashboardSignature;

        isFirstDashboardLoad =
            false;

        /* =====================================
           UPDATE KARTU
        ===================================== */

        const grandTotalElement =
            document.getElementById(
                'grand-total'
            );

        const totalSPElement =
            document.getElementById(
                'total-sp'
            );

        const totalPaketElement =
            document.getElementById(
                'total-paket'
            );

        const totalHifiElement =
            document.getElementById(
                'total-hifi'
            );

        if(grandTotalElement){

            grandTotalElement.innerText =
                formatRupiah(
                    grandTotal
                );

        }

        if(totalSPElement){

            totalSPElement.innerText =
                formatRupiah(
                    totalSPVoucher
                );

        }

        if(totalPaketElement){

            totalPaketElement.innerText =
                formatRupiah(
                    totalPaket
                );

        }

        if(totalHifiElement){

            totalHifiElement.innerText =
                formatRupiah(
                    totalHifi
                );

        }

        console.log(
            '✅ Dashboard berhasil diperbarui.'
        );

    }catch(error){

        console.error(
            '❌ GAGAL MENGAMBIL DATA DASHBOARD'
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

        const elements = [

            'grand-total',
            'total-sp',
            'total-paket',
            'total-hifi'

        ];

        elements.forEach(
            id => {

                const element =
                    document.getElementById(
                        id
                    );

                if(element){

                    element.innerText =
                        'Error';

                }

            }
        );

    }

}

/* =========================================
   JAM DIGITAL
========================================= */

function updateClock(){

    const now =
        new Date();

    const optionsDate = {
        weekday:'short',
        day:'numeric',
        month:'long'
    };

    const dateString =
        now.toLocaleDateString(
            'id-ID',
            optionsDate
        );

    const hours =
        String(
            now.getHours()
        ).padStart(2,'0');

    const minutes =
        String(
            now.getMinutes()
        ).padStart(2,'0');

    const seconds =
        String(
            now.getSeconds()
        ).padStart(2,'0');


    const dateElement =
        document.getElementById(
            'live-date'
        );

    const timeElement =
        document.getElementById(
            'live-time'
        );


    if(dateElement){

        dateElement.innerText =
            dateString;

    }

    if(timeElement){

        timeElement.innerText =
            `${hours}:${minutes}:${seconds}`;

    }

}


updateClock();

setInterval(
    updateClock,
    1000
);


/* =========================================
   NOTIFICATION BADGE
========================================= */

function updateBadge(){

    const notifBadge =
        document.getElementById(
            'notif-badge'
        );

    if(!notifBadge){

        return;

    }


    let logs = [];

    try{

        logs =
            JSON.parse(
                localStorage.getItem(
                    'notif_logs'
                ) || '[]'
            );

    }catch(error){

        logs = [];

    }


    const unreadCount =
        logs.filter(
            log => log.read !== true
        ).length;


    if(unreadCount > 0){

        notifBadge.style.display =
            'flex';

        notifBadge.textContent =
            unreadCount;

    }else{

        notifBadge.style.display =
            'none';

        notifBadge.textContent =
            '';

    }

}

/* =========================================
   TOAST
========================================= */

function showToast(message){

    const container =
        document.getElementById(
            'toast-container'
        );

    if(!container){

        return;

    }


    const toast =
        document.createElement(
            'div'
        );

    toast.className =
        'toast';

    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.remove();

    },3000);

}


/* =========================================
   LOAD SEMUA DATA
========================================= */

async function loadSemua(){

    try{

        await updateDashboardData();

        updateBadge();

    }catch(error){

        console.error(
            'Gagal load dashboard:',
            error
        );

    }

}


/* =========================================
   SEARCH MENU
========================================= */

const openSearchBtn =
    document.getElementById(
        'openSearch'
    );

const searchOverlay =
    document.getElementById(
        'searchOverlay'
    );

const searchInput =
    document.getElementById(
        'searchInput'
    );

const searchResults =
    document.getElementById(
        'searchResults'
    );


function ambilSemuaMenu(){

    const menus = [];


    /* DOWNLOAD */

    menus.push({

        title:'Download File',

        desc:
            'Unduh data excel dan backup',

        href:
            'download-data.html',

        icon:'📥'

    });


    /* MENU UTAMA */

    document
        .querySelectorAll(
            '.nav-item[href], .submenu-item[href]'
        )
        .forEach(item => {

            menus.push({

                title:
                    item.querySelector(
                        '.nav-title, .submenu-title'
                    )?.innerText || '',

                desc:
                    item.querySelector(
                        '.nav-desc'
                    )?.innerText || '',

                href:
                    item.getAttribute(
                        'href'
                    ),

                icon:
                    item.querySelector(
                        '.nav-icon, .submenu-icon'
                    )?.innerText || '📄'

            });

        });


    /* QUICK ACTION */

    document
        .querySelectorAll(
            '.action-btn[href]'
        )
        .forEach(item => {

            menus.push({

                title:
                    item.querySelector(
                        '.action-label'
                    )?.innerText || '',

                desc:
                    'Menu Aksi Cepat',

                href:
                    item.getAttribute(
                        'href'
                    ),

                icon:
                    item.querySelector(
                        '.action-icon'
                    )?.innerText || '⚡'

            });

        });


    return menus;

}


const allMenus =
    ambilSemuaMenu();


/* =========================================
   BUKA SEARCH
========================================= */

if(openSearchBtn){

    openSearchBtn.addEventListener(
        'click',
        () => {

            searchOverlay.classList.add(
                'active'
            );

            searchInput.value =
                '';

            tampilkanHasil(
                ''
            );


            setTimeout(
                () => {

                    searchInput.focus();

                },
                100
            );

        }
    );

}


/* =========================================
   TUTUP SEARCH
========================================= */

if(searchOverlay){

    searchOverlay.addEventListener(
        'click',
        e => {

            if(
                e.target ===
                searchOverlay
            ){

                searchOverlay.classList.remove(
                    'active'
                );

            }

        }
    );

}


/* =========================================
   SEARCH REALTIME
========================================= */

if(searchInput){

    searchInput.addEventListener(
        'input',
        function(){

            tampilkanHasil(
                this.value
            );

        }
    );

}


/* =========================================
   HASIL SEARCH
========================================= */

function tampilkanHasil(keyword){

    keyword =
        keyword
        .toLowerCase()
        .trim();


    const hasil =
        allMenus.filter(
            menu => {

                return (

                    menu.title
                        .toLowerCase()
                        .includes(
                            keyword
                        )

                    ||

                    menu.desc
                        .toLowerCase()
                        .includes(
                            keyword
                        )

                );

            }
        );


    if(
        !searchResults
    ){

        return;

    }


    if(
        hasil.length === 0
    ){

        searchResults.innerHTML = `

            <div class="empty-search">
                Menu tidak ditemukan
            </div>

        `;

        return;

    }


    searchResults.innerHTML =
        hasil.map(
            menu => `

                <a
                    href="${menu.href}"
                    class="search-item"
                >

                    <div class="search-icon">
                        ${menu.icon}
                    </div>

                    <div class="search-text">

                        <div class="search-title">
                            ${menu.title}
                        </div>

                        <div class="search-desc">
                            ${menu.desc}
                        </div>

                    </div>

                </a>

            `
        ).join('');

}

/* =========================================
   REFRESH
========================================= */

const refreshButton =
    document.getElementById(
        'btn-refresh'
    );


if(refreshButton){

    refreshButton.addEventListener(
        'click',
        function(){

            const icon =
                document.getElementById(
                    'refresh-icon'
                );


            if(icon){

                icon.classList.add(
                    'refresh-spin'
                );

            }


            kirimLog(
                'Manual Refresh Halaman'
            );


            tambahNotif(
                'Halaman sedang direfresh...'
            );


            showToast(
                'Halaman sedang direfresh...'
            );


            setTimeout(
                () => {

                    location.reload();

                },
                1500
            );

        }
    );

}


/* =========================================
   DOWNLOAD
========================================= */

const downloadButton =
    document.getElementById(
        'btn-download'
    );


if(downloadButton){

    downloadButton.addEventListener(
        'click',
        function(e){

            e.preventDefault();


            kirimLog(
                'Melakukan Download File'
            );


            window.location.href =
                'download-data.html?download=success';

        }
    );

}


/* =========================================
   STORAGE EVENT
========================================= */

window.addEventListener(
    'storage',
    event => {

        if(
            event.key ===
            'notif_logs'
        ){

            updateBadge();

        }

    }
);


/* =========================================
   HAPUS NOTIF SAAT MENU DIBUKA
========================================= */

document
    .querySelectorAll(
        '.nav-item[href], .submenu-item[href], .bottom-item[href]'
    )
    .forEach(menu => {

        menu.addEventListener(
            'click',
            () => {

                localStorage.removeItem(
                    'notif_logs'
                );


                const badge =
                    document.getElementById(
                        'notif-badge'
                    );


                if(badge){

                    badge.style.display =
                        'none';

                    badge.textContent =
                        '';

                }

            }
        );

    });


/* =========================================
   INIT
========================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        tampilkanNamaPengguna();

        updateBadge();

        cekAksesAdmin();

        kirimLog(
            'Membuka Home Portal'
        );

        loadSemua();

    }
);


/* =========================================
   AUTO REFRESH DATA
========================================= */

setInterval(
    loadSemua,
    10000
);

 /* =========================================================
   BANNER API
========================================================= */

const BANNER_API_URL =
    'https://script.google.com/macros/s/AKfycbxpgqbNoi4_2FdP1pxrr6qxPrR9z17GRNkQVXXYq3nyGkvubJqNJe1JTzw_f5vsGVpcBw/exec';


/* =========================================================
   BANNER CAROUSEL
========================================================= */

let homeBanners = [];

let bannerIndex = 0;

let bannerTimer = null;


/* =========================================================
   LOAD BANNER
========================================================= */

async function loadHomeBanners(){

    try{

        const response =
            await fetch(
                BANNER_API_URL +
                '?action=get&t=' +
                Date.now()
            );


        if(
            !response.ok
        ){

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
                'Gagal mengambil banner.'
            );

        }


        homeBanners =
            (result.data || [])
            .filter(
                banner =>
                    banner.aktif === true
            )
            .sort(
                (a,b) =>
                    Number(a.urutan) -
                    Number(b.urutan)
            );


        renderHomeBanners();


    }catch(error){

        console.error(
            'Gagal mengambil banner:',
            error
        );

    }

}


/* =========================================================
   RENDER (DIPERBARUI UNTUK PERFORMA)
========================================================= */

function renderHomeBanners(){

    const track = document.getElementById('banner-track');
    const dots = document.getElementById('banner-dots');

    if(!track || !dots){
        return;
    }

    clearInterval(bannerTimer);
    bannerIndex = 0;

    if(homeBanners.length === 0){
        track.innerHTML = `
            <div class="banner-slide" style="width:100%; display:flex; align-items:center; justify-content:center; background:#f1f5f9;">
                <div style="color:#94a3b8; font-size:11px; text-align:center;">
                    Belum ada informasi banner.
                </div>
            </div>
        `;
        dots.innerHTML = '';
        return;
    }

    track.innerHTML = homeBanners.map((banner, index) => {
        const safeLink = banner.link && banner.link !== '' ? banner.link : '#';
        
        // Optimasi Performa: Slide pertama dimuat langsung (eager), sisanya belakangan (lazy)
        const loadingAttr = index === 0 ? 'eager' : 'lazy';
        const fetchPriority = index === 0 ? 'high' : 'auto';

        return `
            <a href="${escapeBannerHtml(safeLink)}" class="banner-slide">
                <img
                    src="${escapeBannerHtml(banner.gambar)}"
                    alt="${escapeBannerHtml(banner.judul)}"
                    loading="${loadingAttr}"
                    fetchpriority="${fetchPriority}"
                >
            </a>
        `;
    }).join('');

    dots.innerHTML = homeBanners.map((banner, index) => `
        <span class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
    `).join('');

    dots.querySelectorAll('.banner-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(bannerTimer);
            pindahHomeBanner(Number(dot.dataset.index));
            mulaiHomeBanner();
        });
    });

    pindahHomeBanner(0);

    if(homeBanners.length > 1){
        mulaiHomeBanner();
    }
}



/* =========================================================
   PINDAH BANNER
========================================================= */

function pindahHomeBanner(
    index
){

    const track =
        document.getElementById(
            'banner-track'
        );


    const dots =
        document.querySelectorAll(
            '#banner-dots .banner-dot'
        );


    if(
        !track ||
        !homeBanners.length
    ){

        return;

    }


    bannerIndex =
        index;


    if(
        bannerIndex >=
        homeBanners.length
    ){

        bannerIndex =
            0;

    }


    if(
        bannerIndex < 0
    ){

        bannerIndex =
            homeBanners.length - 1;

    }


    track.style.transform =
        `translateX(-${bannerIndex * 100}%)`;


    dots.forEach(
        (
            dot,
            i
        ) => {

            dot.classList.toggle(
                'active',
                i === bannerIndex
            );

        }
    );

}


/* =========================================================
   AUTO SLIDE
========================================================= */

function mulaiHomeBanner(){

    clearInterval(
        bannerTimer
    );


    if(
        homeBanners.length <= 1
    ){

        return;

    }


    bannerTimer =
        setInterval(
            () => {

                pindahHomeBanner(
                    bannerIndex + 1
                );

            },
            4000
        );

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeBannerHtml(
    value
){

    return String(
        value || ''
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
/* =========================================
   LOGO PREVIEW
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const trigger = document.getElementById("logoPreviewTrigger");
    const modal = document.getElementById("logoPreviewModal");
    const closeBtn = document.getElementById("logoPreviewClose");

    if (!trigger || !modal || !closeBtn) {
        console.warn("Logo preview element tidak ditemukan.");
        return;
    }


    /* BUKA PREVIEW */

    function openLogoPreview() {

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");

        // Mencegah halaman belakang ikut scroll
        document.body.style.overflow = "hidden";
    }


    /* TUTUP PREVIEW */

    function closeLogoPreview() {

        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";
    }


    /* KLIK LOGO */

    trigger.addEventListener("click", function () {
        openLogoPreview();
    });


    /* TOMBOL X */

    closeBtn.addEventListener("click", function (event) {

        event.stopPropagation();

        closeLogoPreview();

    });


    /* KLIK AREA GELAP */

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {
            closeLogoPreview();
        }

    });


    /* TOMBOL ESC */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeLogoPreview();
        }

    });

});


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        loadHomeBanners();

    }
);

