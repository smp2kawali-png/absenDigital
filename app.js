// GANTI DENGAN URL WEB APP GAS ANDA
const API_URL = "https://script.google.com/macros/s/AKfycby.../exec";

const KELAS_LIST = ["VII A", "VII B", "VIII A", "VIII B", "VIII C", "IX A", "IX B", "IX C"];
let currentMode = "student"; // 'student' atau 'admin'
let students = [], attendance = [], stats = {}, rekapData = null;
let filterKelas = "Semua", uploadedImg = null, videoStream = null;
let registeredFacesDatabase = [];

document.addEventListener("DOMContentLoaded", function () {
    injectCSS();
    // Deteksi URL parameter (?page=admin atau default student)
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get("page") === "admin" ? "admin" : "student";
    
    if (currentMode === "admin") {
        renderAdminHTML();
        loadAdminData();
    } else {
        renderStudentHTML();
    }
    lucide.createIcons();
});

// --- API HELPER (AJAX ke Google Apps Script) ---
function callAPI(action, data = {}, callback) {
    let url = `${API_URL}?action=${action}`;
    if (data && Object.keys(data).length > 0 && action !== 'recordAttendance' && action !== 'registerFace') {
        for (let k in data) url += `&${k}=${encodeURIComponent(data[k])}`;
        fetch(url).then(res => res.json()).then(res => callback(res)).catch(err => showToast("Koneksi Error", "error"));
    } else {
        fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: action, ...data })
        }).then(res => res.json()).then(res => callback(res)).catch(err => showToast("Koneksi Error", "error"));
    }
}

// --- CSS STYLING LENGKAP ---
function injectCSS() {
    document.getElementById("app-style").innerHTML = `
    *{margin:0;padding:0;box-sizing:border-box}:root{--primary:#3b82f6;--success:#22c55e;--warning:#f59e0b;--danger:#ef4444;--info:#06b6d4;--purple:#8b5cf6;--bg:#f8fafc;--white:#fff;--border:#e5e7eb;--text:#1f2937;--gray:#6b7280}body{font-family:Poppins,sans-serif;background:var(--bg);color:var(--text)}.app{display:flex;min-height:100vh}.sidebar{width:240px;background:var(--white);border-right:1px solid var(--border);position:fixed;top:0;left:0;bottom:0;display:flex;flex-direction:column}.sidebar-header{padding:20px;display:flex;align-items:center;gap:12px}.logo-icon{width:40px;height:40px;background:var(--info);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff}.logo-text h1{font-size:15px;font-weight:700}.logo-text p{font-size:11px;color:var(--gray)}.nav{flex:1;padding:10px 0}.nav-item{display:flex;align-items:center;gap:12px;padding:12px 20px;color:var(--gray);cursor:pointer;font-size:14px;font-weight:500;margin:2px 10px;border-radius:8px}.nav-item:hover{background:var(--bg);color:var(--text)}.nav-item.active{background:var(--primary);color:#fff}.main{flex:1;margin-left:240px}.topbar{background:var(--white);padding:15px 25px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)}.content{padding:25px}.card{background:var(--white);border-radius:12px;border:1px solid var(--border);margin-bottom:20px}.card-body{padding:20px}.btn{padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:Poppins}.btn-primary{background:var(--primary);color:#fff}.btn-success{background:var(--success);color:#fff}.btn-danger{background:var(--danger);color:#fff}.btn-outline{background:var(--white);border:1px solid var(--border);color:var(--text)}.table{width:100%;border-collapse:collapse}.table th{padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;color:var(--gray);border-bottom:1px solid var(--border)}.table td{padding:14px 16px;border-bottom:1px solid var(--border);font-size:13px}.student-page{min-height:100vh;background:linear-gradient(135deg,var(--primary),#1d4ed8);display:flex;align-items:center;justify-content:center;padding:20px}.att-box{background:var(--white);border-radius:20px;width:100%;max-width:450px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.2)}.att-header{background:linear-gradient(135deg,var(--primary),#1d4ed8);color:#fff;padding:30px;text-align:center}.att-body{padding:25px}.opt-btn{display:flex;align-items:center;gap:15px;padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--white);cursor:pointer;width:100%;margin-bottom:12px;text-align:left}.opt-btn:hover{border-color:var(--primary);background:#eff6ff}.camera-box{width:100%;border-radius:12px;overflow:hidden;background:#000;margin-bottom:15px;position:relative}.camera-video{width:100%;height:320px;object-fit:cover}.face-status{padding:12px;border-radius:8px;text-align:center;font-size:13px;margin-bottom:15px;font-weight:500}.face-status.loading{background:#fef3c7;color:#b45309}.face-status.success{background:#dcfce7;color:#16a34a}.face-status.error{background:#fee2e2;color:#dc2626}.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;z-index:1000}.modal-overlay.active{display:flex}.modal{background:var(--white);border-radius:16px;width:100%;max-width:450px}.modal-header{padding:20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}.modal-body{padding:20px}.modal-footer{padding:15px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px}.form-group{margin-bottom:15px}.form-label{display:block;margin-bottom:6px;font-size:13px;font-weight:500}.form-input,.form-select{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:Poppins}.toast-container{position:fixed;top:20px;right:20px;z-index:9999}.toast{background:var(--white);padding:12px 20px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.1);margin-bottom:10px;border-left:4px solid var(--success);font-size:13px}.toast.error{border-left-color:var(--danger)}
    `;
}

