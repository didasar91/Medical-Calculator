let currentMode = 'psi';

function showCalculator(mode) {
    currentMode = mode;
    document.body.className = 'mode-' + mode;
    ['psi', 'natrium', 'kalium'].forEach(m => {
        document.getElementById(`calc-${m}-content`).style.display = 'none';
        document.getElementById(`${m}-output-box`).style.display = 'none';
        document.getElementById(`btn-${m}`).classList.remove('active');
    });
    document.getElementById(`calc-${mode}-content`).style.display = 'block';
    document.getElementById(`${mode}-output-box`).style.display = 'block';
    document.getElementById(`btn-${mode}`).classList.add('active');
    updateStats();
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Listeners untuk Input Umum & Koreksi
    const inputs = [
        'nama', 'noMR', 'inputDPJP', 'tglAsesmen', 'tglLahir', 'jk', 'bb',
        'naSerum', 'naTarget', 'naKecepatan', 'naInfus', // Perbaikan: naInfus bukan naCairan
        'kSerum', 'kTarget', 'aksesVena'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
            el.addEventListener(eventType, updateStats);
        }
    });

    // 2. Listeners untuk Checkbox PSI
    document.querySelectorAll('.psi-check').forEach(box => {
        box.addEventListener('change', () => {
            const id = box.dataset.id;
            const scoreId = 'score' + id.charAt(0).toUpperCase() + id.slice(1);
            const el = document.getElementById(scoreId);
            if(el) el.textContent = box.checked ? box.dataset.score : 0;
            calculatePSI();
        });
    });
});

function updateStats() {
    // Sinkronisasi Info Pasien
    document.getElementById('displayNama').textContent = document.getElementById('nama').value || '-';
    document.getElementById('displayNoMR').textContent = document.getElementById('noMR').value || '-';
    document.getElementById('displayDPJP').textContent = document.getElementById('inputDPJP').value || '';
    document.getElementById('displayTglAsesmen').textContent = document.getElementById('tglAsesmen').value || '-';
    
    const tgl = document.getElementById('tglLahir').value;
    if (tgl) {
        const dob = new Date(tgl);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
        document.getElementById('displayTglLahir').textContent = tgl;
        document.getElementById('displayUmur').textContent = age + " Tahun";
        const jk = document.getElementById('jk').value;
        const scoreUsia = (jk === 'P') ? Math.max(0, age - 10) : age;
        document.getElementById('scoreUsia').textContent = scoreUsia;
    }

    // Jalankan kalkulator dengan pengaman (try-catch)
    try { calculatePSI(); } catch(e) { console.error("PSI Error:", e); }
    try { calculateNatrium(); } catch(e) { console.error("Natrium Error:", e); }
    try { calculateKalium(); } catch(e) { console.error("Kalium Error:", e); }
}

function calculatePSI() {
    let total = parseInt(document.getElementById('scoreUsia').textContent) || 0;
    document.querySelectorAll('.psi-check').forEach(c => { 
        if(c.checked) total += parseInt(c.dataset.score); 
    });
    document.getElementById('totalScore').textContent = total;
    let kelas = "I", mort = "0.1%";
    if(total > 130) { kelas = "V"; mort = "29.2%"; }
    else if(total >= 91) { kelas = "IV"; mort = "8.2%"; }
    else if(total >= 71) { kelas = "III"; mort = "2.8%"; }
    else if(total > 0) { kelas = "II"; mort = "0.6%"; }
    document.getElementById('kelasRisiko').textContent = kelas;
    document.getElementById('mortalityRate').textContent = mort;
}

function calculateNatrium() {
    const bb = parseFloat(document.getElementById('bb').value);
    const naSerum = parseFloat(document.getElementById('naSerum').value);
    const naTarget = parseFloat(document.getElementById('naTarget').value);
    const naInfus = parseFloat(document.getElementById('naInfus').value);
    const kecMax = parseFloat(document.getElementById('naKecepatan').value);
    const jk = document.getElementById('jk').value;
    const tglAsesmenInput = document.getElementById('tglAsesmen').value;
    const age = parseInt(document.getElementById('displayUmur').textContent) || 30;

    const container = document.getElementById('natrium-tables-container');
    if(container) container.innerHTML = ""; 

    document.getElementById('displayNaAwal').textContent = isNaN(naSerum) ? "0" : naSerum;
    document.getElementById('displayNaTarget').textContent = isNaN(naTarget) ? "0" : naTarget;
    
    if(!bb || isNaN(naSerum) || isNaN(naTarget) || isNaN(kecMax) || !jk) return;

    const deltaTotal = naTarget - naSerum;
    document.getElementById('displayDeltaTotal').textContent = deltaTotal.toFixed(1);

    if (deltaTotal <= 0) {
        if(document.getElementById('displayDurasi')) document.getElementById('displayDurasi').textContent = "0";
        return;
    }

    let factor = (age <= 18) ? 0.6 : (jk === 'L' ? (age > 65 ? 0.5 : 0.6) : (age > 65 ? 0.45 : 0.5));
    const tbw = bb * factor;
    const deltaPerLiter = (naInfus - naSerum) / (tbw + 1);

    let sisaDelta = deltaTotal;
    let hari = 1;
    const selectInfus = document.getElementById('naInfus');
    const cairan = selectInfus.options[selectInfus.selectedIndex].text.split(' (')[0];
    let baseDate = tglAsesmenInput ? new Date(tglAsesmenInput) : new Date();

    while (sisaDelta > 0.01) {
        let deltaHariIni = Math.min(sisaDelta, kecMax);
        const vol = (deltaHariIni / deltaPerLiter) * 1000;
        const botol = Math.ceil(vol / 500);
        const speed = (vol / 24).toFixed(1);

        let currentDayDate = new Date(baseDate);
        currentDayDate.setDate(baseDate.getDate() + (hari - 1));
        const dateString = currentDayDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        const tableHtml = `
            <table class="scoring-table" style="margin-top: 15px;">
                <thead><tr><th style="background:${hari === 1 ? '#4CAF50' : '#2196F3'} !important;">Rencana Hari ke-${hari} (${dateString})</th><th>Hasil</th></tr></thead>
                <tbody>
                    ${hari === 1 ? `<tr><td>Total Body Water (TBW)</td><td>${tbw.toFixed(1)} L</td></tr>` : ''}
                    <tr><td>Target Δ Na+ Periode Ini</td><td>${deltaHariIni.toFixed(1)} mEq/L</td></tr>
                    <tr class="highlight-natrium"><td>Kebutuhan Botol (500 mL)</td><td>${botol} Botol ${cairan} 500 mL</td></tr>
                    <tr class="highlight-natrium"><td>Kecepatan Infus</td><td>${speed} mL/jam</td></tr>
                </tbody>
            </table>`;
        if(container) container.innerHTML += tableHtml;
        sisaDelta -= deltaHariIni;
        if(sisaDelta > 0.01) hari++; else break;
    }
    if(document.getElementById('displayDurasi')) document.getElementById('displayDurasi').textContent = hari;
}

