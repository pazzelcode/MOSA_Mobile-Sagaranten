/* =========================================================
   API
========================================================= */

const PROGRAM_OUTLET_API_URL =
'https://script.google.com/macros/s/AKfycbwn7LmrZubBQIc2Ipfd2la0NuUhcIxIB4JPl8TUnMI-RH2j3ZJq9TxX0zc0UTeGiO-WyQ/exec';


/* =========================================================
   STATE
========================================================= */

let programs = [];

let editId = null;


/* =========================================================
   ELEMENT
========================================================= */

const programList =
    document.getElementById(
        'program-list'
    );

const modal =
    document.getElementById(
        'program-modal'
    );

const form =
    document.getElementById(
        'program-form'
    );

const modalTitle =
    document.getElementById(
        'modal-title'
    );

const fileInput =
    document.getElementById(
        'gambar'
    );

const preview =
    document.getElementById(
        'form-preview'
    );

const previewImage =
    document.getElementById(
        'preview-image'
    );

const saveButton =
    document.getElementById(
        'save-program'
    );


/* =========================================================
   TOAST
========================================================= */

function showToast(message){

    const toast =
        document.getElementById(
            'toast'
        );


    toast.textContent =
        message;


    toast.classList.add(
        'show'
    );


    setTimeout(
        () => {

            toast.classList.remove(
                'show'
            );

        },
        2500
    );

}


/* =========================================================
   ESCAPE
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
   LOAD
========================================================= */

async function loadPrograms(){

    try{

        programList.innerHTML = `

            <div class="loading">
                Memuat program...
            </div>

        `;


        const response =
            await fetch(
                PROGRAM_OUTLET_API_URL +
                '?action=get&t=' +
                Date.now()
            );


        const result =
            await response.json();


        if(!result.success){

            throw new Error(
                result.message
            );

        }


        programs =
            result.data || [];


        renderPrograms();


    }catch(error){

        console.error(
            error
        );


        programList.innerHTML = `

            <div class="empty">

                ⚠️

                <br><br>

                Gagal memuat data.

            </div>

        `;

    }

}


/* =========================================================
   RENDER
========================================================= */

function renderPrograms(){

    if(!programs.length){

        programList.innerHTML = `

            <div class="empty">

                🏪

                <br><br>

                Belum ada Program Outlet.

            </div>

        `;

        return;

    }


    programList.innerHTML =
        programs
        .map(
            program => `

                <article
                    class="program-card"
                >

                    <div
                        class="program-preview"
                    >

                        <img
                            src="${escapeHtml(
                                program.gambar
                            )}"
                            alt="${escapeHtml(
                                program.judul
                            )}"
                            loading="lazy"
                        >

                    </div>


                    <div
                        class="program-body"
                    >

                        <div
                            class="program-title"
                        >
                            ${escapeHtml(
                                program.judul
                            )}
                        </div>


                        <div
                            class="program-desc"
                        >
                            ${escapeHtml(
                                program.deskripsi
                            )}
                        </div>


                        <div
                            class="program-meta"
                        >

                            <span
                                class="program-order"
                            >
                                Urutan #${Number(
                                    program.urutan || 0
                                )}
                            </span>


                            <span
                                class="
                                    status
                                    ${
                                        program.aktif
                                            ? 'active'
                                            : 'inactive'
                                    }
                                "
                            >
                                ${
                                    program.aktif
                                        ? 'AKTIF'
                                        : 'NONAKTIF'
                                }
                            </span>

                        </div>


                        <div
                            class="program-actions"
                        >

                            <button
                                class="
                                    program-action
                                    edit
                                "
                                type="button"
                                onclick="editProgram(
                                    '${escapeHtml(
                                        program.id
                                    )}'
                                )"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                class="
                                    program-action
                                    toggle
                                "
                                type="button"
                                onclick="toggleProgram(
                                    '${escapeHtml(
                                        program.id
                                    )}'
                                )"
                            >
                                ${
                                    program.aktif
                                        ? '⏸ Nonaktif'
                                        : '▶ Aktifkan'
                                }
                            </button>


                            <button
                                class="
                                    program-action
                                    delete
                                "
                                type="button"
                                onclick="deleteProgram(
                                    '${escapeHtml(
                                        program.id
                                    )}'
                                )"
                            >
                                🗑 Hapus
                            </button>

                        </div>

                    </div>

                </article>

            `
        )
        .join('');

}


