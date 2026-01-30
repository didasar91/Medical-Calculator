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

document.getElementById('nama').addEventListener('input', e => document.getElementById('displayNama').textContent = e.target.value || '-');
document.getElementById('noMR').addEventListener('input', e => document.getElementById('displayNoMR').textContent = e.target.value || '-');
document.getElementById('inputDPJP').addEventListener('input', e => document.getElementById('displayDPJP').textContent = e.target.value || '');
document.getElementById('tglAsesmen').addEventListener('change', e => document.getElementById('displayTglAsesmen').textContent = e.target.value || '-');

document.getElementById('tglLahir').addEventListener('change', updateStats);
document.getElementById('jk').addEventListener('change', updateStats);
['bb', 'naSerum', 'naInfus', 'targetNa'].forEach(id => {
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
    
    document.getElementById('displayTglLahir').textContent = tgl;
    document.getElementById('displayUmur').textContent = age + " Tahun";
    const jk = document.getElementById('jk').value;
    document.getElementById('scoreUsia').textContent = (jk === 'P') ? Math.max(0, age - 10) : age;
    
    calculatePSI();
    calculateNatrium();
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

function calculateNatrium() {
    const bb = parseFloat(document.getElementById('bb').value);
    const naSerum = parseFloat(document.getElementById('naSerum').value);
    const naInfus = parseFloat(document.getElementById('naInfus').value);
    const target = parseFloat(document.getElementById('targetNa').value) || 8;
    const jk = document.getElementById('jk').value;
    const ageText = document.getElementById('displayUmur').textContent;
    const age = parseInt(ageText) || 30;

    if(!bb || !naSerum || !jk) return;

    let factor = 0.6; 
    if (age > 18) {
        if (jk === 'P') {
            factor = (age > 65) ? 0.45 : 0.5;
        } else {
            factor = (age > 65) ? 0.5 : 0.6;
        }
    }
    
    const tbw = bb * factor;
    const deltaPerLiter = (naInfus - naSerum) / (tbw + 1);
    const totalVolumeMl = (target / deltaPerLiter) * 1000;
    const botolCount = Math.ceil(totalVolumeMl / 500); 
    const speed = totalVolumeMl / 24;

    const selectInfus = document.getElementById('naInfus');
    const namaCairan = selectInfus.options[selectInfus.selectedIndex].text.split(' (')[0];

    document.getElementById('txtTBW').textContent = tbw.toFixed(1) + " L";
    document.getElementById('txtDelta').textContent = deltaPerLiter.toFixed(2) + " mEq/L";
    document.getElementById('txtTotalVol').textContent = Math.round(totalVolumeMl) + " mL";
    document.getElementById('txtBotolDisplay').textContent = botolCount + " Botol " + namaCairan + " 500 mL";
    document.getElementById('txtKecepatan').textContent = speed.toFixed(1) + " mL/jam";
    
    document.getElementById('displayDelta').textContent = deltaPerLiter.toFixed(2);
    document.getElementById('displayBotol').textContent = botolCount + " Botol";
}

function printAndDownload() {
    const nama = document.getElementById('nama').value;
    const noMR = document.getElementById('noMR').value;
    const dpjp = document.getElementById('inputDPJP').value;

    if (!nama || !noMR || !dpjp) {
        alert("Lengkapi Data Pasien dan Nama DPJP.");
        return;
    }
    if (noMR.length !== 10) {
        alert("No. MR harus tepat 10 digit.");
        return;
    }
    document.title = nama + " - " + currentMode.toUpperCase();
    window.print();
}