function calculateKalium() {
    const bb = parseFloat(document.getElementById('bb').value);
    const kSerum = parseFloat(document.getElementById('kSerum').value);
    const kTarget = parseFloat(document.getElementById('kTarget').value) || 3.0;
    const akses = document.getElementById('aksesVena').value;
    const container = document.getElementById('kalium-instructions');

    if (!bb || isNaN(kSerum)) {
        document.getElementById('displayKebutuhanK').textContent = "0";
        if(container) container.innerHTML = "";
        return;
    }

    const kebutuhan = 0.3 * bb * (kTarget - kSerum);
    document.getElementById('displayKebutuhanK').textContent = kebutuhan > 0 ? kebutuhan.toFixed(1) : "0";
    document.getElementById('displayKaliumSerum').textContent = kSerum.toFixed(2);
    
    let klas = (kSerum < 2.5) ? "Berat" : (kSerum < 3.0) ? "Sedang" : (kSerum < 3.5) ? "Ringan" : "Normal";
    document.getElementById('displayKlasifikasiK').textContent = klas;

    if (kSerum >= kTarget) {
        container.innerHTML = `<tr><td colspan="2" style="text-align:center; color:green; font-weight:bold;">Kadar Kalium sudah mencapai target.</td></tr>`;
        return;
    }

    const jumlahBotol = Math.ceil(kebutuhan / 25);
    const obatVol = jumlahBotol * 25;

    let rows = `
        <tr><td>Kalium Serum Saat Ini</td><td>${kSerum.toFixed(2)} mEq/L</td></tr>
        <tr><td>Target Koreksi</td><td>${kTarget.toFixed(1)} mEq/L</td></tr>
        <tr><td>Dosis Total KCl</td><td><strong>${kebutuhan.toFixed(1)} mEq</strong> (${jumlahBotol} Botol)</td></tr>
    `;

    if (akses === 'sentral') {
        const p1 = jumlahBotol * 100; const t1 = p1 + obatVol; const s1 = (t1 / 24).toFixed(1);
        const p2 = jumlahBotol * 500; const t2 = p2 + obatVol; const s2 = (t2 / 24).toFixed(1);
        rows += `
            <tr style="background:#e3f2fd;"><td colspan="2" style="font-weight:bold; text-align:center;">Opsi Akses Vena Sentral</td></tr>
            <tr><td><strong>Opsi A (Pekat)</strong></td><td>Pelarut: ${p1} mL NaCl<br>Total: ${t1} mL<br>Kecepatan: <strong>${s1} mL/jam</strong></td></tr>
            <tr><td><strong>Opsi B (Encer)</strong></td><td>Pelarut: ${p2} mL NaCl<br>Total: ${t2} mL<br>Kecepatan: <strong>${s2} mL/jam</strong></td></tr>
        `;
    } else {
        const pP = jumlahBotol * 500; const tP = pP + obatVol; const sP = (tP / 24).toFixed(1);
        rows += `
            <tr><td>Akses Vena</td><td>Vena Perifer Besar</td></tr>
            <tr style="background:#fff3e0;"><td>Cairan Pelarut</td><td><strong>${pP} mL NaCl 0.9%</strong></td></tr>
            <tr style="background:#fff3e0;"><td>Volume Total Campuran</td><td><strong>${tP} mL</strong></td></tr>
            <tr style="background-color: #e3f2fd !important; font-weight: bold;"><td>Kecepatan Infus</td><td><strong>${sP} mL/jam</strong></td></tr>
        `;
    }
    if(container) container.innerHTML = rows;
}

function printAndDownload() {
    const nama = document.getElementById('nama').value;
    const noMR = document.getElementById('noMR').value;
    const dpjp = document.getElementById('inputDPJP').value;
    if (!nama || noMR.length !== 10 || !dpjp) {
        alert("Lengkapi Nama, No. MR (10 digit), dan Nama DPJP.");
        return;
    }
    document.title = nama + " - " + currentMode.toUpperCase();
    window.print();
}
