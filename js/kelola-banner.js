/* =========================================================
   MC-SAGARANTEN
   KELOLA BANNER
   ========================================================= */


/* =========================================================
   01. KONFIGURASI & ELEMEN
========================================================= */

const BANNER_API_URL =
    'https://script.google.com/macros/s/AKfycbxpgqbNoi4_2FdP1pxrr6qxPrR9z17GRNkQVXXYq3nyGkvubJqNJe1JTzw_f5vsGVpcBw/exec';

const ADMIN_PHONE =
    localStorage.getItem('mc_sagaranten_phone');

const ADMIN_NUMBER =
    '085759695969';


const bannerList =
    document.getElementById('banner-list');

const modal =
    document.getElementById('banner-modal');

const modalTitle =
    document.getElementById('modal-title');

const judulInput =
    document.getElementById('banner-judul');

const linkInput =
    document.getElementById('banner-link');

const urutanInput =
    document.getElementById('banner-urutan');

const fileInput =
    document.getElementById('banner-file');

const aktifInput =
    document.getElementById('banner-aktif');

const previewBox =
    document.getElementById('form-preview');

const previewImage =
    document.getElementById('preview-image');

const fileInfo =
    document.getElementById('file-info');

const btnSave =
    document.getElementById('btn-save');


let currentEditId = null;


/* =========================================================
   02. PROTEKSI ADMIN
========================================================= */

function cekAdmin() {

    if (
        !ADMIN_PHONE ||
        ADMIN_PHONE !== ADMIN_NUMBER
    ) {

        alert(
            'Akses Administrator ditolak.'
        );

        window.location.replace(
            'dashboard.html'
        );

        return false;
    }

    return true;
}


/* =========================================================
   03. TOAST
========================================================= */

function showToast(message) {

    const toast =
        document.getElementById(
            'banner-toast'
        );

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {

        toast.classList.remove('show');

    }, 2500);
}


/* =========================================================
   04. URL GAMBAR
   Google Drive Thumbnail
========================================================= */

function getBannerImageUrl(url) {

    if (!url) {
        return '';
    }

    try {

        const parsed =
            new URL(url);

        /*
         * Jika URL merupakan Google Drive
         * thumbnail, gunakan ukuran w800.
         *
         * w800 cukup untuk preview admin
         * dan lebih ringan dibanding w1600.
         */

        if (
            parsed.hostname.includes(
                'drive.google.com'
            ) &&
            parsed.pathname ===
                '/thumbnail'
        ) {

            parsed.searchParams.set(
                'sz',
                'w800'
            );

            /*
             * Jangan membawa parameter
             * cache lama.
             */

            parsed.searchParams.delete(
                'retry'
            );
        }

        return parsed.toString();

    } catch (error) {

        console.warn(
            'URL gambar tidak valid:',
            url
        );

        return url;
    }
}


/* =========================================================
   05. FALLBACK IMAGE
========================================================= */

const FALLBACK_IMAGE =
    'data:image/svg+xml;charset=utf-8,' +
    '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 ' +
    'viewBox=%220 0 300 150%22%3E' +

    '%3Crect width=%22100%25%22 height=%22100%25%22 ' +
    'fill=%22%23f3f4f6%22/%3E' +

    '%3Ctext x=%2250%25%22 y=%2250%25%22 ' +
    'dominant-baseline=%22middle%22 ' +
    'text-anchor=%22middle%22 ' +
    'fill=%22%239ca3af%22 ' +
    'font-size=%2214%22 ' +
    'font-family=%22sans-serif%22%3E' +

    'Gagal Memuat Gambar' +

    '%3C/text%3E%3C/svg%3E';


/* =========================================================
   06. IMAGE ERROR + RETRY
========================================================= */

function handleImageError(img) {

    if (!img) return;


    const retry =
        Number(
            img.dataset.retry || 0
        );


    /*
     * Maksimal 3 kali percobaan.
     */

    if (retry < 3) {

        const nextRetry =
            retry + 1;

        img.dataset.retry =
            String(nextRetry);


        /*
         * Delay bertahap:
         *
         * Retry 1 = 800ms
         * Retry 2 = 1600ms
         * Retry 3 = 2400ms
         */

        const delay =
            800 * nextRetry;


        console.warn(
            `Gambar gagal dimuat. ` +
            `Retry ${nextRetry}/3:`,
            img.dataset.originalUrl
        );


        setTimeout(() => {

            const originalUrl =
                img.dataset.originalUrl;

            if (!originalUrl) {
                return;
            }


            try {

                const parsed =
                    new URL(originalUrl);

                /*
                 * Cache busting.
                 */

                parsed.searchParams.set(
                    'retry',
                    Date.now()
                );

                img.src =
                    parsed.toString();

            } catch {

                const separator =
                    originalUrl.includes('?')
                        ? '&'
                        : '?';

                img.src =
                    originalUrl +
                    separator +
                    'retry=' +
                    Date.now();
            }

        }, delay);


        return;
    }


    /*
     * Setelah 3 kali gagal,
     * gunakan fallback.
     */

    console.error(
        'Gambar gagal dimuat setelah 3 percobaan:',
        img.dataset.originalUrl
    );


    img.onerror = null;

    img.src =
        FALLBACK_IMAGE;
}


