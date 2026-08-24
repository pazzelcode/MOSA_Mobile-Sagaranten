/* =========================================================
   API
========================================================= */

const PROGRAM_OUTLET_API_URL =
'https://script.google.com/macros/s/AKfycbwn7LmrZubBQIc2Ipfd2la0NuUhcIxIB4JPl8TUnMI-RH2j3ZJq9TxX0zc0UTeGiO-WyQ/exec';


/* =========================================================
   STATE
========================================================= */

let programs = [];

let viewerIndex = 0;


/* =========================================================
   ELEMENT
========================================================= */

const gallery =
    document.getElementById(
        'program-gallery'
    );

const refreshButton =
    document.getElementById(
        'refresh-button'
    );

const viewer =
    document.getElementById(
        'image-viewer'
    );

const viewerImage =
    document.getElementById(
        'viewer-image'
    );

const viewerTitle =
    document.getElementById(
        'viewer-title'
    );

const viewerCounter =
    document.getElementById(
        'viewer-counter'
    );


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
   LOAD DATA (DENGAN CACHING LOCALSTORAGE)
========================================================= */

const PROGRAM_CACHE_KEY = 'mc_sagaranten_programs_cache';
const PROGRAM_CACHE_TIME_KEY = 'mc_sagaranten_programs_time';
const PROGRAM_CACHE_TTL = 5 * 60 * 1000; // Cache berlaku 5 menit

async function loadPrograms(){

    const cachedData = localStorage.getItem(PROGRAM_CACHE_KEY);
    const cachedTime = Number(localStorage.getItem(PROGRAM_CACHE_TIME_KEY) || 0);
    const isCacheValid = (Date.now() - cachedTime) < PROGRAM_CACHE_TTL;

    // Jika cache valid, tampilkan seketika tanpa menunggu fetch
    if(isCacheValid && cachedData){
        try{
            programs = JSON.parse(cachedData);
            if(programs.length > 0){
                renderPrograms();
                backgroundFetchPrograms(); // Update data terbaru diam-diam di background
                return;
            }
        }catch(e){}
    }

    try{
        refreshButton.classList.add('loading');

        const response = await fetch(
            PROGRAM_OUTLET_API_URL +
            '?action=get&t=' +
            Date.now()
        );

        if(!response.ok){
            throw new Error('HTTP ' + response.status);
        }

        const result = await response.json();

        if(!result.success){
            throw new Error(result.message || 'Gagal mengambil data.');
        }

        programs = (result.data || [])
            .filter(item => item.aktif === true)
            .sort((a,b) => Number(a.urutan) - Number(b.urutan));

        // Simpan ke cache
        localStorage.setItem(PROGRAM_CACHE_KEY, JSON.stringify(programs));
        localStorage.setItem(PROGRAM_CACHE_TIME_KEY, Date.now());

        renderPrograms();

    }catch(error){
        console.error('Gagal load Program Outlet:', error);

        // Fallback ke cache lama jika ada saat offline/error
        if(cachedData){
            programs = JSON.parse(cachedData);
            renderPrograms();
            return;
        }

        gallery.innerHTML = `
            <div class="program-empty">
                <div class="empty-icon">⚠️</div>
                <div class="empty-title">Gagal memuat program</div>
                <div class="empty-desc">Periksa koneksi internet kemudian coba refresh.</div>
            </div>
        `;

    }finally{
        refreshButton.classList.remove('loading');
    }
}

// Fetch latar belakang untuk memperbarui cache tanpa mengganggu UI
async function backgroundFetchPrograms(){
    try{
        const response = await fetch(PROGRAM_OUTLET_API_URL + '?action=get&t=' + Date.now());
        const result = await response.json();
        if(result.success){
            const freshData = (result.data || [])
                .filter(item => item.aktif === true)
                .sort((a,b) => Number(a.urutan) - Number(b.urutan));
            
            localStorage.setItem(PROGRAM_CACHE_KEY, JSON.stringify(freshData));
            localStorage.setItem(PROGRAM_CACHE_TIME_KEY, Date.now());
        }
    }catch(e){}
}


