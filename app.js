var API_URL = "https://script.google.com/macros/s/AKfycbxLDE2FlCxxlaw8jl13aRJvGiOwVfKoXmIYn-I173fSFVlU37Y9Oxj9LRncATOtRF02/exec";

var currentPage = 'dashboard';
var students = [];
var attendance = [];
var stats = {};
var rekapData = null;
var filterKelas = 'Semua';
var colors = ['blue','green','orange','purple','cyan'];
var listKelasSMP2 = ['VII A', 'VII B', 'VIII A', 'VIII B', 'VIII C', 'IX A', 'IX B', 'IX C'];
var regStream = null;
var uploadedImgData = null;

function callAPI(action, payload, callback) {
    var url = new URL(API_URL);
    url.searchParams.append('action', action);
    
    if(payload) {
        for(var key in payload) {
            if(typeof payload[key] === 'object') {
                url.searchParams.append(key, JSON.stringify(payload[key]));
            } else {
                url.searchParams.append(key, payload[key]);
            }
        }
    }

    fetch(url.toString(), { method: 'GET', mode: 'cors' })
    .then(res => res.json())
    .then(res => { if(callback) callback(res); })
    .catch(() => {
        fetch(url.toString(), { method: 'GET', mode: 'no-cors' }).then(() => {
            if(callback) callback({ success: true });
        }).catch(err => console.error(err));
    });
}

document.addEventListener('DOMContentLoaded', function(){
    var urlParams = new URLSearchParams(window.location.search);
    var pageParam = urlParams.get('page') || 'student';
    if(pageParam === 'admin') { initAdmin(); } else { initStudent(); }
});

// ================= RENDER ADMIN =================
function initAdmin() {
    var container = document.getElementById('app-container');
    if(!container) return;
    
    container.innerHTML = `
        <div class='app'>
            <aside class='sidebar'>
                <div class='sidebar-header'>
                    <div class='logo-icon'><i data-lucide='graduation-cap' style='width:22px;height:22px'></i></div>
                    <div class='logo-text'><h1>Admin LevelUp</h1><p>SMPN 2 Kawali</p></div>
                </div>
                <nav class='nav'>
                    <div class='nav-item active' data-page='dashboard' onclick='showPage("dashboard")'><i data-lucide='home'></i><span>Dashboard</span></div>
                    <div class='nav-item' data-page='laporan' onclick='showPage("laporan")'><i data-lucide='clipboard-check'></i><span>Laporan Kehadiran</span></div>
                    <div class='nav-item' data-page='rekap' onclick='showPage("rekap")'><i data-lucide='calendar-range'></i><span>Rekap Bulanan</span></div>
                    <div class='nav-item' data-page='siswa' onclick='showPage("siswa")'><i data-lucide='users'></i><span>Daftar Siswa</span></div>
                    <div class='nav-item' data-page='pengaturan' onclick='showPage("pengaturan")'><i data-lucide='settings'></i><span>Pengaturan</span></div>
                </nav>
                <div class='sidebar-footer'><div class='user'><div class='user-avatar'>S2K</div><div class='user-info'>Admin<p>SMPN 2 Kawali</p></div></div></div>
            </aside>
            <main class='main'>
                <div class='topbar'><h2 id='page-title'>Dashboard</h2><div class='topbar-right'>
                    <div class='search-box'><i data-lucide='search' style='width:16px;color:var(--gray)'></i><input type='text' placeholder='Cari siswa...'></div>
                </div></div>
                <div class='content' id='main-content'></div>
            </main>
        </div>
    `;
    lucide.createIcons();
    loadAdminData();
}

function loadAdminData() {
    callAPI('getStats', {}, function(r){ if(r.success) stats = r.stats; renderPage(); });
    callAPI('getAttendanceToday', {}, function(r){ if(r.success) attendance = r.attendance; renderPage(); });
    callAPI('getStudentList', {}, function(r){ if(r.success) students = r.students; renderPage(); });
}

function showPage(p) {
    currentPage = p;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    var el = document.querySelector('[data-page="' + p + '"]');
    if(el) el.classList.add('active');
    var t = {'dashboard':'Dashboard','laporan':'Laporan Kehadiran','rekap':'Rekap Bulanan','siswa':'Daftar Siswa','pengaturan':'Pengaturan'};
    var titleEl = document.getElementById('page-title');
    if(titleEl) titleEl.textContent = t[p];
    renderPage();
}

