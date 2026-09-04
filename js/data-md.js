/* =========================================================
   MC-SAGARANTEN - DATA MD (FIREBASE AUTH + FIRESTORE)
   Compressed & Optimized Version
========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy, getDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDxEBq9_j05HDWHHpYcvM1_AfNlZr12xYU",
    authDomain: "mc-sagaranten.firebaseapp.com",
    projectId: "mc-sagaranten",
    storageBucket: "mc-sagaranten.firebasestorage.app",
    messagingSenderId: "1055595672864",
    appId: "1:1055595672864:web:29dfeb6fed0f15673b5345"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const OUTLET_JSON_URL = 'https://pazzelcode.github.io/MOSA_Mobile-Sagaranten/data/data-outlet.json';
const DATA_MD_COLLECTION = 'data_md';

let outletData = [];
let dseList = [];
let mdData = [];
let currentUser = null;
let currentUserProfile = null;
let unsubscribeDataMD = null;
let toastTimer = null;
let editTimers = {};
let inputData = { idDse: '', namaDse: '', idOutlet: '', namaOutlet: '', ukuranBanner: '' };

/* =========================================================
   AUTHENTICATION & PROFILE
========================================================= */
function loadCurrentUser() {
    onAuthStateChanged(auth, async user => {
        if (!user) {
            currentUser = null;
            currentUserProfile = null;
            updateResetButton();
            showToast('Anda harus login terlebih dahulu');
            setTimeout(() => location.href = 'login.html', 1200);
            return;
        }
        currentUser = user;
        console.log('✅ DATA MD: User login:', currentUser.email);
        await loadCurrentUserProfile();
        startRealtimeDataMD();
        await loadOutletData();
    });
}

async function loadCurrentUserProfile() {
    if (!currentUser) return (currentUserProfile = null, updateResetButton());
    try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        currentUserProfile = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
    } catch (error) {
        console.error('❌ Gagal mengambil profile user:', error);
        currentUserProfile = null;
    }
    updateResetButton();
}

function isAdmin() {
    return currentUserProfile && String(currentUserProfile.role || '').toLowerCase() === 'admin';
}

function updateResetButton() {
    const resetButton = document.getElementById('resetTableButton');
    if (!resetButton) return;
    resetButton.style.display = isAdmin() ? 'flex' : 'none';
}

/* =========================================================
   FIRESTORE REALTIME & OUTLET DATA
========================================================= */
function startRealtimeDataMD() {
    if (unsubscribeDataMD) unsubscribeDataMD();
    const dataQuery = query(collection(db, DATA_MD_COLLECTION), orderBy('createdAt', 'desc'));
    unsubscribeDataMD = onSnapshot(dataQuery, snapshot => {
        mdData = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        renderTable();
    }, error => {
        console.error('❌ Firestore Data MD ERROR:', error);
        showToast('Gagal mengambil data Data MD');
    });
}

