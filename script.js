let currentMode = 'psi';

function showCalculator(mode) {
    currentMode = mode;
    document.body.className = 'mode-' + mode;
    
    // 1. Atur Tab Menu
    document.querySelectorAll('.btn-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');

    // 2. Tampilkan Konten Hasil & Box Hijau
    ['psi', 'natrium', 'kalium'].forEach(m => {
        const content = document.getElementById(`calc-${m}-content`);
        const output = document.getElementById(`${m}-output-box`);
        if (content) content.style.display = (m === mode) ? 'block' : 'none';
        if (output) output.style.display = (m === mode) ? 'block' : 'none';
    });

    // 3. Atur Input Form yang Relevan (Agar form tidak kepanjangan)
    // Kita sembunyikan input spesifik yang tidak dipakai di mode tersebut
    document.getElementById('input-psi-group').style.display = (mode === 'psi') ? 'contents' : 'none';
    document.getElementById('input-natrium-group').style.display = (mode === 'natrium') ? 'contents' : 'none';
    document.getElementById('input-kalium-group').style.display = (mode === 'kalium') ? 'contents' : 'none';

    updateStats();
}

// FORMAT TANGGAL INDONESIA (dd MMM yyyy)
function formatDateIndo(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date)) return "-";
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const inputIds = [
        'nama', 'noMR', 'inputDPJP', 'tglAsesmen', 'tglLahir', 'jk', 'bb',
        'naSerum', 'naTarget', 'naKecepatan', 'naInfus', 
        'kSerum', 'kTarget', 'aksesVena'
    ];

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
            el.addEventListener(eventType, updateStats);
        }
    });

    document.querySelectorAll('.psi-check').forEach(box => {
        box.addEventListener('change', updateStats);
    });
});

function updateStats() {
    // Info Pasien
    setText('displayNama', getValue('nama') || '-');
    setText('displayNoMR', getValue('noMR') || '-');
    setText('displayDPJP', getValue('inputDPJP') || '');
    
    // FORMAT TANGGAL
    setText('displayTglAsesmen', formatDateIndo(getValue('tglAsesmen')));
    setText('displayTglLahir', formatDateIndo(getValue('tglLahir')));
    
    // Hitung Umur
    const tgl = getValue('tglLahir');
    if (tgl) {
        const dob = new Date(tgl);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
        setText('displayUmur', age + " Tahun");
    }

    try { calculatePSI(); } catch(e) {}
    try { calculateNatrium(); } catch(e) {}
    try { calculateKalium(); } catch(e) {}
}

function calculatePSI() {
    // ... Logika PSI Anda (tidak berubah) ...
    let total = 0; // Tambahkan logika umur
    const tgl = getValue('tglLahir');
    if(tgl) {
         const dob = new Date(tgl);
         const today = new Date();
         let age = today.getFullYear() - dob.getFullYear();
         if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
         const jk = getValue('jk');
         total = (jk === 'P') ? Math.max(0, age - 10) : age;
    }
    
    document.querySelectorAll('.psi-check').forEach(c => { 
        if(c.checked) total += parseInt(c.dataset.score); 
    });
    setText('totalScore', total);
    
    let kelas = "I", mort = "0.1%";
    if(total > 130) { kelas = "V"; mort = "29.2%"; }
    else if(total >= 91) { kelas = "IV"; mort = "8.2%"; }
    else if(total >= 71) { kelas = "III"; mort = "2.8%"; }
    else if(total > 0) { kelas = "II"; mort = "0.6%"; }
    
    setText('kelasRisiko', kelas);
}