function renderPage() {
    if(currentPage==='dashboard') renderDashboard();
    else if(currentPage==='laporan') renderLaporan();
    else if(currentPage==='rekap') renderRekap();
    else if(currentPage==='siswa') renderSiswa();
    else if(currentPage==='pengaturan') renderPengaturan();
}

function renderDashboard() {
    var c = document.getElementById('main-content');
    if(!c) return;
    var verified = attendance.filter(a => a.faceMatch > 0.5).length;
    var pct = attendance.length > 0 ? ((verified/attendance.length)*100).toFixed(1) : '0';
    var feed = '';
    
    if(attendance.length > 0) {
        attendance.forEach((a) => {
            var badge = a.faceMatch > 0.5 ? (a.status === 'Terlambat' ? '<span class="feed-badge late">TERLAMBAT</span>' : '<span class="feed-badge verified">TERVERIFIKASI</span>') : '';
            var photoHtml = a.fotoAbsen ? `<img class="feed-photo" src="${a.fotoAbsen}">` : `<div class="feed-photo" style="display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:700;color:var(--primary)">${a.nama.substring(0,2)}</div>`;
            feed += `<div class="feed-card"><div class="feed-img">${photoHtml}${badge}<div class="feed-check"><i data-lucide="check" style="width:14px;height:14px"></i></div></div><div class="feed-info"><div class="feed-name">${a.nama}</div><div class="feed-class">${a.kelas}</div><div class="feed-time"><i data-lucide="clock" style="width:12px"></i> ${a.waktu} WIB</div></div></div>`;
        });
    } else {
        feed = `<div style="text-align:center;padding:80px 20px;color:var(--gray);grid-column:1/-1"><h3>Belum Ada Absensi Hari Ini</h3></div>`;
    }

    c.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-info"><h3>Total Hadir</h3><div class="value">${stats.totalHadir||0}</div></div><div class="stat-icon green"><i data-lucide="users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><h3>Terlambat</h3><div class="value">${stats.totalTerlambat||0}</div></div><div class="stat-icon orange"><i data-lucide="clock"></i></div></div>
            <div class="stat-card"><div class="stat-info"><h3>Belum Absen</h3><div class="value">${stats.belumAbsen||0}</div></div><div class="stat-icon red"><i data-lucide="user-x"></i></div></div>
            <div class="stat-card"><div class="stat-info"><h3>Akurasi AI</h3><div class="value">${pct}%</div></div><div class="stat-icon blue"><i data-lucide="scan-face"></i></div></div>
        </div>
        <div class="feed-header"><div class="feed-title">Feed Absensi Real-time <span class="live-badge"><span class="live-dot"></span> LIVE</span></div></div>
        <div class="feed-grid">${feed}</div>
    `;
    lucide.createIcons();
}

function renderLaporan() {
    var c = document.getElementById('main-content');
    if(!c) return;
    c.innerHTML = `<div class="page-header"><h1>Laporan Kehadiran</h1></div><div class="card"><div class="card-body"><table class="table"><thead><tr><th>Siswa</th><th>Kelas</th><th>Tanggal</th><th>Jam Masuk</th><th>Status</th></tr></thead><tbody id="lap-table"></tbody></table></div></div>`;
    var tb = document.getElementById('lap-table');
    var h = '';
    attendance.forEach(a => {
        h += `<tr><td>${a.nama}</td><td>${a.kelas}</td><td>${a.tanggal}</td><td>${a.waktu}</td><td><span class="badge badge-success">${a.status}</span></td></tr>`;
    });
    tb.innerHTML = h || '<tr><td colspan="5" style="text-align:center">Tidak ada data</td></tr>';
    lucide.createIcons();
}

function renderRekap() {
    var c = document.getElementById('main-content');
    if(!c) return;
    c.innerHTML = `<div class="page-header"><h1>Rekap Bulanan</h1></div><div class="card"><div class="card-body" id="rekap-content">Memuat rekap...</div></div>`;
    callAPI('getMonthlyRecap', {month: new Date().getMonth()+1, year: new Date().getFullYear()}, function(r){
        if(r.success) {
            rekapData = r;
            var rc = document.getElementById('rekap-content');
            var h = `<table class="table"><thead><tr><th>Siswa</th><th>Kelas</th><th>H</th><th>T</th><th>S</th><th>I</th><th>A</th></tr></thead><tbody>`;
            r.students.forEach(s => {
                h += `<tr><td>${s.nama}</td><td>${s.kelas}</td><td>${s.totals.H}</td><td>${s.totals.T}</td><td>${s.totals.S}</td><td>${s.totals.I}</td><td>${s.totals.A}</td></tr>`;
            });
            rc.innerHTML = h + `</tbody></table>`;
        }
    });
}

function renderSiswa() {
    var c = document.getElementById('main-content');
    if(!c) return;
    c.innerHTML = `<div class="page-header"><h1>Daftar Siswa</h1><div class="header-actions"><button class="btn btn-primary" onclick="showAddModal()">Tambah Siswa</button></div></div><div class="card"><div class="card-body" style="padding:0"><table class="table"><thead><tr><th>Nama</th><th>Barcode</th><th>Kelas</th><th>Status Wajah</th><th>Aksi</th></tr></thead><tbody id="siswa-table"></tbody></table></div></div>`;
    var tb = document.getElementById('siswa-table');
    var h = '';
    students.forEach((s) => {
        var fb = s.hasFace ? '<span class="badge badge-success"><i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:middle"></i> Terverifikasi</span>' : `<button class="btn btn-outline" style="padding:4px 10px;font-size:12px" onclick="regFace('${s.id}','${s.nama}')"><i data-lucide="camera" style="width:14px;height:14px;vertical-align:middle"></i> Register</button>`;
        h += `<tr><td>${s.nama}</td><td>${s.barcode}</td><td>${s.kelas}</td><td>${fb}</td><td><button class="btn btn-danger" style="padding:4px 8px" onclick="deleteSiswa('${s.id}')">Hapus</button></td></tr>`;
    });
    tb.innerHTML = h || '<tr><td colspan="5" style="text-align:center">Belum ada siswa</td></tr>';
    lucide.createIcons();
}

function renderPengaturan() {
    var c = document.getElementById('main-content');
    if(!c) return;
    c.innerHTML = `<div class="page-header"><h1>Pengaturan</h1></div><div class="card"><div class="card-body"><label>Jam Terlambat</label><input type="time" id="set-jam" class="form-input" value="07:15"><button class="btn btn-primary" style="margin-top:10px" onclick="saveSettings()">Simpan</button></div></div>`;
}

function showAddModal() {
    var optKelas = listKelasSMP2.map(k => `<option value="${k}">${k}</option>`).join('');
    var m = document.getElementById('modal');
    if(!m) return;
    m.innerHTML = `<div class="modal"><div class="modal-header"><span>Tambah Siswa SMPN 2 Kawali</span><button class="modal-close" onclick="closeModal()">&times;</button></div><div class="modal-body"><div class="form-group"><label>Barcode / NIS</label><input type="text" id="add-bc" class="form-input"></div><div class="form-group"><label>Nama Lengkap</label><input type="text" id="add-nama" class="form-input"></div><div class="form-group"><label>Pilih Kelas</label><select id="add-kelas" class="form-select">${optKelas}</select></div></div><div class="modal-footer"><button class="btn btn-primary" onclick="submitAdd()">Simpan</button></div></div>`;
    m.classList.add('active');
}

function submitAdd() {
    var bc = document.getElementById('add-bc').value;
    var nm = document.getElementById('add-nama').value;
    var kl = document.getElementById('add-kelas').value;
    if(!bc || !nm) { showToast('Lengkapi data', 'error'); return; }
    callAPI('addStudent', {barcode: bc, nama: nm, kelas: kl}, function(r){
        if(r.success) { showToast('Berhasil!', 'success'); closeModal(); loadAdminData(); }
    });
}

function deleteSiswa(id) {
    if(confirm('Hapus siswa?')) {
        callAPI('deleteStudent', {id: id}, function(r){ if(r.success) loadAdminData(); });
    }
}

// --- FITUR REGISTER WAJAH DENGAN KAMERA LANGSUNG & UPLOAD + TOMBOL SIMPAN ---
function regFace(id, nm) {
    uploadedImgData = null;
    var m = document.getElementById('modal');
    if(!m) return;
    m.innerHTML = `
        <div class="modal" style="max-width:500px">
            <div class="modal-header"><span>Register Wajah - ${nm}</span><button class="modal-close" onclick="closeModal(); stopRegCam();">&times;</button></div>
            <div class="modal-body">
                <div class="camera-box" style="margin-bottom:10px">
                    <video id="reg-video" class="camera-video" autoplay playsinline style="height:220px"></video>
                </div>
                <div style="display:flex;gap:10px;margin-bottom:15px">
                    <button class="btn btn-primary" style="flex:1" onclick="captureRegCam()"><i data-lucide="camera" style="width:16px"></i> Ambil dari Kamera</button>
                    <button class="btn btn-outline" style="flex:1" onclick="document.getElementById('reg-file-in').click()"><i data-lucide="upload" style="width:16px"></i> Upload Foto</button>
                    <input type="file" id="reg-file-in" accept="image/*" style="display:none" onchange="previewRegFile(this)">
                </div>
                <div id="reg-preview-box" style="text-align:center;display:none;margin-bottom:15px">
                    <p style="font-size:12px;color:var(--gray);margin-bottom:5px">Preview Foto:</p>
                    <img id="reg-preview-img" style="max-height:150px;border-radius:8px;object-fit:contain">
                </div>
                <div class="face-status loading" id="reg-status" style="display:none">Memproses wajah...</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeModal(); stopRegCam();">Batal</button>
                <button class="btn btn-success" id="reg-save-btn" disabled onclick="saveRegisteredFace('${id}')"><i data-lucide="save" style="width:16px"></i> Simpan Wajah</button>
            </div>
        </div>
    `;
    m.classList.add('active');
    lucide.createIcons();
    startRegCam();
}

function startRegCam() {
    navigator.mediaDevices.getUserMedia({video: {facingMode:'user', width:640, height:480}}).then(stream => {
        regStream = stream;
        var v = document.getElementById('reg-video');
        if(v) v.srcObject = stream;
    }).catch(() => {
        showToast('Kamera tidak dapat diakses', 'error');
    });
}

function stopRegCam() {
    if(regStream) {
        regStream.getTracks().forEach(t => t.stop());
        regStream = null;
    }
}

function captureRegCam() {
    var v = document.getElementById('reg-video');
    if(!v) return;
    var cv = document.createElement('canvas');
    cv.width = v.videoWidth || 640;
    cv.height = v.videoHeight || 480;
    cv.getContext('2d').drawImage(v, 0, 0);
    uploadedImgData = cv.toDataURL('image/jpeg', 0.5);
    
    var prev = document.getElementById('reg-preview-box');
    var prevImg = document.getElementById('reg-preview-img');
    if(prev && prevImg) {
        prev.style.display = 'block';
        prevImg.src = uploadedImgData;
    }
    var saveBtn = document.getElementById('reg-save-btn');
    if(saveBtn) saveBtn.disabled = false;
    showToast('Foto berhasil diambil dari kamera', 'success');
}

function previewRegFile(input) {
    if(input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            uploadedImgData = e.target.result;
            var prev = document.getElementById('reg-preview-box');
            var prevImg = document.getElementById('reg-preview-img');
            if(prev && prevImg) {
                prev.style.display = 'block';
                prevImg.src = uploadedImgData;
            }
            var saveBtn = document.getElementById('reg-save-btn');
            if(saveBtn) saveBtn.disabled = false;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function saveRegisteredFace(id) {
    if(!uploadedImgData) {
        showToast('Ambil atau upload foto terlebih dahulu', 'error');
        return;
    }

    var statusEl = document.getElementById('reg-status');
    var saveBtn = document.getElementById('reg-save-btn');
    if(statusEl) {
        statusEl.style.display = 'block';
        statusEl.className = 'face-status loading';
        statusEl.textContent = 'Mendeteksi fitur wajah dengan AI...';
    }
    if(saveBtn) saveBtn.disabled = true;

    var img = new Image();
    img.onload = function() {
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
            faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
            faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
        ]).then(() => {
            faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor().then(d => {
                if(d) {
                    if(statusEl) statusEl.textContent = 'Menyimpan ke Database...';
                    callAPI('registerFace', {
                        data: JSON.stringify({
                            studentId: id,
                            faceDescriptor: Array.from(d.descriptor),
                            fotoURL: uploadedImgData
                        })
                    }, function(r){
                        stopRegCam();
                        closeModal();
                        if(r.success) {
                            showToast('Wajah berhasil didaftarkan!', 'success');
                            loadAdminData();
                        } else {
                            showToast('Gagal menyimpan ke server', 'error');
                        }
                    });
                } else {
                    if(statusEl) {
                        statusEl.className = 'face-status error';
                        statusEl.textContent = 'Wajah tidak terdeteksi dalam foto. Pastikan pencahayaan cukup dan wajah menghadap depan!';
                    }
                    if(saveBtn) saveBtn.disabled = false;
                }
            }).catch(err => {
                if(statusEl) {
                    statusEl.className = 'face-status error';
                    statusEl.textContent = 'Error AI: ' + err.message;
                }
                if(saveBtn) saveBtn.disabled = false;
            });
        }).catch(() => {
            if(statusEl) {
                statusEl.className = 'face-status error';
                statusEl.textContent = 'Gagal memuat model face-api';
            }
            if(saveBtn) saveBtn.disabled = false;
        });
    };
    img.src = uploadedImgData;
}

function closeModal() { 
    stopRegCam();
    var m = document.getElementById('modal');
    if(m) m.classList.remove('active'); 
}

function saveSettings() {
    var jamInput = document.getElementById('set-jam');
    if(!jamInput) return;
    callAPI('updateSettings', {settings: JSON.stringify({jamTerlambat: jamInput.value})}, function(r){ if(r.success) showToast('Tersimpan', 'success'); });
}

// ================= RENDER STUDENT / ABSENSI =================
function initStudent() {
    var container = document.getElementById('app-container');
    if(!container) return;
    
    container.innerHTML = `
        <div class='student-page'>
            <div class='att-box'>
                <div class='att-header'><h1>SMPN 2 Kawali</h1><p>Absensi Digital Berbasis AI</p></div>
                <div class='att-body' id='student-content'></div>
            </div>
        </div>
    `;
    showStudentOptions();
}

function showStudentOptions() {
    var c = document.getElementById('student-content');
    if(!c) return;
    c.innerHTML = `
        <button class="opt-btn" onclick="startDirectFaceAttendance()">
            <div class="opt-icon blue"><i data-lucide="scan-face"></i></div>
            <div class="opt-text"><h3>Scan Wajah Langsung</h3><p>Absen cepat tanpa barcode</p></div>
        </button>
        <button class="opt-btn" onclick="startScanner()">
            <div class="opt-icon green"><i data-lucide="scan-barcode"></i></div>
            <div class="opt-text"><h3>Scan Barcode</h3><p>Pindai kartu pelajar (Alternatif)</p></div>
        </button>
        <button class="opt-btn" onclick="showManual()">
            <div class="opt-icon purple"><i data-lucide="keyboard"></i></div>
            <div class="opt-text"><h3>Input NIS / Barcode</h3><p>Ketik manual (Alternatif)</p></div>
        </button>
        <button class="opt-btn" onclick="showSick()">
            <div class="opt-icon orange"><i data-lucide="thermometer"></i></div>
            <div class="opt-text"><h3>Sakit / Izin</h3><p>Form ketidakhadiran</p></div>
        </button>
    `;
    lucide.createIcons();
}

function startDirectFaceAttendance() {
    var c = document.getElementById('student-content');
    if(!c) return;
    c.innerHTML = `
        <div class="camera-box"><video id="direct-video" class="camera-video" autoplay playsinline></video></div>
        <div class="face-status loading" id="df-status">Memuat AI Model & Kamera...</div>
        <button class="btn btn-success" style="width:100%" id="df-btn" disabled onclick="processDirectFace()">Verifikasi Wajah</button>
        <button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="stopStudentCam();showStudentOptions()">Kembali</button>
    `;
    lucide.createIcons();

    navigator.mediaDevices.getUserMedia({video: {facingMode:'user', width:640, height:480}}).then(stream => {
        window.studentStream = stream;
        var videoEl = document.getElementById('direct-video');
        if(videoEl) videoEl.srcObject = stream;
        
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
            faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
            faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
        ]).then(() => {
            var statusEl = document.getElementById('df-status');
            var btnEl = document.getElementById('df-btn');
            if(statusEl) {
                statusEl.className = 'face-status success';
                statusEl.textContent = 'Kamera & AI Siap. Silakan Posisikan Wajah!';
            }
            if(btnEl) btnEl.disabled = false;
        }).catch(() => {
            var statusEl = document.getElementById('df-status');
            if(statusEl) {
                statusEl.className = 'face-status error';
                statusEl.textContent = 'Gagal memuat AI model';
            }
        });
    }).catch(() => {
        var statusEl = document.getElementById('df-status');
        if(statusEl) {
            statusEl.className = 'face-status error';
            statusEl.textContent = 'Kamera tidak diizinkan';
        }
    });
}

function stopStudentCam() {
    if(window.studentStream) {
        window.studentStream.getTracks().forEach(t => t.stop());
        window.studentStream = null;
    }
}

function processDirectFace() {
    var v = document.getElementById('direct-video');
    if(!v) return;
    var cv = document.createElement('canvas');
    cv.width = v.videoWidth || 640;
    cv.height = v.videoHeight || 480;
    cv.getContext('2d').drawImage(v, 0, 0);
    
    var statusEl = document.getElementById('df-status');
    var btnEl = document.getElementById('df-btn');
    if(statusEl) {
        statusEl.className = 'face-status loading';
        statusEl.textContent = 'Mencocokkan wajah dengan database...';
    }
    if(btnEl) btnEl.disabled = true;

    faceapi.detectSingleFace(cv, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor().then(d => {
        if(!d) {
            if(statusEl) {
                statusEl.className = 'face-status error';
                statusEl.textContent = 'Wajah tidak terdeteksi. Coba lagi!';
            }
            if(btnEl) btnEl.disabled = false;
            return;
        }

        var scannedDesc = d.descriptor;

        callAPI('getStudentList', {}, function(res) {
            if(!res.success || res.students.length === 0) {
                showToast('Database siswa kosong', 'error');
                return;
            }

            var matchedStudent = null;
            var minDistance = 0.6;

            res.students.forEach(stu => {
                if(stu.faceDescriptor) {
                    var dist = faceapi.euclideanDistance(scannedDesc, new Float32Array(stu.faceDescriptor));
                    if(dist < minDistance) {
                        minDistance = dist;
                        matchedStudent = stu;
                    }
                }
            });

            if(matchedStudent) {
                var faceMatchScore = Math.max(0, 1 - minDistance);
                var photoBase64 = cv.toDataURL('image/jpeg', 0.4);
                
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(pos => {
                        submitAttendanceRecord(matchedStudent, photoBase64, faceMatchScore, pos.coords.latitude, pos.coords.longitude);
                    }, () => {
                        submitAttendanceRecord(matchedStudent, photoBase64, faceMatchScore, "", "");
                    });
                } else {
                    submitAttendanceRecord(matchedStudent, photoBase64, faceMatchScore, "", "");
                }
            } else {
                if(statusEl) {
                    statusEl.className = 'face-status error';
                    statusEl.textContent = 'Wajah tidak dikenali dalam sistem!';
                }
                if(btnEl) btnEl.disabled = false;
            }
        });
    });
}

function submitAttendanceRecord(student, photo, fm, lat, lng) {
    stopStudentCam();
    callAPI('recordAttendance', {
        data: JSON.stringify({
            studentId: student.id,
            nama: student.nama,
            kelas: student.kelas,
            fotoAbsen: photo,
            faceMatch: fm,
            latitude: lat,
            longitude: lng,
            alamat: "Kawasan Sekolah SMPN 2 Kawali"
        })
    }, function(r){
        if(r.success) {
            showSuccessScreen(r.status, r.time, fm, student);
        } else {
            showToast('Gagal merekam absen', 'error');
            showStudentOptions();
        }
    });
}

function showSuccessScreen(st, tm, fm, student) {
    var c = document.getElementById('student-content');
    if(!c) return;
    var col = st === 'Terlambat' ? 'var(--warning)' : 'var(--success)';
    c.innerHTML = `
        <div class="success-screen">
            <div class="success-icon" style="background:${col}"><i data-lucide="check" style="width:40px;height:40px"></i></div>
            <h2 style="color:${col};margin-bottom:10px">Absensi Berhasil!</h2>
            <strong>${student.nama}</strong><p style="color:var(--gray)">${student.kelas}</p>
            <div style="background:var(--bg);padding:15px;border-radius:8px;margin:20px 0;text-align:left">
                <p><strong>Status:</strong> ${st}</p>
                <p><strong>Waktu:</strong> ${tm} WIB</p>
                <p><strong>Verifikasi AI:</strong> ${fm > 0.5 ? 'Cocok (Terverifikasi)' : 'Berhasil'}</p>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="showStudentOptions()">Selesai / Absen Lain</button>
        </div>
    `;
    lucide.createIcons();
}

function showManual() {
    var c = document.getElementById('student-content');
    if(!c) return;
    c.innerHTML = `<div class="form-group"><label>NIS / Barcode</label><input type="text" id="bc-manual" class="form-input"></div><button class="btn btn-primary" style="width:100%" onclick="findStudentManual()">Proses Absen</button><button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="showStudentOptions()">Kembali</button>`;
}

function findStudentManual() {
    var inputEl = document.getElementById('bc-manual');
    if(!inputEl) return;
    var bc = inputEl.value.trim();
    if(!bc) { showToast('Masukkan NIS/Barcode', 'error'); return; }
    callAPI('getStudentByBarcode', {barcode: bc}, function(r){
        if(r.success) {
            submitAttendanceRecord(r.student, "", 0.8, "", "");
        } else {
            showToast('Siswa tidak ditemukan', 'error');
        }
    });
}

function startScanner() {
    var c = document.getElementById('student-content');
    if(!c) return;
    c.innerHTML = `<div id="scanner" style="width:100%;height:260px"></div><button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="stopScan();showStudentOptions()">Batal</button>`;
    try {
        window.scanner = new Html5Qrcode('scanner');
        window.scanner.start({facingMode:'environment'}, {fps:10, qrbox:{width:250, height:100}}, code => {
            stopScan();
            callAPI('getStudentByBarcode', {barcode: code}, function(r){
                if(r.success) { submitAttendanceRecord(r.student, "", 0.8, "", ""); }
                else { showToast('Barcode tidak terdaftar', 'error'); showStudentOptions(); }
            });
        }, () => {});
    } catch(e) { showToast('Scanner Error', 'error'); showStudentOptions(); }
}

function stopScan() { if(window.scanner) { try{ window.scanner.stop(); }catch(e){} } }

function showSick() {
    var c = document.getElementById('student-content');
    if(!c) return;
    c.innerHTML = `<div class="form-group"><label>Barcode / NIS</label><input type="text" id="s-bc" class="form-input"></div><div class="form-group"><label>Status</label><select id="s-st" class="form-select"><option value="Sakit">Sakit</option><option value="Izin">Izin</option></select></div><div class="form-group"><label>Keterangan</label><textarea id="s-kt" class="form-input"></textarea></div><button class="btn btn-primary" style="width:100%" onclick="submitSickLeave()">Kirim</button><button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="showStudentOptions()">Kembali</button>`;
}

function submitSickLeave() {
    var bcEl = document.getElementById('s-bc');
    var stEl = document.getElementById('s-st');
    var ktEl = document.getElementById('s-kt');
    if(!bcEl || !stEl || !ktEl) return;
    
    var bc = bcEl.value;
    var st = stEl.value;
    var kt = ktEl.value;
    
    callAPI('getStudentByBarcode', {barcode: bc}, function(r){
        if(r.success) {
            callAPI('submitSickLeave', {studentId: r.student.id, nama: r.student.nama, kelas: r.student.kelas, status: st, keterangan: kt}, function(res){
                if(res.success) { showToast('Tersimpan', 'success'); showStudentOptions(); }
            });
        } else { showToast('Siswa tidak ditemukan', 'error'); }
    });
}

function showToast(msg, type) {
    var tc = document.getElementById('toasts');
    if(!tc) return;
    var d = document.createElement('div');
    d.className = 'toast ' + (type === 'error' ? 'error' : '');
    d.textContent = msg;
    tc.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}
