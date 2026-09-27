/**
 * Pantau MP-ASI — server Google Sheet (Puskesmas Moncongloe)
 * Versi 0.2
 *
 * Cara pasang (ringkas; panduan lengkap ada di PANDUAN-APPS-SCRIPT):
 *  1. Buat Google Sheet baru lalu Ekstensi → Apps Script, ATAU buat proyek baru langsung
 *     di script.google.com (Sheet akan dibuat otomatis oleh fungsi setup).
 *  2. Hapus isi Code.gs, tempel seluruh kode ini, lalu Simpan.
 *  3. Pilih fungsi "setup" di toolbar, klik Jalankan, lalu izinkan akses.
 *     Token rahasia akan muncul di Log eksekusi dan di tab "pengaturan".
 *  4. Terapkan → Deployment baru → Jenis: Aplikasi web.
 *     Jalankan sebagai: Saya.  Yang memiliki akses: Siapa saja.
 *  5. Salin URL aplikasi web (berakhiran /exec), lalu masukkan URL + token di aplikasi
 *     Pantau MP-ASI: Menu → Sambungan server.
 */

var VERSI = '0.2.1';

var FOODS = ['asi', 'sereal', 'kacang', 'susu', 'daging/unggas', 'telur', 'buah_sayur_vita', 'buah_sayur_lain'];

var TABEL = {
  sasaran: ['kunci', 'periode', 'key', 'nik', 'nama', 'jk', 'tgl_lahir', 'nama_ortu', 'desa', 'posyandu',
            'bbu', 'tbu', 'bbtb', 'tgl_ukur', 'sumber', 'dibuat_oleh', 'waktu_ubah'],
  pemantauan: ['kunci', 'periode', 'key', 'nik', 'nama', 'tgl_monitoring'].concat(FOODS).concat(
            ['skor', 'dapat_intervensi', 'jenis_intervensi', 'lainnya', 'petugas', 'petugas_id',
             'waktu_input', 'waktu_ubah', 'dihapus', 'catatan']),
  petugas: ['id', 'nama', 'peran', 'pin_hash', 'aktif', 'waktu_ubah'],
  pengaturan: ['kunci', 'nilai'],
  log: ['waktu', 'aksi', 'petugas', 'ringkasan']
};

/* ================= MENU & SETUP ================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Pantau MP-ASI')
    .addItem('Siapkan / periksa sheet', 'setup')
    .addItem('Tampilkan token', 'tampilkanToken')
    .addItem('Buat token baru', 'buatTokenBaru')
    .addToUi();
}

/** Jalankan sekali. Aman dijalankan ulang: tidak menghapus data. */
function setup() {
  var ss = ss_();
  Object.keys(TABEL).forEach(function (n) { sheet_(n); });
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TOKEN');
  if (!token) { token = tokenAcak_(); props.setProperty('TOKEN', token); }
  setPengaturan_('token_petunjuk', 'Token tersimpan aman di Script Properties. Menu Pantau MP-ASI → Tampilkan token.');
  if (!getPengaturan_('periode')) setPengaturan_('periode', periodeAwal_());
  pesan_('Setup selesai.\n\nToken rahasia:\n' + token + '\n\nGoogle Sheet data:\n' + ss.getUrl() + '\n\nLangkah berikutnya: Terapkan → Deployment baru → Aplikasi web (Jalankan sebagai: Saya, Akses: Siapa saja).');
}

function tampilkanToken() {
  var t = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!t) { pesan_('Token belum dibuat. Jalankan fungsi "setup" terlebih dahulu.'); return; }
  pesan_('Token rahasia:\n' + t + '\n\nGoogle Sheet data:\n' + ss_().getUrl() +
         '\n\nJangan dibagikan di grup. Kirim hanya ke petugas lewat pesan pribadi, sebagai bagian dari "kode sambung".');
}