// ==================== SISWA & ABSENSI LANGSUNG SCAN WAJAH ====================
function renderStudentHTML() {
    document.getElementById("app-container").innerHTML = `
        <div class="student-page">
            <div class="att-box">
                <div class="att-header">
                    <h1>SMPN 2 Kawali</h1>
                    <p>Absensi Digital Berbasis AI Wajah</p>
                </div>
                <div class="att-body" id="student-content">
                    <!-- Dinamis Konten Siswa -->
                </div>
            </div>
        </div>
    `;
    showStudentMenu();
}

function showStudentMenu() {
    stopCam();
    document.getElementById("student-content").innerHTML = `
        <button class="opt-btn" onclick="startDirectFaceRecognition()">
            <div class="opt-icon blue" style="background:#eff6ff;color:var(--primary);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center"><i data-lucide="scan-face"></i></div>
            <div><h3>Absen Wajah Langsung</h3><p>AI mengenali wajah Anda otomatis</p></div>
        </button>
        <button class="opt-btn" onclick="startScanner()">
            <div class="opt-icon green" style="background:#dcfce7;color:var(--success);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center"><i data-lucide="scan-barcode"></i></div>
            <div><h3>Scan Barcode / NIS</h3><p>Alternatif kartu pelajar</p></div>
        </button>
        <button class="opt-btn" onclick="showSickForm()">
            <div class="opt-icon purple" style="background:#ede9fe;color:var(--purple);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center"><i data-lucide="thermometer"></i></div>
            <div><h3>Sakit / Izin</h3><p>Kirim keterangan tidak hadir</p></div>
        </button>
        <div style="text-align:center;margin-top:15px">
            <a href="?page=admin" style="font-size:12px;color:var(--gray);text-decoration:none;">Login Portal Admin</a>
        </div>
    `;
    lucide.createIcons();
}

// Fitur Baru: Direct Face Recognition (Tanpa Scan Barcode/NIS)
function startDirectFaceRecognition() {
    document.getElementById("student-content").innerHTML = `
        <div class="camera-box">
            <video id="selfie-video" class="camera-video" autoplay playsinline></video>
        </div>
        <div class="face-status loading" id="fs">Memuat Model AI & Data Wajah...</div>
        <button class="btn btn-primary" style="width:100%" id="sbtn" disabled onclick="processDirectFace()">Verifikasi Wajah</button>
        <button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="stopCam();showStudentMenu()">Kembali</button>
    `;
    lucide.createIcons();
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
    .then(stream => {
        videoStream = stream;
        document.getElementById("selfie-video").srcObject = stream;
        loadFaceModelsAndStudents();
    })
    .catch(err => {
        document.getElementById("fs").className = "face-status error";
        document.getElementById("fs").textContent = "Gagal mengakses kamera!";
    });
}

