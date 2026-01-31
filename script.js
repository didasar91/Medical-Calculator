let currentMode = 'psi';

function showCalculator(mode) {
    currentMode = mode;
    document.body.className = 'mode-' + mode;
    const isPsi = (mode === 'psi');
    const isNatrium = (mode === 'natrium');
    const isKalium = (mode === 'kalium');
    document.getElementById('calc-psi-content').style.display = 'none';
    document.getElementById('calc-natrium-content').style.display = 'none';
    document.getElementById('calc-kalium-content').style.display = 'none';
    document.getElementById('psi-output-box').style.display = 'none';
    document.getElementById('natrium-output-box').style.display = 'none';
    document.getElementById('kalium-output-box').style.display = 'none';
    
    if(isPsi) {
        document.getElementById('calc-psi-content').style.display = 'block';
        document.getElementById('psi-output-box').style.display = 'block';
    } else if(isNatrium) {
        document.getElementById('calc-natrium-content').style.display = 'block';
        document.getElementById('natrium-output-box').style.display = 'block';
    } else if(isKalium) {
        document.getElementById('calc-kalium-content').style.display = 'block';
        document.getElementById('kalium-output-box').style.display = 'block';
    }
    document.getElementById('btn-psi').classList.toggle('active', isPsi);
    document.getElementById('btn-natrium').classList.toggle('active', isNatrium);
    document.getElementById('btn-kalium').classList.toggle('active', isKalium);
}

// Data Binding
document.getElementById('nama').addEventListener('input', e => document.getElementById('displayNama').textContent = e.target.value || '-');
document.getElementById('noMR').addEventListener('input', e => document.getElementById('displayNoMR').textContent = e.target.value || '-');
document.getElementById('inputDPJP').addEventListener('input', e => document.getElementById('displayDPJP').textContent = e.target.value || '');
document.getElementById('tglAsesmen').addEventListener('change', e => document.getElementById('displayTglAsesmen').textContent = e.target.value || '-');
document.getElementById('tglLahir').addEventListener('change', updateStats);
document.getElementById('jk').addEventListener('change', updateStats);

['bb', 'naSerum', 'naTarget', 'naKecepatan', 'naInfus', 'kSerum', 'kTarget', 'aksesVena'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', () => {calculateNatrium() ; calculateKalium() ;
    });
});

function updateStats() {
    const tgl = document.getElementById('tglLahir').value;
    if(!tgl) return;
    const dob = new Date(tgl);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    
    document.getElementById('displayTglLahir').textContent = tgl;
    document.getElementById('displayUmur').textContent = age + " Tahun";
    const jk = document.getElementById('jk').value;
    
    // Perbaikan Skor Usia PSI
    const scoreUsia = (jk === 'P') ? Math.max(0, age - 10) : age;
    document.getElementById('scoreUsia').textContent = scoreUsia;
    
    calculatePSI();
    calculateNatrium();
    calculateKalium();
}