/* =========================================================
   OPEN ADD
========================================================= */

function openAddModal(){

    editId =
        null;


    modalTitle.textContent =
        'Tambah Program Outlet';


    form.reset();


    document.getElementById(
        'aktif'
    ).checked =
        true;


    document.getElementById(
        'urutan'
    ).value =
        programs.length + 1;


    preview.classList.remove(
        'active'
    );


    previewImage.src =
        '';


    modal.classList.add(
        'active'
    );


    document.body.style.overflow =
        'hidden';

}


/* =========================================================
   OPEN EDIT
========================================================= */

window.editProgram =
function(id){

    const program =
        programs.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if(!program){

        return;

    }


    editId =
        program.id;


    modalTitle.textContent =
        'Edit Program Outlet';


    document.getElementById(
        'judul'
    ).value =
        program.judul || '';


    document.getElementById(
        'deskripsi'
    ).value =
        program.deskripsi || '';


    document.getElementById(
        'link'
    ).value =
        program.link || '';


    document.getElementById(
        'urutan'
    ).value =
        program.urutan || 1;


    document.getElementById(
        'aktif'
    ).checked =
        program.aktif === true;


    fileInput.value =
        '';


    if(program.gambar){

        previewImage.src =
            program.gambar;

        preview.classList.add(
            'active'
        );

    }else{

        preview.classList.remove(
            'active'
        );

    }


    modal.classList.add(
        'active'
    );


    document.body.style.overflow =
        'hidden';

};


/* =========================================================
   CLOSE
========================================================= */

function closeModal(){

    modal.classList.remove(
        'active'
    );


    document.body.style.overflow =
        '';

}


document
    .getElementById(
        'cancel-modal'
    )
    .addEventListener(
        'click',
        closeModal
    );


modal.addEventListener(
    'click',
    event => {

        if(
            event.target ===
            modal
        ){

            closeModal();

        }

    }
);


/* =========================================================
   FILE PREVIEW
========================================================= */

