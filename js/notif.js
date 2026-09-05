/*! MC-SAGARANTEN - GLOBAL NOTIFICATION.JS */

(function () {

    'use strict';

    /* =========================================================
       CONFIG
    ========================================================= */

    const NOTIFICATION_API =
        'https://mc-sagaranten-backend.vercel.app/api/notifications';

    const POLLING_INTERVAL = 30000;

    const AUTH_RETRY_INTERVAL = 300;

    const AUTH_MAX_ATTEMPTS = 40;


    /* =========================================================
       STATE
    ========================================================= */

    let auth = null;

    let currentUser = null;

    let notifications = [];

    let pollingTimer = null;

    let authRetryTimer = null;

    let initialized = false;

    let firstFetchCompleted = false;


    /* =========================================================
       LOG
    ========================================================= */

    console.log(
        '🔥 MC-SAGARANTEN notif.js TERLOAD'
    );


    /* =========================================================
       CACHE KEY
    ========================================================= */

    function getCacheKey(uid) {

        return (
            'mc_sagaranten_notifications_' +
            uid
        );

    }


    function getToastCacheKey(uid) {

        return (
            'mc_sagaranten_toasted_notifications_' +
            uid
        );

    }


    /* =========================================================
       CACHE
    ========================================================= */

    function getCachedNotifications() {

        if (!currentUser) {
            return [];
        }

        try {

            const data =
                localStorage.getItem(
                    getCacheKey(
                        currentUser.uid
                    )
                );

            if (!data) {
                return [];
            }

            const parsed =
                JSON.parse(data);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.warn(
                '⚠️ NOTIFICATION CACHE ERROR:',
                error
            );

            return [];

        }

    }


    function saveCachedNotifications(data) {

        if (!currentUser) {
            return;
        }

        try {

            localStorage.setItem(
                getCacheKey(
                    currentUser.uid
                ),
                JSON.stringify(data)
            );

        } catch (error) {

            console.warn(
                '⚠️ NOTIFICATION SAVE CACHE ERROR:',
                error
            );

        }

    }


    function getToastedNotifications() {

        if (!currentUser) {
            return [];
        }

        try {

            const data =
                localStorage.getItem(
                    getToastCacheKey(
                        currentUser.uid
                    )
                );

            if (!data) {
                return [];
            }

            const parsed =
                JSON.parse(data);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch {

            return [];

        }

    }


    function saveToastedNotifications(ids) {

        if (!currentUser) {
            return;
        }

        try {

            localStorage.setItem(
                getToastCacheKey(
                    currentUser.uid
                ),
                JSON.stringify(
                    ids.slice(-100)
                )
            );

        } catch {

            /* ignore */

        }

    }


    /* =========================================================
       AUTH TOKEN
    ========================================================= */

    async function getAuthToken() {

        if (
            !auth ||
            !auth.currentUser
        ) {

            console.warn(
                '⚠️ NOTIFICATION: currentUser belum tersedia'
            );

            return null;

        }

        try {

            return await auth.currentUser.getIdToken();

        } catch (error) {

            console.error(
                '❌ NOTIFICATION TOKEN ERROR:',
                error
            );

            return null;

        }

    }


    /* =========================================================
       FETCH NOTIFICATIONS
    ========================================================= */

    async function fetchGlobalNotifications() {

        if (!auth) {

            console.warn(
                '⚠️ NOTIFICATION: Firebase Auth belum tersedia'
            );

            return [];

        }


        if (!auth.currentUser) {

            console.log(
                '⏳ NOTIFICATION: Menunggu currentUser...'
            );

            return [];

        }


        currentUser =
            auth.currentUser;


        console.log(
            '🔔 NOTIFICATION: User terdeteksi',
            currentUser.uid
        );


        const token =
            await getAuthToken();


        if (!token) {

            console.warn(
                '⚠️ NOTIFICATION: Token tidak tersedia'
            );

            return [];

        }


        try {

            console.log(
                '🔔 NOTIFICATION: Mengambil data...'
            );


            const response =
                await fetch(
                    NOTIFICATION_API +
                    '?t=' +
                    Date.now(),
                    {
                        method: 'GET',

                        cache: 'no-store',

                        headers: {
                            'Authorization':
                                'Bearer ' +
                                token,

                            'Content-Type':
                                'application/json'
                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    'HTTP ' +
                    response.status
                );

            }


            const json =
                await response.json();


            if (
                !json ||
                json.success !== true
            ) {

                throw new Error(
                    json?.message ||
                    'Response API tidak valid'
                );

            }


            const previous =
                notifications;


            notifications =
                Array.isArray(
                    json.data
                )
                    ? json.data
                    : [];


            saveCachedNotifications(
                notifications
            );


            console.log(
                '🔔 NOTIFICATION FETCH BERHASIL:',
                notifications.length
            );


            updateGlobalNotificationBadge();


            /*
             * Jangan tampilkan toast
             * pada fetch pertama.
             *
             * Toast hanya untuk
             * notifikasi yang muncul
             * setelah sistem sudah aktif.
             */

            if (firstFetchCompleted) {

                checkNewNotifications(
                    notifications,
                    previous
                );

            }


            firstFetchCompleted = true;


            return notifications;


        } catch (error) {

            console.error(
                '❌ NOTIFICATION FETCH ERROR:',
                error
            );


            /*
             * Gunakan cache apabila
             * backend sedang tidak tersedia.
             */

            const cached =
                getCachedNotifications();


            if (cached.length) {

                notifications =
                    cached;

            }


            updateGlobalNotificationBadge();


            return notifications;

        }

    }


    /* =========================================================
       READ STATUS
    ========================================================= */

    function isNotificationRead(notification) {

        if (
            !currentUser ||
            !notification
        ) {

            return false;

        }


        const readBy =
            Array.isArray(
                notification.readBy
            )
                ? notification.readBy
                : [];


        return readBy.includes(
            currentUser.uid
        );

    }


    function getUnreadNotifications() {

        return notifications.filter(
            notification =>
                !isNotificationRead(
                    notification
                )
        );

    }


    /* =========================================================
       BADGE
    ========================================================= */

    function updateGlobalNotificationBadge() {

        const badges =
            document.querySelectorAll(
                '.notif-badge'
            );


        const unread =
            getUnreadNotifications();


        const count =
            unread.length;


        badges.forEach(
            badge => {

                if (count > 0) {

                    badge.style.display =
                        'flex';

                    badge.textContent =
                        count > 99
                            ? '99+'
                            : count;

                } else {

                    badge.style.display =
                        'none';

                    badge.textContent =
                        '';

                }

            }
        );


        console.log(
            '🔴 NOTIFICATION BADGE:',
            count
        );

    }


    /* =========================================================
       MARK AS READ
    ========================================================= */

    async function markNotificationAsRead(id) {

        if (
            !id ||
            !currentUser ||
            !auth
        ) {

            return false;

        }


        const token =
            await getAuthToken();


        if (!token) {
            return false;
        }


        try {

            const response =
                await fetch(
                    NOTIFICATION_API +
                    '/' +
                    encodeURIComponent(id) +
                    '/read',
                    {
                        method: 'POST',

                        headers: {
                            'Authorization':
                                'Bearer ' +
                                token,

                            'Content-Type':
                                'application/json'
                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    'HTTP ' +
                    response.status
                );

            }


            notifications =
                notifications.map(
                    notification => {

                        if (
                            notification.id !==
                            id
                        ) {

                            return notification;

                        }


                        const readBy =
                            Array.isArray(
                                notification.readBy
                            )
                                ? [
                                    ...notification.readBy
                                ]
                                : [];


                        if (
                            !readBy.includes(
                                currentUser.uid
                            )
                        ) {

                            readBy.push(
                                currentUser.uid
                            );

                        }


                        return {
                            ...notification,
                            readBy
                        };

                    }
                );


            saveCachedNotifications(
                notifications
            );


            updateGlobalNotificationBadge();


            return true;


        } catch (error) {

            console.error(
                '❌ NOTIFICATION READ ERROR:',
                error
            );

            return false;

        }

    }


    /* =========================================================
       MARK ALL READ
    ========================================================= */

    async function markAllNotificationsAsRead() {

        const unread =
            getUnreadNotifications();


        if (!unread.length) {

            updateGlobalNotificationBadge();

            return true;

        }


        for (
            const notification
            of unread
        ) {

            await markNotificationAsRead(
                notification.id
            );

        }


        updateGlobalNotificationBadge();


        return true;

    }

    /*! MC-SAGARANTEN - GLOBAL NOTIFICATION.JS */

/* =========================================================
   CLEAR ALL NOTIFICATIONS
========================================================= */

async function clearAllNotifications() {

    if (
        !currentUser ||
        !auth
    ) {

        console.warn(
            '⚠️ NOTIFICATION: User belum tersedia'
        );

        return false;

    }


    const token =
        await getAuthToken();


    if (!token) {

        return false;

    }


    try {

        console.log(
            '🗑️ NOTIFICATION: Menghapus semua notification...'
        );


        const response =
            await fetch(
                NOTIFICATION_API +
                '/clear-all',
                {
                    method: 'DELETE',

                    headers: {

                        'Authorization':
                            'Bearer ' +
                            token,

                        'Content-Type':
                            'application/json'

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                'HTTP ' +
                response.status
            );

        }


        const json =
            await response.json();


        if (
            !json ||
            json.success !== true
        ) {

            throw new Error(
                json?.message ||
                'Gagal menghapus notification'
            );

        }


        /*
         * Bersihkan memory
         */

        notifications = [];


        /*
         * Bersihkan cache
         */

        saveCachedNotifications(
            []
        );


        /*
         * Badge langsung menjadi 0
         */

        updateGlobalNotificationBadge();


        console.log(
            '✅ NOTIFICATION: Semua notification berhasil dihapus:',
            json.deleted
        );


        return true;


    } catch (error) {

        console.error(
            '❌ NOTIFICATION CLEAR ALL ERROR:',
            error
        );


        return false;

    }

}
    /* =========================================================
       ICON
    ========================================================= */

    function getNotificationIcon(type) {

        const icons = {

            stock:
                'fa-boxes-stacked',

            sales:
                'fa-chart-line',

            request:
                'fa-file-circle-check',

            user:
                'fa-user',

            broadcast:
                'fa-bullhorn',

            program:
                'fa-gift',

            banner:
                'fa-image',

            activity:
                'fa-list-check',

            dashboard:
                'fa-chart-pie',

            warning:
                'fa-triangle-exclamation',

            system:
                'fa-gear'

        };


        return (
            icons[type] ||
            'fa-bell'
        );

    }


    /* =========================================================
       TIME
    ========================================================= */

    function formatNotificationTime(value) {

        if (!value) {
            return '';
        }


        let date = null;


        try {

            if (
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


            const now =
                new Date();


            const diff =
                now.getTime() -
                date.getTime();


            const minute =
                60 * 1000;

            const hour =
                60 * minute;

            const day =
                24 * hour;


            if (diff < minute) {

                return 'Baru saja';

            }


            if (diff < hour) {

                return (
                    Math.floor(
                        diff / minute
                    ) +
                    ' menit lalu'
                );

            }


            if (diff < day) {

                return (
                    Math.floor(
                        diff / hour
                    ) +
                    ' jam lalu'
                );

            }


            if (diff < 7 * day) {

                return (
                    Math.floor(
                        diff / day
                    ) +
                    ' hari lalu'
                );

            }


            return date.toLocaleDateString(
                'id-ID',
                {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }
            );


        } catch {

            return '';

        }

    }


    /* =========================================================
       TOAST
    ========================================================= */

    function showNotificationToast(
        notification
    ) {

        const title =
            notification?.title ||
            notification?.judul ||
            'Ada notifikasi baru';


        if (
            typeof window.showToast ===
            'function'
        ) {

            window.showToast(
                '🔔 ' + title
            );

            return;

        }


        let container =
            document.getElementById(
                'toast-container'
            );


        if (!container) {

            container =
                document.createElement(
                    'div'
                );


            container.id =
                'toast-container';


            container.style.position =
                'fixed';

            container.style.top =
                '20px';

            container.style.right =
                '20px';

            container.style.zIndex =
                '99999';


            document.body.appendChild(
                container
            );

        }


        const toast =
            document.createElement(
                'div'
            );


        toast.textContent =
            '🔔 ' + title;


        toast.style.background =
            '#111827';

        toast.style.color =
            '#fff';

        toast.style.padding =
            '12px 16px';

        toast.style.borderRadius =
            '12px';

        toast.style.marginBottom =
            '10px';

        toast.style.fontSize =
            '14px';


        container.appendChild(
            toast
        );


        setTimeout(
            () => toast.remove(),
            4000
        );

    }


    /* =========================================================
       NEW NOTIFICATION
    ========================================================= */

    function checkNewNotifications(
        latest,
        previous
    ) {

        if (
            !currentUser ||
            !Array.isArray(latest)
        ) {

            return;

        }


        const oldIds =
            new Set(
                Array.isArray(previous)
                    ? previous.map(
                        item => item.id
                    )
                    : []
            );


        const toasted =
            getToastedNotifications();


        const newItems =
            latest.filter(
                notification => {

                    if (
                        !notification?.id
                    ) {

                        return false;

                    }


                    if (
                        oldIds.has(
                            notification.id
                        )
                    ) {

                        return false;

                    }


                    if (
                        toasted.includes(
                            notification.id
                        )
                    ) {

                        return false;

                    }


                    if (
                        isNotificationRead(
                            notification
                        )
                    ) {

                        return false;

                    }


                    return true;

                }
            );


        if (!newItems.length) {
            return;
        }


        newItems
            .slice(0, 3)
            .forEach(
                notification => {

                    showNotificationToast(
                        notification
                    );

                }
            );


        const ids = [
            ...toasted,
            ...newItems.map(
                notification =>
                    notification.id
            )
        ];


        saveToastedNotifications(
            ids
        );

    }


    /* =========================================================
       POLLING
    ========================================================= */

    function startPolling() {

        stopPolling();


        pollingTimer =
            setInterval(
                () => {

                    if (
                        document.visibilityState ===
                        'visible'
                    ) {

                        fetchGlobalNotifications();

                    }

                },
                POLLING_INTERVAL
            );


        console.log(
            '🔄 NOTIFICATION POLLING AKTIF:',
            POLLING_INTERVAL / 1000,
            'detik'
        );

    }


    function stopPolling() {

        if (pollingTimer) {

            clearInterval(
                pollingTimer
            );

            pollingTimer = null;

        }

    }


    /* =========================================================
       WAIT FOR CURRENT USER
       ========================================================= */

    function waitForCurrentUser() {

        if (!auth) {
            return;
        }


        if (auth.currentUser) {

            currentUser =
                auth.currentUser;


            console.log(
                '🔥 NOTIFICATION: User terdeteksi',
                currentUser.uid
            );


            fetchGlobalNotifications();


            startPolling();


            return;

        }


        let attempts = 0;


        console.log(
            '⏳ NOTIFICATION: Menunggu currentUser...'
        );


        if (authRetryTimer) {

            clearInterval(
                authRetryTimer
            );

        }


        authRetryTimer =
            setInterval(
                () => {

                    attempts++;


                    if (
                        auth.currentUser
                    ) {

                        clearInterval(
                            authRetryTimer
                        );

                        authRetryTimer =
                            null;


                        currentUser =
                            auth.currentUser;


                        console.log(
                            '🔥 NOTIFICATION: User terdeteksi',
                            currentUser.uid
                        );


                        fetchGlobalNotifications();


                        startPolling();


                        return;

                    }


                    if (
                        attempts >=
                        AUTH_MAX_ATTEMPTS
                    ) {

                        clearInterval(
                            authRetryTimer
                        );

                        authRetryTimer =
                            null;


                        console.warn(
                            '⚠️ NOTIFICATION: currentUser tidak ditemukan'
                        );

                    }

                },
                AUTH_RETRY_INTERVAL
            );

    }


    /* =========================================================
       INIT AUTH
    ========================================================= */

    function initNotificationAuth(
        firebaseAuth
    ) {

        if (!firebaseAuth) {

            console.warn(
                '⚠️ NOTIFICATION: Firebase Auth tidak ditemukan'
            );

            return;

        }


        if (
            initialized &&
            auth === firebaseAuth
        ) {

            return;

        }


        auth =
            firebaseAuth;


        initialized =
            true;


        console.log(
            '🔥 NOTIFICATION: Firebase Auth diterima'
        );


        waitForCurrentUser();

    }


    /* =========================================================
       WAIT FIREBASE AUTH
    ========================================================= */

    function waitForFirebaseAuth() {

        /*
         * Jika dashboard-auth.js
         * sudah selesai lebih dahulu.
         */

        if (
            window.firebaseAuth
        ) {

            console.log(
                '🔥 NOTIFICATION: Firebase Auth sudah tersedia'
            );


            initNotificationAuth(
                window.firebaseAuth
            );


            return;

        }


        /*
         * Jika dashboard-auth.js
         * belum selesai.
         */

        console.log(
            '⏳ NOTIFICATION: Menunggu Firebase Auth...'
        );


        window.addEventListener(
            'firebase-auth-ready',
            () => {

                console.log(
                    '🔥 NOTIFICATION: firebase-auth-ready diterima'
                );


                if (
                    window.firebaseAuth
                ) {

                    initNotificationAuth(
                        window.firebaseAuth
                    );

                }

            }
        );

    }


    /* =========================================================
       VISIBILITY
    ========================================================= */

    document.addEventListener(
        'visibilitychange',
        () => {

            if (
                document.visibilityState ===
                'visible' &&
                currentUser
            ) {

                fetchGlobalNotifications();

            }

        }
    );


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.MCNotification = {

    fetch:
        fetchGlobalNotifications,

    getCached:
        getCachedNotifications,

    getUnread:
        getUnreadNotifications,

    markAsRead:
        markNotificationAsRead,

    markAllAsRead:
        markAllNotificationsAsRead,

    clearAll:
        clearAllNotifications,

    updateBadge:
        updateGlobalNotificationBadge,

    getIcon:
        getNotificationIcon,

    formatTime:
        formatNotificationTime

};


    /*
     * Backward compatibility
     */

    window.fetchGlobalNotifications =
        fetchGlobalNotifications;

    window.getCachedNotifications =
        getCachedNotifications;

    window.getUnreadNotifications =
        getUnreadNotifications;

    window.getNotificationIcon =
        getNotificationIcon;

    window.formatNotificationTime =
        formatNotificationTime;

    window.markNotificationAsRead =
        markNotificationAsRead;

    window.markAllNotificationsAsRead =
        markAllNotificationsAsRead;

    window.clearAllNotifications =
        clearAllNotifications;
  
    window.updateGlobalNotificationBadge =
        updateGlobalNotificationBadge;


    /* =========================================================
       START
    ========================================================= */

    waitForFirebaseAuth();


    console.log(
        '🔥 MC-SAGARANTEN GLOBAL NOTIFICATION AKTIF'
    );

})();