/* =========================================================
   RENDER (OPTIMASI GAMBAR & EVENT DELEGATION)
========================================================= */

function renderPrograms(){

    if(!programs.length){
        gallery.innerHTML = `
            <div class="program-empty">
                <div class="empty-icon">🏪</div>
                <div class="empty-title">Belum ada program</div>
                <div class="empty-desc">Informasi program outlet akan muncul di sini.</div>
            </div>
        `;
        return;
    }

    gallery.innerHTML = programs.map((program, index) => {
        const image = escapeHtml(program.gambar);
        const title = escapeHtml(program.judul);
        const desc = escapeHtml(program.deskripsi);
        const link = escapeHtml(program.link);

        // 4 kartu pertama (baris atas) diprioritaskan (eager + high priority)
        const loadingAttr = index < 4 ? 'eager' : 'lazy';
        const fetchPriority = index < 4 ? 'high' : 'auto';

        return `
            <article class="program-card" data-index="${index}">
                <div class="program-image-wrap">
                    <img
                        class="program-image"
                        src="${image}"
                        alt="${title}"
                        loading="${loadingAttr}"
                        fetchpriority="${fetchPriority}"
                        decoding="async"
                    >
                    <span class="program-badge">AKTIF</span>
                    <div class="program-image-overlay">
                        <div class="program-card-title">${title}</div>
                    </div>
                </div>

                <div class="program-card-body">
                    <div class="program-card-desc">${desc}</div>
                    ${link ? `<span class="program-card-link">Lihat detail →</span>` : ''}
                </div>
            </article>
        `;
    }).join('');

    pasangEventGaleri();

    setTimeout(adjustCardDescriptions, 50);
}


/* =========================================================
   EVENT DELEGATION UNTUK KARTU (SANGAT HEMAT MEMORI)
========================================================= */

function pasangEventGaleri(){
    if(gallery.dataset.listenerAttached === 'true') return;
    gallery.dataset.listenerAttached = 'true';

    gallery.addEventListener('click', function(event){
        const card = event.target.closest('.program-card');
        if(card){
            const index = Number(card.dataset.index);
            openViewer(index);
        }
    });
}


/* =========================================================
   ATUR DESKRIPSI BERDASARKAN BARIS CARD
========================================================= */

function adjustCardDescriptions(){

    const cards =
        Array.from(
            gallery.querySelectorAll(
                '.program-card'
            )
        );


    if(!cards.length){

        return;

    }


    /* -----------------------------------------
       RESET SEMUA CARD
    ----------------------------------------- */

    cards.forEach(card => {

        const desc =
            card.querySelector(
                '.program-card-desc'
            );


        if(desc){

            desc.classList.remove(
                'expand'
            );

        }

    });


    /* -----------------------------------------
       KELOMPOKKAN CARD BERDASARKAN POSISI Y
       Artinya card yang satu baris
       akan memiliki top yang hampir sama.
    ----------------------------------------- */

    const rows = [];


    cards.forEach(card => {

        const top =
            Math.round(
                card.getBoundingClientRect().top
            );


        let row =
            rows.find(
                item =>
                    Math.abs(
                        item.top - top
                    ) <= 5
            );


        if(!row){

            row = {

                top:top,

                cards:[]

            };


            rows.push(row);

        }


        row.cards.push(card);

    });


    /* -----------------------------------------
       PROSES SETIAP BARIS
    ----------------------------------------- */

    rows.forEach(row => {

        /* Kalau hanya ada 1 card
           jangan diperpanjang */

        if(
            row.cards.length <= 1
        ){

            return;

        }


        /* Cari card paling tinggi */

        const maxHeight =
            Math.max(
                ...row.cards.map(
                    card =>
                        card.getBoundingClientRect()
                            .height
                )
            );


        /* Cari card yang lebih pendek */

        row.cards.forEach(card => {

            const cardHeight =
                card.getBoundingClientRect()
                    .height;


            const desc =
                card.querySelector(
                    '.program-card-desc'
                );


            if(
                !desc
            ){

                return;

            }


            /*
             * Hanya card yang lebih pendek
             * yang deskripsinya dibuka penuh.
             */

            if(
                cardHeight <
                maxHeight - 5
            ){

                desc.classList.add(
                    'expand'
                );

            }

        });

    });

}