function loadFaceModelsAndStudents() {
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
    ]).then(() => {
        document.getElementById("fs").textContent = "Mengunduh Database Wajah Siswa...";
        callAPI("getAllStudentsForFaceMatch", {}, res => {
            if (res.success && res.students.length > 0) {
                registeredFacesDatabase = res.students.map(s => {
                    return {
                        id: s.id,
                        nama: s.nama,
                        kelas: s.kelas,
                        descriptor: new Float32Array(s.faceDescriptor)
                    };
                });
                document.getElementById("fs").className = "face-status success";
                document.getElementById("fs").textContent = "Kamera Siap, Posisikan Wajah Anda!";
                document.getElementById("sbtn").disabled = false;
            } else {
                document.getElementById("fs").className = "face-status error";
                document.getElementById("fs").textContent = "Belum ada siswa yang mendaftarkan wajah di Admin!";
            }
        });
    }).catch(err => {
        document.getElementById("fs").className = "face-status error";
        document.getElementById("fs").textContent = "Gagal memuat AI Model.";
    });
}

function processDirectFace() {
    const video = document.getElementById("selfie-video");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);

    document.getElementById("fs").textContent = "Mencocokkan Wajah...";
    document.getElementById("sbtn").disabled = true;

    faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
    .then(detection => {
        if (!detection) {
            document.getElementById("fs").className = "face-status error";
            document.getElementById("fs").textContent = "Wajah tidak terdeteksi. Coba lagi.";
            document.getElementById("sbtn").disabled = false;
            return;
        }

        let bestMatch = { distance: 1.0, student: null };
        for (let student of registeredFacesDatabase) {
            let dist = faceapi.euclideanDistance(detection.descriptor, student.descriptor);
            if (dist < bestMatch.distance) {
                bestMatch.distance = dist;
                bestMatch.student = student;
            }
        }

        // Threshold pencocokan wajah (0.5 ke bawah dianggap mirip)
        if (bestMatch.student && bestMatch.distance < 0.55) {
            let fm = Math.max(0, 1 - bestMatch.distance);
            let photoUrl = canvas.toDataURL("image/jpeg", 0.3);
            
            callAPI("recordAttendance", {
                studentId: bestMatch.student.id,
                nama: bestMatch.student.nama,
                kelas: bestMatch.student.kelas,
                fotoAbsen: photoUrl,
                faceMatch: fm
            }, res => {
                stopCam();
                if (res.success) {
                    showSuccessScreen(bestMatch.student.nama, bestMatch.student.kelas, res.status, res.time, fm);
                } else {
                    showToast("Gagal menyimpan absensi", "error");
                    showStudentMenu();
                }
            });
        } else {
            document.getElementById("fs").className = "face-status error";
            document.getElementById("fs").textContent = "Wajah tidak dikenali dalam database!";
            document.getElementById("sbtn").disabled = false;
        }
    }).catch(err => {
        document.getElementById("fs").className = "face-status error";
        document.getElementById("fs").textContent = "Error AI: " + err.message;
        document.getElementById("sbtn").disabled = false;
    });
}

function stopCam() {
    if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        videoStream = null;
    }
}

function showSuccessScreen(nama, kelas, status, waktu, fm) {
    document.getElementById("student-content").innerHTML = `
        <div style="text-align:center;padding:10px">
            <div style="width:70px;height:70px;background:var(--success);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:32px">✓</div>
            <h2 style="color:var(--success);margin-bottom:5px">Absensi Berhasil!</h2>
            <h3 style="font-size:16px">${nama}</h3>
            <p style="color:var(--gray);font-size:13px">${kelas}</p>
            <div style="background:var(--bg);padding:12px;border-radius:8px;margin:15px 0;text-align:left;font-size:13px">
                <p><strong>Status:</strong> ${status}</p>
                <p><strong>Waktu:</strong> ${waktu} WIB</p>
                <p><strong>Kecocokan AI:</strong> ${(fm * 100).toFixed(1)}%</p>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="showStudentMenu()">Selesai</button>
        </div>
    `;
}