function buatTokenBaru() {
  var t = tokenAcak_();
  PropertiesService.getScriptProperties().setProperty('TOKEN', t);
  pesan_('Token baru:\n' + t + '\n\nSemua HP harus disambungkan ulang dengan kode sambung yang baru.');
}

/* ================= WEB APP ================= */

function doGet() {
  return json_({ ok: true, app: 'Pantau MP-ASI', versi: VERSI, pesan: 'Server aktif. Gunakan aplikasi Pantau MP-ASI untuk mengirim data.' });
}

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Permintaan tidak terbaca.' }); }

  var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || req.token !== token) return json_({ ok: false, error: 'Token salah. Minta kode sambung terbaru ke koordinator.' });

  try {
    switch (req.action) {
      case 'ping': return json_({ ok: true, versi: VERSI, periode: getPengaturan_('periode') });
      case 'pull': return json_(tarik_(req));
      case 'push': return json_(kirim_(req));
      default: return json_({ ok: false, error: 'Aksi tidak dikenal: ' + req.action });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/* ================= TARIK (server → HP) ================= */

function tarik_(req) {
  var periode = req.periode || getPengaturan_('periode');
  var sas = baca_('sasaran').rows.filter(function (r) { return r.periode === periode; }).map(sasaranKeKlien_);
  var pem = baca_('pemantauan').rows.filter(function (r) { return r.periode === periode; }).map(pemantauanKeKlien_);
  var ptg = baca_('petugas').rows.map(function (r) {
    return { id: r.id, nama: r.nama, peran: r.peran, pinHash: r.pin_hash, aktif: r.aktif !== '0', waktuUbah: r.waktu_ubah };
  });
  return {
    ok: true, versi: VERSI, waktuServer: new Date().toISOString(),
    pengaturan: { periode: getPengaturan_('periode'), periodeWaktu: getPengaturan_('periode_waktu') || '' },
    periode: periode, sasaran: sas, pemantauan: pem, petugas: ptg
  };
}

/* ================= KIRIM (HP → server) ================= */

function kirim_(req) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var hasil = { ok: true, sasaran: 0, pemantauan: 0, petugas: 0, ganda: 0 };

    // pengaturan (periode aktif) — yang terbaru menang
    if (req.pengaturan && req.pengaturan.periode) {
      var w = req.pengaturan.periodeWaktu || '';
      if (w >= (getPengaturan_('periode_waktu') || '')) {
        setPengaturan_('periode', req.pengaturan.periode);
        setPengaturan_('periode_waktu', w);
      }
    }

    // petugas
    if (req.petugas && req.petugas.length) {
      var tp = baca_('petugas');
      req.petugas.forEach(function (u) {
        if (!u || !u.id || !u.nama) return;
        var row = { id: u.id, nama: u.nama, peran: u.peran || 'petugas', pin_hash: u.pinHash || '',
                    aktif: u.aktif === false ? '0' : '1', waktu_ubah: u.waktuUbah || new Date().toISOString() };
        var i = tp.index[u.id];
        if (i == null) { tp.index[u.id] = tp.rows.length; tp.rows.push(row); hasil.petugas++; }
        else if (row.waktu_ubah >= (tp.rows[i].waktu_ubah || '')) { tp.rows[i] = row; hasil.petugas++; }
      });
      tulis_(tp);
    }

    // sasaran
    if (req.sasaran && req.sasaran.length) {
      var ts = baca_('sasaran');
      req.sasaran.forEach(function (s) {
        if (!s || !s.periode || !s.key) return;
        var row = {
          kunci: s.periode + '|' + s.key, periode: s.periode, key: s.key, nik: s.nik || '', nama: s.nama || '',
          jk: s.jk || '', tgl_lahir: s.tglLahir || '', nama_ortu: s.namaOrtu || '', desa: s.desa || '', posyandu: s.posyandu || '',
          bbu: s.bbu || '', tbu: s.tbu || '', bbtb: s.bbtb || '', tgl_ukur: s.tglUkur || '', sumber: s.sumber || '',
          dibuat_oleh: s.dibuatOleh || '', waktu_ubah: s.waktuUbah || new Date().toISOString()
        };
        var i = ts.index[row.kunci];
        if (i == null) { ts.index[row.kunci] = ts.rows.length; ts.rows.push(row); hasil.sasaran++; }
        else if (row.waktu_ubah >= (ts.rows[i].waktu_ubah || '')) { ts.rows[i] = row; hasil.sasaran++; }
      });
      tulis_(ts);
    }

    // pemantauan
    if (req.pemantauan && req.pemantauan.length) {
      var tm = baca_('pemantauan');
      req.pemantauan.forEach(function (r) {
        if (!r || !r.periode || !r.key) return;
        var kunci = r.periode + '|' + r.key;
        var row = {
          kunci: kunci, periode: r.periode, key: r.key, nik: r.nik || '', nama: r.nama || '', tgl_monitoring: r.tgl || '',
          skor: '', dapat_intervensi: r.intervensi ? '1' : '0', jenis_intervensi: (r.jenis || []).join('; '),
          lainnya: r.lainnya || '', petugas: r.petugas || '', petugas_id: r.petugasId || '',
          waktu_input: r.waktuInput || '', waktu_ubah: r.waktuUbah || new Date().toISOString(),
          dihapus: r.dihapus ? '1' : '', catatan: ''
        };
        var skor = 0;
        FOODS.forEach(function (f) { row[f] = r[f] === 1 ? '1' : '0'; if (r[f] === 1) skor++; });
        row.skor = String(skor);

        var i = tm.index[kunci];
        if (i == null) { tm.index[kunci] = tm.rows.length; tm.rows.push(row); hasil.pemantauan++; return; }
        var lama = tm.rows[i];
        if (!row.nik) row.nik = lama.nik;
        if (!row.nama) row.nama = lama.nama;
        var ganda = lama.dihapus !== '1' && !r.dihapus && lama.petugas_id && row.petugas_id &&
                    lama.petugas_id !== row.petugas_id && lama.waktu_input !== row.waktu_input;
        if (row.waktu_ubah >= (lama.waktu_ubah || '')) {
          row.catatan = ganda ? ('Ganda: sebelumnya diisi ' + lama.petugas + ' (' + lama.tgl_monitoring + ')') : (lama.catatan || '');
          tm.rows[i] = row; hasil.pemantauan++;
        } else if (ganda) {
          lama.catatan = 'Ganda: juga diisi ' + row.petugas + ' (' + row.tgl_monitoring + ')';
        }
        if (ganda) hasil.ganda++;
      });
      tulis_(tm);
    }

    catatLog_('push', req.oleh || '', 'sasaran ' + hasil.sasaran + ', isian ' + hasil.pemantauan + ', petugas ' + hasil.petugas + (hasil.ganda ? ', ganda ' + hasil.ganda : ''));
    return hasil;
  } finally {
    lock.releaseLock();
  }
}

