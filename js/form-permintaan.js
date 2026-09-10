/* =========================================================
   MC-SAGARANTEN — FORM PERMINTAAN BARANG
   + STOK DSE DARI GITHUB PAGES JSON
========================================================= */

const ADMIN_WHATSAPP = "6285759695969";
const STOCK_JSON_URL = "https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/stok-barang-dse.json";

const DSE_MAPPING = {
    SKBPLARA04: "Parhan",
    SKBPLARA08: "Adiguna",
    SKBPLARA11: "Enden",
    DSESGRN01: "Pebrian"
};

const STOCK_DSE_MAPPING = {
    SKBPLARA04: "FARHAN",
    SKBPLARA08: "ADIGUNA",
    SKBPLARA11: "ENDEN",
    DSESGRN01: "PEBRIAN"
};

let stockData = [];

const PRODUCT_CONFIG = {
    sp_zero: { label: "SP ZERO", category: "Starter Pack" },
    sp_3gb_injek: { label: "SP 3GB INJEK", category: "Starter Pack" },
    sp_3gb_ori: { label: "SP 3GB ORI", category: "Starter Pack" },
    sp_10gb: { label: "SP 10GB", category: "Starter Pack" },
    vdk: { label: "VDK", category: "Voucher" },
    v_3gb_14hr: { label: "3GB 14HR", category: "Voucher" },
    v_2_5gb_5hr: { label: "2,5GB 5HR", category: "Voucher" },
    v_3_5gb_5hr: { label: "3.5GB 5HR", category: "Voucher" },
    v_5gb_5hr: { label: "5GB 5HR", category: "Voucher" },
    v_7gb_7hr: { label: "7GB 7HR", category: "Voucher" },
    v_fi_6gb_3hr: { label: "Fi 6GB 3HR", category: "Voucher" },
    v_fi_1_5gb_1hr: { label: "Fi 1.5GB 1HR", category: "Voucher" },
    v_fi_5gb_2hr: { label: "Fi 5GB 2HR", category: "Voucher" },
    v_fi_5gb_3hr: { label: "Fi 5GB 3HR", category: "Voucher" },
    v_fi_7gb_28hr: { label: "Fi 7GB 28HR", category: "Voucher" }
};

const holdState = new WeakMap();

document.addEventListener("DOMContentLoaded", async () => {
    const tanggal = document.getElementById("tanggal");
    if (tanggal) {
        const now = new Date();
        tanggal.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
    }

    setupDSESelector();
    setupQuantityButtons();
    updateSummary();

    await loadStockData();
    updateStockDisplay();
});

async function loadStockData() {
    try {
        const response = await fetch(STOCK_JSON_URL + "?t=" + Date.now());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();
        stockData = Array.isArray(json.data) ? json.data : [];
        return true;
    } catch (error) {
        console.error("MC-SAGARANTEN — GAGAL MEMUAT STOK DSE:", error);
        stockData = [];
        return false;
    }
}

function setupDSESelector() {
    const select = document.getElementById("nama_dse_select");
    if (!select) return;

    select.addEventListener("change", async function () {
        const selectedValue = String(select.value || "").trim();

        if (!selectedValue) {
            const namaInput = document.getElementById("nama_dse");
            const idInput = document.getElementById("id_dse");
            if (namaInput) namaInput.value = "";
            if (idInput) idInput.value = "";
            hideAllStock();
            return;
        }

        const option = select.options[select.selectedIndex];
        const optionText = String(option?.textContent || "").trim();
        const normalizeName = value => String(value || "").trim().toUpperCase();

        let dseId = "";
        let dseName = "";

        if (DSE_MAPPING[selectedValue]) {
            dseId = selectedValue;
            dseName = DSE_MAPPING[selectedValue];
        }

        if (!dseId) {
            const foundByValue = Object.entries(DSE_MAPPING).find(
                ([id, name]) => normalizeName(name) === normalizeName(selectedValue)
            );
            if (foundByValue) {
                dseId = foundByValue[0];
                dseName = foundByValue[1];
            }
        }

        if (!dseId) {
            const foundByText = Object.entries(DSE_MAPPING).find(
                ([id, name]) => normalizeName(name) === normalizeName(optionText)
            );
            if (foundByText) {
                dseId = foundByText[0];
                dseName = foundByText[1];
            }
        }

        if (!dseId) {
            const dataId = option?.dataset?.id;
            if (dataId && DSE_MAPPING[dataId]) {
                dseId = dataId;
                dseName = DSE_MAPPING[dataId];
            }
        }

        if (!dseId) return;

        const namaInput = document.getElementById("nama_dse");
        if (namaInput) namaInput.value = dseName;

        const idInput = document.getElementById("id_dse");
        if (idInput) idInput.value = dseId;

        if (stockData.length === 0) {
            await loadStockData();
        }

        updateStockDisplay(dseId);
    });
}