function calculateNatrium() {
    // ... Gunakan logika Natrium yang sudah fix sebelumnya ...
    const bb = parseFloat(getValue('bb'));
    const naSerum = parseFloat(getValue('naSerum'));
    const naTarget = parseFloat(getValue('naTarget'));
    const naInfus = parseFloat(getValue('naInfus'));
    const kecMax = parseFloat(getValue('naKecepatan'));
    
    setText('displayNaTarget', naTarget || 0);
    
    const container = document.getElementById('natrium-tables-container');
    if (!bb || isNaN(naSerum) || isNaN(naTarget) || !container) return;

    const deltaTotal = naTarget - naSerum;
    setText('displayDeltaTotal', deltaTotal.toFixed(1));
    
    if (deltaTotal <= 0) {
        container.innerHTML = "<tr><td colspan='2'>Target tercapai</td></tr>";
        return;
    }
    
    // Logika tabel harian
    let tglAsesmen = getValue('tglAsesmen') ? new Date(getValue('tglAsesmen')) : new Date();
    const tbw = bb * 0.6; // Simplifikasi
    const deltaPerLiter = (naInfus - naSerum) / (tbw + 1);
    const vol = (Math.min(deltaTotal, kecMax) / deltaPerLiter) * 1000;
    const botol = Math.ceil(vol / 500);
    const speed = (vol / 24).toFixed(1);
    
    // Format tanggal header tabel
    const dateStr = `${tglAsesmen.getDate()} ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][tglAsesmen.getMonth()]} ${tglAsesmen.getFullYear()}`;

    container.innerHTML = `
        <table class="scoring-table">
            <thead><tr><th style="background:#4CAF50">Rencana Hari ke-1 (${dateStr})</th><th>Hasil</th></tr></thead>
            <tbody>
                <tr><td>TBW</td><td>${tbw.toFixed(1)} L</td></tr>
                <tr class="highlight-natrium"><td>Kebutuhan</td><td>${botol} Botol (500mL)</td></tr>
                <tr class="highlight-natrium"><td>Kecepatan</td><td>${speed} mL/jam</td></tr>
            </tbody>
        </table>`;
}

// INI LOGIKA KALIUM YANG KOMPLIT (BUG 2 FIX)
function calculateKalium() {
    const bb = parseFloat(getValue('bb'));
    const kSerum = parseFloat(getValue('kSerum'));
    const kTarget = parseFloat(getValue('kTarget')) || 3.0;
    const akses = getValue('aksesVena');
    const container = document.getElementById('kalium-instructions');

    if (!bb || isNaN(kSerum) || !container) return;

    const kebutuhan = 0.3 * bb * (kTarget - kSerum);
    setText('displayKebutuhanK', kebutuhan > 0 ? kebutuhan.toFixed(1) : "0");
    setText('displayKaliumSerum', kSerum.toFixed(2));
    
    // Update Status
    let klas = (kSerum < 2.5) ? "Berat" : (kSerum < 3.0) ? "Sedang" : (kSerum < 3.5) ? "Ringan" : "Normal";
    setText('displayStatusK', klas);

    if (kSerum >= kTarget) {
        container.innerHTML = `<tr><td colspan="2" style="text-align:center; color:green;">Kadar Normal.</td></tr>`;
        return;
    }

    const jumlahBotol = Math.ceil(kebutuhan / 25);
    const obatVol = jumlahBotol * 25;

    let rows = `
        <tr><td>Kalium Serum</td><td>${kSerum.toFixed(2)} mEq/L</td></tr>
        <tr><td>Target Koreksi</td><td>${kTarget.toFixed(1)} mEq/L</td></tr>
        <tr><td>Dosis Total</td><td><strong>${kebutuhan.toFixed(1)} mEq</strong> (${jumlahBotol} Botol)</td></tr>
    `;

    if (akses === 'sentral') {
        const p1 = jumlahBotol * 100; const t1 = p1 + obatVol; const s1 = (t1 / 24).toFixed(1);
        const p2 = jumlahBotol * 500; const t2 = p2 + obatVol; const s2 = (t2 / 24).toFixed(1);

        rows += `
            <tr style="background:#e3f2fd;"><td colspan="2" style="font-weight:bold; text-align:center;">OPSI VENA SENTRAL</td></tr>
            <tr><td><strong>Opsi A (Pekat)</strong></td><td>Pelarut: ${p1} mL NaCl<br>Total: ${t1} mL<br>Kecepatan: <strong>${s1} mL/jam</strong></td></tr>
            <tr><td><strong>Opsi B (Encer)</strong></td><td>Pelarut: ${p2} mL NaCl<br>Total: ${t2} mL<br>Kecepatan: <strong>${s2} mL/jam</strong></td></tr>
        `;
    } else {
        const pP = jumlahBotol * 500; const tP = pP + obatVol; const sP = (tP / 24).toFixed(1);
        rows += `
            <tr><td>Akses Vena</td><td>Vena Perifer Besar</td></tr>
            <tr style="background:#fff3e0;"><td>Cairan Pelarut</td><td><strong>${pP} mL NaCl 0.9%</strong></td></tr>
            <tr style="background:#fff3e0;"><td>Volume Total Campuran</td><td><strong>${tP} mL</strong></td></tr>
            <tr class="highlight-natrium"><td>Kecepatan Infus</td><td><strong>${sP} mL/jam</strong></td></tr>
        `;
    }
    container.innerHTML = rows;
}

function getValue(id) { return document.getElementById(id)?.value; }
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function printAndDownload() { window.print(); }
