/* =========================================================
   MC-SAGARANTEN
   GLOBAL REFRESH ENGINE
   ---------------------------------------------------------
   Fungsi:
   - Satu sistem refresh untuk semua halaman
   - Setiap halaman dapat mendaftarkan fungsi refresh sendiri
   - Mencegah refresh ganda
   - Animasi tombol refresh
   - Toast otomatis
   - Aman walaupun halaman tidak memiliki fungsi refresh
========================================================= */

(function () {

    'use strict';

    /* =====================================================
       STATE
    ===================================================== */

    let isRefreshing = false;

    const refreshHandlers = [];


    /* =====================================================
       REGISTER REFRESH HANDLER
       -----------------------------------------------------
       Digunakan oleh setiap halaman.

       Contoh:

       window.registerGlobalRefresh(
           'Dashboard',
           refreshDashboard
       );
    ===================================================== */

    window.registerGlobalRefresh = function (name, handler) {

        if (
            typeof name !== 'string' ||
            typeof handler !== 'function'
        ) {
            console.warn(
                '[GLOBAL REFRESH] Handler tidak valid:',
                name
            );

            return;
        }


        /* Hindari handler terdaftar dua kali */

        const exists = refreshHandlers.some(
            item => item.name === name
        );

        if (exists) {

            console.warn(
                `[GLOBAL REFRESH] ${name} sudah terdaftar`
            );

            return;
        }


        refreshHandlers.push({
            name,
            handler
        });


        console.log(
            `[GLOBAL REFRESH] Registered: ${name}`
        );

    };


    /* =====================================================
       REFRESH SEMUA DATA
    ===================================================== */

    async function refreshSemuaData() {

        if (isRefreshing) {

            console.log(
                '[GLOBAL REFRESH] Refresh sedang berjalan'
            );

            return;

        }


        isRefreshing = true;


        console.log(
            '================================='
        );

        console.log(
            '[GLOBAL REFRESH] MULAI'
        );


        try {

            if (refreshHandlers.length === 0) {

                console.log(
                    '[GLOBAL REFRESH] Tidak ada handler'
                );

                return;

            }


            /* =============================================
               JALANKAN SEMUA HANDLER
            ============================================= */

            for (const item of refreshHandlers) {

                console.log(
                    `[GLOBAL REFRESH] ${item.name}...`
                );


                try {

                    await item.handler();


                    console.log(
                        `[GLOBAL REFRESH] ${item.name} selesai`
                    );


                } catch (error) {

                    console.error(
                        `[GLOBAL REFRESH] ${item.name} gagal:`,
                        error
                    );

                }

            }


            console.log(
                '[GLOBAL REFRESH] SEMUA DATA SELESAI'
            );


            /* =============================================
               TOAST
            ============================================= */

            if (
                typeof window.showToast === 'function'
            ) {

                window.showToast(
                    'Data berhasil diperbarui'
                );

            }


        } finally {

            isRefreshing = false;


            console.log(
                '================================='
            );

        }

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.refreshAllData = refreshSemuaData;

    /* Alias kompatibilitas */

    window.refreshAllDashboardData =
        refreshSemuaData;

    window.globalRefresh =
        refreshSemuaData;


    /* =====================================================
       BUTTON REFRESH
    ===================================================== */

    document.addEventListener(
        'DOMContentLoaded',
        function () {

            const button =
                document.getElementById(
                    'btn-refresh'
                );


            if (!button) {

                console.log(
                    '[GLOBAL REFRESH] Tombol refresh tidak ditemukan'
                );

                return;

            }


            button.addEventListener(
                'click',
                async function (event) {

                    event.preventDefault();


                    if (isRefreshing) {
                        return;
                    }


                    console.log(
                        '[GLOBAL REFRESH] Tombol Refresh ditekan'
                    );


                    const originalHTML =
                        button.innerHTML;


                    /* =====================================
                       DISABLE BUTTON
                    ===================================== */

                    button.disabled = true;

                    button.classList.add(
                        'refreshing'
                    );


                    /* =====================================
                       ANIMASI ICON
                    ===================================== */

                    const icon =
                        button.querySelector(
                            '.quick-menu-icon i'
                        );


                    if (icon) {

                        icon.classList.add(
                            'refresh-spin'
                        );

                    }


                    /* =====================================
                       REFRESH
                    ===================================== */

                    try {

                        await refreshSemuaData();


                    } catch (error) {

                        console.error(
                            '[GLOBAL REFRESH] Refresh gagal:',
                            error
                        );


                        if (
                            typeof window.showToast ===
                            'function'
                        ) {

                            window.showToast(
                                'Gagal memperbarui data'
                            );

                        }

                    } finally {

                        /* =============================
                           RESTORE BUTTON
                        ============================= */

                        if (icon) {

                            icon.classList.remove(
                                'refresh-spin'
                            );

                        }


                        button.disabled = false;

                        button.classList.remove(
                            'refreshing'
                        );


                        button.innerHTML =
                            originalHTML;

                    }

                }
            );

        }
    );

})();