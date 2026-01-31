let currentMode = 'psi';

// --- FUNGSI UTAMA ---
function showCalculator(mode) {
    currentMode = mode;
    document.body.className = 'mode-' + mode;
    
    // 1. Tab Active State
    document.querySelectorAll('.btn-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');

    // 2. Control Output Boxes (Bug 2 & 4 Fix)
    // Sembunyikan semua dulu
    ['psi', 'natrium', 'kalium'].forEach(m => {
        document.getElementById(`calc-${m}-content`).style.display = 'none';
        document.getElementById(`${m}-output-box`).style.display = 'none';
    });
    // Tampilkan yang aktif saja
    document.getElementById(`calc-${mode}-content`).style.display = 'block';
    document.getElementById(`${mode}-output-box`).style.display = 'flex'; // Gunakan flex agar centering content jalan

    // 3. Control Form Inputs
    document.getElementById('input-psi-group').style.display = (mode === 'psi') ? 'contents' : 'none';
    document.getElementById('input-natrium-group').style.display = (mode === 'natrium') ? 'contents' : 'none';
    document.getElementById('input-kalium-group').style.display = (mode === 'kalium') ? 'contents' : 'none';

    updateStats();
}

// FORMAT TANGGAL INDONESIA
function formatDateIndo(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date)) return "-";
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// INIT SAAT LOAD
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

    // Bug 4 Fix: Paksa jalankan mode PSI saat awal load agar kotak hijau muncul
    showCalculator('psi');
});