function updateStockDisplay(selectedDseId = null) {
    const select = document.getElementById("nama_dse_select");
    let dseId = selectedDseId;

    if (!dseId && select) {
        const selectedValue = String(select.value || "").trim();
        if (DSE_MAPPING[selectedValue]) {
            dseId = selectedValue;
        } else {
            const found = Object.entries(DSE_MAPPING).find(
                ([id, name]) => String(name).trim().toUpperCase() === selectedValue.toUpperCase()
            );
            if (found) dseId = found[0];
        }
    }

    if (!dseId) {
        hideAllStock();
        return;
    }

    const dseColumn = STOCK_DSE_MAPPING[dseId];
    if (!dseColumn || !Array.isArray(stockData) || stockData.length === 0) {
        hideAllStock();
        return;
    }

    Object.keys(PRODUCT_CONFIG).forEach(productId => {
        const stockElement = document.getElementById(`stock_${productId}`);
        if (!stockElement) return;

        const config = PRODUCT_CONFIG[productId];
        const productLabel = String(config.label || "").trim().toUpperCase();

        const row = stockData.find(item => {
            const jenisBarang = String(item["JENIS BARANG"] ?? "").trim().toUpperCase();
            return jenisBarang === productLabel;
        });

        if (!row) {
            stockElement.textContent = "Stok: 0 PCS";
            stockElement.classList.add("show");
            return;
        }

        let stock = row[dseColumn];
        if (stock === "-" || stock === "" || stock === null || stock === undefined) {
            stock = 0;
        }

        stock = Number(String(stock).replace(/,/g, ""));
        if (Number.isNaN(stock)) stock = 0;

        stockElement.textContent = `Stok: ${stock.toLocaleString("id-ID")} PCS`;
        stockElement.classList.add("show");
    });
}

function hideAllStock() {
    document.querySelectorAll(".product-stock").forEach(element => {
        element.textContent = "";
        element.classList.remove("show");
    });
}

function setupQuantityButtons() {
    document.querySelectorAll(".qty-btn").forEach(button => {
        button.addEventListener("pointerdown", startHold);
        button.addEventListener("pointerup", () => stopHold(button));
        button.addEventListener("pointerleave", () => stopHold(button));
        button.addEventListener("pointercancel", () => stopHold(button));
    });

    document.querySelectorAll(".qty-input").forEach(input => {
        input.addEventListener("input", () => {
            normalizeQuantity(input);
            updateSummary();
        });
        input.addEventListener("blur", () => {
            normalizeQuantity(input);
            updateSummary();
        });
    });
}

function startHold(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = button.dataset.product;
    const change = Number(button.dataset.change);

    stopHold(button);
    button.classList.add("pressing");
    changeQty(productId, change);

    const state = { timeout: null, interval: null, speed: 110 };

    state.timeout = setTimeout(() => {
        state.interval = setInterval(() => {
            changeQty(productId, change);
            if (state.speed > 45) {
                state.speed -= 8;
                clearInterval(state.interval);
                state.interval = setInterval(() => {
                    changeQty(productId, change);
                }, state.speed);
            }
        }, state.speed);
    }, 400);

    holdState.set(button, state);
}

