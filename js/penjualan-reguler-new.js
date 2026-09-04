/* =========================================================
   MC-SAGARANTEN - PENJUALAN FISIK
   Data Source : GitHub Pages JSON
   ========================================================= */

(() => {
    'use strict';

    const DATA_JSON_URL =
        'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/penjualan-reguler-new.json';

    /* =====================================================
       UTILITIES
    ===================================================== */

    const $ = id => document.getElementById(id);

    const escapeHTML = value =>
        String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const normalizeHeader = value =>
        String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[_-]+/g, ' ')
            .trim();

    const normalizeProductName = value =>
        String(value ?? '')
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();

    function parseNumber(value) {
        if (value == null || value === '') return 0;
        if (typeof value === 'number')
            return Number.isFinite(value) ? value : 0;

        let text = String(value)
            .trim()
            .replace(/^"|"$/g, '');

        if (!text || text === '-') return 0;

        if (text.includes('.') && text.includes(',')) {
            text = text.replace(/\./g, '').replace(',', '.');
        } else if (text.includes(',')) {
            text = text.replace(',', '.');
        } else if (text.includes('.')) {
            const parts = text.split('.');
            if (
                parts.length > 1 &&
                parts.slice(1).every(part => part.length === 3)
            ) {
                text = text.replace(/\./g, '');
            }
        }

        const number = Number(text);
        return Number.isFinite(number) ? number : 0;
    }

    const formatNumber = value => {
        const number = parseNumber(value);
        return number === 0
            ? '<span class="zero-val">-</span>'
            : number.toLocaleString('id-ID');
    };

    const formatRupiah = value => {
        const number = parseNumber(value);
        return number === 0
            ? '<span class="zero-val">-</span>'
            : `Rp ${number.toLocaleString('id-ID')}`;
    };

    /* =====================================================
       DATA NORMALIZATION
    ===================================================== */

    function normalizeData(raw) {
        if (!raw) return [];

        if (!Array.isArray(raw) && typeof raw === 'object') {
            raw =
                Array.isArray(raw.data) ? raw.data :
                Array.isArray(raw.rows) ? raw.rows :
                Array.isArray(raw.values) ? raw.values :
                [raw];
        }

        if (!Array.isArray(raw) || !raw.length) return [];

        if (
            typeof raw[0] === 'object' &&
            !Array.isArray(raw[0])
        ) {
            return raw;
        }

        if (Array.isArray(raw[0])) {
            const headers = raw[0];

            return raw.slice(1).map(row =>
                Object.fromEntries(
                    headers.map((header, index) => [
                        String(header ?? '').trim(),
                        row[index]
                    ])
                )
            );
        }

        return [];
    }

    function getObjectValue(row, candidates) {
        if (!row) return '';

        const keys = Object.keys(row);

        for (const candidate of candidates) {
            const target = normalizeHeader(candidate);

            const exactKey = keys.find(
                key => normalizeHeader(key) === target
            );

            if (exactKey !== undefined) {
                return row[exactKey];
            }
        }

        for (const candidate of candidates) {
            const target = normalizeHeader(candidate);

            const partialKey = keys.find(
                key => normalizeHeader(key).includes(target)
            );

            if (partialKey !== undefined) {
                return row[partialKey];
            }
        }

        return '';
    }

    /* =====================================================
       FIELD ACCESSORS
    ===================================================== */

    const getProduk = row =>
        String(
            getObjectValue(row, [
                'Nama Barang',
                'Produk',
                'Barang',
                'Item',
                'SP'
            ]) || ''
        ).trim();

    const getAdigunaDaily = row =>
        parseNumber(
            getObjectValue(row, ['Adiguna', 'Andi'])
        );

    const getParhanDaily = row =>
        parseNumber(getObjectValue(row, ['Parhan']));

    const getEndenDaily = row =>
        parseNumber(getObjectValue(row, ['Enden']));

    const getPebrianDaily = row =>
        parseNumber(getObjectValue(row, ['Pebrian']));

    function getHarga(row) {
        const harga = parseNumber(
            getObjectValue(row, ['Harga'])
        );

        return harga > 0
            ? harga
            : parseNumber(getObjectValue(row, ['Harga_1']));
    }

    const getSheetTotalPCS = row =>
        parseNumber(getObjectValue(row, ['Total PCS']));

    const getAmount = row =>
        parseNumber(getObjectValue(row, ['Amount']));

    const getSheetTotalRp = row =>
        parseNumber(
            getObjectValue(row, [
                'Total Rp',
                'Total Rupiah',
                'Amount Rp'
            ])
        );

    /* =====================================================
       WEEKLY
    ===================================================== */

    function getWeeklyValue(row, user, week) {
        const candidates = [
            `${user} W${week}`,
            `${user} - W${week}`,
            `${user}-W${week}`,
            `W${week} ${user}`,
            `W${week}-${user}`
        ];

        return parseNumber(
            getObjectValue(row, candidates)
        );
    }

    function getWeeklyUserData(row, user) {
        const W1 = getWeeklyValue(row, user, 1);
        const W2 = getWeeklyValue(row, user, 2);
        const W3 = getWeeklyValue(row, user, 3);
        const W4 = getWeeklyValue(row, user, 4);

        return {
            W1,
            W2,
            W3,
            W4,
            total: W1 + W2 + W3 + W4
        };
    }

    function getWeeklyData(row) {
        const Adiguna = getWeeklyUserData(row, 'Adiguna');
        const Parhan = getWeeklyUserData(row, 'Parhan');
        const Enden = getWeeklyUserData(row, 'Enden');
        const Pebrian = getWeeklyUserData(row, 'Pebrian');

        const grand =
            Adiguna.total +
            Parhan.total +
            Enden.total +
            Pebrian.total;

        const harga = getHarga(row);
        const amountSheet = getAmount(row);

        return {
            Adiguna,
            Parhan,
            Enden,
            Pebrian,
            grand,
            amount: amountSheet > 0
                ? amountSheet
                : grand * harga
        };
    }

    /* =====================================================
       PRODUCT CATEGORY
    ===================================================== */

    const PRODUK_SP = new Set([
        'SP ZERO',
        'SP 3GB INJEK',
        'SP 3GB ORI',
        'SP 9GB',
        'SP 10GB'
    ]);

    const PRODUK_VCR = new Set([
        'VDK',
        'VOUCHER 3GB 14HR',
        'VOUCHER 2,5GB',
        'FREEDOM INTERNET 3 GB',
        'VOUCHER 3.5GB 5HR',
        'VOUCHER 5GB 5HR',
        'VOUCHER 7GB 7HR',
        'FI 6GB',
        'FI 1.5GB/1D',
        'FI 3GB/1D',
        'FI 3GB/3D',
        'FI 5GB/2D',
        'FI 5GB/3D'
    ]);

    function getProductCategory(product) {
        const name = normalizeProductName(product);

        if (PRODUK_SP.has(name)) return 'SP';
        if (PRODUK_VCR.has(name)) return 'VCR';

        return null;
    }

    /* =====================================================
       NORMALIZE SALES ROWS
    ===================================================== */

    function normalizeSalesRows(data) {
        return data
            .map(row => {
                const produk = getProduk(row);
                const upper = normalizeProductName(produk);

                return {
                    raw: row,
                    produk,
                    isSection:
                        upper === 'SP' ||
                        upper === 'VOUCHER',
                    isTotalSP:
                        upper === 'TOTAL SP',
                    isTotalVoucher:
                        upper === 'TOTAL VOUCHER',

                    adiguna: getAdigunaDaily(row),
                    parhan: getParhanDaily(row),
                    enden: getEndenDaily(row),
                    pebrian: getPebrianDaily(row),

                    harga: getHarga(row),
                    totalPCS: getSheetTotalPCS(row),
                    totalRp: getSheetTotalRp(row),
                    amount: getAmount(row)
                };
            })
            .filter(row => row.produk);
    }

    /* =====================================================
       DSE SUMMARY
    ===================================================== */

    function renderDSESummary(user, data) {
        const sp = $(`summary${user}SP`);
        const vcr = $(`summary${user}VCR`);
        const rp = $(`summary${user}Rp`);

        if (sp)
            sp.textContent =
                `${data.sp.toLocaleString('id-ID')} PCS`;

        if (vcr)
            vcr.textContent =
                `${data.vcr.toLocaleString('id-ID')} PCS`;

        if (rp)
            rp.textContent =
                data.rp.toLocaleString('id-ID');
    }

    function updateSummary(rows) {
        let totalPCS = 0;
        let totalRp = 0;
        let productCount = 0;

        const dse = {
            Adiguna: { sp: 0, vcr: 0, rp: 0 },
            Parhan: { sp: 0, vcr: 0, rp: 0 },
            Enden: { sp: 0, vcr: 0, rp: 0 },
            Pebrian: { sp: 0, vcr: 0, rp: 0 }
        };

        rows.forEach(row => {
            if (
                row.isSection ||
                row.isTotalSP ||
                row.isTotalVoucher
            ) return;

            const category =
                getProductCategory(row.produk);

            if (!category) return;

            productCount++;

            const users = [
                ['Adiguna', row.adiguna],
                ['Parhan', row.parhan],
                ['Enden', row.enden],
                ['Pebrian', row.pebrian]
            ];

            users.forEach(([user, pcs]) => {
                dse[user][category.toLowerCase()] += pcs;
                dse[user].rp += pcs * row.harga;
            });

            const pcs =
                row.adiguna +
                row.parhan +
                row.enden +
                row.pebrian;

            totalPCS += pcs;
            totalRp += pcs * row.harga;
        });

        if ($('heroTotalPCS'))
            $('heroTotalPCS').textContent =
                totalPCS.toLocaleString('id-ID');

        if ($('heroTotalRp'))
            $('heroTotalRp').textContent =
                `Rp ${totalRp.toLocaleString('id-ID')}`;

        if ($('heroProductCount'))
            $('heroProductCount').textContent =
                productCount.toLocaleString('id-ID');

        Object.entries(dse).forEach(
            ([user, data]) =>
                renderDSESummary(user, data)
        );
    }

    /* =====================================================
       TOTAL TABLE
    ===================================================== */

    function getTotalRowData(row) {
        const weekly = getWeeklyData(row.raw);

        const adiguna = weekly.Adiguna.total;
        const parhan = weekly.Parhan.total;
        const enden = weekly.Enden.total;
        const pebrian = weekly.Pebrian.total;

        const totalPCS =
            adiguna +
            parhan +
            enden +
            pebrian;

        const totalRp =
            row.totalRp > 0
                ? row.totalRp
                : totalPCS * row.harga;

        return {
            adiguna,
            parhan,
            enden,
            pebrian,
            totalPCS,
            harga: row.harga,
            totalRp
        };
    }

    /* =====================================================
       RENDER TABLES
    ===================================================== */

    function processAndRender(data) {
        const rows = normalizeSalesRows(data);

        if (!rows.length) {
            $('bodyDaily').innerHTML =
                '<tr><td colspan="8" class="loading-text">Data penjualan tidak tersedia</td></tr>';
            return;
        }

        updateSummary(rows);

        $('headDaily').innerHTML = `
            <tr>
                <th>Produk</th>
                <th>Adiguna</th>
                <th>Parhan</th>
                <th>Enden</th>
                <th>Pebrian</th>
                <th>Total PCS</th>
                <th>Harga</th>
                <th>Total Rp</th>
            </tr>
        `;

        let dailyHTML = '';
        let totalHTML = '';
        let weeklyHTML = '';

        let runningPCS = 0;
        let runningRp = 0;
        let keptWeeklyTotalRow = false;

        rows.forEach(row => {

            if (row.isSection) {
                runningPCS = 0;
                runningRp = 0;

                dailyHTML += `
                    <tr class="section-row">
                        <td colspan="8">
                            ${escapeHTML(row.produk)}
                        </td>
                    </tr>
                `;

                totalHTML += `
                    <tr class="section-row">
                        <td colspan="8">
                            ${escapeHTML(row.produk)}
                        </td>
                    </tr>
                `;

                weeklyHTML += `
                    <tr class="section-row">
                        <td colspan="24">
                            ${escapeHTML(row.produk)}
                        </td>
                    </tr>
                `;

                return;
            }

            if (row.isTotalVoucher) {
                if (keptWeeklyTotalRow) return;
                keptWeeklyTotalRow = true;
            }

            const linePCS =
                row.adiguna +
                row.parhan +
                row.enden +
                row.pebrian;

            const lineRp =
                linePCS * row.harga;

            const isTotal =
                row.isTotalSP ||
                row.isTotalVoucher;

            if (!isTotal) {
                runningPCS += linePCS;
                runningRp += lineRp;
            }

            const dailyPCS =
                isTotal
                    ? row.totalPCS || runningPCS
                    : linePCS;

            const dailyRp =
                isTotal
                    ? row.totalRp || runningRp
                    : lineRp;

            const rowClass =
                isTotal ? 'total-row' : '';

            /* DAILY */

            dailyHTML += `
                <tr class="${rowClass}">
                    <td>${escapeHTML(row.produk)}</td>
                    <td>${formatNumber(row.adiguna)}</td>
                    <td>${formatNumber(row.parhan)}</td>
                    <td>${formatNumber(row.enden)}</td>
                    <td>${formatNumber(row.pebrian)}</td>
                    <td>${formatNumber(dailyPCS)}</td>
                    <td>${isTotal ? '-' : formatNumber(row.harga)}</td>
                    <td>${formatRupiah(dailyRp)}</td>
                </tr>
            `;

            /* TOTAL */

            const total = getTotalRowData(row);

            totalHTML += `
                <tr class="${rowClass}">
                    <td>${escapeHTML(row.produk)}</td>
                    <td>${formatNumber(total.adiguna)}</td>
                    <td>${formatNumber(total.parhan)}</td>
                    <td>${formatNumber(total.enden)}</td>
                    <td>${formatNumber(total.pebrian)}</td>
                    <td>${formatNumber(total.totalPCS)}</td>
                    <td>${formatNumber(total.harga)}</td>
                    <td>${formatRupiah(total.totalRp)}</td>
                </tr>
            `;

            /* WEEKLY */

            const weekly = getWeeklyData(row.raw);

            const users = [
                'Adiguna',
                'Parhan',
                'Enden',
                'Pebrian'
            ];

            let userWeeklyHTML = '';

            users.forEach(user => {
                const data = weekly[user];

                userWeeklyHTML += `
                    <td class="weekly-num">${formatNumber(data.W1)}</td>
                    <td class="weekly-num">${formatNumber(data.W2)}</td>
                    <td class="weekly-num">${formatNumber(data.W3)}</td>
                    <td class="weekly-num">${formatNumber(data.W4)}</td>
                    <td class="weekly-total-cell weekly-num">
                        ${formatNumber(data.total)}
                    </td>
                `;
            });

            weeklyHTML += `
                <tr class="${rowClass}">
                    <td>${escapeHTML(row.produk)}</td>
                    ${userWeeklyHTML}
                    <td class="weekly-grand-total weekly-num">
                        ${formatNumber(weekly.grand)}
                    </td>
                    <td>${formatNumber(row.harga)}</td>
                    <td>${formatRupiah(weekly.amount)}</td>
                </tr>
            `;

            if (isTotal) {
                const emptyRow = `
                    <tr class="empty-row">
                        <td colspan="8"></td>
                    </tr>
                `;

                dailyHTML += emptyRow;
                totalHTML += emptyRow;

                weeklyHTML += `
                    <tr class="empty-row">
                        <td colspan="24"></td>
                    </tr>
                `;
            }
        });

        $('bodyDaily').innerHTML = dailyHTML;
        $('bodyTotal').innerHTML = totalHTML;
        $('bodyWeekly').innerHTML = weeklyHTML;
    }

    /* =====================================================
       FETCH JSON
    ===================================================== */

    async function fetchMasterData() {
        const updateTime = $('updateTime');
        const heroStatus = $('heroStatus');

        try {
            if (updateTime)
                updateTime.textContent =
                    'Update Data: Memuat...';

            if (heroStatus)
                heroStatus.textContent = 'SYNC';

            const response = await fetch(
                `${DATA_JSON_URL}?t=${Date.now()}`,
                {
                    method: 'GET',
                    cache: 'no-store',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            if (!response.ok)
                throw new Error(
                    `JSON GitHub gagal. HTTP ${response.status}`
                );

            const result = await response.json();

            if (!result || result.success !== true)
                throw new Error(
                    result?.message ||
                    'JSON mengembalikan response gagal'
                );

            if (!Array.isArray(result.data))
                throw new Error(
                    'Format JSON tidak valid: data bukan array'
                );

            if (!result.data.length)
                throw new Error(
                    'Data penjualan kosong'
                );

            const objectData =
                normalizeData(result.data);

            if (!objectData.length)
                throw new Error(
                    'Data penjualan tidak dapat dinormalisasi'
                );

            processAndRender(objectData);

            let updateDate = null;

            for (const value of [
                result.updated_at,
                result.updatedAt
            ]) {
                if (!value) continue;

                const date = new Date(value);

                if (!Number.isNaN(date.getTime())) {
                    updateDate = date;
                    break;
                }
            }

            updateDate ||= new Date();

            if (updateTime) {
                updateTime.textContent =
                    'Update Data: ' +
                    updateDate.toLocaleString(
                        'id-ID',
                        {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        }
                    );
            }

            if (heroStatus)
                heroStatus.textContent = 'LIVE';

        } catch (error) {

            console.error(
                'Gagal mengambil data penjualan:',
                error
            );

            if (heroStatus)
                heroStatus.textContent = 'ERROR';

            $('bodyDaily').innerHTML = `
                <tr>
                    <td colspan="8" class="loading-text">
                        ⚠️ Gagal memuat data:
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;

            $('bodyTotal').innerHTML = `
                <tr>
                    <td colspan="8" class="loading-text">
                        ⚠️ Gagal memuat data
                    </td>
                </tr>
            `;

            $('bodyWeekly').innerHTML = `
                <tr>
                    <td colspan="24" class="loading-text">
                        ⚠️ Gagal memuat data
                    </td>
                </tr>
            `;

            if (updateTime)
                updateTime.textContent =
                    'Update Data: Gagal memuat';
        }
    }

    /* =====================================================
       TAB
    ===================================================== */

    function showTab(type) {
        const wrappers = {
            daily: $('wrapperDaily'),
            weekly: $('wrapperWeekly'),
            total: $('wrapperTotal')
        };

        const buttons = {
            daily: $('btnDaily'),
            weekly: $('btnWeekly'),
            total: $('btnTotal')
        };

        Object.values(wrappers).forEach(
            element => {
                if (element)
                    element.style.display = 'none';
            }
        );

        Object.values(buttons).forEach(
            element => {
                if (element)
                    element.classList.remove('active');
            }
        );

        if (wrappers[type])
            wrappers[type].style.display = 'block';

        if (buttons[type])
            buttons[type].classList.add('active');
    }

    /* =====================================================
       DOWNLOAD TABLE AS IMAGE
    ===================================================== */

    async function downloadTableAsImage(
        tableId,
        fileName,
        title
    ) {
        const table = $(tableId);

        if (!table)
            throw new Error(
                `Tabel ${tableId} tidak ditemukan`
            );

        const clone = table.cloneNode(true);
        const container = document.createElement('div');

        const width = Math.max(
            table.scrollWidth,
            table.offsetWidth,
            1000
        );

        Object.assign(container.style, {
            position: 'absolute',
            left: '-999999px',
            top: '0',
            background: '#fff',
            padding: '30px',
            boxSizing: 'border-box',
            display: 'block',
            overflow: 'visible',
            height: 'auto',
            width: `${width}px`
        });

        const titleElement =
            document.createElement('div');

        Object.assign(titleElement.style, {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '26px',
            fontWeight: '700',
            color: '#0f172a',
            margin: '0',
            padding: '0 0 10px',
            whiteSpace: 'nowrap'
        });

        titleElement.textContent =
            `PENJUALAN FISIK — ${String(title).toUpperCase()}`;

        const subtitleElement =
            document.createElement('div');

        Object.assign(subtitleElement.style, {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '14px',
            color: '#64748b',
            margin: '0',
            padding: '0 0 22px',
            whiteSpace: 'nowrap'
        });

        subtitleElement.textContent =
            'Monitoring penjualan SP & Voucher DSE';

        Object.assign(clone.style, {
            display: 'table',
            visibility: 'visible',
            opacity: '1',
            height: 'auto',
            minHeight: '0',
            maxHeight: 'none',
            overflow: 'visible',
            width: `${width}px`
        });

        clone
            .querySelectorAll(
                'tbody, tr, td, th'
            )
            .forEach(element => {
                element.style.visibility = 'visible';
                element.style.opacity = '1';
                element.style.overflow = 'visible';
                element.style.maxHeight = 'none';

                if (element.tagName === 'TR')
                    element.style.display = 'table-row';

                if (element.tagName === 'TBODY')
                    element.style.display =
                        'table-row-group';
            });

        container.append(
            titleElement,
            subtitleElement,
            clone
        );

        document.body.appendChild(container);

        try {
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(resolve, 150);
                    });
                });
            });

            const rect =
                container.getBoundingClientRect();

            const canvasWidth = Math.ceil(
                Math.max(
                    container.scrollWidth,
                    rect.width
                )
            );

            const canvasHeight = Math.ceil(
                Math.max(
                    container.scrollHeight,
                    container.offsetHeight,
                    clone.offsetTop +
                    clone.offsetHeight +
                    150
                )
            );

            const canvas =
                await html2canvas(
                    container,
                    {
                        backgroundColor: '#fff',
                        scale: Math.min(
                            window.devicePixelRatio || 2,
                            2
                        ),
                        useCORS: true,
                        allowTaint: false,
                        logging: false,
                        width: canvasWidth,
                        height: canvasHeight,
                        windowWidth: canvasWidth,
                        windowHeight: canvasHeight,
                        scrollX: 0,
                        scrollY: 0
                    }
                );

            const link =
                document.createElement('a');

            link.download =
                `${fileName}.png`;

            link.href =
                canvas.toDataURL(
                    'image/png',
                    1
                );

            document.body.appendChild(link);
            link.click();
            link.remove();

        } finally {
            container.remove();
        }
    }

    /* =====================================================
       DOWNLOAD MODAL
    ===================================================== */

    function openDownloadModal() {
        const modal = $('downloadModal');

        if (modal)
            modal.style.display = 'flex';
    }

    function closeDownloadModal() {
        const modal = $('downloadModal');

        if (modal)
            modal.style.display = 'none';
    }

    async function executeDownload(type) {
        closeDownloadModal();

        const config = {
            daily: {
                table: 'tableDaily',
                file: 'penjualan-fisik-daily',
                title: 'Daily'
            },
            weekly: {
                table: 'tableWeekly',
                file: 'penjualan-fisik-weekly',
                title: 'Weekly'
            },
            total: {
                table: 'tableTotal',
                file: 'penjualan-fisik-total',
                title: 'Total'
            }
        }[type];

        if (!config) return;

        const button = $('btnDownload');

        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <span class="download-icon">⏳</span>
                <span>Membuat ${config.title}...</span>
            `;
        }

        try {
            await downloadTableAsImage(
                config.table,
                config.file,
                config.title
            );

            if (button) {
                button.innerHTML = `
                    <span class="download-icon">✓</span>
                    <span>Berhasil</span>
                `;
            }

        } catch (error) {

            console.error(
                'Gagal download:',
                error
            );

            if (button) {
                button.innerHTML = `
                    <span class="download-icon">⚠️</span>
                    <span>Gagal</span>
                `;
            }

            alert(
                'Gagal membuat gambar tabel.\n\n' +
                error.message
            );

        } finally {

            setTimeout(() => {
                if (!button) return;

                button.disabled = false;

                button.innerHTML = `
                    <span class="download-icon">↓</span>
                    <span>Download Gambar</span>
                `;
            }, 1200);
        }
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    document.addEventListener(
        'click',
        event => {
            const modal = $('downloadModal');

            if (
                modal &&
                event.target === modal
            ) {
                closeDownloadModal();
            }
        }
    );

    document.addEventListener(
        'keydown',
        event => {
            if (event.key === 'Escape')
                closeDownloadModal();
        }
    );

    document.addEventListener(
        'DOMContentLoaded',
        fetchMasterData
    );

    function goBack() {
        if (window.history.length > 1)
            window.history.back();
        else
            window.location.href =
                'dashboard.html';
    }

    /* =====================================================
       GLOBAL API
    ===================================================== */

    window.showTab = showTab;
    window.openDownloadModal = openDownloadModal;
    window.closeDownloadModal = closeDownloadModal;
    window.executeDownload = executeDownload;
    window.downloadTableAsImage =
        downloadTableAsImage;
    window.goBack = goBack;

})();