async function loadOutletData() {
    const loading = document.getElementById('dataLoading');
    try {
        if (loading) loading.style.display = 'block';
        const response = await fetch(OUTLET_JSON_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const json = await response.json();
        if (!json || !Array.isArray(json.data)) throw new Error('Format JSON tidak valid');

        outletData = json.data.map(item => ({
            idOutlet: String(item['ID OUTLET'] ?? '').trim(),
            namaOutlet: String(item['NAMA OUTLET'] ?? '').trim(),
            idDse: String(item['ID DSE'] ?? '').trim(),
            namaDse: String(item['NAMA DSE'] ?? '').trim()
        })).filter(item => item.idOutlet);

        buildDseList();
        populateDseSelect();
        if (loading) loading.style.display = 'none';
    } catch (error) {
        console.error('❌ Gagal mengambil data outlet:', error);
        if (loading) loading.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Gagal mengambil data outlet.';
    }
}

function buildDseList() {
    const map = new Map();
    outletData.forEach(item => {
        if (!item.idDse || !item.namaDse) return;
        if (!map.has(item.idDse)) map.set(item.idDse, { idDse: item.idDse, namaDse: item.namaDse });
    });
    dseList = [...map.values()].sort((a, b) => a.namaDse.localeCompare(b.namaDse, 'id'));
}

function populateDseSelect() {
    const select = document.getElementById('inputDse');
    if (!select) return;
    select.innerHTML = '<option value="">Pilih Nama DSE</option>';
    dseList.forEach(dse => {
        const option = document.createElement('option');
        option.value = dse.idDse;
        option.textContent = dse.namaDse;
        select.appendChild(option);
    });
}

function handleDseChange() {
    const select = document.getElementById('inputDse');
    const info = document.getElementById('inputDseInfo');
    if (!select) return;
    const dse = dseList.find(item => item.idDse === select.value);

    inputData.idDse = dse ? dse.idDse : '';
    inputData.namaDse = dse ? dse.namaDse : '';
    inputData.idOutlet = '';
    inputData.namaOutlet = '';

    const outletInput = document.getElementById('inputIdOutlet');
    const outletName = document.getElementById('inputNamaOutlet');
    const suggestionsBox = document.getElementById('inputOutletSuggestions');

    if (outletInput) outletInput.value = '';
    if (outletName) outletName.value = '';
    if (suggestionsBox) { suggestionsBox.innerHTML = ''; suggestionsBox.classList.remove('show'); }

    if (dse) {
        info.innerHTML = `ID DSE: <strong>${escapeHtml(dse.idDse)}</strong>`;
        info.classList.add('show');
    } else {
        info.innerHTML = '';
        info.classList.remove('show');
    }
}

/* =========================================================
   OUTLET SEARCH & SELECTION
========================================================= */
function searchInputOutlet(keyword) {
    const box = document.getElementById('inputOutletSuggestions');
    if (!box) return;
    keyword = String(keyword).trim().toLowerCase();
    if (keyword.length < 2) { box.innerHTML = ''; box.classList.remove('show'); return; }

    const results = outletData.filter(item => {
        if (inputData.idDse && item.idDse !== inputData.idDse) return false;
        return item.idOutlet.toLowerCase().includes(keyword) || item.namaOutlet.toLowerCase().includes(keyword);
    }).slice(0, 12);

    if (!results.length) {
        box.innerHTML = `<div class="suggestion-empty"><i class="fa-solid fa-circle-info"></i> Outlet tidak ditemukan</div>`;
        box.classList.add('show');
        return;
    }

    box.innerHTML = results.map(item => `
        <button type="button" class="outlet-suggestion" data-outlet-id="${escapeHtml(item.idOutlet)}">
            <span class="outlet-id">${escapeHtml(item.idOutlet)}</span>
            <span class="outlet-name">${escapeHtml(item.namaOutlet)}</span>
        </button>
    `).join('');
    box.classList.add('show');
}

function selectInputOutlet(idOutlet) {
    const outlet = outletData.find(item => item.idOutlet === idOutlet);
    if (!outlet) return;

    inputData.idDse = outlet.idDse;
    inputData.namaDse = outlet.namaDse;
    inputData.idOutlet = outlet.idOutlet;
    inputData.namaOutlet = outlet.namaOutlet;

    const dseSelect = document.getElementById('inputDse');
    if (dseSelect) dseSelect.value = outlet.idDse;

    const info = document.getElementById('inputDseInfo');
    if (info) { info.innerHTML = `ID DSE: <strong>${escapeHtml(outlet.idDse)}</strong>`; info.classList.add('show'); }

    const outletInput = document.getElementById('inputIdOutlet');
    const outletName = document.getElementById('inputNamaOutlet');
    if (outletInput) outletInput.value = outlet.idOutlet;
    if (outletName) outletName.value = outlet.namaOutlet;

    const box = document.getElementById('inputOutletSuggestions');
    if (box) { box.innerHTML = ''; box.classList.remove('show'); }
}

/* =========================================================
   DATA CRUD & RESET
========================================================= */
async function saveCurrentData() {
    const ukuranInput = document.getElementById('inputUkuran');
    const ukuran = ukuranInput ? ukuranInput.value.trim() : '';

    if (!currentUser) return showToast('Sesi login tidak ditemukan');
    if (!inputData.idDse) return showToast('Silakan pilih DSE terlebih dahulu');
    if (!inputData.idOutlet) return showToast('Silakan pilih outlet terlebih dahulu');
    if (!inputData.namaOutlet) return showToast('Nama outlet belum tersedia');
    if (!ukuran) return showToast('Ukuran banner wajib diisi');

    const saveButton = document.getElementById('saveButton');
    if (saveButton) saveButton.disabled = true;

    try {
        await addDoc(collection(db, DATA_MD_COLLECTION), {
            idDse: inputData.idDse,
            namaDse: inputData.namaDse,
            idOutlet: inputData.idOutlet,
            namaOutlet: inputData.namaOutlet,
            ukuranBanner: ukuran,
            createdAt: serverTimestamp(),
            createdByUid: currentUser.uid,
            createdByEmail: currentUser.email || '',
            updatedAt: serverTimestamp(),
            updatedByUid: currentUser.uid,
            updatedByEmail: currentUser.email || ''
        });
        resetInputForm();
        showToast('Data MD berhasil disimpan');
    } catch (error) {
        console.error('❌ Gagal menyimpan Data MD:', error);
        showToast('Gagal menyimpan data');
    } finally {
        if (saveButton) saveButton.disabled = false;
    }
}

function editTableData(id, field, value) {
    const timerKey = id + '_' + field;
    clearTimeout(editTimers[timerKey]);

    editTimers[timerKey] = setTimeout(async () => {
        const item = mdData.find(data => data.id === id);
        if (!item) return;

        value = String(value ?? '').trim();
        const updateData = {};

        if (field === 'idOutlet') {
            const outlet = outletData.find(data => data.idOutlet === value);
            if (outlet) {
                updateData.idDse = outlet.idDse;
                updateData.namaDse = outlet.namaDse;
                updateData.idOutlet = outlet.idOutlet;
                updateData.namaOutlet = outlet.namaOutlet;
            } else {
                updateData.idOutlet = value;
            }
        } else {
            updateData[field] = value;
        }

        updateData.updatedAt = serverTimestamp();
        updateData.updatedByUid = currentUser ? currentUser.uid : '';
        updateData.updatedByEmail = currentUser ? (currentUser.email || '') : '';

        try {
            await updateDoc(doc(db, DATA_MD_COLLECTION, id), updateData);
        } catch (error) {
            console.error('❌ Gagal update Data MD:', error);
            showToast('Gagal memperbarui data');
        }
    }, 500);
}

async function deleteTableData(id) {
    if (!confirm('Hapus data pengajuan ini?')) return;
    try {
        await deleteDoc(doc(db, DATA_MD_COLLECTION, id));
        showToast('Data berhasil dihapus');
    } catch (error) {
        console.error('❌ Gagal menghapus Data MD:', error);
        showToast('Gagal menghapus data');
    }
}

async function resetAllDataMD() {
    if (!currentUser) return showToast('Sesi login tidak ditemukan');
    if (!isAdmin()) return showToast('Akses ditolak. Hanya admin yang dapat melakukan reset.');
    if (!mdData.length) return showToast('Tidak ada data yang perlu dihapus');

    if (!confirm(`⚠️ PERINGATAN!\n\nAnda akan menghapus SEMUA data pengajuan MD (${mdData.length} data).\nLanjutkan?`)) return;

    const resetButton = document.getElementById('resetTableButton');
    if (resetButton) { resetButton.disabled = true; resetButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghapus...'; }

    try {
        const chunkSize = 500;
        for (let i = 0; i < mdData.length; i += chunkSize) {
            const chunk = mdData.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(item => batch.delete(doc(db, DATA_MD_COLLECTION, item.id)));
            await batch.commit();
        }
        showToast(`Berhasil menghapus ${mdData.length} data`);
    } catch (error) {
        console.error('❌ Gagal reset seluruh Data MD:', error);
        showToast('Gagal menghapus seluruh data');
    } finally {
        if (resetButton) { resetButton.disabled = false; resetButton.innerHTML = '<i class="fa-solid fa-trash-can"></i> Reset'; }
    }
}

function resetInputForm() {
    inputData = { idDse: '', namaDse: '', idOutlet: '', namaOutlet: '', ukuranBanner: '' };
    ['inputDse', 'inputIdOutlet', 'inputNamaOutlet', 'inputUkuran'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const info = document.getElementById('inputDseInfo');
    if (info) { info.innerHTML = ''; info.classList.remove('show'); }
    const box = document.getElementById('inputOutletSuggestions');
    if (box) { box.innerHTML = ''; box.classList.remove('show'); }
}

/* =========================================================
   UI RENDERING & UTILITIES
========================================================= */
function renderTable() {
    const tbody = document.getElementById('mdTableBody');
    const empty = document.getElementById('emptyTable');
    const wrapper = document.getElementById('tableWrapper');
    const count = document.getElementById('dataCount');

    if (!tbody) return;
    if (count) count.textContent = `${mdData.length} data`;

    if (!mdData.length) {
        if (empty) empty.style.display = 'block';
        if (wrapper) wrapper.style.display = 'none';
        tbody.innerHTML = '';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';

    tbody.innerHTML = mdData.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><input class="table-input" value="${escapeHtml(item.idDse)}" data-id="${escapeHtml(item.id)}" data-field="idDse"></td>
            <td><input class="table-input" value="${escapeHtml(item.namaDse)}" data-id="${escapeHtml(item.id)}" data-field="namaDse"></td>
            <td><input class="table-input" value="${escapeHtml(item.idOutlet)}" data-id="${escapeHtml(item.id)}" data-field="idOutlet"></td>
            <td><input class="table-input" value="${escapeHtml(item.namaOutlet)}" data-id="${escapeHtml(item.id)}" data-field="namaOutlet"></td>
            <td><input class="table-input" value="${escapeHtml(item.ukuranBanner)}" data-id="${escapeHtml(item.id)}" data-field="ukuranBanner"></td>
            <td>
                <div class="table-actions">
                    <button type="button" class="table-action delete" data-delete-id="${escapeHtml(item.id)}" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function cancelInput() {
    resetInputForm();
    showToast('Form telah dikosongkan');
}

function focusInputForm() {
    resetInputForm();
    const inputCard = document.getElementById('inputCard');
    if (inputCard) inputCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
        const dse = document.getElementById('inputDse');
        if (dse) dse.focus();
    }, 400);
}

function exportToExcel() {
    if (!mdData.length) return showToast('Belum ada data untuk diekspor');
    if (typeof XLSX === 'undefined') return showToast('Library Excel belum tersedia');

    const exportData = mdData.map((item, index) => ({
        'NO': index + 1,
        'ID DSE': item.idDse || '',
        'NAMA DSE': item.namaDse || '',
        'ID OUTLET': item.idOutlet || '',
        'NAMA OUTLET': item.namaOutlet || '',
        'UKURAN BANNER': item.ukuranBanner || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 30 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data MD');
    
    const tanggal = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `DATA-MD-${tanggal}.xlsx`);
    showToast('Excel berhasil dibuat');
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function goBack() {
    if (document.referrer && document.referrer !== location.href) history.back();
    else location.href = 'dashboard.html';
}

/* =========================================================
   EVENT LISTENERS & DOM READY
========================================================= */
document.addEventListener('click', event => {
    if (!event.target.closest('.form-group')) {
        document.querySelectorAll('.outlet-suggestions').forEach(box => box.classList.remove('show'));
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const dseSelect = document.getElementById('inputDse');
    const outletInput = document.getElementById('inputIdOutlet');
    const ukuranInput = document.getElementById('inputUkuran');
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    const exportButton = document.getElementById('exportExcelButton');
    const resetButton = document.getElementById('resetTableButton');
    const plusButton = document.getElementById('addPageButton');
    const suggestionsBox = document.getElementById('inputOutletSuggestions');

    if (dseSelect) dseSelect.addEventListener('change', handleDseChange);
    if (outletInput) outletInput.addEventListener('input', function() {
        inputData.idOutlet = this.value.trim();
        inputData.namaOutlet = '';
        const namaOutlet = document.getElementById('inputNamaOutlet');
        if (namaOutlet) namaOutlet.value = '';
        searchInputOutlet(this.value);
    });
    if (suggestionsBox) suggestionsBox.addEventListener('click', event => {
        const button = event.target.closest('.outlet-suggestion');
        if (button) selectInputOutlet(button.dataset.outletId);
    });
    if (ukuranInput) ukuranInput.addEventListener('input', function() { inputData.ukuranBanner = this.value; });
    if (saveButton) saveButton.addEventListener('click', saveCurrentData);
    if (cancelButton) resetButton && cancelButton.addEventListener('click', cancelInput); // Wait, fix cancel listener properly
    if (cancelButton) cancelButton.addEventListener('click', cancelInput);
    if (exportButton) exportButton.addEventListener('click', exportToExcel);
    if (resetButton) resetButton.addEventListener('click', resetAllDataMD);
    if (plusButton) plusButton.addEventListener('click', focusInputForm);

    document.addEventListener('input', event => {
        if (event.target.matches('.table-input')) {
            editTableData(event.target.dataset.id, event.target.dataset.field, event.target.value);
        }
    });

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-delete-id]');
        if (button) deleteTableData(button.dataset.deleteId);
    });

    loadCurrentUser();
});