// Opsi alternatif scan barcode atau sakit/izin tetap tersedia jika diperlukan
function startScanner() {
    document.getElementById("student-content").innerHTML = `
        <div id="scanner" style="width:100%;height:250px;border-radius:12px;overflow:hidden;margin-bottom:15px"></div>
        <button class="btn btn-outline" style="width:100%" onclick="showStudentMenu()">Kembali</button>
    `;
    try {
        window.scanner = new Html5Qrcode("scanner");
        window.scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 100 } }, code => {
            window.scanner.stop();
            callAPI("getStudentByBarcode", { barcode: code }, res => {
                if (res.success) {
                    processAttendanceDirect(res.student);
                } else {
                    showToast("Barcode tidak terdaftar!", "error");
                    showStudentMenu();
                }
            });
        }, err => {});
    } catch(e) {
        showStudentMenu();
    }
}

function processAttendanceDirect(student) {
    callAPI("recordAttendance", { studentId: student.id, nama: student.nama, kelas: student.kelas, faceMatch: 1.0 }, res => {
        if(res.success) showSuccessScreen(student.nama, student.kelas, res.status, res.time, 1.0);
        else showToast("Gagal absen", "error");
    });
}

function showSickForm() {
    document.getElementById("student-content").innerHTML = `
        <div class="form-group"><label class="form-label">Barcode / NIS</label><input type="text" class="form-input" id="sbc"></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="sst"><option value="Sakit">Sakit</option><option value="Izin">Izin</option></select></div>
        <div class="form-group"><label class="form-label">Keterangan</label><textarea class="form-input" id="skt" rows="2"></textarea></div>
        <button class="btn btn-primary" style="width:100%" onclick="submitSick()">Kirim</button>
        <button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="showStudentMenu()">Kembali</button>
    `;
}

function submitSick() {
    let bc = document.getElementById("sbc").value.trim();
    let st = document.getElementById("sst").value;
    let kt = document.getElementById("skt").value;
    if(!bc) { showToast("Isi barcode", "error"); return; }
    callAPI("getStudentByBarcode", { barcode: bc }, res => {
        if(res.success) {
            callAPI("submitSickLeave", { studentId: res.student.id, nama: res.student.nama, kelas: res.student.kelas, status: st, keterangan: kt }, r2 => {
                if(r2.success) showSuccessScreen(res.student.nama, res.student.kelas, r2.status, r2.time, 0);
            });
        } else { showToast("Siswa tidak ditemukan", "error"); }
    });
}

// ==================== PORTAL ADMIN ====================
function renderAdminHTML() {
    document.getElementById("app-container").innerHTML = `
        <div class="app">
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="logo-icon"><i data-lucide="graduation-cap"></i></div>
                    <div class="logo-text"><h1>Admin LevelUp</h1><p>SMPN 2 Kawali</p></div>
                </div>
                <nav class="nav">
                    <div class="nav-item active" data-page="dashboard" onclick="changeAdminPage('dashboard')"><i data-lucide="home"></i><span>Dashboard</span></div>
                    <div class="nav-item" data-page="siswa" onclick="changeAdminPage('siswa')"><i data-lucide="users"></i><span>Daftar Siswa</span></div>
                    <div class="nav-item" data-page="pengaturan" onclick="changeAdminPage('pengaturan')"><i data-lucide="settings"></i><span>Pengaturan</span></div>
                </nav>
            </aside>
            <main class="main">
                <div class="topbar"><h2 id="page-title">Dashboard Admin</h2></div>
                <div class="content" id="main-content"></div>
            </main>
        </div>
        <div class="modal-overlay" id="modal"></div>
    `;
    lucide.createIcons();
}