/* =========================================================
   07. ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value || '')

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
   08. LOAD BANNER
========================================================= */

async function loadBanners() {

    bannerList.innerHTML =
        `<div class="loading">
            Memuat banner...
        </div>`;


    try {

        const response =
            await fetch(
                `${BANNER_API_URL}?action=get&t=${Date.now()}`,
                {
                    cache: 'no-store'
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                'Gagal mengambil data banner.'
            );
        }


        renderBanners(
            result.data || []
        );


    } catch (error) {

        console.error(
            'Gagal load banner:',
            error
        );


        bannerList.innerHTML =
            `<div class="banner-empty">

                Gagal memuat banner.

                <br><br>

                ${escapeHtml(
                    error.message ||
                    'Terjadi kesalahan.'
                )}

            </div>`;
    }
}


/* =========================================================
   09. RENDER BANNER
========================================================= */

function renderBanners(banners) {

    console.log(
        'BANNER DATA:',
        banners
    );


    if (!Array.isArray(banners)) {

        bannerList.innerHTML =
            `<div class="banner-empty">
                Data banner tidak valid.
            </div>`;

        return;
    }


    if (!banners.length) {

        bannerList.innerHTML =
            `<div class="banner-empty">

                Belum ada banner.

                <br>

                Silakan tambahkan
                banner pertama.

            </div>`;

        return;
    }


    /*
     * Urutkan berdasarkan urutan.
     */

    banners.sort(
        (a, b) =>
            Number(a.urutan || 0) -
            Number(b.urutan || 0)
    );


    bannerList.innerHTML =
        banners.map(
            banner => {

                const gambarUrl =
                    getBannerImageUrl(
                        banner.gambar
                    );


                console.log(
                    'GAMBAR:',
                    gambarUrl
                );


                const statusAktif =
                    banner.aktif === true ||
                    banner.aktif === 'true' ||
                    banner.aktif === 1 ||
                    banner.aktif === '1';


                return `

                    <div class="banner-card">

                        <div class="banner-preview">

                            <img
                                src="${escapeHtml(
                                    gambarUrl
                                )}"

                                data-original-url="${escapeHtml(
                                    gambarUrl
                                )}"

                                data-retry="0"

                                alt="${escapeHtml(
                                    banner.judul
                                )}"

                                decoding="async"

                                onerror="handleImageError(this)"
                            >

                        </div>


                        <div class="banner-card-body">

                            <div class="banner-card-title">

                                ${escapeHtml(
                                    banner.judul
                                )}

                            </div>


                            <div class="banner-card-meta">

                                <div class="banner-order">

                                    Urutan:
                                    ${escapeHtml(
                                        banner.urutan
                                    )}

                                </div>


                                <div
                                    class="banner-status ${
                                        statusAktif
                                            ? 'active'
                                            : 'inactive'
                                    }"
                                >

                                    ${
                                        statusAktif
                                            ? 'AKTIF'
                                            : 'NONAKTIF'
                                    }

                                </div>

                            </div>


                            <div class="banner-actions">

                                <button
                                    class="banner-action edit"
                                    onclick="editBanner('${escapeHtml(
                                        banner.id
                                    )}')"
                                >
                                    ✏️ Edit
                                </button>


                                <button
                                    class="banner-action toggle"
                                    onclick="toggleBanner(
                                        '${escapeHtml(
                                            banner.id
                                        )}',
                                        ${statusAktif}
                                    )"
                                >

                                    ${
                                        statusAktif
                                            ? '⏸ Nonaktif'
                                            : '▶ Aktifkan'
                                    }

                                </button>


                                <button
                                    class="banner-action delete"
                                    onclick="hapusBanner('${escapeHtml(
                                        banner.id
                                    )}')"
                                >
                                    🗑 Hapus
                                </button>

                            </div>

                        </div>

                    </div>

                `;
            }
        ).join('');
}


/* =========================================================
   10. FILE READER
========================================================= */

function readFileAsDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload = () => {

                resolve(
                    reader.result
                );
            };


            reader.onerror = reject;


            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================================
   11. TAMBAH BANNER
========================================================= */

document
    .getElementById(
        'btn-add-banner'
    )
    .addEventListener(
        'click',
        () => {

            currentEditId = null;


            modalTitle.textContent =
                'Tambah Banner';


            judulInput.value =
                '';


            linkInput.value =
                '#';


            urutanInput.value =
                '1';


            aktifInput.checked =
                true;


            fileInput.value =
                '';


            previewImage.removeAttribute(
                'src'
            );


            previewBox.classList.remove(
                'active'
            );


            fileInfo.textContent =
                'Maksimal 5 MB.';


            modal.classList.add(
                'active'
            );
        }
    );


/* =========================================================
   12. CLOSE MODAL
========================================================= */

document
    .getElementById(
        'btn-cancel'
    )
    .addEventListener(
        'click',
        closeModal
    );


modal.addEventListener(
    'click',
    event => {

        if (
            event.target === modal
        ) {

            closeModal();
        }
    }
);


function closeModal() {

    modal.classList.remove(
        'active'
    );
}


/* =========================================================
   13. PREVIEW FILE
========================================================= */

fileInput.addEventListener(
    'change',
    () => {

        const file =
            fileInput.files[0];


        if (!file) {
            return;
        }


        /*
         * Maksimal 5 MB.
         */

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                'Ukuran gambar maksimal 5 MB.'
            );


            fileInput.value =
                '';


            return;
        }


        /*
         * Validasi MIME.
         */

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                'Format gambar harus JPG, PNG, atau WEBP.'
            );


            fileInput.value =
                '';


            return;
        }


        fileInfo.textContent =
            file.name;


        const reader =
            new FileReader();


        reader.onload =
            event => {

                previewImage.src =
                    event.target.result;


                previewBox.classList.add(
                    'active'
                );
            };


        reader.readAsDataURL(
            file
        );
    }
);


/* =========================================================
   14. EDIT BANNER
========================================================= */

async function editBanner(id) {

    try {

        const response =
            await fetch(
                `${BANNER_API_URL}?action=get&t=${Date.now()}`,
                {
                    cache: 'no-store'
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                'Gagal mengambil data banner.'
            );
        }


        const banner =
            (result.data || [])
                .find(
                    item =>
                        String(item.id) ===
                        String(id)
                );


        if (!banner) {

            throw new Error(
                'Banner tidak ditemukan.'
            );
        }


        currentEditId =
            id;


        modalTitle.textContent =
            'Edit Banner';


        judulInput.value =
            banner.judul || '';


        linkInput.value =
            banner.link || '#';


        urutanInput.value =
            banner.urutan || 1;


        aktifInput.checked =
            banner.aktif === true ||
            banner.aktif === 'true' ||
            banner.aktif === 1 ||
            banner.aktif === '1';


        fileInput.value =
            '';


        const gambarUrl =
            getBannerImageUrl(
                banner.gambar
            );


        previewImage.src =
            gambarUrl;


        previewImage.dataset.originalUrl =
            gambarUrl;


        previewImage.dataset.retry =
            '0';


        previewImage.onerror =
            function () {

                handleImageError(
                    this
                );
            };


        previewBox.classList.add(
            'active'
        );


        fileInfo.textContent =
            'Kosongkan jika tidak ingin mengganti gambar.';


        modal.classList.add(
            'active'
        );


    } catch (error) {

        console.error(
            'Edit banner error:',
            error
        );


        alert(
            error.message ||
            'Gagal membuka banner.'
        );
    }
}


/* =========================================================
   15. SIMPAN / UPDATE BANNER
========================================================= */