window.addEventListener(
    'resize',
    () => {

        setTimeout(
            adjustCardDescriptions,
            100
        );

    }
);
  
/* =========================================================
   OPEN VIEWER
========================================================= */

function openViewer(index){

    if(
        !programs.length
    ){

        return;

    }


    viewerIndex =
        index;


    updateViewer();


    viewer.classList.add(
        'active'
    );


    document.body.style.overflow =
        'hidden';

}


/* =========================================================
   UPDATE VIEWER
========================================================= */

function updateViewer(){

    const program =
        programs[
            viewerIndex
        ];


    if(!program){

        return;

    }


    viewerImage.src =
        program.gambar || '';


    viewerImage.alt =
        program.judul || '';


    viewerTitle.textContent =
        program.judul || 'Program Outlet';


    viewerCounter.textContent =
        `${viewerIndex + 1} / ${programs.length}`;


    document.getElementById(
        'viewer-open'
    ).style.display =
        program.link
            ? 'block'
            : 'none';

}


/* =========================================================
   CLOSE VIEWER
========================================================= */

function closeViewer(){

    viewer.classList.remove(
        'active'
    );


    document.body.style.overflow =
        '';

}


document
    .getElementById(
        'viewer-close'
    )
    .addEventListener(
        'click',
        closeViewer
    );


/* =========================================================
   NEXT
========================================================= */

function nextViewer(){

    if(
        !programs.length
    ){

        return;

    }


    viewerIndex =
        (
            viewerIndex + 1
        )
        %
        programs.length;


    updateViewer();

}


/* =========================================================
   PREVIOUS
========================================================= */

function previousViewer(){

    if(
        !programs.length
    ){

        return;

    }


    viewerIndex =
        (
            viewerIndex -
            1 +
            programs.length
        )
        %
        programs.length;


    updateViewer();

}


document
    .getElementById(
        'viewer-next'
    )
    .addEventListener(
        'click',
        nextViewer
    );


document
    .getElementById(
        'viewer-prev'
    )
    .addEventListener(
        'click',
        previousViewer
    );


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    'keydown',
    event => {

        if(
            !viewer.classList.contains(
                'active'
            )
        ){

            return;

        }


        if(
            event.key === 'Escape'
        ){

            closeViewer();

        }


        if(
            event.key === 'ArrowRight'
        ){

            nextViewer();

        }


        if(
            event.key === 'ArrowLeft'
        ){

            previousViewer();

        }

    }
);


/* =========================================================
   SWIPE
========================================================= */

let touchStartX = 0;

let touchEndX = 0;


const viewerStage =
    document.getElementById(
        'viewer-stage'
    );


viewerStage.addEventListener(
    'touchstart',
    event => {

        touchStartX =
            event.changedTouches[0].screenX;

    },
    {
        passive:true
    }
);


viewerStage.addEventListener(
    'touchend',
    event => {

        touchEndX =
            event.changedTouches[0].screenX;


        const difference =
            touchEndX -
            touchStartX;


        if(
            Math.abs(difference) <
            50
        ){

            return;

        }


        if(
            difference < 0
        ){

            nextViewer();

        }else{

            previousViewer();

        }

    },
    {
        passive:true
    }
);


/* =========================================================
   SHARE PROGRAM + GAMBAR
========================================================= */