let currentAdminPage = 'dashboard';
function changeAdminPage(p) {
    currentAdminPage = p;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-page="${p}"]`).classList.add('active');
    renderAdminPageContent();
}

function loadAdminData() {
    callAPI("getStats", {}, r => { if(r.success) stats = r.stats; renderAdminPageContent(); });
    callAPI("getAttendanceToday", {}, r => { if(r.success) attendance = r.attendance; renderAdminPageContent(); });
    callAPI("getStudentList", {}, r => { if(r.success) students = r.students; renderAdminPageContent(); });
}

function renderAdminPageContent() {
    let c = document.getElementById("main-content");
    if (currentAdminPage === 'dashboard') {
        c.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:20px">
                <div class="card" style="padding:20px"><h3>Total Hadir</h3><div style="font-size:28px;font-weight:700;color:var(--success)">${stats.totalHadir || 0}</div></div>
                <div class="card" style="padding:20px"><h3>Terlambat</h3><div style="font-size:28px;font-weight:700;color:var(--warning)">${stats.totalTerlambat || 0}</div></div>
                <div class="card" style="padding:20px"><h3>Sakit/Izin</h3><div style="font-size:28px;font-weight:700;color:var(--info)">${(stats.totalSakit || 0) + (stats.totalIzin || 0)}</div></div>
                <div class="card" style="padding:20px"><h3>Belum Absen</h3><div style="font-size:28px;font-weight:700;color:var(--danger)">${stats.belumAbsen || 0}</div></div>
            </div>
            <div class="card"><div class="card-body"><h3>Log Kehadiran Hari Ini</h3>
            <table class="table"><thead><tr><th>Nama</th><th>Kelas</th><th>Waktu</th><th>Status</th></tr></thead>
            <tbody>${attendance.map(a => `<tr><td>${a.nama}</td><td>${a.kelas}</td><td>${a.waktu}</td><td>${a.status}</td></tr>`).join('')}</tbody></table>
            </div></div>
        `;
    } else if (currentAdminPage === 'siswa') {
        c.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:20px">
                <h2>Manajemen Data Siswa</h2>
                <button class="btn btn-primary" onclick="showAddStudentModal()">+ Tambah Siswa</button>
            </div>
            <div class="card"><div class="card-body" style="padding:0">
                <table class="table"><thead><tr><th>Nama</th><th>Barcode</th><th>Kelas</th><th>Wajah AI</th><th>Aksi</th></tr></thead>
                <tbody>${students.map(s => `
                    <tr>
                        <td>${s.nama}</td>
                        <td>${s.barcode}</td>
                        <td>${s.kelas}</td>
                        <td>${s.hasFace ? '<span style="color:var(--success)">Terdaftar</span>' : '<button class="btn btn-outline" style="padding:4px 8px;font-size:11px" onclick="openRegFace(\\\''+s.id+'\\\',\\\''+s.nama+'\\\')">Daftarkan Wajah</button>'}</td>
                        <td><button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="deleteStudent(\\\''+s.id+'\\\')">Hapus</button></td>
                    </tr>
                `).join('')}</tbody></table>
            </div></div>
        `;
    } else if (currentAdminPage === 'pengaturan') {
        c.innerHTML = `
            <div class="card"><div class="card-body" style="max-width:400px">
                <h3>Pengaturan Sistem</h3>
                <div class="form-group" style="margin-top:15px"><label class="form-label">Jam Batas Terlambat</label><input type="time" class="form-input" id="set-jam" value="07:15"></div>
                <button class="btn btn-primary" onclick="saveSettings()">Simpan Pengaturan</button>
            </div></div>
        `;
    }
    lucide.createIcons();
}

// Form Tambah Siswa dengan Pilihan Kelas SMPN 2 Kawali
function showAddStudentModal() {
    let kelasOptions = KELAS_LIST.map(k => `<option value="${k}">${k}</option>`).join('');
    let m = document.getElementById("modal");
    m.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>Tambah Siswa Baru</h3><span style="cursor:pointer" onclick="closeModal()">✕</span></div>
            <div class="modal-body">
                <div class="form-group"><label class="form-label">Barcode / NIS</label><input type="text" class="form-input" id="add-bc"></div>
                <div class="form-group"><label class="form-label">Nama Lengkap</label><input type="text" class="form-input" id="add-nama"></div>
                <div class="form-group"><label class="form-label">Kelas</label><select class="form-select" id="add-kelas">${kelasOptions}</select></div>
            </div>
            <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-primary" onclick="submitAddStudent()">Simpan</button></div>
        </div>
    `;
    m.classList.add("active");
}