btnSave.addEventListener(
    'click',
    async () => {

        /*
         * Validasi judul.
         */

        if (
            !judulInput.value.trim()
        ) {

            alert(
                'Judul banner wajib diisi.'
            );

            judulInput.focus();

            return;
        }


        /*
         * Validasi admin.
         */

        if (
            !ADMIN_PHONE ||
            ADMIN_PHONE !== ADMIN_NUMBER
        ) {

            alert(
                'Akses Administrator ditolak.'
            );

            return;
        }


        btnSave.disabled =
            true;


        btnSave.textContent =
            'Menyimpan...';


        try {

            const isBannerBaru =
                currentEditId === null;


            const judulYangDisimpan =
                judulInput.value.trim();


            const file =
                fileInput.files[0];


            let fileData = null;


            if (file) {

                fileData =
                    await readFileAsDataURL(
                        file
                    );
            }


            const payload = {

                action:
                    currentEditId
                        ? 'update'
                        : 'create',

                adminPhone:
                    ADMIN_PHONE,

                id:
                    currentEditId,

                judul:
                    judulYangDisimpan,

                link:
                    linkInput.value.trim() ||
                    '#',

                urutan:
                    Number(
                        urutanInput.value
                    ) || 1,

                aktif:
                    aktifInput.checked,

                fileData:
                    fileData,

                fileName:
                    file
                        ? file.name
                        : '',

                mimeType:
                    file
                        ? file.type
                        : ''
            };


            const response =
                await fetch(
                    BANNER_API_URL,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'text/plain;charset=utf-8'
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const result =
                await response.json();


            if (!result.success) {

                throw new Error(
                    result.message ||
                    'Gagal menyimpan banner.'
                );
            }


            showToast(
                result.message ||
                'Banner berhasil disimpan.'
            );


            closeModal();


            await loadBanners();


            /*
             * Kirim notifikasi
             * setelah banner berhasil disimpan.
             */

            kirimNotifikasiBanner(
                judulYangDisimpan,
                isBannerBaru
            );


        } catch (error) {

            console.error(
                'Save banner error:',
                error
            );


            alert(
                'Gagal menyimpan banner:\n' +
                (
                    error.message ||
                    'Terjadi kesalahan.'
                )
            );


        } finally {

            btnSave.disabled =
                false;


            btnSave.textContent =
                'Simpan';
        }
    }
);


/* =========================================================
   16. TOGGLE STATUS BANNER
========================================================= */

async function toggleBanner(
    id,
    currentStatus
) {

    const action =
        currentStatus
            ? 'menonaktifkan'
            : 'mengaktifkan';


    if (
        !confirm(
            `Yakin ingin ${action} banner ini?`
        )
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                BANNER_API_URL,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'text/plain;charset=utf-8'
                    },

                    body:
                        JSON.stringify({

                            action:
                                'toggle',

                            adminPhone:
                                ADMIN_PHONE,

                            id:
                                id,

                            aktif:
                                !currentStatus
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                'Gagal mengubah status banner.'
            );
        }


        showToast(
            result.message ||
            'Status banner berhasil diubah.'
        );


        await loadBanners();


    } catch (error) {

        console.error(
            'Toggle banner error:',
            error
        );


        alert(
            error.message ||
            'Gagal mengubah status banner.'
        );
    }
}


/* =========================================================
   17. HAPUS BANNER
========================================================= */

async function hapusBanner(id) {

    if (
        !confirm(
            'Yakin ingin menghapus banner ini?\n\n' +
            'Gambar di Google Drive juga akan dihapus.'
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                BANNER_API_URL,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'text/plain;charset=utf-8'
                    },

                    body:
                        JSON.stringify({

                            action:
                                'delete',

                            adminPhone:
                                ADMIN_PHONE,

                            id:
                                id
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                'Gagal menghapus banner.'
            );
        }


        showToast(
            result.message ||
            'Banner berhasil dihapus.'
        );


        await loadBanners();


    } catch (error) {

        console.error(
            'Delete banner error:',
            error
        );


        alert(
            error.message ||
            'Gagal menghapus banner.'
        );
    }
}


/* =========================================================
   18. NOTIFIKASI BANNER
========================================================= */

async function kirimNotifikasiBanner(
    judulBanner,
    isBaru
) {

    const NOTIF_API_URL =
        'https://script.google.com/macros/s/AKfycbzINzFJt38mQyqrgvzrTDechPja8b7tyoO5MMZkDmDSfw-Ftjp_y2POSAfYuP0fqi5WKw/exec';


    const notifTitle =
        isBaru
            ? 'Program / Promo Baru! 📢'
            : 'Update Program 📢';


    const notifMessage =
        isBaru

            ? `Terdapat informasi/promo baru: "${judulBanner}". Yuk cek aplikasinya sekarang!`

            : `Informasi pada banner "${judulBanner}" baru saja diperbarui oleh Admin.`;


    const payloadNotif = {

        action:
            'create_notification',

        data: {

            title:
                notifTitle,

            message:
                notifMessage,

            type:
                'banner',

            url:
                'dashboard.html',

            createdAt:
                new Date().toISOString()
        }
    };


    try {

        await fetch(
            NOTIF_API_URL,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'text/plain;charset=utf-8'
                },

                body:
                    JSON.stringify(
                        payloadNotif
                    )
            }
        );


    } catch (error) {

        console.error(
            'Gagal mengirim notifikasi banner:',
            error
        );
    }
}


/* =========================================================
   19. INIT
========================================================= */

if (cekAdmin()) {

    loadBanners();
}