fileInput.addEventListener(
    'change',
    function(){

        const file =
            this.files[0];


        if(!file){

            return;

        }


        if(
            !file.type.startsWith(
                'image/'
            )
        ){

            showToast(
                'File harus berupa gambar.'
            );

            this.value =
                '';

            return;

        }


        /*
           Batasi 10 MB
        */

        if(
            file.size >
            10 * 1024 * 1024
        ){

            showToast(
                'Ukuran gambar maksimal 10 MB.'
            );

            this.value =
                '';

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                previewImage.src =
                    event.target.result;

                preview.classList.add(
                    'active'
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);


/* =========================================================
   FILE → BASE64
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
                () => {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   SUBMIT
========================================================= */

form.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        try{

            saveButton.disabled =
                true;


            saveButton.textContent =
                'Menyimpan...';


            const file =
                fileInput.files[0];


            const data = {

                action:
                    editId
                        ? 'update'
                        : 'create',

                id:
                    editId,

                judul:
                    document.getElementById(
                        'judul'
                    ).value.trim(),

                deskripsi:
                    document.getElementById(
                        'deskripsi'
                    ).value.trim(),

                link:
                    document.getElementById(
                        'link'
                    ).value.trim(),

                urutan:
                    Number(
                        document.getElementById(
                            'urutan'
                        ).value || 1
                    ),

                aktif:
                    document.getElementById(
                        'aktif'
                    ).checked

            };


            /*
               Jika ada gambar baru
            */

            if(file){

                showToast(
                    'Menyiapkan gambar...'
                );


                data.imageBase64 =
                    await fileToBase64(
                        file
                    );


                data.imageName =
                    file.name;


                data.imageType =
                    file.type;

            }


            const response =
                await fetch(
                    PROGRAM_OUTLET_API_URL,
                    {

                        method:'POST',

                        headers:{
                            'Content-Type':
                                'text/plain;charset=utf-8'
                        },

                        body:
                            JSON.stringify(
                                data
                            )

                    }
                );


                        const result =
                await response.json();


            if(!result.success){

                throw new Error(
                    result.message ||
                    'Gagal menyimpan program.'
                );

            }


            showToast(
                result.message ||
                'Program berhasil disimpan.'
            );


            closeModal();


            await loadPrograms();

            // ---> PANGGIL NOTIFIKASI DI SINI (JIKA SUKSES) <---
            const judulYangDisimpan = document.getElementById('judul').value.trim();
            const isProgramBaru = editId === null; // Deteksi apakah ini tambah baru atau edit
            
            kirimNotifikasiProgram(judulYangDisimpan, isProgramBaru);
            // ---------------------------------------------------


        }catch(error){


            console.error(
                error
            );


            showToast(
                error.message ||
                'Terjadi kesalahan.'
            );

        }finally{

            saveButton.disabled =
                false;


            saveButton.textContent =
                'Simpan';

        }

    }
);


/* =========================================================
   TOGGLE
========================================================= */

window.toggleProgram =
async function(id){

    const program =
        programs.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if(!program){

        return;

    }


    const action =
        program.aktif
            ? 'nonaktifkan'
            : 'aktifkan';


    if(
        !confirm(
            `Yakin ingin ${action} program ini?`
        )
    ){

        return;

    }


    try{

        const response =
            await fetch(
                PROGRAM_OUTLET_API_URL,
                {

                    method:'POST',

                    headers:{
                        'Content-Type':
                            'text/plain;charset=utf-8'
                    },

                    body:
                        JSON.stringify({

                            action:'toggle',

                            id:id

                        })

                }
            );


        const result =
            await response.json();


        if(!result.success){

            throw new Error(
                result.message
            );

        }


        showToast(
            result.message
        );


        await loadPrograms();


    }catch(error){

        showToast(
            error.message
        );

    }

};


/* =========================================================
   DELETE
========================================================= */

window.deleteProgram =
async function(id){

    const program =
        programs.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if(!program){

        return;

    }


    const confirmed =
        confirm(
            `Hapus program "${program.judul}"?\n\nGambar juga akan dipindahkan ke Sampah Google Drive.`
        );


    if(!confirmed){

        return;

    }


    try{

        const response =
            await fetch(
                PROGRAM_OUTLET_API_URL,
                {

                    method:'POST',

                    headers:{
                        'Content-Type':
                            'text/plain;charset=utf-8'
                    },

                    body:
                        JSON.stringify({

                            action:'delete',

                            id:id

                        })

                }
            );


        const result =
            await response.json();


        if(!result.success){

            throw new Error(
                result.message
            );

        }


        showToast(
            result.message
        );


        await loadPrograms();


    }catch(error){

        showToast(
            error.message
        );

    }

};


/* =========================================================
   ADD BUTTON
========================================================= */

document
    .getElementById(
        'add-program'
    )
    .addEventListener(
        'click',
        openAddModal
    );

/* =========================================================
   KIRIM NOTIFIKASI OTOMATIS (PROGRAM OUTLET)
========================================================= */
async function kirimNotifikasiProgram(judulProgram, isBaru) {
    // URL API Global Notification System
    const NOTIF_API_URL = 'https://script.google.com/macros/s/AKfycbzINzFJt38mQyqrgvzrTDechPja8b7tyoO5MMZkDmDSfw-Ftjp_y2POSAfYuP0fqi5WKw/exec';

    // Sesuaikan teks judul dan pesan
    const notifTitle = isBaru ? 'Program Outlet Baru! 🏪' : 'Update Program Outlet 🏪';
    const notifMessage = isBaru 
        ? `Ada program baru nih: "${judulProgram}". Yuk cek detailnya sekarang!`
        : `Informasi pada program "${judulProgram}" baru saja diperbarui oleh Admin.`;

    const payloadNotif = {
        action: 'create_notification',
        data: {
            title: notifTitle,
            message: notifMessage,
            type: 'info', // Menggunakan ikon ℹ️ (atau ganti 'banner' untuk 📢)
            url: 'program-outlet.html', // Arahkan pengguna ke halaman program outlet
            createdAt: new Date().toISOString()
        }
    };

    try {
        await fetch(NOTIF_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payloadNotif)
        });
        console.log("Notifikasi program outlet berhasil dipancarkan.");
    } catch (error) {
        console.error("Gagal mengirim notifikasi program:", error);
    }
}

/* =========================================================
   INIT
========================================================= */

loadPrograms();