function stopHold(button) {
    if (!button) return;
    const state = holdState.get(button);
    if (state) {
        clearTimeout(state.timeout);
        clearInterval(state.interval);
        holdState.delete(button);
    }
    button.classList.remove("pressing");
}

function changeQty(productId, amount) {
    const input = document.getElementById(productId);
    if (!input) return;

    let value = parseInt(input.value, 10);
    if (Number.isNaN(value)) value = 0;

    value += amount;
    if (value < 0) value = 0;

    input.value = value;
    updateSummary();
}

function normalizeQuantity(input) {
    let value = parseInt(input.value, 10);
    if (Number.isNaN(value) || value < 0) value = 0;
    input.value = value;
}

function getSummary() {
    let total = 0;
    let totalSP = 0;
    let totalVoucher = 0;
    let activeProducts = 0;
    const products = [];

    Object.keys(PRODUCT_CONFIG).forEach(productId => {
        const input = document.getElementById(productId);
        if (!input) return;

        normalizeQuantity(input);
        const qty = parseInt(input.value, 10) || 0;
        const config = PRODUCT_CONFIG[productId];

        if (qty > 0) {
            activeProducts++;
            products.push({ id: productId, label: config.label, category: config.category, qty: qty });
        }

        total += qty;
        if (config.category === "Starter Pack") {
            totalSP += qty;
        } else {
            totalVoucher += qty;
        }
    });

    return { total, totalSP, totalVoucher, activeProducts, products };
}

function updateSummary() {
    const summary = getSummary();

    const totalQty = document.getElementById("totalQty");
    if (totalQty) totalQty.textContent = summary.total.toLocaleString("id-ID");

    const totalSP = document.getElementById("totalSP");
    if (totalSP) totalSP.textContent = `${summary.totalSP.toLocaleString("id-ID")} PCS`;

    const totalVoucher = document.getElementById("totalVoucher");
    if (totalVoucher) totalVoucher.textContent = `${summary.totalVoucher.toLocaleString("id-ID")} PCS`;

    const activeProducts = document.getElementById("activeProducts");
    if (activeProducts) activeProducts.textContent = summary.activeProducts;

    Object.keys(PRODUCT_CONFIG).forEach(productId => {
        const row = document.querySelector(`[data-product="${productId}"]`);
        const input = document.getElementById(productId);
        if (!row || !input) return;

        const qty = parseInt(input.value, 10) || 0;
        row.classList.toggle("active", qty > 0);
    });
}

function resetForm() {
    if (!confirm("Reset semua jumlah barang dan catatan?")) return;

    Object.keys(PRODUCT_CONFIG).forEach(productId => {
        const input = document.getElementById(productId);
        if (input) input.value = 0;
    });

    const komentar = document.getElementById("komentar");
    if (komentar) komentar.value = "";

    updateSummary();
}

