import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel  # <--- INI YANG HILANG
from dotenv import load_dotenv
import mysql.connector
import requests
from prompts import SOCRAMIND_SYSTEM_PROMPT, generate_user_prompt
import subprocess 
import sys        
import hashlib
import json

# 1. Load variabel dari file .env
load_dotenv()

DINOIKI_API_KEY = os.getenv("DINOIKI_API_KEY")
DINOIKI_URL = "https://ai.dinoiki.com/v1/chat/completions"

app = FastAPI(root_path="/api")

# 2. PENGATURAN CORS (WAJIB agar React bisa memanggil API ini)
app.add_middleware(
    CORSMiddleware,
    # Masukkan domain domain utama Anda di sini
    allow_origins=[
        "https://autofeed.my.id",
        "http://autofeed.my.id",
        "https://www.autofeed.my.id",
        "http://localhost:5173" # Untuk testing lokal
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. KONEKSI DATABASE
def get_db_connection():
    return mysql.connector.connect(
        host="localhost", # Karena database ada di VPS yang sama
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )
    
def get_student_history(user_id: int, modul_id: int):
    connection = get_db_connection()
    history_text = ""
    if connection is None:
        return history_text
    try:
        cursor = connection.cursor(dictionary=True)
        # Ambil log dari fase 1 sampai 3
        sql = """
            SELECT fase, percobaan_ke, input_verbal, input_kode, balasan_ai 
            FROM riwayat_belajar 
            WHERE user_id = %s AND modul_id = %s AND fase < 4
            ORDER BY fase ASC, percobaan_ke ASC
        """
        cursor.execute(sql, (user_id, modul_id))
        logs = cursor.fetchall()
        
        for log in logs:
            history_text += f"\n[Fase {log['fase']} - Percobaan {log['percobaan_ke']}]\n"
            if log['input_verbal']:
                history_text += f"Analisis Siswa: {log['input_verbal']}\n"
            if log['input_kode']:
                history_text += f"Kode Siswa:\n{log['input_kode']}\n"
            history_text += f"Feedback AI: {log['balasan_ai']}\n"
        return history_text
    except Exception as e:
        print(f"Error reading history: {e}")
        return ""
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/")
def home():
    return {"status": "Backend SocraMind Aktif!"}

class RunCodeRequest(BaseModel):
    code: str
    inputs: str = ""

class FeedbackRequest(BaseModel):
    user_id: int
    modul_id: int     
    fase_pbl: int
    input_verbal: str
    input_kode: str
    output_compiler: str
    jumlah_percobaan: int
    skenario_masalah: str
    rubrik_fase: str

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    nama: str
    kelas: str
    email: str
    password: str

class SubmitKuisRequest(BaseModel):
    user_id: int
    modul_id: int
    skor: int

class MateriBaruRequest(BaseModel):
    modul_id: int
    urutan: int
    tipe: str
    judul: str
    isi_konten: str
    contoh_kode: str = "" # Boleh kosong
    durasi: str

class KuisBaruRequest(BaseModel):
    modul_id: int
    pertanyaan: str
    opsi_a: str
    opsi_b: str
    opsi_c: str
    opsi_d: str
    opsi_e: str
    jawaban_benar: str

# --- TAMBAHKAN MODEL INI DI BAWAH MODEL YANG SUDAH ADA ---
class RubrikFase(BaseModel):
    fase: int
    kriteria: str

class SkenarioBaruRequest(BaseModel):
    modul_id: int
    judul: str
    skenario: str
    rubrik: list[RubrikFase]

class PengaturanUjianUpdate(BaseModel):
    pretest_aktif: bool
    posttest_aktif: bool

class SoalUjianBaru(BaseModel):
    tipe_ujian: str # 'pretest' atau 'posttest'
    pertanyaan: str
    opsi_a: str
    opsi_b: str
    opsi_c: str
    opsi_d: str
    opsi_e: str
    jawaban_benar: str

class SubmitUjianSiswa(BaseModel):
    user_id: int
    tipe_ujian: str
    jawaban_siswa: dict # Contoh: {"1": "A", "2": "C"}

# --- TAMBAHKAN ENDPOINT INI DI PALING BAWAH ---
@app.post("/guru/skenario")
async def tambah_skenario(request: SkenarioBaruRequest):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor()
        
        # 1. Simpan atau Perbarui Skenario di tabel modul_soal
        # Kita gunakan ON DUPLICATE KEY UPDATE agar guru bisa mengedit skenario yang sudah ada
        sql_modul = """
            INSERT INTO modul_soal (id, judul, skenario) 
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE judul=VALUES(judul), skenario=VALUES(skenario)
        """
        cursor.execute(sql_modul, (request.modul_id, request.judul, request.skenario))
        
        # 2. Hapus rubrik lama untuk modul ini (jika ada) agar bersih
        cursor.execute("DELETE FROM rubrik_fase WHERE modul_id = %s", (request.modul_id,))
        
        # 3. Masukkan 5 Rubrik Fase yang baru
        sql_rubrik = "INSERT INTO rubrik_fase (modul_id, fase, kriteria_lulus) VALUES (%s, %s, %s)"
        for r in request.rubrik:
            cursor.execute(sql_rubrik, (request.modul_id, r.fase, r.kriteria))
            
        connection.commit()
        return {"status": "success", "message": "Skenario PBL & Rubrik berhasil disimpan!"}
        
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/signup")
async def signup(request: SignupRequest):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        # Enkripsi password menggunakan SHA-256 bawaan Python
        hashed_password = hashlib.sha256(request.password.encode()).hexdigest()
        
        cursor = connection.cursor()
        sql = "INSERT INTO users (nama, kelas, email, password_hash, role) VALUES (%s, %s, %s, %s, 'Siswa')"
        val = (request.nama, request.kelas, request.email, hashed_password)
        cursor.execute(sql, val)
        connection.commit()
        
        return {"status": "success", "message": "Pendaftaran berhasil! Silakan login."}
    except Error as e:
        # Jika email sudah terdaftar, MySQL akan error duplicate (karena kolom email UNIQUE)
        return {"status": "error", "message": "Email sudah digunakan atau terjadi kesalahan."}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/login")
async def login(request: LoginRequest):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    cursor = None # WAJIB DIDEFINISIKAN DI SINI DULU!
    
    try:
        hashed_password = hashlib.sha256(request.password.encode()).hexdigest()
        
        cursor = connection.cursor(dictionary=True)
        sql = "SELECT id, nama, kelas, role FROM users WHERE email = %s AND password_hash = %s"
        cursor.execute(sql, (request.email, hashed_password))
        user = cursor.fetchone()
        
        if user:
            return {"status": "success", "data": user}
        else:
            return {"status": "error", "message": "Email atau Password salah!"}
            
    except Exception as e:
        return {"status": "error", "message": f"Error MySQL: {str(e)}"}
        
    finally:
        # Pengecekan ekstra aman agar tidak crash!
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()

# 1. Ubah get_soal agar menerima parameter modul_id
@app.get("/soal/{modul_id}")
async def get_soal(modul_id: int):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor(dictionary=True)
        # Ambil skenario berdasarkan modul_id (bukan LIMIT 1 lagi)
        cursor.execute("SELECT * FROM modul_soal WHERE id = %s", (modul_id,))
        modul = cursor.fetchone()
        
        if modul:
            cursor.execute("SELECT fase, kriteria_lulus FROM rubrik_fase WHERE modul_id = %s ORDER BY fase ASC", (modul['id'],))
            rubrik_data = cursor.fetchall()
            modul['rubrik_fase'] = {row['fase']: row['kriteria_lulus'] for row in rubrik_data}
            return {"status": "success", "data": modul}
        else:
            return {"status": "error", "message": f"Skenario PBL untuk Pertemuan {modul_id} belum dibuat oleh Guru."}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection is not None and connection.is_connected():
            cursor.close()
            connection.close()

# 2. Ubah get_materi agar menampilkan SELURUH materi dari semua pertemuan
@app.get("/materi")
async def get_semua_materi():
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor(dictionary=True)
        # Mengambil semua materi dan mengurutkannya berdasarkan modul (pertemuan) lalu urutannya
        cursor.execute("SELECT * FROM materi ORDER BY modul_id ASC, urutan ASC")
        materi_data = cursor.fetchall()
        return {"status": "success", "data": materi_data}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/run-code")
def run_code(request: RunCodeRequest):
    print("Mengeksekusi kode Python dari siswa...")
    if not request.code.strip():
        return {"status": "error", "output": "Kode kosong. Silakan tulis kode Python terlebih dahulu."}
        
    try:
        result = subprocess.run(
            [sys.executable, "-c", request.code],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.stderr:
            return {"status": "error", "output": result.stderr.strip()}
        return {"status": "success", "output": result.stdout.strip()}
        
    except subprocess.TimeoutExpired:
        return {"status": "error", "output": "Timeout: Kode berjalan terlalu lama (maksimal 5 detik)."}
    except Exception as e:
        return {"status": "error", "output": f"Terjadi kesalahan sistem: {str(e)}"}

@app.post("/feedback")
def get_feedback(request: FeedbackRequest): 
    print(f"Memproses feedback Fase {request.fase_pbl}...")
    
    connection = get_db_connection()
    if connection is None:
        return {"status_lulus_fase": False, "pesan_untuk_ui": "Gagal terhubung ke database."}

    # --- PENAMBAL LUBANG 1: BYPASS FASE 4 (GHOST PHASE) ---
    if request.fase_pbl == 4:
        try:
            cursor = connection.cursor()
            sql_insert = """
                INSERT INTO riwayat_belajar 
                (user_id, modul_id, fase, percobaan_ke, input_verbal, input_kode, output_compiler, balasan_ai, status_lulus)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            val = (request.user_id, request.modul_id, 4, 1, "Siswa melakukan presentasi offline", request.input_kode, "", "Evaluasi dilewati. Berfokus pada diskusi kelas.", True)
            cursor.execute(sql_insert, val)
            connection.commit()
            return {"status_lulus_fase": True, "pesan_untuk_ui": "Sesi presentasi selesai."}
        except Exception as e:
            print(f"Error Fase 4 Bypass: {e}")
        finally:
            connection.close()

    try:
        cursor = connection.cursor(dictionary=True)
        
        # --- PENAMBAL LUBANG 2: HITUNG PERCOBAAN DARI DATABASE (Anti-Hack) ---
        cursor.execute(
            "SELECT COUNT(*) as total FROM riwayat_belajar WHERE user_id=%s AND modul_id=%s AND fase=%s",
            (request.user_id, request.modul_id, request.fase_pbl)
        )
        current_attempt = cursor.fetchone()['total'] + 1

        # --- AMBIL MEMORI ---
        student_history = get_student_history(request.user_id, request.modul_id)
        
        # --- GENERATE PROMPT (Pastikan prompts.py sudah diupdate untuk menerima 3 parameter ini) ---
        user_message = generate_user_prompt(request, current_attempt, student_history)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DINOIKI_API_KEY}"
        }

        payload = {
            "model": "google/gemini-2.5-flash", 
            "messages": [
                {"role": "system", "content": SOCRAMIND_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            "temperature": 1.0,
            "max_tokens": 1000
        }

        api_response = requests.post(DINOIKI_URL, headers=headers, json=payload, timeout=15)
        api_response.raise_for_status() 
        
        hasil_json = api_response.json()
        
        print("====== DEBUG DINOIKI ======")
        print(hasil_json)
        print("===========================")
        
        try:
            balasan_ai = hasil_json['choices'][0]['message']['content']
        except (KeyError, IndexError, TypeError) as e:
            print(f"Gagal ekstraksi JSON: {e}")
            balasan_ai = "[BELUM LULUS]\nTerjadi kendala teknis saat memproses format umpan balik."
        
        # --- PENAMBAL LUBANG 3: LOGIKA KELULUSAN ---
        is_lulus = False
        
        if request.fase_pbl == 5:
            # Fase 5 OTOMATIS LULUS (AI hanya mereview)
            is_lulus = True
            balasan_ai = balasan_ai.replace("[LULUS]", "").replace("[BELUM LULUS]", "").strip()
        else:
            # Fase 1, 2, 3 pakai pengecekan tag
            if "[LULUS]" in balasan_ai:
                is_lulus = True
                balasan_ai = balasan_ai.replace("[LULUS]", "").strip()
            elif "[BELUM LULUS]" in balasan_ai:
                is_lulus = False
                balasan_ai = balasan_ai.replace("[BELUM LULUS]", "").strip()
            else:
                # Fallback jika AI lupa tag: otomatis lulus jika attempt sudah 4
                is_lulus = current_attempt >= 4
        
        # --- SIMPAN KE DATABASE ---
        sql_insert = """
            INSERT INTO riwayat_belajar 
            (user_id, modul_id, fase, percobaan_ke, input_verbal, input_kode, output_compiler, balasan_ai, status_lulus)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        val = (request.user_id, request.modul_id, request.fase_pbl, current_attempt, request.input_verbal, request.input_kode, request.output_compiler, balasan_ai, is_lulus)
        cursor.execute(sql_insert, val)
        connection.commit()

        return {"status_lulus_fase": is_lulus, "pesan_untuk_ui": balasan_ai}
        
    except requests.exceptions.Timeout:
        return {"status_lulus_fase": False, "pesan_untuk_ui": "Sistem AI sedang sibuk memproses. Silakan klik Minta Feedback sekali lagi."}
    except requests.exceptions.RequestException as e:
        print(f"Error API Dinoiki: {e}")
        return {"status_lulus_fase": False, "pesan_untuk_ui": "Koneksi ke AI terputus. Silakan coba lagi."}
    except Exception as e:
        print(f"Error Internal Python: {e}")
        return {"status_lulus_fase": False, "pesan_untuk_ui": "Terjadi kendala saat memproses feedback."}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
        
@app.get("/guru/riwayat")
async def get_riwayat_guru():
    connection = get_db_connection()
    
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database MySQL."}
        
    try:
        cursor = connection.cursor(dictionary=True)
        # Menggunakan LEFT JOIN untuk mengambil nama dan kelas dari tabel users
        sql_query = """
            SELECT r.*, u.nama as nama_siswa, u.kelas 
            FROM riwayat_belajar r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.waktu DESC
        """
        cursor.execute(sql_query)
        return {"status": "success", "data": cursor.fetchall()}
        
    except Error as e:
        return {"status": "error", "message": str(e)}
        
    finally:
        if connection is not None and connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/materi/{modul_id}")
async def get_materi(modul_id: int):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor(dictionary=True)
        # Ambil materi berdasarkan modul dan urutkan
        cursor.execute("SELECT * FROM materi WHERE modul_id = %s ORDER BY urutan ASC", (modul_id,))
        materi_data = cursor.fetchall()
        return {"status": "success", "data": materi_data}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/kuis/{modul_id}")
async def get_kuis(modul_id: int):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM kuis_soal WHERE modul_id = %s", (modul_id,))
        soal_data = cursor.fetchall()
        
        # Format ulang data agar persis seperti yang diharapkan React Frontend Anda
        formatted_soal = []
        for soal in soal_data:
            formatted_soal.append({
                "id": soal["id"],
                "pertanyaan": soal["pertanyaan"],
                "opsi": [
                    {"id": "A", "teks": soal["opsi_a"]},
                    {"id": "B", "teks": soal["opsi_b"]},
                    {"id": "C", "teks": soal["opsi_c"]},
                    {"id": "D", "teks": soal["opsi_d"]},
                    {"id": "E", "teks": soal["opsi_e"]}
                ],
                "jawabanBenar": soal["jawaban_benar"]
            })
            
        return {"status": "success", "data": formatted_soal}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/kuis/submit")
async def submit_kuis(request: SubmitKuisRequest):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor()
        # Memasukkan data ke tabel progres_kuis yang sudah kita buat di awal
        sql = "INSERT INTO progres_kuis (user_id, modul_id, skor) VALUES (%s, %s, %s)"
        val = (request.user_id, request.modul_id, request.skor)
        
        cursor.execute(sql, val)
        connection.commit()
        
        return {"status": "success", "message": "Nilai kuis berhasil disimpan!"}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/guru/stats")
async def get_guru_stats():
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # 1. Total Siswa
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'Siswa'")
        total_siswa = cursor.fetchone()['total']
        
        # 2. Rata-rata Skor Kuis
        cursor.execute("SELECT AVG(skor) as rata_skor FROM progres_kuis")
        rata_skor = cursor.fetchone()['rata_skor'] or 0
        
        # 3. Siswa Perlu Bantuan (Gagal >= 3x di Fase apapun)
        cursor.execute("SELECT COUNT(DISTINCT user_id) as total FROM riwayat_belajar WHERE percobaan_ke >= 3 AND status_lulus = 0")
        perlu_bantuan = cursor.fetchone()['total']
        
        return {
            "status": "success", 
            "data": {
                "total_siswa": total_siswa,
                "rata_skor": round(rata_skor, 1),
                "perlu_bantuan": perlu_bantuan
            }
        }
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/guru/hasil-kuis")
async def get_hasil_kuis():
    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        # Ambil skor kuis terbaru per siswa
        sql = """
            SELECT u.nama, u.kelas, pk.skor, pk.waktu_selesai
            FROM progres_kuis pk
            JOIN users u ON pk.user_id = u.id
            ORDER BY pk.waktu_selesai DESC
        """
        cursor.execute(sql)
        return {"status": "success", "data": cursor.fetchall()}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/guru/materi")
async def tambah_materi(request: MateriBaruRequest):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor()
        sql = """INSERT INTO materi (modul_id, urutan, tipe, judul, isi_konten, contoh_kode, durasi) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        val = (request.modul_id, request.urutan, request.tipe, request.judul, 
               request.isi_konten, request.contoh_kode, request.durasi)
        cursor.execute(sql, val)
        connection.commit()
        return {"status": "success", "message": "Materi berhasil ditambahkan!"}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/guru/kuis")
async def tambah_kuis(request: KuisBaruRequest):
    connection = get_db_connection()
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        cursor = connection.cursor()
        sql = """INSERT INTO kuis_soal (modul_id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        val = (request.modul_id, request.pertanyaan, request.opsi_a, request.opsi_b, 
               request.opsi_c, request.opsi_d, request.opsi_e, request.jawaban_benar)
        cursor.execute(sql, val)
        connection.commit()
        return {"status": "success", "message": "Soal Kuis berhasil ditambahkan!"}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/guru/portofolio/{user_id}/{modul_id}")
async def get_portofolio_siswa(user_id: int, modul_id: int):
    connection = get_db_connection()
    
    if connection is None:
        return {"status": "error", "message": "Gagal terhubung ke database."}
        
    try:
        # Gunakan dictionary=True agar hasilnya berbentuk key-value seperti r['fase']
        cursor = connection.cursor(dictionary=True)
        
        # Tarik data langsung dari tabel riwayat_belajar
        sql_query = """
            SELECT * FROM riwayat_belajar 
            WHERE user_id = %s AND modul_id = %s 
            ORDER BY fase ASC
        """
        cursor.execute(sql_query, (user_id, modul_id))
        riwayat = cursor.fetchall()
        
        # Format data yang dikirim ke React
        data_portofolio = []
        for r in riwayat:
            # Tentukan tipe fase
            tipe_fase = "verbal"
            if r['fase'] == 3 or r['fase'] == 4:
                tipe_fase = "kode"
                
            data_portofolio.append({
                "fase": r['fase'],
                "tipe": tipe_fase,
                # Gunakan .get() agar aman jika ada kolom yang bernilai NULL/kosong
                "input_verbal": r.get('input_verbal', ''),
                "input_kode": r.get('input_kode', ''),
                "feedback_ai": r.get('balasan_ai', '')
            })
            
        return {"status": "success", "data": data_portofolio}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
    finally:
        if connection is not None and connection.is_connected():
            cursor.close()
            connection.close()

# ==========================================
# ENDPOINT PRE-TEST & POST-TEST
# ==========================================

@app.get("/pengaturan-ujian")
async def get_pengaturan_ujian():
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM pengaturan_ujian WHERE id = 1")
        data = cursor.fetchone()
        # Ubah 1/0 jadi True/False agar mudah dibaca React
        if data:
            data['pretest_aktif'] = bool(data['pretest_aktif'])
            data['posttest_aktif'] = bool(data['posttest_aktif'])
        return {"status": "success", "data": data}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/guru/pengaturan-ujian")
async def update_pengaturan_ujian(request: PengaturanUjianUpdate):
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor()
        val = (int(request.pretest_aktif), int(request.posttest_aktif))
        cursor.execute("UPDATE pengaturan_ujian SET pretest_aktif=%s, posttest_aktif=%s WHERE id=1", val)
        connection.commit()
        return {"status": "success", "message": "Pengaturan ujian diperbarui."}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/soal-ujian/{tipe_ujian}")
async def get_soal_ujian(tipe_ujian: str):
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM bank_soal_ujian WHERE tipe_ujian = %s", (tipe_ujian,))
        soal_data = cursor.fetchall()
        
        formatted_soal = []
        for soal in soal_data:
            formatted_soal.append({
                "id": soal["id"],
                "pertanyaan": soal["pertanyaan"],
                "opsi": [
                    {"id": "A", "teks": soal["opsi_a"]},
                    {"id": "B", "teks": soal["opsi_b"]},
                    {"id": "C", "teks": soal["opsi_c"]},
                    {"id": "D", "teks": soal["opsi_d"]},
                    {"id": "E", "teks": soal["opsi_e"]}
                ],
                "jawabanBenar": soal["jawaban_benar"]
            })
        return {"status": "success", "data": formatted_soal}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/guru/soal-ujian")
async def tambah_soal_ujian(request: SoalUjianBaru):
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor()
        sql = """INSERT INTO bank_soal_ujian (tipe_ujian, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        val = (request.tipe_ujian, request.pertanyaan, request.opsi_a, request.opsi_b, request.opsi_c, request.opsi_d, request.opsi_e, request.jawaban_benar)
        cursor.execute(sql, val)
        connection.commit()
        return {"status": "success", "message": f"Soal {request.tipe_ujian} berhasil ditambahkan!"}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.post("/ujian/submit")
async def submit_ujian(request: SubmitUjianSiswa):
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor(dictionary=True)
        
        # 1. Cek apakah siswa sudah pernah mengerjakan ujian ini
        cursor.execute("SELECT id FROM hasil_ujian_siswa WHERE user_id=%s AND tipe_ujian=%s", (request.user_id, request.tipe_ujian))
        if cursor.fetchone():
            return {"status": "error", "message": f"Anda sudah pernah mengerjakan {request.tipe_ujian} ini."}

        # 2. Ambil kunci jawaban dari database
        cursor.execute("SELECT id, jawaban_benar FROM bank_soal_ujian WHERE tipe_ujian=%s", (request.tipe_ujian,))
        kunci_jawaban = {str(row['id']): row['jawaban_benar'] for row in cursor.fetchall()}
        
        # 3. Hitung skor di Backend (Aman dari kecurangan)
        total_soal = len(kunci_jawaban)
        benar = 0
        if total_soal > 0:
            for soal_id, jawaban_siswa in request.jawaban_siswa.items():
                if soal_id in kunci_jawaban and kunci_jawaban[soal_id] == jawaban_siswa:
                    benar += 1
            skor_akhir = (benar / total_soal) * 100
        else:
            skor_akhir = 0
            
        # 4. Simpan ke database (Ubah dict ke string JSON untuk detail_jawaban)
        detail_json = json.dumps(request.jawaban_siswa)
        sql_insert = "INSERT INTO hasil_ujian_siswa (user_id, tipe_ujian, skor, detail_jawaban) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql_insert, (request.user_id, request.tipe_ujian, skor_akhir, detail_json))
        connection.commit()
        
        return {"status": "success", "message": f"Nilai {request.tipe_ujian} berhasil disimpan!", "skor": skor_akhir}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/guru/hasil-ujian-rekap")
async def rekap_hasil_ujian():
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor(dictionary=True)
        # Query ini menggunakan teknik PIVOT (kondisional) untuk menyatukan nilai pretest & posttest 
        # dalam satu baris per siswa agar sangat mudah diekspor ke SPSS/Excel.
        sql = """
            SELECT 
                u.nama, 
                u.kelas,
                MAX(CASE WHEN h.tipe_ujian = 'pretest' THEN h.skor ELSE NULL END) as nilai_pretest,
                MAX(CASE WHEN h.tipe_ujian = 'posttest' THEN h.skor ELSE NULL END) as nilai_posttest
            FROM users u
            JOIN hasil_ujian_siswa h ON u.id = h.user_id
            WHERE u.role = 'Siswa'
            GROUP BY u.id, u.nama, u.kelas
            ORDER BY u.kelas ASC, u.nama ASC
        """
        cursor.execute(sql)
        return {"status": "success", "data": cursor.fetchall()}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.get("/guru/analisis-soal/{tipe_ujian}")
async def get_analisis_soal(tipe_ujian: str):
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM bank_soal_ujian WHERE tipe_ujian=%s ORDER BY id ASC", (tipe_ujian,))
        soal_ids = [str(row['id']) for row in cursor.fetchall()]
        
        cursor.execute("SELECT id, jawaban_benar FROM bank_soal_ujian WHERE tipe_ujian=%s", (tipe_ujian,))
        kunci_jawaban = {str(row['id']): row['jawaban_benar'] for row in cursor.fetchall()}
        
        sql_siswa = """
            SELECT u.nama, u.kelas, h.detail_jawaban, h.skor 
            FROM hasil_ujian_siswa h
            JOIN users u ON h.user_id = u.id
            WHERE h.tipe_ujian = %s
            ORDER BY u.kelas ASC, u.nama ASC
        """
        cursor.execute(sql_siswa, (tipe_ujian,))
        data_mentah = cursor.fetchall()
        
        hasil_analisis = []
        for baris in data_mentah:
            jawaban_json = json.loads(baris['detail_jawaban']) if baris['detail_jawaban'] else {}
            rekap_per_siswa = {"nama": baris['nama'], "kelas": baris['kelas'], "skor_total": baris['skor']}
            
            for s_id in soal_ids:
                jwb_siswa = jawaban_json.get(s_id)
                kunci = kunci_jawaban.get(s_id)
                if jwb_siswa:
                    rekap_per_siswa[f"soal_{s_id}"] = 1 if jwb_siswa == kunci else 0
                else:
                    rekap_per_siswa[f"soal_{s_id}"] = "-"
            hasil_analisis.append(rekap_per_siswa)
            
        return {"status": "success", "data": hasil_analisis, "daftar_soal": soal_ids}
    finally:
        if connection.is_connected():
            cursor.close()

@app.delete("/guru/soal-ujian/{soal_id}")
async def hapus_soal_ujian(soal_id: int):
    connection = get_db_connection()
    if not connection: return {"status": "error", "message": "DB Error"}
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM bank_soal_ujian WHERE id = %s", (soal_id,))
        connection.commit()
        return {"status": "success", "message": "Soal berhasil dihapus!"}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()