function submitAddStudent() {
    let bc = document.getElementById("add-bc").value;
    let nama = document.getElementById("add-nama").value;
    let kelas = document.getElementById("add-kelas").value;
    if(!bc || !nama) { showToast("Lengkapi form", "error"); return; }
    callAPI("addStudent", { barcode: bc, nama: nama, kelas: kelas }, res => {
        if(res.success) { showToast("Siswa ditambahkan", "success"); closeModal(); loadAdminData(); }
    });
}

function deleteStudent(id) {
    if(confirm("Yakin hapus siswa ini?")) {
        callAPI("deleteStudent", { id: id }, res => { if(res.success) { showToast("Dihapus", "success"); loadAdminData(); } });
    }
}

function openRegFace(id, nama) {
    let m = document.getElementById("modal");
    m.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>Registrasi Wajah - ${nama}</h3><span style="cursor:pointer" onclick="closeModal()">✕</span></div>
            <div class="modal-body">
                <input type="file" id="f-file" accept="image/*" onchange="previewUploadFace(this)" style="margin-bottom:10px">
                <div id="prev-container" style="display:none;margin-bottom:10px"><img id="img-prev" style="width:100%;max-height:200px;object-fit:contain"></div>
                <div class="face-status loading" id="reg-status" style="display:none">Memproses...</div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" id="btn-save-face" disabled onclick="executeSaveFace('${id}')">Simpan Wajah</button></div>
        </div>
    `;
    m.classList.add("active");
}

let selectedFaceImg = null;
function previewUploadFace(input) {
    if(input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function(e) {
            selectedFaceImg = new Image();
            selectedFaceImg.onload = function() {
                document.getElementById("prev-container").style.display = "block";
                document.getElementById("img-prev").src = e.target.result;
                document.getElementById("btn-save-face").disabled = false;
            };
            selectedFaceImg.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function executeSaveFace(id) {
    document.getElementById("reg-status").style.display = "block";
    document.getElementById("reg-status").textContent = "Mendeteksi fitur wajah...";
    
    faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model').then(() => {
        faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model').then(() => {
            faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model').then(() => {
                let cv = document.createElement("canvas");
                cv.width = selectedFaceImg.width; cv.height = selectedFaceImg.height;
                cv.getContext("2d").drawImage(selectedFaceImg, 0, 0);
                
                faceapi.detectSingleFace(cv, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor().then(d => {
                    if(d) {
                        let desc = Array.from(d.descriptor);
                        let smallCv = document.createElement("canvas");
                        smallCv.width = 150; smallCv.height = 150;
                        smallCv.getContext("2d").drawImage(selectedFaceImg, 0, 0, 150, 150);
                        let fotoUrl = smallCv.toDataURL("image/jpeg", 0.4);
                        
                        callAPI("registerFace", { studentId: id, faceDescriptor: desc, fotoURL: fotoUrl }, res => {
                            closeModal();
                            if(res.success) { showToast("Wajah berhasil didaftarkan!", "success"); loadAdminData(); }
                            else { showToast("Gagal menyimpan ke server", "error"); }
                        });
                    } else {
                        document.getElementById("reg-status").className = "face-status error";
                        document.getElementById("reg-status").textContent = "Wajah tidak terdeteksi dalam foto!";
                    }
                });
            });
        });
    });
}

function saveSettings() {
    let jam = document.getElementById("set-jam").value;
    callAPI("updateSettings", { settings: { jamTerlambat: jam } }, res => {
        if(res.success) showToast("Pengaturan disimpan", "success");
    });
}

function closeModal() { document.getElementById("modal").classList.remove("active"); selectedFaceImg = null; }
function showToast(m, t) {
    let tc = document.getElementById("toasts");
    let d = document.createElement("div");
    d.className = `toast ${t === 'error' ? 'error' : ''}`;
    d.textContent = m;
    tc.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}