function formatTanggalIndonesia(value) {
    if (!value) return "-";
    const parts = value.split("-");
    if (parts.length !== 3) return value;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function openConfirmModal() {
    const summary = getSummary();
    const idDse = document.getElementById("id_dse").value;
    const namaDse = document.getElementById("nama_dse").value;
    const tanggal = document.getElementById("tanggal").value;

    document.getElementById("confirmTanggal").textContent = formatTanggalIndonesia(tanggal);
    document.getElementById("confirmIdDse").textContent = idDse || "-";
    document.getElementById("confirmNamaDse").textContent = namaDse || "-";
    document.getElementById("confirmTotal").textContent = `${summary.total.toLocaleString("id-ID")} PCS`;
    document.getElementById("confirmSP").textContent = `${summary.totalSP.toLocaleString("id-ID")} PCS`;
    document.getElementById("confirmVoucher").textContent = `${summary.totalVoucher.toLocaleString("id-ID")} PCS`;

    const productContainer = document.getElementById("confirmProducts");
    productContainer.innerHTML = "";

    summary.products.forEach(product => {
        const item = document.createElement("div");
        item.className = "modal-product";
        item.innerHTML = `
            <span class="modal-product-name">${escapeHTML(product.label)}</span>
            <span class="modal-product-qty">${product.qty.toLocaleString("id-ID")} PCS</span>
        `;
        productContainer.appendChild(item);
    });

    const komentar = document.getElementById("komentar").value.trim();
    const note = document.getElementById("confirmNote");

    if (komentar) {
        note.style.display = "block";
        note.innerHTML = `<strong>Catatan:</strong><br>${escapeHTML(komentar)}`;
    } else {
        note.style.display = "none";
        note.innerHTML = "";
    }

    document.getElementById("confirmOverlay").classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeConfirmModal() {
    document.getElementById("confirmOverlay").classList.remove("show");
    document.body.style.overflow = "";
}

function confirmAndSend() {
    const summary = getSummary();
    if (summary.total <= 0) {
        closeConfirmModal();
        alert("Tidak ada barang yang diminta.");
        return;
    }

    const message = buildWhatsAppMessage();
    const waLink = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}`;

    if (typeof tambahNotif === "function") {
        tambahNotif({
            aktivitas: "Form Permintaan berhasil dikirim",
            halaman: "form-permintaan.html",
            detail: `Permintaan stok ${summary.total} PCS berhasil dibuat`
        });
    }

    closeConfirmModal();
    window.open(waLink, "_blank", "noopener,noreferrer");
}

function buildWhatsAppMessage() {
    const summary = getSummary();
    const tanggal = document.getElementById("tanggal").value;
    const idDse = document.getElementById("id_dse").value;
    const namaDse = document.getElementById("nama_dse").value;

    let message = "*--- PERMINTAAN BARANG IM3 ---*\n\n";
    message += `*Tanggal:* ${formatTanggalIndonesia(tanggal)}\n`;
    message += `*ID DSE:* ${idDse}\n`;
    message += `*Nama DSE:* ${namaDse}\n\n`;

    const starterPack = summary.products.filter(p => p.category === "Starter Pack");
    const voucher = summary.products.filter(p => p.category === "Voucher");

    if (starterPack.length) {
        message += "*STARTER PACK*\n";
        starterPack.forEach(p => { message += `• ${p.label}: *${p.qty} PCS*\n`; });
        message += "\n";
    }

    if (voucher.length) {
        message += "*VOUCHER*\n";
        voucher.forEach(p => { message += `• ${p.label}: *${p.qty} PCS*\n`; });
        message += "\n";
    }

    message += `*TOTAL PERMINTAAN: ${summary.total} PCS*\n`;
    message += `Starter Pack: ${summary.totalSP} PCS\n`;
    message += `Voucher: ${summary.totalVoucher} PCS`;

    const komentar = document.getElementById("komentar").value.trim();
    if (komentar) {
        message += `\n\n*Catatan Tambahan:*\n_${komentar}_`;
    }

    return message;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleSubmit(event) {
    event.preventDefault();

    const idDse = document.getElementById("id_dse").value;
    const namaDse = document.getElementById("nama_dse").value;

    if (!idDse) {
        alert("Silakan pilih Nama DSE terlebih dahulu.");
        return;
    }

    if (!namaDse) {
        alert("Nama DSE belum tersedia.");
        return;
    }

    const summary = getSummary();
    if (summary.total <= 0) {
        alert("Silakan masukkan kuantitas minimal pada salah satu barang sebelum mengirim.");
        return;
    }

    openConfirmModal();
}

document.addEventListener("click", event => {
    const overlay = document.getElementById("confirmOverlay");
    if (event.target === overlay) {
        closeConfirmModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeConfirmModal();
    }
});

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = "dashboard.html";
    }
}
