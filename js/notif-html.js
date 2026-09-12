/* =========================================================
   MC-SAGARANTEN
   NOTIFICATION PAGE UI
========================================================= */

(function () {

    'use strict';

    console.log(
        '🔔 MC-SAGARANTEN NOTIFICATION PAGE AKTIF'
    );


    /* =====================================================
       STATE
    ===================================================== */

    let allNotifications = [];

    let currentFilter = 'all';


    /* =====================================================
       ELEMENT
    ===================================================== */

    const listElement =
        document.getElementById('notif-list');

    const unreadCountElement =
        document.querySelector(
            '[data-notif-unread]'
        );

    const markAllButton =
        document.getElementById(
            'btn-mark-all'
        );

    const clearAllButton =
        document.getElementById(
            'btn-clear-all'
        );


    /* =====================================================
       GET CACHE
    ===================================================== */

    function getNotifications() {

        if (
            window.MCNotification &&
            typeof window.MCNotification.getCached ===
            'function'
        ) {

            const data =
                window.MCNotification.getCached();

            if (Array.isArray(data)) {

                return data;

            }

        }


        if (
            Array.isArray(
                window.__MC_NOTIFICATIONS__
            )
        ) {

            return window.__MC_NOTIFICATIONS__;

        }


        return [];

    }


    /* =====================================================
       CHECK READ STATUS
       
       STATUS UTAMA:
       MCNotification → readBy → current user
       
       Fallback:
       isRead
    ===================================================== */

    function isNotificationRead(
        notification
    ) {

        if (!notification) {

            return false;

        }


        /*
         * Jika notif.js menyediakan
         * daftar unread, gunakan itu
         */

        if (
            window.MCNotification &&
            typeof window.MCNotification.getUnread ===
            'function'
        ) {

            const unread =
                window.MCNotification.getUnread();


            const unreadIds =
                new Set(
                    unread
                        .map(
                            item => item?.id
                        )
                        .filter(Boolean)
                );


            if (
                notification.id &&
                unreadIds.has(
                    notification.id
                )
            ) {

                return false;

            }


            /*
             * Kalau notification tidak ada
             * di daftar unread, berarti read.
             */

            if (
                notification.id &&
                !unreadIds.has(
                    notification.id
                )
            ) {

                /*
                 * Hanya anggap read jika
                 * MCNotification memang sudah
                 * mempunyai data notification.
                 */

                return true;

            }

        }


        /*
         * Fallback
         */

        return notification.isRead === true;

    }


    /* =====================================================
       NORMALIZE
    ===================================================== */

    function normalizeNotification(
        notification
    ) {

        return {

            ...notification,

            isRead:
                isNotificationRead(
                    notification
                )

        };

    }


    /* =====================================================
       SYNC READ STATUS
    ===================================================== */

    function syncReadStatus() {

        allNotifications =
            allNotifications.map(
                normalizeNotification
            );

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        return String(
            value ?? ''
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


    /* =====================================================
       FORMAT TIME
    ===================================================== */

    function formatTime(
        notification
    ) {

        if (
            window.MCNotification &&
            typeof window.MCNotification.formatTime ===
            'function'
        ) {

            return window.MCNotification.formatTime(
                notification.createdAt
            );

        }


        const value =
            notification.createdAt;


        if (!value) {

            return '';

        }


        try {

            let date;


            if (
                typeof value === 'object' &&
                value._seconds != null
            ) {

                date =
                    new Date(
                        Number(
                            value._seconds
                        ) * 1000
                    );

            } else if (
                typeof value === 'object' &&
                value.seconds != null
            ) {

                date =
                    new Date(
                        Number(
                            value.seconds
                        ) * 1000
                    );

            } else {

                date =
                    new Date(value);

            }


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return '';

            }


            return date.toLocaleString(
                'id-ID',
                {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );

        } catch {

            return '';

        }

    }


    /* =====================================================
       ICON
    ===================================================== */

    function getIcon(
        notification
    ) {

        if (
            window.MCNotification &&
            typeof window.MCNotification.getIcon ===
            'function'
        ) {

            return window.MCNotification.getIcon(
                notification.type
            );

        }


        const icons = {

            stock:
                'fa-boxes-stacked',

            sales:
                'fa-chart-column',

            request:
                'fa-clipboard-list',

            user:
                'fa-user',

            broadcast:
                'fa-bullhorn',

            program:
                'fa-store',

            banner:
                'fa-image',

            activity:
                'fa-calendar-check',

            dashboard:
                'fa-chart-line',

            warning:
                'fa-triangle-exclamation',

            system:
                'fa-bell'

        };


        return (
            icons[
                String(
                    notification.type ||
                    ''
                ).toLowerCase()
            ] ||
            'fa-bell'
        );

    }


    /* =====================================================
       URL
    ===================================================== */

    function getNotificationUrl(
        notification
    ) {

        const data =
            notification.data ||
            {};


        if (data.url) {

            return data.url;

        }


        if (data.href) {

            return data.href;

        }


        if (data.page) {

            return data.page;

        }


        const type =
            String(
                notification.type ||
                ''
            ).toLowerCase();


        const urls = {

            stock:
                'stok-gudang.html',

            sales:
                'penjualan-reguler-new.html',

            program:
                'program-outlet.html',

            banner:
                'index.html',

            activity:
                'activity-daily.html',

            dashboard:
                'index.html',

            system:
                'index.html',

            warning:
                'index.html'

        };


        return urls[type] || null;

    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary() {

        syncReadStatus();


        const unread =
            allNotifications.filter(
                notification =>
                    !notification.isRead
            );


        if (
            unreadCountElement
        ) {

            unreadCountElement.textContent =
                unread.length;

        }


        /*
         * Update global badge juga
         */

        if (
            window.MCNotification &&
            typeof window.MCNotification.updateBadge ===
            'function'
        ) {

            window.MCNotification.updateBadge();

        }

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredNotifications() {

        syncReadStatus();


        if (
            currentFilter ===
            'unread'
        ) {

            return allNotifications.filter(
                notification =>
                    !notification.isRead
            );

        }


        return allNotifications;

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderNotifications() {

        if (!listElement) {

            return;

        }


        syncReadStatus();


        const notifications =
            getFilteredNotifications();


        listElement.innerHTML = '';


        /* =================================================
           EMPTY
        ================================================= */

        if (!notifications.length) {

            listElement.innerHTML = `

                <div class="notif-empty">

                    <div class="notif-empty-icon">
                        <i class="fa-regular fa-bell-slash"></i>
                    </div>

                    <div class="notif-empty-title">
                        Belum Ada Notifikasi
                    </div>

                    <div class="notif-empty-text">
                        Belum ada pembaruan untuk Anda.
                    </div>

                </div>

            `;

            return;

        }


        /* =================================================
           ITEMS
        ================================================= */

        notifications.forEach(
            notification => {

                const item =
                    document.createElement(
                        'div'
                    );


                item.className =
                    `notif-item ${
                        notification.isRead
                            ? 'read'
                            : 'unread'
                    }`;


                item.dataset.id =
                    notification.id ||
                    '';


                const title =
                    notification.title ||
                    'Notifikasi';


                const message =
                    notification.message ||
                    '';


                const icon =
                    getIcon(
                        notification
                    );


                const time =
                    formatTime(
                        notification
                    );


                item.innerHTML = `

                    <div class="notif-item-icon">
                        <i class="fa-solid ${escapeHtml(icon)}"></i>
                    </div>

                    <div class="notif-item-content">

                        <div class="notif-item-title">
                            ${escapeHtml(title)}
                        </div>

                        <div class="notif-item-message">
                            ${escapeHtml(message)}
                        </div>

                        <div class="notif-item-time">
                            ${escapeHtml(time)}
                        </div>

                    </div>

                    ${
                        !notification.isRead
                            ? `
                                <div class="notif-unread-dot"></div>
                              `
                            : ''
                    }

                `;


                /* =========================================
                   CLICK NOTIFICATION
                ========================================= */

                item.addEventListener(
                    'click',
                    async () => {

                        if (
                            !notification.isRead &&
                            window.MCNotification &&
                            typeof window.MCNotification.markAsRead ===
                            'function'
                        ) {

                            const success =
                                await window.MCNotification.markAsRead(
                                    notification.id
                                );


                            if (success) {

                                notification.isRead =
                                    true;

                            }

                        }


                        updateSummary();

                        renderNotifications();


                        const url =
                            getNotificationUrl(
                                notification
                            );


                        if (url) {

                            window.location.href =
                                url;

                        }

                    }
                );


                listElement.appendChild(
                    item
                );

            }
        );


        console.log(
            '📋 NOTIF PAGE: Render selesai:',
            notifications.length
        );

    }


    /* =====================================================
       SYNC FROM BACKEND / CACHE
    ===================================================== */

    async function syncFromCache() {

        try {

            if (
                window.MCNotification &&
                typeof window.MCNotification.fetch ===
                'function'
            ) {

                const data =
                    await window.MCNotification.fetch();


                if (
                    Array.isArray(data)
                ) {

                    allNotifications =
                        data.slice();


                    updateSummary();

                    renderNotifications();


                    console.log(
                        '🔄 NOTIF PAGE: Data berhasil disinkronkan:',
                        allNotifications.length
                    );


                    return true;

                }

            }


            const cached =
                getNotifications();


            if (
                Array.isArray(cached)
            ) {

                allNotifications =
                    cached.slice();


                updateSummary();

                renderNotifications();


                console.log(
                    '📦 NOTIF PAGE: Menggunakan cache:',
                    allNotifications.length
                );


                return true;

            }


            return false;

        } catch (error) {

            console.error(
                '❌ NOTIF PAGE SYNC ERROR:',
                error
            );

            return false;

        }

    }


    /* =====================================================
       START SYNC
    ===================================================== */

    function startSync() {

        syncFromCache();


        let attempts = 0;


        const timer =
            setInterval(
                async () => {

                    attempts++;


                    const updated =
                        await syncFromCache();


                    if (
                        updated &&
                        allNotifications.length > 0
                    ) {

                        console.log(
                            '✅ NOTIF PAGE: Notification berhasil ditampilkan:',
                            allNotifications.length
                        );


                        clearInterval(
                            timer
                        );

                    }


                    if (
                        attempts >= 40
                    ) {

                        clearInterval(
                            timer
                        );


                        if (
                            allNotifications.length === 0
                        ) {

                            console.warn(
                                '⚠️ NOTIF PAGE: Data notification tidak ditemukan'
                            );

                        }

                    }

                },
                500
            );


        /*
         * Re-sync 30 detik
         */

        setInterval(
            () => {

                syncFromCache();

            },
            30000
        );

    }


    /* =====================================================
       FILTER BUTTON
    ===================================================== */

    function setupFilters() {

        document
            .querySelectorAll(
                '.notif-filter button'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        () => {

                            document
                                .querySelectorAll(
                                    '.notif-filter button'
                                )
                                .forEach(
                                    btn =>
                                        btn.classList.remove(
                                            'active'
                                        )
                                );


                            button.classList.add(
                                'active'
                            );


                            currentFilter =
                                button.dataset.filter ||
                                'all';


                            renderNotifications();

                        }
                    );

                }
            );

    }


    /* =====================================================
       MARK ALL READ
    ===================================================== */

    async function markAllRead() {

        console.log(
            '🔵 MARK ALL READ: tombol ditekan'
        );


        if (
            !window.MCNotification ||
            typeof window.MCNotification.markAllAsRead !==
            'function'
        ) {

            console.error(
                '❌ MCNotification.markAllAsRead tidak tersedia'
            );

            alert(
                'Fungsi Tandai Semua Dibaca belum tersedia.'
            );

            return;

        }


        /*
         * Cek jumlah unread dari global notification
         */

        const unreadBefore =
            typeof window.MCNotification.getUnread ===
            'function'
                ? window.MCNotification.getUnread()
                : [];


        console.log(
            '🔵 UNREAD SEBELUM:',
            unreadBefore.length
        );


        if (
            !unreadBefore.length
        ) {

            updateSummary();

            renderNotifications();

            console.log(
                'ℹ️ Tidak ada notifikasi belum dibaca'
            );

            return;

        }


        /*
         * Lock tombol
         */

        if (markAllButton) {

            markAllButton.disabled =
                true;

            markAllButton.dataset.loading =
                'true';

            markAllButton.textContent =
                'Menandai...';

        }


        try {

            const success =
                await window.MCNotification.markAllAsRead();


            console.log(
                '🔵 MARK ALL RESULT:',
                success
            );


            if (!success) {

                throw new Error(
                    'API mark all read gagal'
                );

            }


            /*
             * Ambil data terbaru dari
             * MCNotification
             */

            const latest =
                typeof window.MCNotification.getCached ===
                'function'
                    ? window.MCNotification.getCached()
                    : [];


            if (
                Array.isArray(latest)
            ) {

                allNotifications =
                    latest.slice();

            } else {

                /*
                 * Fallback jika cache tidak tersedia
                 */

                allNotifications =
                    allNotifications.map(
                        notification => ({
                            ...notification,
                            isRead: true
                        })
                    );

            }


            /*
             * Pastikan status halaman
             * langsung menjadi read.
             */

            allNotifications =
                allNotifications.map(
                    notification => ({
                        ...notification,
                        isRead: true
                    })
                );


            updateSummary();

            renderNotifications();


            /*
             * Badge global
             */

            if (
                window.MCNotification &&
                typeof window.MCNotification.updateBadge ===
                'function'
            ) {

                window.MCNotification.updateBadge();

            }


            if (markAllButton) {

                markAllButton.textContent =
                    'Semua Sudah Dibaca';

            }


            console.log(
                '✅ SEMUA NOTIFIKASI BERHASIL DITANDAI DIBACA'
            );


        } catch (error) {

            console.error(
                '❌ MARK ALL ERROR:',
                error
            );


            alert(
                'Gagal menandai semua notifikasi sebagai sudah dibaca.'
            );


            if (markAllButton) {

                markAllButton.textContent =
                    'Tandai Semua Dibaca';

            }

        } finally {

            if (markAllButton) {

                markAllButton.disabled =
                    false;

                markAllButton.dataset.loading =
                    'false';

            }

        }

    }


    /* =====================================================
       CLEAR ALL
    ===================================================== */

    async function clearAll() {

        const total =
            allNotifications.length;


        if (!total) {

            alert(
                'Tidak ada notifikasi untuk dihapus.'
            );

            return;

        }


        const confirmed =
            confirm(
                `Hapus semua ${total} notifikasi?\n\n` +
                `Notifikasi akan dihapus dari daftar Anda.`
            );


        if (!confirmed) {

            return;

        }


        try {

            if (clearAllButton) {

                clearAllButton.disabled =
                    true;

                clearAllButton.textContent =
                    'Menghapus...';

            }


            if (
                !window.MCNotification ||
                typeof window.MCNotification.clearAll !==
                'function'
            ) {

                throw new Error(
                    'MCNotification.clearAll tidak tersedia'
                );

            }


            const success =
                await window.MCNotification.clearAll();


            if (!success) {

                throw new Error(
                    'Gagal menghapus notification'
                );

            }


            allNotifications = [];


            updateSummary();

            renderNotifications();


            console.log(
                '✅ NOTIF PAGE: Semua notification dihapus'
            );


        } catch (error) {

            console.error(
                '❌ CLEAR ALL ERROR:',
                error
            );


            alert(
                'Gagal menghapus semua notifikasi.'
            );


        } finally {

            if (clearAllButton) {

                clearAllButton.disabled =
                    false;

                clearAllButton.textContent =
                    'Hapus Semua';

            }

        }

    }


    /* =====================================================
       BACK
    ===================================================== */

    window.goBack = function () {

        if (
            document.referrer &&
            document.referrer !==
            window.location.href
        ) {

            window.history.back();

        } else {

            window.location.href =
                'index.html';

        }

    };


    /* =====================================================
       PUBLIC RENDER
    ===================================================== */

    window.renderNotifications =
        renderNotifications;


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        setupFilters();


        if (markAllButton) {

            markAllButton.addEventListener(
                'click',
                markAllRead
            );

        }


        if (clearAllButton) {

            clearAllButton.addEventListener(
                'click',
                clearAll
            );

        }


        startSync();

    }


    /* =====================================================
       DOM READY
    ===================================================== */

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init,
            {
                once: true
            }
        );

    } else {

        init();

    }

})();