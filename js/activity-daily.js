/* =========================================================
   ACTIVITY DAILY
   API TERPISAH - SPREADSHEET MASTER YANG SAMA

   FITUR:
   - Cek API setiap 30 detik
   - Hanya render jika data berubah
   - Tidak menghilangkan data saat polling
   - Tidak menampilkan loading setiap refresh
   - Data lama tetap tampil jika API gagal sementara
========================================================= */

(function () {

    const WEB_APP_URL =
        'https://script.google.com/macros/s/AKfycbwHoSI5afQrS69qZyt6aFxTWRfPynRJ0jzR-2XCLlpFnjMpwKebeDSPWI0oG556pd3O/exec';


    /* =====================================================
       KONFIGURASI
    ===================================================== */

    const REFRESH_INTERVAL = 30000; // 30 detik


    /* =====================================================
       STATE DATA
    ===================================================== */

    let lastDataHash = null;

    let isFirstLoad = true;

    let isLoading = false;


    /* =====================================================
       HELPER
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    /* =====================================================
       PARSE ANGKA
    ===================================================== */

    function ambilAngka(value) {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {

            return 0;

        }


        if (typeof value === 'number') {

            return value;

        }


        let str = String(value).trim();


        if (!str) {

            return 0;

        }


        /*
         * Format Indonesia:
         *
         * 1.500.000
         * 1.500
         * 10,5
         */

        str = str
            .replace(/[^\d,.-]/g, '')
            .replace(/\./g, '')
            .replace(',', '.');


        return Number(str) || 0;

    }


    /* =====================================================
       FORMAT RUPIAH
    ===================================================== */

    function formatRupiah(value) {

        const angka =
            ambilAngka(value);


        return 'Rp ' +
            angka.toLocaleString(
                'id-ID'
            );

    }


    /* =====================================================
       FORMAT ANGKA
    ===================================================== */

    function formatAngka(value) {

        return ambilAngka(value)
            .toLocaleString('id-ID');

    }


    /* =====================================================
       ELEMENT
    ===================================================== */

    const moboList =
        document.getElementById(
            'activity-mobo-list'
        );


    const fisikList =
        document.getElementById(
            'activity-fisik-list'
        );


    const paketList =
        document.getElementById(
            'activity-paket-list'
        );


    const dateElement =
        document.getElementById(
            'activity-date'
        );


    /* =====================================================
       LOADING HANYA UNTUK LOAD PERTAMA
    ===================================================== */

    function tampilkanLoading() {

        const loading = `
            <div class="activity-loading">
                Memuat data...
            </div>
        `;


        if (moboList) {

            moboList.innerHTML =
                loading;

        }


        if (fisikList) {

            fisikList.innerHTML =
                loading;

        }


        if (paketList) {

            paketList.innerHTML =
                loading;

        }

    }


    /* =====================================================
       EMPTY
    ===================================================== */

    function tampilkanKosong() {

        const empty = `
            <div class="activity-empty">
                Tidak ada aktivitas hari ini.
            </div>
        `;


        if (moboList) {

            moboList.innerHTML =
                empty;

        }


        if (fisikList) {

            fisikList.innerHTML =
                empty;

        }


        if (paketList) {

            paketList.innerHTML =
                empty;

        }

    }


    /* =====================================================
       ERROR
       
       PENTING:
       Kalau sebelumnya sudah ada data,
       jangan hapus data tersebut.
    ===================================================== */

    function tampilkanError() {

        /*
         * Jangan mengganti isi card.
         *
         * Data terakhir tetap dipertahankan.
         *
         * Error cukup dicatat di console.
         */

        console.warn(
            '⚠️ Activity Daily gagal diperbarui. Data lama dipertahankan.'
        );

    }


    /* =====================================================
       NORMALISASI DATA
       
       Digunakan untuk membandingkan apakah data berubah.
    ===================================================== */

    function normalizeData(data) {

        return data.map(item => {

            return {

                tanggal:
                    item.tanggal ??
                    item.Tanggal ??
                    '',

                dse:
                    item.dse ??
                    item.DSE ??
                    '',

                saldoMobo:
                    ambilAngka(
                        item.saldoMobo ??
                        item['Saldo Mobo']
                    ),

                sp:
                    ambilAngka(
                        item.sp ??
                        item.SP
                    ),

                voucher:
                    ambilAngka(
                        item.voucher ??
                        item.Voucher
                    ),

                totalSPVoucher:
                    ambilAngka(
                        item.totalSPVoucher ??
                        item['Total SP Voucher']
                    ),

                namaPaket:
                    item.namaPaket ??
                    item['Nama Paket'] ??
                    '',

                jumlahPaket:
                    ambilAngka(
                        item.jumlahPaket ??
                        item['Jumlah Paket']
                    ),

                paketRupiah:
                    ambilAngka(
                        item.paketRupiah ??
                        item['Paket Rupiah']
                    )

            };

        });

    }


    /* =====================================================
       BUAT HASH DATA
       
       Jika hasil hash sama:
       TIDAK ADA RENDER.
    ===================================================== */

    function buatDataHash(data) {

        return JSON.stringify(
            normalizeData(data)
        );

    }


    /* =====================================================
       LOAD DATA
    ===================================================== */

    async function loadActivityDailyData() {

        /*
         * Mencegah request bertumpuk
         */

        if (isLoading) {

            return;

        }


        isLoading = true;


        try {

            /*
             * Loading hanya ketika pertama kali halaman dibuka.
             */

            if (isFirstLoad) {

                tampilkanLoading();

            }


            console.log(
                '🔄 Mengecek Activity Daily...'
            );


            const response =
                await fetch(
                    WEB_APP_URL +
                    '?action=daily&t=' +
                    Date.now(),
                    {
                        cache: 'no-store'
                    }
                );


            if (!response.ok) {

                throw new Error(
                    'HTTP ' +
                    response.status
                );

            }


            const result =
                await response.json();


            console.log(
                '📊 RESPON ACTIVITY DAILY:',
                result
            );


            if (
                !result.success ||
                !Array.isArray(result.data)
            ) {

                throw new Error(
                    result.message ||
                    'Data Activity Daily tidak valid.'
                );

            }


            const data =
                result.data;


            /* =================================================
               DATA KOSONG
            ================================================= */

            if (data.length === 0) {

                /*
                 * Hanya ubah tampilan jika sebelumnya
                 * bukan kondisi kosong.
                 */

                const emptyHash =
                    'EMPTY_DATA';


                if (
                    lastDataHash !==
                    emptyHash
                ) {

                    tampilkanKosong();

                    lastDataHash =
                        emptyHash;

                }


                if (dateElement) {

                    dateElement.textContent =
                        'Tidak ada data';

                }


                isFirstLoad = false;

                return;

            }


            /* =================================================
               CEK APAKAH DATA BERUBAH
            ================================================= */

            const currentHash =
                buatDataHash(data);


            /*
             * Jika hash sama:
             *
             * Tidak render ulang.
             */

            if (
                !isFirstLoad &&
                currentHash === lastDataHash
            ) {

                console.log(
                    '✓ Activity Daily belum berubah. Tidak render ulang.'
                );

                return;

            }


            /*
             * Simpan hash baru
             */

            lastDataHash =
                currentHash;


            console.log(
                '🔔 Activity Daily berubah. Render ulang...'
            );


            /* =================================================
               TANGGAL
            ================================================= */

            const tanggal =
                data[0].tanggal ||
                data[0].Tanggal ||
                '--';


            if (dateElement) {

                dateElement.textContent =
                    tanggal;

            }


            /* =================================================
               TOTAL
            ================================================= */

            let totalMobo = 0;

            let totalSP = 0;

            let totalVoucher = 0;

            let totalSPVoucher = 0;

            let totalPaket = 0;

            let totalPaketRupiah = 0;


            data.forEach(item => {

                totalMobo +=
                    ambilAngka(
                        item.saldoMobo ??
                        item['Saldo Mobo']
                    );


                totalSP +=
                    ambilAngka(
                        item.sp ??
                        item.SP
                    );


                totalVoucher +=
                    ambilAngka(
                        item.voucher ??
                        item.Voucher
                    );


                totalSPVoucher +=
                    ambilAngka(
                        item.totalSPVoucher ??
                        item['Total SP Voucher']
                    );


                totalPaket +=
                    ambilAngka(
                        item.jumlahPaket ??
                        item['Jumlah Paket']
                    );


                totalPaketRupiah +=
                    ambilAngka(
                        item.paketRupiah ??
                        item['Paket Rupiah']
                    );

            });


            /* =================================================
               CARD 1
               SALDO MOBO
            ================================================= */

            let moboHTML = '';


            data.forEach(item => {

                const dse =
                    escapeHTML(
                        item.dse ??
                        item.DSE ??
                        '-'
                    );


                const saldo =
                    formatRupiah(
                        item.saldoMobo ??
                        item['Saldo Mobo']
                    );


                moboHTML += `

                    <div class="activity-row">

                        <div class="activity-dse">

                            <div class="activity-dse-name">

                                👤 ${dse}

                            </div>

                            <div class="activity-dse-sub">

                                Saldo Mobo

                            </div>

                        </div>


                        <div class="activity-value">

                            <div
                                class="activity-value-main"
                                style="color:#16a34a;"
                            >

                                ${saldo}

                            </div>


                            <div class="activity-value-sub">

                                saldo tersedia

                            </div>

                        </div>

                    </div>

                `;

            });


            moboHTML += `

                <div class="activity-total">

                    <div class="activity-total-label">

                        Total Saldo

                    </div>


                    <div
                        class="activity-total-value"
                        style="color:#16a34a;"
                    >

                        ${formatRupiah(totalMobo)}

                    </div>

                </div>

            `;


            /* =================================================
               CARD 2
               PENJUALAN FISIK
            ================================================= */

            let fisikHTML = '';


            data.forEach(item => {

                const dse =
                    escapeHTML(
                        item.dse ??
                        item.DSE ??
                        '-'
                    );


                const sp =
                    ambilAngka(
                        item.sp ??
                        item.SP
                    );


                const voucher =
                    ambilAngka(
                        item.voucher ??
                        item.Voucher
                    );


                const total =
                    ambilAngka(
                        item.totalSPVoucher ??
                        item['Total SP Voucher']
                    );


                fisikHTML += `

                    <div
                        class="
                            activity-row
                            activity-fisik-row
                        "
                    >

                        <div class="activity-dse">

                            <div class="activity-dse-name">

                                👤 ${dse}

                            </div>


                            <div class="activity-dse-sub">

                                Penjualan fisik

                            </div>

                        </div>


                        <div class="activity-fisik-values">


                            <div class="activity-fisik-item">

                                <div class="activity-fisik-label">

                                    SP

                                </div>


                                <div class="activity-fisik-number">

                                    ${formatAngka(sp)}

                                </div>

                            </div>


                            <div class="activity-fisik-item">

                                <div class="activity-fisik-label">

                                    Voucher

                                </div>


                                <div class="activity-fisik-number">

                                    ${formatAngka(voucher)}

                                </div>

                            </div>


                            <div
                                class="activity-fisik-item"
                                style="min-width:75px;"
                            >

                                <div class="activity-fisik-label">

                                    Total

                                </div>


                                <div
                                    class="
                                        activity-fisik-number
                                    "
                                    style="color:#16a34a;"
                                >

                                    ${formatRupiah(total)}

                                </div>

                            </div>


                        </div>

                    </div>

                `;

            });


            fisikHTML += `

                <div class="activity-total">

                    <div class="activity-total-label">

                        Total SP & Voucher

                    </div>


                    <div class="activity-total-value">

                        ${formatRupiah(
                            totalSPVoucher
                        )}

                    </div>

                </div>

            `;


            /* =================================================
               CARD 3
               PENJUALAN PAKET
            ================================================= */

            let paketHTML = '';


            data.forEach(item => {

                const dse =
                    escapeHTML(
                        item.dse ??
                        item.DSE ??
                        '-'
                    );


                const namaPaket =
                    escapeHTML(
                        item.namaPaket ??
                        item['Nama Paket'] ??
                        'Paket'
                    );


                const jumlah =
                    ambilAngka(
                        item.jumlahPaket ??
                        item['Jumlah Paket']
                    );


                const rupiah =
                    ambilAngka(
                        item.paketRupiah ??
                        item['Paket Rupiah']
                    );


                paketHTML += `

                    <div
                        class="
                            activity-paket-row
                            activity-row
                        "
                    >

                        <div class="activity-paket-top">

                            <div class="activity-paket-name">

                                📦 ${namaPaket}

                            </div>


                            <div class="activity-paket-dse">

                                ${dse}

                            </div>

                        </div>


                        <div class="activity-paket-bottom">

                            <div class="activity-paket-pcs">

                                ${formatAngka(jumlah)}
                                PAKET

                            </div>


                            <div class="activity-paket-rupiah">

                                ${formatRupiah(rupiah)}

                            </div>

                        </div>

                    </div>

                `;

            });


            paketHTML += `

                <div class="activity-total">

                    <div class="activity-total-label">

                        Total Paket

                    </div>


                    <div class="activity-total-value">

                        ${formatAngka(totalPaket)}
                        PAKET
                        ·
                        ${formatRupiah(totalPaketRupiah)}

                    </div>

                </div>

            `;


            /* =================================================
               RENDER SEKALI
            ================================================= */

            if (moboList) {

                moboList.innerHTML =
                    moboHTML;

            }


            if (fisikList) {

                fisikList.innerHTML =
                    fisikHTML;

            }


            if (paketList) {

                paketList.innerHTML =
                    paketHTML;

            }


            isFirstLoad = false;


            console.log(
                '✅ Activity Daily berhasil diperbarui.'
            );


        } catch (error) {

            console.error(
                '❌ Gagal mengambil Activity Daily:',
                error
            );


            /*
             * Jangan hapus data lama.
             */

            if (isFirstLoad) {

                tampilkanError();

            } else {

                tampilkanError();

            }

        } finally {

            isLoading = false;

        }

    }


    /* =====================================================
       INIT
    ===================================================== */

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            loadActivityDailyData
        );

    } else {

        loadActivityDailyData();

    }


    /* =====================================================
       AUTO CHECK
       
       Tetap cek API 30 detik sekali,
       tetapi TIDAK render jika data sama.
    ===================================================== */

    setInterval(
        loadActivityDailyData,
        REFRESH_INTERVAL
    );


})();