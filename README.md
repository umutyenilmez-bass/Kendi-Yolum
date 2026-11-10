# Kendi Yolum

İşimi yap. Kendimi koru. Kendi geleceğimi kur.

Kişisel ilkeler, günlük kontrol, haftalık ve aylık değerlendirme, kendi projeler ve basılabilir hatırlatma kartları için sade bir web uygulaması.

- Bağımlılık yok: `index.html`, `styles.css`, `app.js`.
- Kayıtlar yalnızca kullanıldığı tarayıcıda (localStorage) saklanır; bu depoda hiçbir kişisel kayıt bulunmaz.
- Telefonda ana ekrana eklenebilir ve internet olmadan çalışır (`manifest.webmanifest`, `sw.js`).
- Yedekleme sayfasından JSON olarak dışa/içe aktarılabilir.

Güncelleme yaparken `sw.js` içindeki `VERSION` değerini artır; telefondaki uygulama yeni sürümü bir sonraki açılışta alır.
