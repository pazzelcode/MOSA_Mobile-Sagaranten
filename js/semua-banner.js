/* =========================================================
   PROTEKSI LOGIN - 7 HARI
========================================================= */

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
        'login.html'
    );

}



/* =========================================================
   BANNER API
========================================================= */

const BANNER_API_URL =
    'https://script.google.com/macros/s/AKfycbxpgqbNoi4_2FdP1pxrr6qxPrR9z17GRNkQVXXYq3nyGkvubJqNJe1JTzw_f5vsGVpcBw/exec';


let allBanners = [];



/* =========================================================
   ELEMENT
========================================================= */

const bannerGrid =
    document.getElementById(
        'bannerGrid'
    );

const bannerLoading =
    document.getElementById(
        'bannerLoading'
    );

const bannerEmpty =
    document.getElementById(
        'bannerEmpty'
    );

const bannerError =
    document.getElementById(
        'bannerError'
    );

const bannerCount =
    document.getElementById(
        'bannerCount'
    );



/* =========================================================
   TOAST
========================================================= */

function showToast(message){

    const container =
        document.getElementById(
            'toast-container'
        );

    if(!container){

        alert(message);

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


    setTimeout(
        () => {

            toast.remove();

        },
        3000
    );

}



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value){

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



/* =========================================================
   LOAD BANNER (DENGAN CACHING LOCALSTORAGE)
========================================================= */

const CACHE_KEY = 'mc_sagaranten_banners_cache';
const CACHE_TIME_KEY = 'mc_sagaranten_banners_time';
const CACHE_TTL = 5 * 60 * 1000; // Cache berlaku 5 menit

async function loadAllBanners(){

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
    const isCacheValid = (Date.now() - cachedTime) < CACHE_TTL;

    // Jika cache ada dan valid, tampilkan seketika tanpa menunggu fetch
    if(isCacheValid && cachedData){
        try{
            allBanners = JSON.parse(cachedData);
            bannerLoading.style.display = 'none';
            updateBannerCount();
            if(allBanners.length === 0){
                bannerEmpty.style.display = 'flex';
                bannerGrid.innerHTML = '';
            } else {
                renderAllBanners();
            }
            // Lakukan fetch diam-diam di background untuk update data terbaru
            backgroundFetchBanners();
            return;
        }catch(e){
            // Jika cache korup, lanjut fetch normal
        }
    }

    bannerLoading.style.display = 'flex';
    bannerError.style.display = 'none';
    bannerEmpty.style.display = 'none';

    try{
        const response = await fetch(BANNER_API_URL + '?action=get&t=' + Date.now());

        if(!response.ok){
            throw new Error('HTTP ' + response.status);
        }

        const result = await response.json();

        if(!result.success){
            throw new Error(result.message || 'Gagal mengambil banner.');
        }

        allBanners = (result.data || [])
            .filter(banner => banner.aktif === true)
            .sort((a,b) => Number(a.urutan) - Number(b.urutan));

        // Simpan ke cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(allBanners));
        localStorage.setItem(CACHE_TIME_KEY, Date.now());

        bannerLoading.style.display = 'none';
        updateBannerCount();

        if(allBanners.length === 0){
            bannerEmpty.style.display = 'flex';
            bannerGrid.innerHTML = '';
            return;
        }

        renderAllBanners();

    }catch(error){
        console.error('Gagal load semua banner:', error);
        
        // Fallback ke cache lama jika ada saat offline/error
        if(cachedData){
            allBanners = JSON.parse(cachedData);
            bannerLoading.style.display = 'none';
            updateBannerCount();
            renderAllBanners();
            showToast('Menggunakan data offline tersimpan.');
            return;
        }

        bannerLoading.style.display = 'none';
        bannerError.style.display = 'flex';
    }
}

// Fetch latar belakang untuk memperbarui cache tanpa mengganggu UI
async function backgroundFetchBanners(){
    try{
        const response = await fetch(BANNER_API_URL + '?action=get&t=' + Date.now());
        const result = await response.json();
        if(result.success){
            const freshData = (result.data || [])
                .filter(banner => banner.aktif === true)
                .sort((a,b) => Number(a.urutan) - Number(b.urutan));
            
            localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
            localStorage.setItem(CACHE_TIME_KEY, Date.now());
        }
    }catch(e){}
}


/* =========================================================
   RENDER (OPTIMASI ATRIBUT PERFORMA)
========================================================= */

function renderAllBanners(){

    bannerGrid.innerHTML = allBanners.map((banner, index) => {

        const image = escapeHtml(banner.gambar);
        const title = escapeHtml(banner.judul || 'Informasi Terbaru');

        // 4 banner pertama (baris atas) diprioritaskan load-nya (eager + high priority)
        const loadingAttr = index < 4 ? 'eager' : 'lazy';
        const fetchPriority = index < 4 ? 'high' : 'auto';

        return `
            <article class="banner-card">
                <div class="banner-image-wrapper">
                    <img
                        src="${image}"
                        alt="${title}"
                        loading="${loadingAttr}"
                        fetchpriority="${fetchPriority}"
                        decoding="async"
                        data-index="${index}"
                        class="banner-preview-trigger"
                    >
                    <div class="banner-number">
                        #${index + 1}
                    </div>
                </div>

                <div class="banner-card-body">
                    <div class="banner-card-title">
                        ${title}
                    </div>
                    <div class="banner-card-desc">
                        MC-SAGARANTEN
                    </div>
                    <div class="banner-actions">
                        <button
                            type="button"
                            class="banner-action banner-download"
                            data-index="${index}"
                        >
                            📥 Download
                        </button>
                        <button
                            type="button"
                            class="banner-action banner-share"
                            data-index="${index}"
                        >
                            📤 Share
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    pasangEventBanner();
}


/* =========================================================
   EVENT BANNER (MENGGUNAKAN EVENT DELEGATION)
========================================================= */

function pasangEventBanner(){
    // Menghapus listener lama dengan mengganti innerHTML, 
    // lalu menggunakan 1 event listener di induk (bannerGrid) agar sangat cepat.
    
    // Pastikan tidak menumpuk event listener ganda
    if(bannerGrid.dataset.listenerAttached === 'true') return;
    bannerGrid.dataset.listenerAttached = 'true';

    bannerGrid.addEventListener('click', function(event){
        const downloadBtn = event.target.closest('.banner-download');
        const shareBtn = event.target.closest('.banner-share');
        const previewImg = event.target.closest('.banner-preview-trigger');

        if(downloadBtn){
            downloadBanner(Number(downloadBtn.dataset.index));
        } else if(shareBtn){
            shareBanner(Number(shareBtn.dataset.index));
        } else if(previewImg){
            bukaPreview(Number(previewImg.dataset.index));
        }
    });
}


/* =========================================================
   COUNT
========================================================= */

function updateBannerCount(){

    const total =
        allBanners.length;


    bannerCount.textContent =
        total +
        (
            total === 1
                ? ' Banner'
                : ' Banner'
        );

}

/* =========================================================
   DOWNLOAD
========================================================= */

async function downloadBanner(index){

    const banner =
        allBanners[index];


    if(
        !banner ||
        !banner.gambar
    ){

        showToast(
            'Gambar banner tidak tersedia.'
        );

        return;

    }


    showToast(
        'Menyiapkan download...'
    );


    try{

        const response =
            await fetch(
                banner.gambar
            );


        if(!response.ok){

            throw new Error(
                'Gagal mengambil gambar.'
            );

        }


        const blob =
            await response.blob();


        const blobUrl =
            URL.createObjectURL(
                blob
            );


        const extension =
            getExtension(
                banner.gambar
            );


        const filename =
            slugify(
                banner.judul ||
                'banner-mc-sagaranten'
            ) +
            '.' +
            extension;


        const link =
            document.createElement(
                'a'
            );


        link.href =
            blobUrl;

        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    blobUrl
                );

            },
            1000
        );


        showToast(
            'Banner berhasil didownload.'
        );


    }catch(error){

        console.error(
            'Download banner gagal:',
            error
        );


        /*
           Fallback:
           buka gambar langsung
        */

        window.open(
            banner.gambar,
            '_blank'
        );


        showToast(
            'Banner dibuka. Tekan lama gambar untuk menyimpan.'
        );

    }

}



/* =========================================================
   SHARE
========================================================= */

async function shareBanner(index){

    const banner =
        allBanners[index];


    if(!banner){

        return;

    }


    const title =
        banner.judul ||
        'Informasi MC-SAGARANTEN';


    const imageUrl =
        banner.gambar;


    /*
       Web Share API
    */

    if(
        navigator.share
    ){

        try{

            await navigator.share({

                title:
                    title,

                text:
                    title +
                    '\n\nMC-SAGARANTEN',

                url:
                    imageUrl

            });


            showToast(
                'Banner berhasil dibagikan.'
            );


            return;

        }catch(error){

            /*
               User membatalkan share
            */

            if(
                error.name ===
                'AbortError'
            ){

                return;

            }

        }

    }


    /*
       Fallback copy link
    */

    try{

        await navigator.clipboard.writeText(
            imageUrl
        );


        showToast(
            'Link banner berhasil disalin.'
        );


    }catch(error){

        window.prompt(
            'Salin link banner:',
            imageUrl
        );

    }

}



/* =========================================================
   PREVIEW
========================================================= */

const previewModal =
    document.getElementById(
        'bannerPreviewModal'
    );

const previewImage =
    document.getElementById(
        'previewImage'
    );

const previewTitle =
    document.getElementById(
        'previewTitle'
    );

const previewDownload =
    document.getElementById(
        'previewDownload'
    );

const previewShare =
    document.getElementById(
        'previewShare'
    );

const previewClose =
    document.getElementById(
        'previewClose'
    );


let previewIndex =
    null;



function bukaPreview(index){

    const banner =
        allBanners[index];


    if(!banner){

        return;

    }


    previewIndex =
        index;


    previewImage.src =
        banner.gambar;


    previewImage.alt =
        banner.judul ||
        'Banner MC-SAGARANTEN';


    previewTitle.textContent =
        banner.judul ||
        'Informasi MC-SAGARANTEN';


    previewModal.classList.add(
        'show'
    );


    previewModal.setAttribute(
        'aria-hidden',
        'false'
    );


    document.body.style.overflow =
        'hidden';

}



function tutupPreview(){

    previewModal.classList.remove(
        'show'
    );


    previewModal.setAttribute(
        'aria-hidden',
        'true'
    );


    document.body.style.overflow =
        '';


    previewImage.src =
        '';



    previewIndex =
        null;

}



/* CLOSE */

previewClose.addEventListener(
    'click',
    tutupPreview
);


previewModal.addEventListener(
    'click',
    event => {

        if(
            event.target ===
            previewModal
        ){

            tutupPreview();

        }

    }
);


document.addEventListener(
    'keydown',
    event => {

        if(
            event.key ===
            'Escape'
        ){

            tutupPreview();

        }

    }
);



/* PREVIEW DOWNLOAD */

previewDownload.addEventListener(
    'click',
    () => {

        if(
            previewIndex !== null
        ){

            downloadBanner(
                previewIndex
            );

        }

    }
);



/* PREVIEW SHARE */

previewShare.addEventListener(
    'click',
    () => {

        if(
            previewIndex !== null
        ){

            shareBanner(
                previewIndex
            );

        }

    }
);



/* =========================================================
   HELPER
========================================================= */

function getExtension(url){

    try{

        const cleanUrl =
            url.split('?')[0];

        const match =
            cleanUrl.match(
                /\.([a-zA-Z0-9]+)$/
            );


        if(match){

            const ext =
                match[1].toLowerCase();


            if(
                ['jpg','jpeg','png','webp']
                .includes(ext)
            ){

                return ext;

            }

        }

    }catch(error){}


    return 'jpg';

}



function slugify(text){

    return String(
        text || 'banner'
    )

    .toLowerCase()

    .replace(
        /[^a-z0-9]+/g,
        '-'
    )

    .replace(
        /^-+|-+$/g,
        ''
    )

    .substring(
        0,
        60
    );

}



/* =========================================================
   RETRY
========================================================= */

document
    .getElementById(
        'btnRetry'
    )
    .addEventListener(
        'click',
        loadAllBanners
    );



/* =========================================================
   BACK
========================================================= */

document
    .getElementById(
        'btnBack'
    )
    .addEventListener(
        'click',
        () => {

            if(
                document.referrer &&
                document.referrer.includes(
                    location.hostname
                )
            ){

                history.back();

            }else{

                window.location.href =
                    'dashboard.html';

            }

        }
    );



/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        loadAllBanners();

    }
);