/* ================= KONVERSI ================= */

function sasaranKeKlien_(r) {
  return { nik: r.nik, nama: r.nama, jk: r.jk, tglLahir: r.tgl_lahir, namaOrtu: r.nama_ortu, desa: r.desa, posyandu: r.posyandu,
           bbu: r.bbu, tbu: r.tbu, bbtb: r.bbtb, tglUkur: r.tgl_ukur, sumber: r.sumber, dibuatOleh: r.dibuat_oleh,
           waktuUbah: r.waktu_ubah, key: r.key };
}

function pemantauanKeKlien_(r) {
  var o = { key: r.key, tgl: r.tgl_monitoring, intervensi: r.dapat_intervensi === '1' ? 1 : 0,
            jenis: r.jenis_intervensi ? r.jenis_intervensi.split('; ') : [], lainnya: r.lainnya,
            petugas: r.petugas, petugasId: r.petugas_id, waktuInput: r.waktu_input, waktuUbah: r.waktu_ubah,
            dihapus: r.dihapus === '1', catatan: r.catatan };
  FOODS.forEach(function (f) { o[f] = r[f] === '1' ? 1 : 0; });
  return o;
}

/* ================= SHEET HELPER ================= */

/** Spreadsheet data: yang menempel ke skrip, atau yang dibuat otomatis oleh setup. */
function ss_() {
  var aktif = null;
  try { aktif = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (aktif) return aktif;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var baru = SpreadsheetApp.create('Data Pantau MP-ASI Moncongloe');
  props.setProperty('SHEET_ID', baru.getId());
  return baru;
}

function sheet_(nama) {
  var ss = ss_();
  var kol = TABEL[nama];
  var sh = ss.getSheetByName(nama);
  if (!sh) sh = ss.insertSheet(nama);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, kol.length).setValues([kol]).setFontWeight('bold');
    sh.setFrozenRows(1);
    // semua kolom sebagai teks agar NIK 16 digit dan tanggal tidak berubah
    sh.getRange(1, 1, sh.getMaxRows(), kol.length).setNumberFormat('@');
  }
  return sh;
}

