/* =========================================================
   MC-SAGARANTEN - PROGRAM OUTLET
========================================================= */

'use strict';

const PROGRAM_OUTLET_API_URL = 'https://mc-sagaranten-backend.vercel.app/api/program-outlet';
const PROGRAM_CACHE_KEY = 'mc_sagaranten_programs_cache';
const PROGRAM_CACHE_TIME_KEY = 'mc_sagaranten_programs_time';
const PROGRAM_CACHE_TTL = 5 * 60 * 1000;

let programs = [];
let viewerIndex = 0;

const gallery = document.getElementById('program-gallery');
const refreshButton = document.getElementById('refresh-button');
const viewer = document.getElementById('image-viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerTitle = document.getElementById('viewer-title');
const viewerCounter = document.getElementById('viewer-counter');
const viewerStage = document.getElementById('viewer-stage');

function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function normalizePrograms(data) {
    return (data || []).filter(item => item.aktif === true).sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0)).map(item => ({
        ...item,
        gambar: item.imageUrl || item.gambar || ''
    }));
}

async function loadPrograms() {
    const cachedData = localStorage.getItem(PROGRAM_CACHE_KEY);
    const cachedTime = Number(localStorage.getItem(PROGRAM_CACHE_TIME_KEY) || 0);
    const isCacheValid = (Date.now() - cachedTime) < PROGRAM_CACHE_TTL;

    if (isCacheValid && cachedData) {
        try {
            programs = JSON.parse(cachedData);
            if (programs.length > 0) {
                renderPrograms();
                backgroundFetchPrograms();
                return;
            }
        } catch (error) {
            console.warn('Cache Program Outlet rusak:', error);
        }
    }

    try {
        refreshButton.classList.add('loading');
        const response = await fetch(PROGRAM_OUTLET_API_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Gagal mengambil data');

        programs = normalizePrograms(result.data);
        localStorage.setItem(PROGRAM_CACHE_KEY, JSON.stringify(programs));
        localStorage.setItem(PROGRAM_CACHE_TIME_KEY, Date.now());
        renderPrograms();
    } catch (error) {
        console.error('Gagal load Program Outlet:', error);
        if (cachedData) {
            try {
                programs = JSON.parse(cachedData);
                renderPrograms();
                return;
            } catch (e) {}
        }
        gallery.innerHTML = `
            <div class="program-empty">
                <div class="empty-icon">⚠️</div>
                <div class="empty-title">Gagal memuat program</div>
                <div class="empty-desc">Periksa koneksi internet kemudian coba refresh.</div>
            </div>
        `;
    } finally {
        refreshButton.classList.remove('loading');
    }
}

async function backgroundFetchPrograms() {
    try {
        const response = await fetch(PROGRAM_OUTLET_API_URL + '?t=' + Date.now());
        if (!response.ok) return;

        const result = await response.json();
        if (!result.success) return;

        const freshData = normalizePrograms(result.data);
        localStorage.setItem(PROGRAM_CACHE_KEY, JSON.stringify(freshData));
        localStorage.setItem(PROGRAM_CACHE_TIME_KEY, Date.now());
    } catch (error) {
        console.warn('Background fetch Program Outlet gagal:', error);
    }
}

function renderPrograms() {
    if (!programs.length) {
        gallery.innerHTML = `
            <div class="program-empty">
                <div class="empty-icon">🏪</div>
                <div class="empty-title">Belum ada program</div>
                <div class="empty-desc">Informasi program outlet akan muncul di sini.</div>
            </div>
        `;
        return;
    }

    gallery.innerHTML = programs.map((program, index) => {
        const image = escapeHtml(program.gambar);
        const title = escapeHtml(program.judul);
        const desc = escapeHtml(program.deskripsi);
        const link = escapeHtml(program.link);
        const loadingAttr = index < 4 ? 'eager' : 'lazy';
        const fetchPriority = index < 4 ? 'high' : 'auto';

        return `
            <article class="program-card" data-index="${index}">
                <div class="program-image-wrap">
                    <img class="program-image" src="${image}" alt="${title}" loading="${loadingAttr}" fetchpriority="${fetchPriority}" decoding="async">
                    <span class="program-badge">AKTIF</span>
                    <div class="program-image-overlay">
                        <div class="program-card-title">${title}</div>
                    </div>
                </div>
                <div class="program-card-body">
                    <div class="program-card-desc">${desc}</div>
                    ${link ? `<span class="program-card-link">Lihat detail →</span>` : ''}
                </div>
            </article>
        `;
    }).join('');

    pasangEventGaleri();
    setTimeout(adjustCardDescriptions, 50);
}

function pasangEventGaleri() {
    if (gallery.dataset.listenerAttached === 'true') return;
    gallery.dataset.listenerAttached = 'true';

    gallery.addEventListener('click', event => {
        const card = event.target.closest('.program-card');
        if (!card) return;
        openViewer(Number(card.dataset.index));
    });
}

function adjustCardDescriptions() {
    const cards = Array.from(gallery.querySelectorAll('.program-card'));
    if (!cards.length) return;

    cards.forEach(card => {
        const desc = card.querySelector('.program-card-desc');
        if (desc) desc.classList.remove('expand');
    });

    const rows = [];
    cards.forEach(card => {
        const top = Math.round(card.getBoundingClientRect().top);
        let row = rows.find(item => Math.abs(item.top - top) <= 5);
        if (!row) {
            row = { top, cards: [] };
            rows.push(row);
        }
        row.cards.push(card);
    });

    rows.forEach(row => {
        if (row.cards.length <= 1) return;
        const maxHeight = Math.max(...row.cards.map(card => card.getBoundingClientRect().height));

        row.cards.forEach(card => {
            const cardHeight = card.getBoundingClientRect().height;
            const desc = card.querySelector('.program-card-desc');
            if (!desc) return;
            if (cardHeight < maxHeight - 5) desc.classList.add('expand');
        });
    });
}

window.addEventListener('resize', () => { setTimeout(adjustCardDescriptions, 100); });

function openViewer(index) {
    if (!programs.length) return;
    viewerIndex = index;
    updateViewer();
    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateViewer() {
    const program = programs[viewerIndex];
    if (!program) return;

    viewerImage.src = program.gambar || '';
    viewerImage.alt = program.judul || '';
    viewerTitle.textContent = program.judul || 'Program Outlet';
    viewerCounter.textContent = `${viewerIndex + 1} / ${programs.length}`;
    document.getElementById('viewer-open').style.display = program.link ? 'block' : 'none';
}

function closeViewer() {
    viewer.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('viewer-close').addEventListener('click', closeViewer);

function nextViewer() {
    if (!programs.length) return;
    viewerIndex = (viewerIndex + 1) % programs.length;
    updateViewer();
}

function previousViewer() {
    if (!programs.length) return;
    viewerIndex = (viewerIndex - 1 + programs.length) % programs.length;
    updateViewer();
}

document.getElementById('viewer-next').addEventListener('click', nextViewer);
document.getElementById('viewer-prev').addEventListener('click', previousViewer);

document.addEventListener('keydown', event => {
    if (!viewer.classList.contains('active')) return;
    if (event.key === 'Escape') closeViewer();
    if (event.key === 'ArrowRight') nextViewer();
    if (event.key === 'ArrowLeft') previousViewer();
});

let touchStartX = 0;
let touchEndX = 0;

viewerStage.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

viewerStage.addEventListener('touchend', event => {
    touchEndX = event.changedTouches[0].screenX;
    const difference = touchEndX - touchStartX;
    if (Math.abs(difference) < 50) return;
    if (difference < 0) nextViewer();
    else previousViewer();
}, { passive: true });

document.getElementById('viewer-share').addEventListener('click', async () => {
    const program = programs[viewerIndex];
    if (!program) return;

    const title = program.judul || 'Program Outlet MC-SAGARANTEN';
    const description = program.deskripsi || 'Program Outlet MC-SAGARANTEN';
    const link = program.link || window.location.href;
    const shareButton = document.getElementById('viewer-share');
    const originalText = shareButton.innerHTML;

    shareButton.disabled = true;
    shareButton.innerHTML = '⏳ Menyiapkan...';

    try {
        const imageResponse = await fetch(program.gambar);
        if (!imageResponse.ok) throw new Error('Gambar Cloudinary tidak dapat diambil');

        const blob = await imageResponse.blob();
        const extension = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const file = new File([blob], `program-outlet.${extension}`, { type: blob.type || 'image/jpeg' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title, text: description + '\n\n' + link, files: [file] });
            return;
        }

        if (navigator.share) {
            await navigator.share({ title, text: description, url: link });
            return;
        }

        await navigator.clipboard.writeText(link);
        alert('Link program berhasil disalin.');
    } catch (error) {
        console.error('Share error:', error);
        if (error.name === 'AbortError') return;
        alert('Gagal membagikan program.\n\n' + error.message);
    } finally {
        shareButton.disabled = false;
        shareButton.innerHTML = originalText;
    }
});

document.getElementById('viewer-open').addEventListener('click', () => {
    const program = programs[viewerIndex];
    if (program && program.link) {
        window.open(program.link, '_blank');
    }
});

refreshButton.addEventListener('click', () => {
    localStorage.removeItem(PROGRAM_CACHE_KEY);
    localStorage.removeItem(PROGRAM_CACHE_TIME_KEY);
    loadPrograms();
});

loadPrograms();
