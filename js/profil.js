/* =========================================
   CEK SESSION
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


/* =========================================
   JIKA BELUM LOGIN / SESSION HABIS
========================================= */

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
        'mc_sagaranten_nama'
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


/* =========================================
   AMBIL DATA USER
========================================= */

const nama =
    localStorage.getItem(
        'mc_sagaranten_nama'
    ) || 'Pengguna';

const nomorHP =
    localStorage.getItem(
        'mc_sagaranten_phone'
    ) || '-';


/* =========================================
   TAMPILKAN DATA
========================================= */

const profileName =
    document.getElementById(
        'profile-name'
    );

const namaUser =
    document.getElementById(
        'nama-user'
    );

const nomorUser =
    document.getElementById(
        'nomor-user'
    );


if(profileName){

    profileName.textContent =
        nama;

}

if(namaUser){

    namaUser.textContent =
        nama;

}

if(nomorUser){

    nomorUser.textContent =
        nomorHP;

}


/* =========================================
   LOGOUT
========================================= */

const logoutBtn =
    document.getElementById(
        'logoutBtn'
    );


if(logoutBtn){

    logoutBtn.addEventListener(
        'click',
        function(){

            /* HAPUS SESSION */

            localStorage.removeItem(
                'mc_sagaranten_login'
            );

            localStorage.removeItem(
                'mc_sagaranten_phone'
            );

            localStorage.removeItem(
                'mc_sagaranten_nama'
            );

            localStorage.removeItem(
                'mc_sagaranten_login_time'
            );

            localStorage.removeItem(
                'mc_sagaranten_expire'
            );


            /* KEMBALI KE LOGIN */

            window.location.replace(
                'index.html'
            );

        }
    );

}

/* =========================================
   FOTO PROFIL
========================================= */

const profilePhotoInput =
    document.getElementById('profilePhotoInput');

const profilePhoto =
    document.getElementById('profilePhoto');

const profileAvatarIcon =
    document.getElementById('profileAvatarIcon');

const profilePhotoSmall =
    document.getElementById('profilePhotoSmall');

const profileSmallIcon =
    document.getElementById('profileSmallIcon');


/* =========================================
   LOAD FOTO
========================================= */

function loadProfilePhoto(){

    const savedPhoto =
        localStorage.getItem('mc_sagaranten_profile_photo');

    if(!savedPhoto){
        return;
    }

    setProfilePhoto(savedPhoto);
}


/* =========================================
   SET FOTO
========================================= */

function setProfilePhoto(photo){

    if(profilePhoto){

        profilePhoto.src = photo;

        profilePhoto.classList.add('has-photo');

    }

    if(profileAvatarIcon){

        profileAvatarIcon.classList.add('hide');

    }


    if(profilePhotoSmall){

        profilePhotoSmall.src = photo;

        profilePhotoSmall.classList.add('has-photo');

    }

    if(profileSmallIcon){

        profileSmallIcon.classList.add('hide');

    }

}


/* =========================================
   PILIH FOTO
========================================= */

if(profilePhotoInput){

    profilePhotoInput.addEventListener(
        'change',
        function(){

            const file =
                this.files[0];

            if(!file){
                return;
            }


            /* Validasi gambar */

            if(!file.type.startsWith('image/')){

                alert('File harus berupa gambar.');

                this.value = '';

                return;

            }


            /* Baca gambar */

            const reader =
                new FileReader();


            reader.onload = function(event){

                const photo =
                    event.target.result;


                /* Simpan */

                localStorage.setItem(
                    'mc_sagaranten_profile_photo',
                    photo
                );


                /* Tampilkan */

                setProfilePhoto(photo);

            };


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================
   INIT
========================================= */

loadProfilePhoto();

/* =========================================================
   TOMBOL KEMBALI
========================================================= */

function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = 'dashboard.html';

    }

}
