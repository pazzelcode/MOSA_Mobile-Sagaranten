document.addEventListener('DOMContentLoaded', async function() {

    const list = document.getElementById('notif-list');

    try {

        // Ambil data notifikasi
        const notifications = await fetchGlobalNotifications();

        // Pastikan berupa array
        const notifData = Array.isArray(notifications)
            ? notifications
            : [];

        // =========================================
        // UPDATE JUMLAH BELUM DIBACA
        // =========================================
        updateUnreadCount(notifData);

        // Tampilkan semua notifikasi
        renderNotifications(notifData, 'all');


        // =========================================
        // LOGIKA FILTER
        // =========================================
        const filterButtons =
            document.querySelectorAll('.notif-filter button');


        filterButtons.forEach(button => {

            button.addEventListener('click', function() {

                // Hapus active
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                });

                // Tambahkan active
                this.classList.add('active');


                // Ambil filter
                const filterType =
                    this.getAttribute('data-filter');


                // Render
                renderNotifications(
                    notifData,
                    filterType
                );

            });

        });


    } catch (error) {

        console.error(
            'Gagal memuat notifikasi:',
            error
        );

        // Jika gagal, tampilkan 0
        updateUnreadCount([]);

    }

});



/* =========================================
   UPDATE JUMLAH NOTIFIKASI BELUM DIBACA
========================================= */

function updateUnreadCount(notifications) {

    const countElement =
        document.querySelector('[data-notif-unread]');


    if (!countElement) return;


    // Ambil daftar ID yang sudah dibaca
    const readIds =
        typeof getReadNotificationIds === 'function'
            ? getReadNotificationIds()
            : [];


    // Hitung yang belum dibaca
    const unreadCount =
        (notifications || []).filter(notification => {

            return !readIds.includes(
                String(notification.id)
            );

        }).length;


    // Tampilkan angka
    countElement.textContent = unreadCount;


    // =========================================
    // OPTIONAL:
    // Update badge pada bottom navigation
    // =========================================

    const badge =
        document.getElementById('notif-badge');


    if (badge) {

        if (unreadCount > 0) {

            badge.textContent =
                unreadCount > 99
                    ? '99+'
                    : unreadCount;

            badge.style.display = 'flex';

        } else {

            badge.textContent = '';

            badge.style.display = 'none';

        }

    }

}



/* =========================================
   RENDER NOTIFICATIONS
========================================= */

function renderNotifications(
    notifications,
    filterType = 'all'
) {

    const list =
        document.getElementById('notif-list');


    const readIds =
        typeof getReadNotificationIds === 'function'
            ? getReadNotificationIds()
            : [];


    // =========================================
    // FILTER
    // =========================================

    let filteredNotifications =
        notifications || [];


    if (filterType === 'unread') {

        filteredNotifications =
            filteredNotifications.filter(
                notification =>
                    !readIds.includes(
                        String(notification.id)
                    )
            );

    }


    // =========================================
    // EMPTY STATE
    // =========================================

    if (
        !filteredNotifications ||
        filteredNotifications.length === 0
    ) {

        list.innerHTML = `

            <div class="notif-empty">

                <div class="notif-empty-icon">
                    🔔
                </div>

                <div class="notif-empty-title">
                    Tidak ada notifikasi
                </div>

                <div class="notif-empty-text">

                    ${
                        filterType === 'unread'
                            ? 'Hore! Semua notifikasi sudah Anda baca.'
                            : 'Saat ini belum ada pemberitahuan baru.'
                    }

                </div>

            </div>

        `;

        return;

    }


    // =========================================
    // LIST NOTIFIKASI
    // =========================================

    list.innerHTML =
        filteredNotifications.map(notification => {

            const isRead =
                readIds.includes(
                    String(notification.id)
                );


            return `

                <div
                    class="notif-item ${
                        isRead
                            ? 'read'
                            : 'unread'
                    }"
                    data-id="${escapeHtml(
                        notification.id
                    )}"
                >

                    <div class="notif-item-icon">

                        ${
                            typeof getNotificationIcon === 'function'
                                ? getNotificationIcon(
                                    notification.type
                                )
                                : '📄'
                        }

                    </div>


                    <div class="notif-item-content">

                        <div class="notif-item-title">

                            ${escapeHtml(
                                notification.title
                            )}

                        </div>


                        <div class="notif-item-message">

                            ${escapeHtml(
                                notification.message
                            )}

                        </div>


                        <div class="notif-item-time">

                            ${
                                typeof formatNotificationTime === 'function'
                                    ? formatNotificationTime(
                                        notification.createdAt
                                    )
                                    : 'Baru saja'
                            }

                        </div>

                    </div>


                    ${
                        !isRead
                            ? '<div class="notif-unread-dot"></div>'
                            : ''
                    }

                </div>

            `;

        }).join('');


    // =========================================
    // EVENT KLIK NOTIFIKASI
    // =========================================

    list
        .querySelectorAll('.notif-item')
        .forEach(item => {

            item.addEventListener(
                'click',
                () => {

                    const id =
                        String(item.dataset.id);


                    const notification =
                        notifications.find(
                            n =>
                                String(n.id) === id
                        );


                    // Tandai dibaca
                    if (
                        typeof markNotificationAsRead ===
                        'function'
                    ) {

                        markNotificationAsRead(id);

                    }


                    // Update visual
                    item.classList.remove(
                        'unread'
                    );

                    item.classList.add(
                        'read'
                    );


                    const dot =
                        item.querySelector(
                            '.notif-unread-dot'
                        );


                    if (dot) {

                        dot.remove();

                    }


                    // =========================================
                    // UPDATE ANGKA SECARA LANGSUNG
                    // =========================================

                    updateUnreadCount(
                        notifications
                    );


                    // =========================================
                    // REDIRECT
                    // =========================================

                    if (
                        notification &&
                        notification.url &&
                        notification.url !== '#'
                    ) {

                        window.location.href =
                            notification.url;

                    }

                }
            );

        });

}



/* =========================================
   ESCAPE HTML
========================================= */

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



/* =========================================
   BACK
========================================= */

function goBack() {

    if (window.history.length > 1) {

        window.history.back();

    } else {

        window.location.href =
            'index.html';

    }

}