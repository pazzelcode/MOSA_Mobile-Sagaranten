/* =========================================================
   MC-SAGARANTEN
   NOTIFICATION PAGE UI
========================================================= */

(function () {

    'use strict';

    console.log('🔔 MC-SAGARANTEN NOTIFICATION PAGE AKTIF');

    let allNotifications = [];
    let currentFilter = 'all';

    const listElement =
        document.getElementById('notif-list');

    const unreadCountElement =
        document.querySelector('[data-notif-unread]');

    const markAllButton =
        document.getElementById('btn-mark-all');

    const clearAllButton =
        document.getElementById('btn-clear-all');


    /* =====================================================
       GET CACHE
    ===================================================== */

    function getNotifications() {

        if (
            window.MCNotification &&
            typeof window.MCNotification.getCached === 'function'
        ) {

            const data =
                window.MCNotification.getCached();

            if (Array.isArray(data)) {
                return data;
            }
        }

        if (
            Array.isArray(window.__MC_NOTIFICATIONS__)
        ) {
            return window.__MC_NOTIFICATIONS__;
        }

        return [];
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    /* =====================================================
       FORMAT TIME
    ===================================================== */

    function formatTime(notification) {

        if (
            window.MCNotification &&
            typeof window.MCNotification.formatTime === 'function'
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
                value._seconds
            ) {

                date = new Date(
                    value._seconds * 1000
                );

            } else if (
                typeof value === 'object' &&
                value.seconds
            ) {

                date = new Date(
                    value.seconds * 1000
                );

            } else {

                date = new Date(value);
            }

            if (isNaN(date.getTime())) {
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

        } catch (error) {

            return '';
        }
    }


    /* =====================================================
       ICON
    ===================================================== */

    function getIcon(notification) {

        if (
            window.MCNotification &&
            typeof window.MCNotification.getIcon === 'function'
        ) {

            return window.MCNotification.getIcon(
                notification.type
            );
        }

        const icons = {

            stock: 'fa-boxes-stacked',
            sales: 'fa-chart-column',
            request: 'fa-clipboard-list',
            user: 'fa-user',
            broadcast: 'fa-bullhorn',
            program: 'fa-store',
            banner: 'fa-image',
            activity: 'fa-calendar-check',
            dashboard: 'fa-chart-line',
            warning: 'fa-triangle-exclamation',
            system: 'fa-bell'

        };

        return icons[
            String(notification.type || '').toLowerCase()
        ] || 'fa-bell';
    }


    /* =====================================================
       URL
    ===================================================== */

    function getNotificationUrl(notification) {

        const data =
            notification.data || {};

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
            String(notification.type || '')
                .toLowerCase();

        const urls = {

            stock: 'stok-gudang.html',
            sales: 'penjualan-reguler-new.html',
            program: 'program-outlet.html',
            banner: 'index.html',
            activity: 'activity-daily.html',
            dashboard: 'index.html',
            system: 'index.html',
            warning: 'index.html'

        };

        return urls[type] || null;
    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary() {

        const unread =
            allNotifications.filter(
                n => !n.isRead
            ).length;

        if (unreadCountElement) {

            unreadCountElement.textContent =
                unread;
        }

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredNotifications() {

        if (currentFilter === 'unread') {

            return allNotifications.filter(
                n => !n.isRead
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
           RENDER ITEMS
        ================================================= */

        notifications.forEach(notification => {

            const item =
                document.createElement('div');

            item.className =
                `notif-item ${
                    notification.isRead
                        ? 'read'
                        : 'unread'
                }`;

            item.dataset.id =
                notification.id;


            const title =
                notification.title ||
                'Notifikasi';

            const message =
                notification.message ||
                '';

            const icon =
                getIcon(notification);

            const time =
                formatTime(notification);


            item.innerHTML = `

                <div class="notif-item-icon">
                    <i class="fa-solid ${icon}"></i>
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


            item.addEventListener(
                'click',
                async () => {

                    if (
                        !notification.isRead &&
                        typeof window.markNotificationAsRead ===
                        'function'
                    ) {

                        try {

                            await window.markNotificationAsRead(
                                notification.id
                            );

                            notification.isRead =
                                true;

                        } catch (error) {

                            console.error(
                                '❌ MARK READ ERROR:',
                                error
                            );
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


            listElement.appendChild(item);

        });


        console.log(
            '📋 NOTIF PAGE: Render selesai:',
            notifications.length
        );

    }


    /* =====================================================
       SYNC CACHE
    ===================================================== */

    async function syncFromCache() {

    try {

        /*
         * Ambil data terbaru dari global notification
         */

        if (
            window.MCNotification &&
            typeof window.MCNotification.fetch ===
            'function'
        ) {

            const data =
                await window.MCNotification.fetch();


            if (Array.isArray(data)) {

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


        /*
         * Fallback ke cache
         */

        const cached =
            getNotifications();


        if (Array.isArray(cached)) {

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
       WAIT FOR DATA
    ===================================================== */

    function startSync() {

    /*
     * Ambil data pertama kali
     */

    syncFromCache();


    /*
     * Beri kesempatan notif.js selesai
     * melakukan fetch dari backend.
     */

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

                    clearInterval(timer);

                }


                /*
                 * Maksimal 20 detik
                 */

                if (
                    attempts >= 40
                ) {

                    clearInterval(timer);


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
     * Re-sync setiap 30 detik
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
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        document
                            .querySelectorAll(
                                '.notif-filter button'
                            )
                            .forEach(btn =>
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

            });

    }


    /* =====================================================
       MARK ALL
    ===================================================== */

    async function markAllRead() {

        if (
            typeof window.markAllNotificationsAsRead !==
            'function'
        ) {

            return;
        }

        try {

            await window.markAllNotificationsAsRead();

            allNotifications =
                allNotifications.map(
                    n => ({
                        ...n,
                        isRead: true
                    })
                );

            updateSummary();
            renderNotifications();

        } catch (error) {

            console.error(
                '❌ MARK ALL ERROR:',
                error
            );
        }
    }


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

            clearAllButton.disabled = true;

            clearAllButton.textContent =
                'Menghapus...';

        }


        const success =
            await window.clearAllNotifications();


        if (!success) {

            throw new Error(
                'Gagal menghapus notification'
            );

        }


        /*
         * Kosongkan halaman
         */

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

            clearAllButton.disabled = false;

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


    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init,
            { once: true }
        );

    } else {

        init();

    }


})();