document.querySelectorAll('.psi-check').forEach(box => {
    box.addEventListener('change', () => {
        const id = box.dataset.id;
        const scoreId = 'score' + id.charAt(0).toUpperCase() + id.slice(1);
        const el = document.getElementById(scoreId);
        if(el) el.textContent = box.checked ? box.dataset.score : 0;
        calculatePSI();
    });
});

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
    container.innerHTML = ""; 

    document.getElementById('displayNaAwal').textContent = isNaN(naSerum) ? "0" : naSerum;
    document.getElementById('displayNaTarget').textContent = isNaN(naTarget) ? "0" : naTarget;
    
    if(!bb || isNaN(naSerum) || isNaN(naTarget) || isNaN(kecMax) || !jk) return;

    const deltaTotal = naTarget - naSerum;
    document.getElementById('displayDeltaTotal').textContent = deltaTotal.toFixed(1);

    if (deltaTotal <= 0) {
        document.getElementById('displayDurasi').textContent = "0";
        return;
    }

    // TBW & Delta per Liter
    let factor = (age <= 18) ? 0.6 : (jk === 'L' ? (age > 65 ? 0.5 : 0.6) : (age > 65 ? 0.45 : 0.5));
    const tbw = bb * factor;
    const deltaPerLiter = (naInfus - naSerum) / (tbw + 1);

    let sisaDelta = deltaTotal;
    let hari = 1;
    const selectInfus = document.getElementById('naInfus');
    const cairan = selectInfus.options[selectInfus.selectedIndex].text.split(' (')[0];

    // Persiapan Tanggal
    let baseDate = tglAsesmenInput ? new Date(tglAsesmenInput) : new Date();

    while (sisaDelta > 0.01) {
        let deltaHariIni = Math.min(sisaDelta, kecMax);
        const vol = (deltaHariIni / deltaPerLiter) * 1000;
        const botol = Math.ceil(vol / 500);
        const speed = (vol / 24).toFixed(1);

        // Hitung Tanggal untuk Hari ini
        let currentDayDate = new Date(baseDate);
        currentDayDate.setDate(baseDate.getDate() + (hari - 1));
        
        // Format Tanggal (Contoh: 31 Jan 2026)
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        const dateString = currentDayDate.toLocaleDateString('id-ID', options);

        const tableHtml = `
            <table class="scoring-table" style="margin-top: 15px;">
                <thead>
                    <tr>
                        <th style="background:${hari === 1 ? '#4CAF50' : '#2196F3'} !important;">
                            Rencana Hari ke-${hari} (${dateString})
                        </th>
                        <th>Hasil</th>
                    </tr>
                </thead>
                <tbody>
                    ${hari === 1 ? `<tr><td>Total Body Water (TBW)</td><td>${tbw.toFixed(1)} L</td></tr>` : ''}
                    <tr><td>Target Δ Na+ Periode Ini</td><td>${deltaHariIni.toFixed(1)} mEq/L</td></tr>
                    <tr class="highlight-natrium"><td>Kebutuhan Botol (500 mL)</td><td>${botol} Botol ${cairan} 500 mL</td></tr>
                    <tr class="highlight-natrium"><td>Kecepatan Infus</td><td>${speed} mL/jam</td></tr>
                </tbody>
            </table>
        `;
        container.innerHTML += tableHtml;
        
        sisaDelta -= deltaHariIni;
        if(sisaDelta > 0.01) hari++;
        else break;
    }
    document.getElementById('displayDurasi').textContent = hari;
}

function calculateKalium() {
    const bb = parseFloat(document.getElementById('bb').value);
    const kSerum = parseFloat(document.getElementById('kSerum').value);
    const kTarget = parseFloat(document.getElementById('kTarget').value) || 3.0;
    const akses = document.getElementById('aksesVena').value; // Mengambil nilai dari dropdown yang sudah diperbaiki
    const container = document.getElementById('kalium-instructions');

    if (!bb || isNaN(kSerum)) {
        document.getElementById('displayKebutuhanK').textContent = "0";
        return;
    }

    const kebutuhan = 0.3 * bb * (kTarget - kSerum);
    document.getElementById('displayKebutuhanK').textContent = kebutuhan > 0 ? kebutuhan.toFixed(1) : "0";
    document.getElementById('displayKaliumSerum').textContent = kSerum;
    
    if (kSerum >= kTarget) {
        container.innerHTML = `<tr><td colspan="2" style="text-align:center;">Kadar Kalium sudah mencapai target.</td></tr>`;
        return;
    }

    const jumlahBotol = Math.ceil(kebutuhan / 25);
    
    // LOGIKA AKSES VENA
    let pelarutVol, infoAkses;
    if (akses === 'sentral') {
        pelarutVol = jumlahBotol * 100; // Sentral lebih pekat: 100ml per botol
        infoAkses = "Vena Sentral (Dosis pekat)";
    } else {
        pelarutVol = jumlahBotol * 500; // Perifer: 500ml per botol (instruksi dr. Eric)
        infoAkses = "Vena Perifer Besar";
    }

    const obatVol = jumlahBotol * 25; 
    const totalCampuran = pelarutVol + obatVol;
    const speed = (totalCampuran / 24).toFixed(1);

    container.innerHTML = `
        <tr><td>Kalium Serum Saat Ini</td><td>${kSerum.toFixed(2)} mEq/L</td></tr>
        <tr><td>Target Koreksi</td><td>${kTarget.toFixed(1)} mEq/L</td></tr>
        <tr><td>Sediaan RS</td><td><strong>${jumlahBotol} Botol</strong> (25 mEq/25 mL)</td></tr>
        <tr style="background:#fff3e0;"><td>Cairan Pelarut</td><td><strong>${pelarutVol} mL NaCl 0.9%</strong></td></tr>
        <tr style="background:#fff3e0;"><td>Volume Total Campuran</td><td><strong>${totalCampuran} mL</strong></td></tr>
        <tr><td>Akses Vena</td><td>${infoAkses}</td></tr>
        <tr class="highlight-natrium"><td>Kecepatan Infus</td><td><strong>${speed} mL/jam</strong></td></tr>
    `;
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
