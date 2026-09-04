/* =========================================================
   MC-SAGARANTEN - SEMUA BANNER
========================================================= */

'use strict';

const BANNER_API_URL = 'http://localhost:3000/api/banners';
const CACHE_KEY = 'mc_sagaranten_banners_cache';
const CACHE_TIME_KEY = 'mc_sagaranten_banners_time';
const CACHE_TTL = 5 * 60 * 1000;

let allBanners = [];
let previewIndex = null;

const bannerGrid = document.getElementById('bannerGrid');
const bannerLoading = document.getElementById('bannerLoading');
const bannerEmpty = document.getElementById('bannerEmpty');
const bannerError = document.getElementById('bannerError');
const bannerCount = document.getElementById('bannerCount');
const previewModal = document.getElementById('bannerPreviewModal');
const previewImage = document.getElementById('previewImage');
const previewTitle = document.getElementById('previewTitle');
const previewDownload = document.getElementById('previewDownload');
const previewShare = document.getElementById('previewShare');
const previewClose = document.getElementById('previewClose');
const btnRetry = document.getElementById('btnRetry');
const btnBack = document.getElementById('btnBack');

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) { alert(message); return; }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function normalizeBanner(banner) {
    return {
        id: banner.id || '',
        judul: banner.judul || 'Informasi Terbaru',
        link: banner.link || '#',
        urutan: Number(banner.urutan || 0),
        aktif: banner.aktif === true,
        imageUrl: banner.imageUrl || banner.gambar || ''
    };
}

async function fetchBanners() {
    const response = await fetch(`${BANNER_API_URL}?t=${Date.now()}`, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal mengambil data banner.');

    return (result.data || []).map(normalizeBanner).filter(b => b.aktif === true && b.imageUrl).sort((a, b) => a.urutan - b.urutan);
}

async function loadAllBanners() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
    const isCacheValid = cachedData && (Date.now() - cachedTime) < CACHE_TTL;

    if (isCacheValid) {
        try {
            allBanners = JSON.parse(cachedData);
            bannerLoading.style.display = 'none';
            bannerError.style.display = 'none';
            updateBannerCount();

            if (!allBanners.length) {
                bannerEmpty.style.display = 'flex';
                bannerGrid.innerHTML = '';
            } else {
                bannerEmpty.style.display = 'none';
                renderAllBanners();
            }
            backgroundFetchBanners();
            return;
        } catch (error) {
            console.warn('Cache banner tidak valid.');
        }
    }

    bannerLoading.style.display = 'flex';
    bannerError.style.display = 'none';
    bannerEmpty.style.display = 'none';

    try {
        allBanners = await fetchBanners();
        localStorage.setItem(CACHE_KEY, JSON.stringify(allBanners));
        localStorage.setItem(CACHE_TIME_KEY, Date.now());

        bannerLoading.style.display = 'none';
        updateBannerCount();

        if (!allBanners.length) {
            bannerEmpty.style.display = 'flex';
            bannerGrid.innerHTML = '';
            return;
        }

        bannerEmpty.style.display = 'none';
        renderAllBanners();
    } catch (error) {
        console.error('LOAD ALL BANNER ERROR:', error);
        if (cachedData) {
            try {
                allBanners = JSON.parse(cachedData);
                bannerLoading.style.display = 'none';
                bannerError.style.display = 'none';
                updateBannerCount();
                renderAllBanners();
                showToast('Menampilkan data banner tersimpan.');
                return;
            } catch (cacheError) {
                console.error('CACHE ERROR:', cacheError);
            }
        }
        bannerLoading.style.display = 'none';
        bannerError.style.display = 'flex';
    }
}

async function backgroundFetchBanners() {
    try {
        const freshData = await fetchBanners();
        const oldData = JSON.stringify(allBanners);
        const newData = JSON.stringify(freshData);

        localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
        localStorage.setItem(CACHE_TIME_KEY, Date.now());

        if (oldData !== newData) {
            allBanners = freshData;
            updateBannerCount();
            if (!allBanners.length) {
                bannerEmpty.style.display = 'flex';
                bannerGrid.innerHTML = '';
            } else {
                bannerEmpty.style.display = 'none';
                renderAllBanners();
            }
        }
    } catch (error) {
        console.warn('BACKGROUND BANNER UPDATE:', error);
    }
}