function updateStats() {
    // Info Pasien
    setText('displayNama', getValue('nama') || '-');
    setText('displayNoMR', getValue('noMR') || '-');
    setText('displayDPJP', getValue('inputDPJP') || '');
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

// --- PSI CALCULATOR (Bug 3 Fix: Detail Checklist) ---
function calculatePSI() {
    let total = 0;
    // ... (Logika skor umur & checklist checklist TETAP SAMA seperti sebelumnya) ...
    // ... Cukup copy bagian ini dari script sebelumnya ...
    
    // BAGIAN INI YANG DI-UPDATE UNTUK OUTPUT:
    const tgl = getValue('tglLahir');
    if(tgl) {
         const dob = new Date(tgl);
         const today = new Date();
         let age = today.getFullYear() - dob.getFullYear();
         if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
         const jk = getValue('jk');
         let ageScore = (jk === 'P') ? Math.max(0, age - 10) : age;
         total += ageScore;
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
    setText('mortalityRate', mort); // <--- UPDATE: Tampilkan Mortality
}
    
    detailsTable += `<tr><td><strong>TOTAL SCORE</strong></td><td><strong>${total}</strong></td></tr></tbody></table>`;

    setText('totalScore', total);
    
    let kelas = "I", mort = "0.1%";
    if(total > 130) { kelas = "V"; mort = "29.2%"; }
    else if(total >= 91) { kelas = "IV"; mort = "8.2%"; }
    else if(total >= 71) { kelas = "III"; mort = "2.8%"; }
    else if(total > 0) { kelas = "II"; mort = "0.6%"; }
    
    setText('kelasRisiko', kelas); // Bug 3: Bhs Indo

    // Tampilkan tabel detail HANYA jika ada data
    const contentDiv = document.getElementById('calc-psi-content');
    contentDiv.innerHTML = detailsTable;
}

// --- NATRIUM CALCULATOR (Bug 5 Fix: Looping Hari) ---
function calculateNatrium() {
    const bb = parseFloat(getValue('bb'));
    const naSerum = parseFloat(getValue('naSerum'));
    const naTarget = parseFloat(getValue('naTarget'));
    const naInfus = parseFloat(getValue('naInfus'));
    const kecMax = parseFloat(getValue('naKecepatan'));
    const age = parseInt(document.getElementById('displayUmur')?.innerText) || 30;
    const jk = getValue('jk');

    setText('displayNaAwal', naSerum || 0);   // Na Sekarang
    setText('displayNaTarget', naTarget || 0); // Target Na
    
    // Hitung Delta
    const deltaTotal = naTarget - naSerum;
    setText('displayDeltaTotal', deltaTotal.toFixed(1)); // Delta jadi huruf besar

    // ... sisa logika tabel loop tetap sama ...
    // (Pastikan logika tabel loop Anda yang sudah fix tadi tetap ada di sini)
    const container = document.getElementById('natrium-tables-container');
    if (!bb || isNaN(naSerum) || isNaN(naTarget) || !container) return;
    
    if (deltaTotal <= 0) {
        container.innerHTML = "<tr><td colspan='2'>Target tercapai / Nilai serum lebih tinggi.</td></tr>";
        return;
    }
    
    // ... Lanjutkan kode loop tabel di bawah ini (copy dari script sebelumnya) ...
    container.innerHTML = "";
    let tglAsesmen = getValue('tglAsesmen') ? new Date(getValue('tglAsesmen')) : new Date();
    const age = parseInt(document.getElementById('displayUmur')?.innerText) || 30;
    const jk = getValue('jk');
    let factor = (age <= 18) ? 0.6 : (jk === 'L' ? (age > 65 ? 0.5 : 0.6) : (age > 65 ? 0.45 : 0.5));
    const tbw = bb * factor;
    const naInfus = parseFloat(getValue('naInfus'));
    const deltaPerLiter = (naInfus - naSerum) / (tbw + 1);
    const kecMax = parseFloat(getValue('naKecepatan'));

    let sisaDelta = deltaTotal;
    let hari = 1;

    while (sisaDelta > 0.01) {
        let deltaHariIni = Math.min(sisaDelta, kecMax);
        const volmL = (deltaHariIni / deltaPerLiter) * 1000;
        const botol = Math.ceil(volmL / 500);
        const speed = (volmL / 24).toFixed(1);

        let currentDayDate = new Date(tglAsesmen);
        currentDayDate.setDate(tglAsesmen.getDate() + (hari - 1));
        const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
        const dateStr = `${currentDayDate.getDate()} ${months[currentDayDate.getMonth()]} ${currentDayDate.getFullYear()}`;

        container.innerHTML += `
        <table class="scoring-table">
            <thead><tr><th style="background:${hari === 1 ? '#4CAF50' : '#2196F3'}; color:white;">Rencana Hari ke-${hari} (${dateStr})</th><th>Hasil</th></tr></thead>
            <tbody>
                ${hari === 1 ? `<tr><td>TBW</td><td>${tbw.toFixed(1)} L</td></tr>` : ''}
                <tr><td>Target Δ Na+</td><td>${deltaHariIni.toFixed(1)} mEq/L</td></tr>
                <tr class="highlight-natrium"><td>Kebutuhan</td><td>${botol} Botol (Total ${volmL.toFixed(0)} mL)</td></tr>
                <tr class="highlight-natrium"><td>Kecepatan</td><td>${speed} mL/jam</td></tr>
            </tbody>
        </table>`;
        
        sisaDelta -= deltaHariIni;
        hari++;
        if(hari > 7) break; 
    }
}

// --- KALIUM CALCULATOR (Kalium Fix Text) ---
function calculateKalium() {
    const bb = parseFloat(getValue('bb'));
    const kSerum = parseFloat(getValue('kSerum'));
    const kTarget = parseFloat(getValue('kTarget')) || 3.0;
    
    // UPDATE OUTPUT BOX:
    setText('displayKaliumSerum', kSerum || 0);
    setText('displayKTarget', kTarget);
    
    const deltaK = kTarget - kSerum;
    setText('displayDeltaK', deltaK > 0 ? deltaK.toFixed(1) : "0");

    const kebutuhan = 0.3 * bb * (kTarget - kSerum);
    setText('displayKebutuhanK', kebutuhan > 0 ? kebutuhan.toFixed(1) : "0");
    
    // ... sisa logika tabel instruksi tetap sama (copy dari script sebelumnya) ...
    const akses = getValue('aksesVena');
    const container = document.getElementById('kalium-instructions');
    if (!bb || isNaN(kSerum) || !container) return;
    
    if (kSerum >= kTarget) {
        container.innerHTML = `<tr><td colspan="2" style="text-align:center; color:green;">Kadar Normal.</td></tr>`;
        return;
    }
    
    const jumlahBotol = Math.ceil(kebutuhan / 25);
    const obatVol = jumlahBotol * 25;
    let rows = `
        <tr><td>Kalium Serum</td><td>${kSerum.toFixed(2)} mEq/L</td></tr>
        <tr><td>Target Koreksi</td><td>${kTarget.toFixed(1)} mEq/L</td></tr>
        <tr><td>Dosis Total</td><td><strong>${kebutuhan.toFixed(1)} mEq</strong> (${jumlahBotol} Botol KCl)</td></tr>
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
function setText(id, txt) { const el = document.getElementById(id); if (el) el.innerText = txt; }
function printAndDownload() { window.print(); }
