/*! MC-SAGARANTEN - DASHBOARD.JS */
(function () {
    const DASHBOARD_JSON_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/dashboard.json';
    const BANNER_API_URL = 'http://localhost:3000/api/banners';
    let lastDashboardSignature = null, isFirstDashboardLoad = true, allMenus = [], dashboardBanners = [], bannerCurrentIndex = 0, bannerAutoPlay = null;

    const $ = id => document.getElementById(id);
    const formatRupiah = num => 'Rp ' + Number(num || 0).toLocaleString('id-ID');
    
    const ambilAngka = v => {
        if (v === null || v === undefined || v === '') return 0;
        if (typeof v === 'number') return v;
        let str = String(v).trim();
        if (!str) return 0;
        return Number(str.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    };

    const escapeHTML = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const normalizeDashboardData = item => ({
        grandTotal: ambilAngka(item?.['TOTAL PENJUALAN SALMO'] ?? item?.total_penjualan_salmo ?? item?.totalPenjualanSalmo),
        totalSPVoucher: ambilAngka(item?.['SP DAN VOUCHER'] ?? item?.sp_dan_voucher ?? item?.spDanVoucher),
        totalPaket: ambilAngka(item?.['ALL PAKET'] ?? item?.all_paket ?? item?.allPaket),
        totalHifi: ambilAngka(item?.['HIFI'] ?? item?.hifi)
    });

    const tampilkanNamaPengguna = () => {
        const el = $('user-name');
        if (el && (!el.textContent || el.textContent.trim() === '' || el.textContent.trim() === 'Pengguna')) el.textContent = 'Pengguna';
    };

    const muatDashboardCache = () => {
        try {
            const cached = localStorage.getItem('mc_cached_dashboard');
            if (!cached) return;
            const d = JSON.parse(cached);
            if ($('grand-total') && d.grandTotal !== undefined) $('grand-total').innerText = formatRupiah(d.grandTotal);
            if ($('total-sp') && d.totalSPVoucher !== undefined) $('total-sp').innerText = formatRupiah(d.totalSPVoucher);
            if ($('total-paket') && d.totalPaket !== undefined) $('total-paket').innerText = formatRupiah(d.totalPaket);
            if ($('total-hifi') && d.totalHifi !== undefined) $('total-hifi').innerText = formatRupiah(d.totalHifi);
        } catch (e) { console.warn('[Dashboard] Gagal memuat cache:', e); }
    };

    const updateDashboardCards = (gt, sp, pk, hf) => {
        if ($('grand-total')) $('grand-total').innerText = formatRupiah(gt);
        if ($('total-sp')) $('total-sp').innerText = formatRupiah(sp);
        if ($('total-paket')) $('total-paket').innerText = formatRupiah(pk);
        if ($('total-hifi')) $('total-hifi').innerText = formatRupiah(hf);
    };

    const updateDashboardData = async () => {
        try {
            const res = await fetch(DASHBOARD_JSON_URL + '?t=' + Date.now(), { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (!json || json.success !== true || !Array.isArray(json.data) || !json.data.length) throw new Error('Format tidak valid.');
            
            const norm = normalizeDashboardData(json.data[0]);
            const { grandTotal, totalSPVoucher, totalPaket, totalHifi } = norm;

            try {
                localStorage.setItem('mc_cached_dashboard', JSON.stringify({
                    grandTotal, totalSPVoucher, totalPaket, totalHifi,
                    updatedAt: json.updated_at || null, version: json.version || null, timestamp: Date.now()
                }));
            } catch (e) { console.warn('[Dashboard] Gagal menyimpan cache:', e); }

            const sig = JSON.stringify({ salmo: grandTotal, spVoucher: totalSPVoucher, paket: totalPaket, hifi: totalHifi });
            if (!isFirstDashboardLoad && lastDashboardSignature !== sig) {
                if (typeof tambahNotif === 'function') tambahNotif('Data Dashboard berubah. Silakan periksa data terbaru.');
                if (typeof showToast === 'function') showToast('Data Dashboard berubah');
            }
            lastDashboardSignature = sig;
            isFirstDashboardLoad = false;
            updateDashboardCards(grandTotal, totalSPVoucher, totalPaket, totalHifi);
        } catch (e) {
            console.error('[Dashboard] ❌ Gagal:', e.message);
            if (localStorage.getItem('mc_cached_dashboard')) return;
            ['grand-total', 'total-sp', 'total-paket', 'total-hifi'].forEach(id => { if ($(id)) $(id).innerText = 'Error'; });
        }
    };

    const updateClock = () => {
        const now = new Date();
        if ($('live-date')) $('live-date').innerText = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long' });
        if ($('live-time')) $('live-time').innerText = [now.getHours(), now.getMinutes(), now.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
    };
    setInterval(updateClock, 1000);
    updateClock();

    const updateBadge = () => {
        const badge = document.querySelector('.notif-badge');
        if (!badge) return;
        let logs = [];
        try { logs = JSON.parse(localStorage.getItem('notif_logs') || '[]'); } catch (e) { logs = []; }
        const unread = logs.filter(l => l.read !== true).length;
        badge.style.display = unread > 0 ? 'flex' : 'none';
        badge.textContent = unread > 0 ? unread : '';
    };

    window.showToast = msg => {
        const container = $('toast-container');
        if (!container) return;
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    };

    const loadSemua = async () => {
    try {
        await updateDashboardData();
        updateBadge();
    } catch (e) {
        console.error('[Dashboard] Gagal load:', e);
    }
};

let isDashboardRefreshing = false;

const refreshDashboardPage = () => {
    if (isDashboardRefreshing) return;
    isDashboardRefreshing = true;
    console.log('[Dashboard] Tombol Refresh ditekan');

    const button = $('btn-refresh');
    if (button) {
        button.disabled = true;
        button.classList.add('refreshing');
        const icon = button.querySelector('.quick-menu-icon i');
        if (icon) icon.classList.add('refresh-spin');
    }

    setTimeout(() => window.location.reload(), 150);
};

window.refreshDashboardPage = refreshDashboardPage;

document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = $('btn-refresh');
    if (refreshButton) {
        refreshButton.addEventListener('click', (e) => {
            e.preventDefault();
            refreshDashboardPage();
        });
    }
});


    const getSearchIcon = item => {
        const icon = item.querySelector('.nav-icon i, .nav-icon img');
        let cls = '';
        if (item.matches('.form-link, .gudang-link, .dse-link')) cls = 'search-icon-form';
        else if (item.classList.contains('penjualan-link')) cls = 'search-icon-trade';
        else if (item.classList.contains('trade-link')) cls = 'search-icon-gudang';
        else if (item.matches('.kpi-link, .md-link')) cls = 'search-icon-kpi';

        if (!icon) return `<span class="search-icon ${cls}"><i class="fa-solid fa-file fa-outline"></i></span>`;
        if (icon.tagName.toLowerCase() === 'i') return `<span class="search-icon ${cls}"><i class="${icon.className}"></i></span>`;
        if (icon.tagName.toLowerCase() === 'img') return `<span class="search-icon ${cls}"><img src="${icon.getAttribute('src')}" alt="${icon.getAttribute('alt') || ''}"></span>`;
        return `<span class="search-icon ${cls}"><i class="fa-solid fa-file fa-outline"></i></span>`;
    };

    const ambilSemuaMenu = () => {
        const menus = [];
        document.querySelectorAll('.nav-item[href], .submenu-item[href], .bottom-item[href]').forEach(item => {
            const adminContainer = item.closest('#admin-menu');
            if (adminContainer && adminContainer.style.display === 'none') return;
            const title = item.querySelector('.nav-title')?.innerText.trim() || '';
            const bottomTitle = item.querySelector('span')?.innerText.trim() || '';
            const finalTitle = title || bottomTitle;
            if (!finalTitle) return;
            menus.push({
                title: finalTitle,
                desc: item.querySelector('.nav-desc')?.innerText.trim() || '',
                href: item.getAttribute('href'),
                icon: getSearchIcon(item)
            });
        });
        return menus;
    };

    const openSearchBtn = $('openSearch'), searchOverlay = $('searchOverlay'), searchInput = $('searchInput'), searchResults = $('searchResults');

    if (openSearchBtn) {
        openSearchBtn.addEventListener('click', () => {
            allMenus = ambilSemuaMenu();
            searchOverlay.classList.add('active');
            searchInput.value = '';
            tampilkanHasil('');
            setTimeout(() => searchInput.focus(), 100);
        });
    }
    if (searchOverlay) {
        searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) searchOverlay.classList.remove('active'); });
    }
    if (searchInput) {
        searchInput.addEventListener('input', function() { tampilkanHasil(this.value); });
    }

    const tampilkanHasil = kw => {
        kw = kw.toLowerCase().trim();
        const hasil = allMenus.filter(m => m.title.toLowerCase().includes(kw) || m.desc.toLowerCase().includes(kw));
        if (!searchResults) return;
        if (!hasil.length) {
            searchResults.innerHTML = '<div class="empty-search">Menu tidak ditemukan</div>';
            return;
        }
        searchResults.innerHTML = hasil.map(m => `
            <a href="${m.href}" class="search-item">
                <div class="search-icon">${m.icon}</div>
                <div class="search-text">
                    <div class="search-title">${m.title}</div>
                    <div class="search-desc">${m.desc}</div>
                </div>
            </a>
        `).join('');
    };

    const kirimLogSafe = act => {
        if (typeof kirimLog === 'function') {
            try { kirimLog(act); } catch (e) { console.warn('[Dashboard] Log gagal:', e); }
        }
    };

    const downloadBtn = $('btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', e => {
            e.preventDefault();
            kirimLogSafe('Melakukan Download File');
            window.location.href = 'download-data.html?download=success';
        });
    }

    window.addEventListener('storage', e => { if (e.key === 'notif_logs') updateBadge(); });

    document.querySelectorAll('.nav-item[href], .submenu-item[href], .bottom-item[href]').forEach(m => {
        m.addEventListener('click', () => {
            localStorage.removeItem('notif_logs');
            const badge = document.querySelector('.notif-badge');
            if (badge) { badge.style.display = 'none'; badge.textContent = ''; }
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
    muatDashboardCache();
    tampilkanNamaPengguna();
    updateBadge();
    kirimLogSafe('Membuka Home Portal');
    loadSemua();


    const trigger = $('logoPreviewTrigger');
    const modal = $('logoPreviewModal');
    const closeBtn = $('logoPreviewClose');

    if (trigger && modal && closeBtn) {
        const openModal = () => {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        trigger.addEventListener('click', openModal);
        closeBtn.addEventListener('click', e => { e.stopPropagation(); closeModal(); });
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    }
});


    const escapeBannerHtml = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const bannerTrack = $('banner-track'), bannerDots = $('banner-dots');

    const loadDashboardBanners = async () => {
        if (!bannerTrack) return;
        bannerTrack.innerHTML = '<div class="banner-loading">Memuat banner...</div>';
        try {
            const res = await fetch(`${BANNER_API_URL}?t=${Date.now()}`, { cache: 'no-store' });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'Gagal');
            dashboardBanners = (json.data || []).filter(b => b.aktif === true && b.imageUrl).sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0));
            renderDashboardBanners();
        } catch (e) {
            console.error('BANNER ERROR:', e);
            bannerTrack.innerHTML = '<div class="banner-loading">Banner belum dapat dimuat.</div>';
            if (bannerDots) bannerDots.innerHTML = '';
        }
    };

    const renderDashboardBanners = () => {
        if (!bannerTrack) return;
        if (!dashboardBanners.length) {
            bannerTrack.innerHTML = '<div class="banner-loading">Belum ada informasi terbaru.</div>';
            if (bannerDots) bannerDots.innerHTML = '';
            return;
        }
        bannerCurrentIndex = 0;
        bannerTrack.innerHTML = dashboardBanners.map((b, i) => {
            const img = escapeBannerHtml(b.imageUrl);
            const title = escapeBannerHtml(b.judul);
            const link = b.link && b.link !== '#' ? escapeBannerHtml(b.link) : null;
            return link 
                ? `<a href="${link}" class="dashboard-banner-slide"><img src="${img}" alt="${title}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" onerror="this.style.display='none'"></a>`
                : `<div class="dashboard-banner-slide"><img src="${img}" alt="${title}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" onerror="this.style.display='none'"></div>`;
        }).join('');

        if (bannerDots) {
            bannerDots.innerHTML = dashboardBanners.map((_, i) => `<button type="button" class="banner-dot ${i === 0 ? 'active' : ''}" data-banner-index="${i}" aria-label="Banner ${i + 1}"></button>`).join('');
            bannerDots.querySelectorAll('.banner-dot').forEach(dot => {
                dot.addEventListener('click', () => showDashboardBanner(Number(dot.dataset.bannerIndex)));
            });
        }
        showDashboardBanner(0);
        startBannerAutoPlay();
    };

    const showDashboardBanner = idx => {
        if (!dashboardBanners.length) return;
        bannerCurrentIndex = idx;
        bannerTrack.querySelectorAll('.dashboard-banner-slide').forEach((s, i) => { s.style.display = i === idx ? 'block' : 'none'; });
        if (bannerDots) {
            bannerDots.querySelectorAll('.banner-dot').forEach((d, i) => { d.classList.toggle('active', i === idx); });
        }
    };

    const startBannerAutoPlay = () => {
        clearInterval(bannerAutoPlay);
        if (dashboardBanners.length <= 1) return;
        bannerAutoPlay = setInterval(() => {
            let next = bannerCurrentIndex + 1;
            if (next >= dashboardBanners.length) next = 0;
            showDashboardBanner(next);
        }, 5000);
    };

    window.loadBanners = loadDashboardBanners;
    window.refreshBanner = loadDashboardBanners;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDashboardBanners);
    } else {
        loadDashboardBanners();
    }
})();