function renderAllBanners() {
    if (!bannerGrid) return;

    bannerGrid.innerHTML = allBanners.map((banner, index) => {
        const image = escapeHtml(banner.imageUrl);
        const title = escapeHtml(banner.judul);
        const loadingAttr = index < 4 ? 'eager' : 'lazy';
        const fetchPriority = index < 4 ? 'high' : 'auto';

        return `
            <article class="banner-card">
                <div class="banner-image-wrapper">
                    <img src="${image}" alt="${title}" loading="${loadingAttr}" fetchpriority="${fetchPriority}" decoding="async" data-index="${index}" class="banner-preview-trigger">
                    <div class="banner-number">#${index + 1}</div>
                </div>
                <div class="banner-card-body">
                    <div class="banner-card-title">${title}</div>
                    <div class="banner-card-desc">MC-SAGARANTEN</div>
                    <div class="banner-actions">
                        <button type="button" class="banner-action banner-download" data-index="${index}">📥 Download</button>
                        <button type="button" class="banner-action banner-share" data-index="${index}">📤 Share</button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    pasangEventBanner();
}

function pasangEventBanner() {
    if (bannerGrid.dataset.listenerAttached === 'true') return;
    bannerGrid.dataset.listenerAttached = 'true';

    bannerGrid.addEventListener('click', event => {
        const downloadBtn = event.target.closest('.banner-download');
        const shareBtn = event.target.closest('.banner-share');
        const previewImg = event.target.closest('.banner-preview-trigger');

        if (downloadBtn) {
            downloadBanner(Number(downloadBtn.dataset.index));
            return;
        }
        if (shareBtn) {
            shareBanner(Number(shareBtn.dataset.index));
            return;
        }
        if (previewImg) {
            bukaPreview(Number(previewImg.dataset.index));
        }
    });
}

function updateBannerCount() {
    bannerCount.textContent = `${allBanners.length} Banner`;
}

async function downloadBanner(index) {
    const banner = allBanners[index];
    if (!banner || !banner.imageUrl) {
        showToast('Gambar banner tidak tersedia.');
        return;
    }

    showToast('Menyiapkan download...');

    try {
        const response = await fetch(banner.imageUrl);
        if (!response.ok) throw new Error('Gagal mengambil gambar.');

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const extension = getExtension(banner.imageUrl);
        const filename = slugify(banner.judul || 'banner-mc-sagaranten') + '.' + extension;

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        showToast('Banner berhasil didownload.');
    } catch (error) {
        console.error('DOWNLOAD BANNER ERROR:', error);
        window.open(banner.imageUrl, '_blank');
        showToast('Banner dibuka. Tekan lama gambar untuk menyimpan.');
    }
}

async function shareBanner(index) {
    const banner = allBanners[index];
    if (!banner) return;

    const title = banner.judul || 'Informasi MC-SAGARANTEN';
    const imageUrl = banner.imageUrl;

    if (navigator.share) {
        try {
            await navigator.share({ title, text: title + '\n\nMC-SAGARANTEN', url: imageUrl });
            showToast('Banner berhasil dibagikan.');
            return;
        } catch (error) {
            if (error.name === 'AbortError') return;
        }
    }

    try {
        await navigator.clipboard.writeText(imageUrl);
        showToast('Link banner berhasil disalin.');
    } catch (error) {
        window.prompt('Salin link banner:', imageUrl);
    }
}

function bukaPreview(index) {
    const banner = allBanners[index];
    if (!banner) return;

    previewIndex = index;
    previewImage.src = banner.imageUrl;
    previewImage.alt = banner.judul || 'Banner MC-SAGARANTEN';
    previewTitle.textContent = banner.judul || 'Informasi MC-SAGARANTEN';

    previewModal.classList.add('show');
    previewModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function tutupPreview() {
    previewModal.classList.remove('show');
    previewModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    previewImage.src = '';
    previewIndex = null;
}

if (previewClose) previewClose.addEventListener('click', tutupPreview);
if (previewModal) previewModal.addEventListener('click', e => { if (e.target === previewModal) tutupPreview(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') tutupPreview(); });

if (previewDownload) previewDownload.addEventListener('click', () => { if (previewIndex !== null) downloadBanner(previewIndex); });
if (previewShare) previewShare.addEventListener('click', () => { if (previewIndex !== null) shareBanner(previewIndex); });

function getExtension(url) {
    try {
        const cleanUrl = url.split('?')[0];
        const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
        if (match) {
            const ext = match[1].toLowerCase();
            if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext;
        }
    } catch (error) {}
    return 'jpg';
}

function slugify(text) {
    return String(text || 'banner').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
}

if (btnRetry) {
    btnRetry.addEventListener('click', () => {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
        loadAllBanners();
    });
}

if (btnBack) {
    btnBack.addEventListener('click', () => {
        if (document.referrer && document.referrer.includes(location.hostname)) {
            history.back();
        } else {
            window.location.href = 'dashboard.html';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllBanners);
} else {
    loadAllBanners();
}
