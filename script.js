// Format tanggal ke dd/mm/yyyy
function formatTanggal(dateString) {
    if (!dateString) return '-';
    
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Update display values untuk print
function updateDisplay() {
    document.getElementById('displayNama').textContent = document.getElementById('nama').value || '-';
    document.getElementById('displayTanggalLahir').textContent = formatTanggal(document.getElementById('tanggalLahir').value);
    document.getElementById('displayUmur').textContent = (document.getElementById('umur').value || '-') + (document.getElementById('umur').value ? ' Tahun' : '');
    document.getElementById('displayNoMR').textContent = document.getElementById('noMR').value || '-';
    document.getElementById('displayTanggalAssessment').textContent = formatTanggal(document.getElementById('tanggalAssessment').value);
    document.getElementById('displayJenisKelamin').textContent = document.getElementById('jenisKelamin').value || '-';
}

// Calculate age from date of birth
document.getElementById('tanggalLahir').addEventListener('change', function() {
    const dob = new Date(this.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    document.getElementById('umur').value = age;
    updateDisplay();
    calculateTotal();
});

// Update display ketika input berubah
document.getElementById('nama').addEventListener('input', updateDisplay);
document.getElementById('noMR').addEventListener('input', updateDisplay);
document.getElementById('tanggalAssessment').addEventListener('change', updateDisplay);
document.getElementById('jenisKelamin').addEventListener('change', function() {
    updateDisplay();
    calculateTotal();
});

// Calculate age score based on gender
function calculateAgeScore() {
    const age = parseInt(document.getElementById('umur').value) || 0;
    const gender = document.getElementById('jenisKelamin').value;
    
    let ageScore = 0;
    if (gender === 'Laki-laki') {
        ageScore = age;
    } else if (gender === 'Perempuan') {
        ageScore = Math.max(0, age - 10);
    }
    
    document.getElementById('scoreUsia').textContent = ageScore;
    return ageScore;
}

// Handle checkbox changes
document.querySelectorAll('.score-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const score = this.checked ? parseInt(this.dataset.score) : 0;
        const field = this.dataset.field;
        const scoreElement = document.getElementById('score' + field.charAt(0).toUpperCase() + field.slice(1));
        scoreElement.textContent = score;
        calculateTotal();
    });
});

// Calculate total score and risk classification
function calculateTotal() {
    let total = calculateAgeScore();
    
    document.querySelectorAll('.score-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
            total += parseInt(checkbox.dataset.score);
        }
    });
    
    document.getElementById('totalScore').textContent = total;
    
    // Determine risk classification based on PSI score
    let risiko, kelasRisiko, mortalityRate;
    
    if (total <= 70) {
        risiko = 'Rendah';
        kelasRisiko = 'II';
        mortalityRate = '0.6%';
    } else if (total >= 71 && total <= 90) {
        risiko = 'Rendah';
        kelasRisiko = 'III';
        mortalityRate = '2.8%';
    } else if (total >= 91 && total <= 130) {
        risiko = 'Sedang';
        kelasRisiko = 'IV';
        mortalityRate = '8.2%';
    } else if (total > 130) {
        risiko = 'Berat';
        kelasRisiko = 'V';
        mortalityRate = '29.2%';
    }
    
    document.getElementById('risiko').textContent = risiko;
    document.getElementById('kelasRisiko').textContent = kelasRisiko;
    document.getElementById('mortalityRate').textContent = mortalityRate;
}

// Update DPJP display
document.getElementById('namaDPJP').addEventListener('input', function() {
    document.getElementById('dpjpDisplay').textContent = this.value;
});

// Print and Download dengan nama file otomatis
// Perbaikan fungsi Print and Download dengan Validasi Lengkap
function printAndDownload() {
    // 1. Ambil semua nilai input untuk validasi
    const nama = document.getElementById('nama').value;
    const tglLahir = document.getElementById('tanggalLahir').value;
    const noMR = document.getElementById('noMR').value;
    const tglAssessment = document.getElementById('tanggalAssessment').value;
    const jenisKelamin = document.getElementById('jenisKelamin').value;
    const namaDPJP = document.getElementById('namaDPJP').value;

    // 2. Cek apakah semua field utama sudah diisi
    if (!nama || !tglLahir || !noMR || !tglAssessment || !jenisKelamin || !namaDPJP) {
        alert("Mohon lengkapi semua data pasien dan nama DPJP sebelum mencetak.");
        return;
    }

    // 3. Validasi No RM: Harus berisi angka dan tepat 10 digit
    const noMRRegex = /^\d{10}$/; 
    if (!noMRRegex.test(noMR)) {
        alert("Nomor Medical Record wajib berisi 10 digit angka.");
        return;
    }

    // 4. Update tampilan display sebelum dicetak
    updateDisplay();

    // 5. Set Judul Dokumen otomatis untuk nama file Save PDF
    // Format: "Nama Pasien - PSI Score"
    const originalTitle = document.title;
    document.title = `${nama} - PSI Score`;

    // 6. Trigger jendela print
    window.print();

    // 7. Kembalikan judul halaman ke aslinya setelah print selesai
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
}

// Reset form
function resetForm() {
    if (confirm('Apakah Anda yakin ingin mereset semua data?')) {
        document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"]').forEach(input => {
            input.value = '';
        });
        document.getElementById('jenisKelamin').value = '';
        document.querySelectorAll('.score-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.querySelectorAll('span[id^="score"]').forEach(span => {
            span.textContent = '0';
        });
        document.getElementById('totalScore').textContent = '0';
        document.getElementById('risiko').textContent = '-';
        document.getElementById('kelasRisiko').textContent = '-';
        document.getElementById('mortalityRate').textContent = '-';
        document.getElementById('dpjpDisplay').textContent = '';
        document.getElementById('umur').value = '';
        updateDisplay();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    calculateTotal();
    updateDisplay();
});