document
    .getElementById('viewer-share')
    .addEventListener(
        'click',
        async () => {

            const program =
                programs[viewerIndex];


            if(!program){

                return;

            }


            /*
             * =========================================
             * CEK WEB SHARE
             * =========================================
             */

            if(
                !navigator.share
            ){

                alert(
                    'Browser ini belum mendukung fitur Share.'
                );

                return;

            }


            const title =
                program.judul ||
                'Program Outlet MC-SAGARANTEN';


            const description =
                program.deskripsi ||
                'Program Outlet MC-SAGARANTEN';


            const link =
                program.link ||
                window.location.href;


            const shareButton =
                document.getElementById(
                    'viewer-share'
                );


            const originalText =
                shareButton.innerHTML;


            /*
             * =========================================
             * BUTTON LOADING
             * =========================================
             */

            shareButton.disabled =
                true;


            shareButton.innerHTML =
                '⏳ Menyiapkan...';


            try{

                /*
                 * =========================================
                 * MINTA GAMBAR KE GOOGLE APPS SCRIPT
                 * =========================================
                 */

                const apiUrl =
                    PROGRAM_OUTLET_API_URL +
                    '?action=getImage' +
                    '&url=' +
                    encodeURIComponent(
                        program.gambar
                    ) +
                    '&t=' +
                    Date.now();


                const response =
                    await fetch(
                        apiUrl
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
                        'Gagal mengambil gambar.'
                    );

                }


                if(
                    !result.data ||
                    !result.data.base64
                ){

                    throw new Error(
                        'Data gambar kosong.'
                    );

                }


                /*
                 * =========================================
                 * BASE64 → BYTE ARRAY
                 * =========================================
                 */

                const byteCharacters =
                    atob(
                        result.data.base64
                    );


                const byteArrays =
                    [];


                const sliceSize =
                    1024;


                for(
                    let offset = 0;
                    offset <
                    byteCharacters.length;
                    offset +=
                    sliceSize
                ){

                    const slice =
                        byteCharacters.slice(
                            offset,
                            offset +
                            sliceSize
                        );


                    const byteNumbers =
                        new Array(
                            slice.length
                        );


                    for(
                        let i = 0;
                        i <
                        slice.length;
                        i++
                    ){

                        byteNumbers[i] =
                            slice.charCodeAt(
                                i
                            );

                    }


                    byteArrays.push(
                        new Uint8Array(
                            byteNumbers
                        )
                    );

                }


                /*
                 * =========================================
                 * BUAT BLOB
                 * =========================================
                 */

                const blob =
                    new Blob(
                        byteArrays,
                        {
                            type:
                                result.data.mimeType ||
                                'image/jpeg'
                        }
                    );


                /*
                 * =========================================
                 * BUAT FILE
                 * =========================================
                 */

                const fileName =
                    result.data.fileName ||
                    'program-outlet.jpg';


                const file =
                    new File(
                        [
                            blob
                        ],
                        fileName,
                        {
                            type:
                                result.data.mimeType ||
                                'image/jpeg'
                        }
                    );


                /*
                 * =========================================
                 * CEK FILE SHARE
                 * =========================================
                 */

                if(
                    !navigator.canShare ||
                    !navigator.canShare({
                        files:[
                            file
                        ]
                    })
                ){

                    throw new Error(
                        'Browser tidak mendukung Share Gambar.'
                    );

                }


                /*
                 * =========================================
                 * SHARE GAMBAR + TEKS
                 * ========================================= */

                await navigator.share({

                    title:
                        title,

                    text:
                        description +
                        (
                            link
                                ? '\n\n' +
                                  link
                                : ''
                        ),

                    files:[
                        file
                    ]

                });


            }catch(error){

                console.error(
                    'Share error:',
                    error
                );


                /*
                 * User membatalkan
                 */

                if(
                    error.name ===
                    'AbortError'
                ){

                    return;

                }


                alert(
                    'Gagal menyiapkan gambar untuk dibagikan.\n\n' +
                    error.message
                );


            }finally{

                /*
                 * =========================================
                 * KEMBALIKAN BUTTON
                 * ========================================= */

                shareButton.disabled =
                    false;


                shareButton.innerHTML =
                    originalText;

            }

        }
    );


/* =========================================================
   OPEN LINK
========================================================= */

document
    .getElementById(
        'viewer-open'
    )
    .addEventListener(
        'click',
        () => {

            const program =
                programs[
                    viewerIndex
                ];


            if(
                program &&
                program.link
            ){

                window.open(
                    program.link,
                    '_blank'
                );

            }

        }
    );


/* =========================================================
   REFRESH
========================================================= */

refreshButton.addEventListener(
    'click',
    loadPrograms
);


/* =========================================================
   INIT
========================================================= */

loadPrograms();
