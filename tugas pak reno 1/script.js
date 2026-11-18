// Data produk — ubah/tambah sesuai stok toko Anda
const produk = [
  {id:1, nama:"Kaos Katun Polos", kat:"baju", harga:89000, emoji:"👕", warna:"#cfe0ee", ukuran:["S","M","L","XL"]},
  {id:2, nama:"Kemeja Flanel Kotak", kat:"baju", harga:179000, emoji:"👔", warna:"#efd9b0", ukuran:["M","L","XL"]},
  {id:3, nama:"Hoodie Fleece", kat:"baju", harga:249000, emoji:"🧥", warna:"#d6d9e8", ukuran:["S","M","L","XL"]},
  {id:4, nama:"Jaket Denim", kat:"jaket", harga:329000, emoji:"🧥", warna:"#b7cbe0", ukuran:["M","L","XL"]},
  {id:5, nama:"Jaket Bomber", kat:"jaket", harga:359000, emoji:"🧥", warna:"#cdd8c6", ukuran:["S","M","L"]},
  {id:6, nama:"Jaket Parasut Anti Air", kat:"jaket", harga:289000, emoji:"🧥", warna:"#f0d2c4", ukuran:["M","L","XL"]}
];
const NO_WA = "6281200000000"; // ganti dengan nomor WhatsApp Anda (awali 62)

const rupiah = n => "Rp" + n.toLocaleString("id-ID");
let keranjang = [];
try { keranjang = JSON.parse(localStorage.getItem("keranjang")) || []; } catch(e){}
const pilihanUkuran = {};

const $ = id => document.getElementById(id);
const grid = $("grid"), panel = $("panel"), overlay = $("overlay");

function tampilProduk(kat = "semua"){
  grid.innerHTML = "";
  produk.filter(p => kat === "semua" || p.kat === kat).forEach(p => {
    pilihanUkuran[p.id] = pilihanUkuran[p.id] || p.ukuran[0];
    const el = document.createElement("article");
    el.className = "kartu";
    el.innerHTML = `
      <div class="foto" style="background:${p.warna}" aria-hidden="true">${p.emoji}</div>
      <div class="info">
        <h3>${p.nama}</h3>
        <small>${p.kat === "baju" ? "Baju" : "Jaket"}</small>
        <div class="ukuran">${p.ukuran.map(u =>
          `<button data-id="${p.id}" data-u="${u}" class="${u === pilihanUkuran[p.id] ? "pilih" : ""}">${u}</button>`).join("")}</div>
        <div class="harga">${rupiah(p.harga)}</div>
        <button class="tambah" data-tambah="${p.id}">Tambah ke keranjang</button>
      </div>`;
    grid.appendChild(el);
  });
}

grid.addEventListener("click", e => {
  const u = e.target.closest("[data-u]");
  if (u){
    pilihanUkuran[u.dataset.id] = u.dataset.u;
    u.parentElement.querySelectorAll("button").forEach(b => b.classList.toggle("pilih", b === u));
  }
  const t = e.target.closest("[data-tambah]");
  if (t) tambahKeKeranjang(+t.dataset.tambah);
});

$("filter").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  document.querySelectorAll("#filter button").forEach(x => x.classList.toggle("aktif", x === b));
  tampilProduk(b.dataset.kat);
});

function tambahKeKeranjang(id){
  const p = produk.find(x => x.id === id), uk = pilihanUkuran[id];
  const ada = keranjang.find(i => i.id === id && i.ukuran === uk);
  ada ? ada.qty++ : keranjang.push({id, ukuran: uk, qty: 1});
  simpan(); toast(`${p.nama} (${uk}) masuk keranjang`);
}

function simpan(){
  try { localStorage.setItem("keranjang", JSON.stringify(keranjang)); } catch(e){}
  renderKeranjang();
}

function renderKeranjang(){
  const ul = $("daftar"); ul.innerHTML = "";
  let total = 0, jumlah = 0;
  if (!keranjang.length) ul.innerHTML = `<li class="kosong">Keranjang masih kosong. Pilih produk lalu tekan “Tambah ke keranjang”.</li>`;
  keranjang.forEach((i, idx) => {
    const p = produk.find(x => x.id === i.id);
    total += p.harga * i.qty; jumlah += i.qty;
    const li = document.createElement("li");
    li.innerHTML = `
      <div><strong>${p.nama}</strong><br><small>Ukuran ${i.ukuran} · ${rupiah(p.harga)}</small></div>
      <div>${rupiah(p.harga * i.qty)}</div>
      <div class="qty"><button data-k="-${idx}" aria-label="Kurangi">−</button>${i.qty}<button data-k="+${idx}" aria-label="Tambah">+</button></div>
      <button class="hapus" data-k="x${idx}">Hapus</button>`;
    ul.appendChild(li);
  });
  $("total").textContent = rupiah(total);
  $("jumlah").textContent = jumlah;
}

$("daftar").addEventListener("click", e => {
  const k = e.target.dataset.k; if (!k) return;
  const idx = +k.slice(1);
  if (k[0] === "+") keranjang[idx].qty++;
  else if (k[0] === "-") { if (--keranjang[idx].qty <= 0) keranjang.splice(idx, 1); }
  else keranjang.splice(idx, 1);
  simpan();
});

function bukaPanel(b){ panel.classList.toggle("buka", b); overlay.classList.toggle("buka", b); }
$("btnKeranjang").onclick = () => bukaPanel(true);
$("tutup").onclick = overlay.onclick = () => bukaPanel(false);
document.addEventListener("keydown", e => e.key === "Escape" && bukaPanel(false));

$("checkout").onclick = () => {
  if (!keranjang.length) return toast("Keranjang masih kosong");
  let total = 0;
  const baris = keranjang.map(i => {
    const p = produk.find(x => x.id === i.id); total += p.harga * i.qty;
    return `- ${p.nama} (${i.ukuran}) x${i.qty} = ${rupiah(p.harga * i.qty)}`;
  });
  const pesan = `Halo Lapis, saya ingin memesan:\n${baris.join("\n")}\nTotal: ${rupiah(total)}`;
  window.open(`https://wa.me/${NO_WA}?text=${encodeURIComponent(pesan)}`, "_blank");
};

let timer;
function toast(teks){
  const t = $("toast"); t.textContent = teks; t.classList.add("tampil");
  clearTimeout(timer); timer = setTimeout(() => t.classList.remove("tampil"), 2000);
}

tampilProduk(); renderKeranjang();
