let currentMode = 'psi';

function showCalculator(mode) {
    currentMode = mode;
    document.body.className = 'mode-' + mode;
    const isPsi = (mode === 'psi');
    document.getElementById('calc-psi-content').style.display = isPsi ? 'block' : 'none';
    document.getElementById('calc-natrium-content').style.display = !isPsi ? 'block' : 'none';
    document.getElementById('psi-output-box').style.display = isPsi ? 'block' : 'none';
    document.getElementById('natrium-output-box').style.display = !isPsi ? 'block' : 'none';
    document.getElementById('btn-psi').classList.toggle('active', isPsi);
    document.getElementById('btn-natrium').classList.toggle('active', !isPsi);
}

// Data Binding
document.getElementById('nama').addEventListener('input', e => document.getElementById('displayNama').textContent = e.target.value || '-');
document.getElementById('noMR').addEventListener('input', e => document.getElementById('displayNoMR').textContent = e.target.value || '-');
document.getElementById('inputDPJP').addEventListener('input', e => document.getElementById('displayDPJP').textContent = e.target.value || '');
document.getElementById('tglAsesmen').addEventListener('change', e => document.getElementById('displayTglAsesmen').textContent = e.target.value || '-');
document.getElementById('tglLahir').addEventListener('change', updateStats);
document.getElementById('jk').addEventListener('change', updateStats);

['bb', 'naSerum', 'naTarget', 'naInfus'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateNatrium);
});

function updateStats() {
    const tgl = document.getElementById('tglLahir').value;
    if(!tgl) return;
    const dob = new Date(tgl);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    document.getElementById('displayUmur').textContent = age + " Tahun";
    document.getElementById('displayTglLahir').textContent = tgl;
    const jk = document.getElementById('jk').value;
    document.getElementById('scoreUsia').textContent = (jk === 'P') ? Math.max(0, age - 10) : age;
    calculatePSI();
    calculateNatrium();
}

function calculateNatrium() {
    const bb = parseFloat(document.getElementById('bb').value);
    const naSerum = parseFloat(document.getElementById('naSerum').value);
    const naTarget = parseFloat(document.getElementById('naTarget').value);
    const naInfus = parseFloat(document.getElementById('naInfus').value);
    const jk = document.getElementById('jk').value;
    const age = parseInt(document.getElementById('displayUmur').textContent) || 30;

    if(!bb || isNaN(naSerum) || isNaN(naTarget) || !jk) return;

    // Hitung Selisih Otomatis
    const deltaTotal = naTarget - naSerum;
    document.getElementById('displayDeltaTotal').textContent = deltaTotal.toFixed(1);

    // TBW Logic
    let factor = 0.6; 
    if (age > 18) {
        if (jk === 'P') factor = (age > 65) ? 0.45 : 0.5;
        else factor = (age > 65) ? 0.5 : 0.6;
    }
    const tbw = bb * factor;
    const deltaPerLiter = (naInfus - naSerum) / (tbw + 1);

    // Pembagian Rencana (Maks 10 per 24 jam)
    let targetHarian1 = deltaTotal;
    let targetHarian2 = 0;

    if (deltaTotal > 10) {
        document.getElementById('warning-ods').style.display = 'block';
        document.getElementById('table-hari-2').style.display = 'table';
        document.getElementById('displayStatus').textContent = "ODS Risk (Divided)";
        document.getElementById('displayStatus').style.color = "red";
        targetHarian1 = 10;
        targetHarian2 = deltaTotal - 10;
        document.getElementById('header-hari-1').textContent = "Rencana Hari ke-1 (Maks 10 mEq/L)";
    } else {
        document.getElementById('warning-ods').style.display = 'none';
        document.getElementById('table-hari-2').style.display = 'none';
        document.getElementById('displayStatus').textContent = "Safe";
        document.getElementById('displayStatus').style.color = "green";
        document.getElementById('header-hari-1').textContent = "Rencana Koreksi 24 Jam";
    }

    // Hitung Hari 1
    const vol1 = (targetHarian1 / deltaPerLiter) * 1000;
    const botol1 = Math.ceil(vol1 / 500);
    const speed1 = vol1 / 24;

    const selectInfus = document.getElementById('naInfus');
    const namaCairan = selectInfus.options[selectInfus.selectedIndex].text.split(' (')[0];

    document.getElementById('txtTBW').textContent = tbw.toFixed(1);
    document.getElementById('txtTargetHarian').textContent = targetHarian1.toFixed(1);
    document.getElementById('txtBotolDisplay').textContent = botol1 + " Botol " + namaCairan + " 500 mL";
    document.getElementById('txtKecepatan').textContent = speed1.toFixed(1) + " mL/jam";

    // Hitung Hari 2
    if (targetHarian2 > 0) {
        const vol2 = (targetHarian2 / deltaPerLiter) * 1000;
        const botol2 = Math.ceil(vol2 / 500);
        const speed2 = vol2 / 24;
        document.getElementById('txtTargetHarian2').textContent = targetHarian2.toFixed(1);
        document.getElementById('txtBotolDisplay2').textContent = botol2 + " Botol " + namaCairan + " 500 mL";
        document.getElementById('txtKecepatan2').textContent = speed2.toFixed(1) + " mL/jam";
    }
}

// Checklist PSI & Print (Sama seperti sebelumnya)
function calculatePSI() {
    let total = parseInt(document.getElementById('scoreUsia').textContent) || 0;
    document.querySelectorAll('.psi-check').forEach(c => { if(c.checked) total += parseInt(c.dataset.score); });
    document.getElementById('totalScore').textContent = total;
    let kelas = "I", mort = "0.1%";
    if(total > 130) { kelas = "V"; mort = "29.2%"; }
    else if(total >= 91) { kelas = "IV"; mort = "8.2%"; }
    else if(total >= 71) { kelas = "III"; mort = "2.8%"; }
    else if(total > 0) { kelas = "II"; mort = "0.6%"; }
    document.getElementById('kelasRisiko').textContent = kelas;
    document.getElementById('mortalityRate').textContent = mort;
}

function printAndDownload() {
    const nama = document.getElementById('nama').value;
    const noMR = document.getElementById('noMR').value;
    const dpjp = document.getElementById('displayDPJP').textContent;
    if (!nama || noMR.length !== 10 || !dpjp) {
        alert("Lengkapi Data Pasien dan Nama DPJP.");
        return;
    }
    window.print();
}
