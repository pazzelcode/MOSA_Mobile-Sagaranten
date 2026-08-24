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
            const noAdmin = "6285759695969"; 
            const formData = new FormData(event.target);
            
            let message = "*--- PERMINTAAN BARANG IM3 ---*\n\n";
            message += `*Tanggal:* ${formData.get('tanggal')}\n`;
            message += `*ID DSE:* ${formData.get('id_dse')}\n`;
            message += `*Nama DSE:* ${document.getElementById('nama_dse').value}\n\n`;
            message += "*Daftar Item:*\n";

            let hasItems = false;
            for (let [key, value] of formData.entries()) {
                if (key !== 'tanggal' && key !== 'id_dse' && key !== 'komentar' && parseInt(value) > 0) {
                    const inputElement = document.querySelector(`[name="${key}"]`);
                    const labelText = inputElement.closest('.item-input-group').querySelector('.item-label').innerText;
                    message += `- ${labelText}: *${value} pcs*\n`;
                    hasItems = true;
                }
            }

            if (!hasItems) {
                alert("Silakan masukkan kuantitas minimal pada salah satu barang sebelum mengirim.");
                return;
            }

            const catatan = formData.get('komentar').trim();
            if (catatan) {
                message += `\n*Catatan Tambahan:* \n_${catatan}_\n`;
            }

            const encodedMessage = encodeURIComponent(message);
            const waLink = `https://api.whatsapp.com/send?phone=${noAdmin}&text=${encodedMessage}`;
            window.open(waLink, '_blank');
        }
        tambahNotif({
    aktivitas: 'Form Permintaan berhasil dikirim',
    halaman: 'form-permintaan.html',
    detail: 'Data permintaan stok berhasil disimpan'
});
      function goBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "index.html";

    }

}