function baca_(nama) {
  var sh = sheet_(nama);
  var kol = TABEL[nama];
  var n = sh.getLastRow() - 1;
  var vals = n > 0 ? sh.getRange(2, 1, n, kol.length).getValues() : [];
  var rows = [], index = {};
  vals.forEach(function (v) {
    var o = {};
    kol.forEach(function (k, j) { o[k] = v[j] == null ? '' : String(v[j]); });
    var id = o[kol[0]];
    if (!id) return;
    index[id] = rows.length;
    rows.push(o);
  });
  return { nama: nama, sh: sh, kol: kol, rows: rows, index: index };
}

function tulis_(t) {
  if (!t.rows.length) return;
  var data = t.rows.map(function (o) { return t.kol.map(function (k) { return o[k] == null ? '' : String(o[k]); }); });
  var perlu = data.length + 1;
  if (t.sh.getMaxRows() < perlu) t.sh.insertRowsAfter(t.sh.getMaxRows(), perlu - t.sh.getMaxRows());
  var lastOld = t.sh.getLastRow();
  if (lastOld > perlu) t.sh.getRange(perlu + 1, 1, lastOld - perlu, t.kol.length).clearContent();
  t.sh.getRange(2, 1, data.length, t.kol.length).setNumberFormat('@').setValues(data);
}

function getPengaturan_(k) {
  var t = baca_('pengaturan');
  var i = t.index[k];
  return i == null ? '' : t.rows[i].nilai;
}

function setPengaturan_(k, v) {
  var t = baca_('pengaturan');
  var i = t.index[k];
  if (i == null) t.rows.push({ kunci: k, nilai: String(v) }); else t.rows[i].nilai = String(v);
  tulis_(t);
}

function catatLog_(aksi, oleh, ringkas) {
  try {
    var sh = sheet_('log');
    sh.appendRow([new Date().toISOString(), aksi, oleh, ringkas]);
    var lebih = sh.getLastRow() - 2001;
    if (lebih > 0) sh.deleteRows(2, lebih);
  } catch (e) {}
}

/* ================= UTIL ================= */

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function tokenAcak_() {
  var huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var s = '';
  for (var i = 0; i < 24; i++) s += huruf.charAt(Math.floor(Math.random() * huruf.length));
  return s;
}

function periodeAwal_() {
  var d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
  var b = [3, 6, 9, 12].filter(function (x) { return x >= m; })[0];
  if (!b) { b = 3; y++; }
  return y + '-' + (b < 10 ? '0' : '') + b;
}

function pesan_(teks) {
  Logger.log(teks);
  // Jendela pesan hanya bila dijalankan dari menu di Google Sheet; dari editor cukup Log eksekusi.
  var aktif = null;
  try { aktif = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!aktif) return;
  try { SpreadsheetApp.getUi().alert(teks); } catch (e) {}
}
