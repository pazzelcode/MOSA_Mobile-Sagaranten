document.addEventListener('DOMContentLoaded', () => {
            // JS NAVIGASI MENU RESPONSIVE (ANTI TUMPANG TINDIH)
           
            document.addEventListener

            const today = new Date().toISOString().split('T')[0];
            document.getElementById('tanggal').value = today;
        });

        const dseMapping = {
            'SKBPLARA04': 'Parhan',
            'SKBPLARA08': 'Andi',
            'SKBPLARA11': 'Endem',
            'DSESGRN01': 'Pebrian'
        };

        function updateNamaDSE() {
            const idDse = document.getElementById('id_dse').value;
            const namaField = document.getElementById('nama_dse');
            namaField.value = dseMapping[idDse] || '';
        }

        function clearZero(input) {
            if (input.value === "0") input.value = "";
        }

        function restoreZero(input) {
            if (input.value === "") input.value = "0";
        }

function handleSubmit(event) {
    event.preventDefault();
    const noAdminPusat = "6285692469992"; 
    const formData = new FormData(event.target);
    
    let message = "*--- REQUEST TAMBAHAN STOK BARANG ---\n\n";
    message += `*Nama MC:* ${formData.get('nama_cabang')}\n`;
    message += `*Tanggal:* ${formData.get('tanggal')}\n\n`;
    message += "*Daftar Request:*\n";

    let hasItems = false;
    for (let [key, value] of formData.entries()) {
        // Abaikan field non-item
        if (!['tanggal', 'nama_cabang', 'komentar'].includes(key) && parseInt(value) > 0) {
            const inputElement = document.querySelector(`[name="${key}"]`);
            const labelText = inputElement.closest('.item-input-group').querySelector('.item-label').innerText;
            message += `- ${labelText}: *${value} pcs*\n`;
            hasItems = true;
        }
    }

    if (!hasItems) {
        alert("Silakan masukkan jumlah barang yang diminta.");
        return;
    }

    const catatan = formData.get('komentar').trim();
    if (catatan) {
        message += `\n*Catatan:* \n_${catatan}_\n`;
    }

    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://api.whatsapp.com/send?phone=${noAdminPusat}&text=${encodedMessage}`;
    window.open(waLink, '_blank');
}
function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "index.html";

    }

}
