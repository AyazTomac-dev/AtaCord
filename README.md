# AtaCord - Merkezi Olmayan Türkçe Sohbet Uygulaması

AtaCord, React, Vite, Gun.js ve PeerJS kullanılarak oluşturulmuş, tamamen sunucusuz ve şifreli bir Web3 sohbet uygulamasıdır. Discord benzeri bir arayüze sahip olup, Türkçe dilinde çalışmaktadır.

## 🌟 Özellikler

### 🔐 Güvenlik & Gizlilik
- **End-to-End Şifreleme**: SEA (Security, Encryption, Authorization) kullanılarak tüm mesajlar şifrelenir
- **Merkezi Olmayan Kimlik**: Kullanıcılar kriptografik anahtar çiftleri ile kimlik oluşturur
- **XSS Koruması**: DOMPurify ile tüm HTML içeriği temizlenir
- **Hesap Kurtarma**: Özel anahtar dışa aktarım/içe aktarım özelliği

### 💬 Sohbet Özellikleri
- **Discord-benzeri Arayüz**: Sol panelde arkadaşlar, orta panelde sohbet, sağ panelde kullanıcı bilgileri
- **Direkt Mesajlaşma**: Arkadaşlar arasında şifreli birebir mesajlaşma
- **Topluluk Desteği**: Gelecekte eklenecek olan sunucu/topluluk sistemi
- **Çevrimiçi Durum**: Arkadaşların çevrimiçi/çevrimdışı durumları
- **Engelleme Sistemi**: İstenmeyen kullanıcıları engelleme

### 🎥 Sesli & Görüntülü Arama
- **WebRTC Tabanlı**: PeerJS ile doğrudan tarayıcılar arası bağlantı
- **Sesli Arama**: Yüksek kaliteli sesli görüşme
- **Görüntülü Arama**: Kamera desteği ile video görüşme
- **Cihaz Seçimi**: Mikrofon, hoparlör ve kamera seçimi
- **Mikrofon Testi**: Gerçek zamanlı ses seviyesi göstergesi

### 🎨 Kişiselleştirme
- **Çoklu Tema**: Koyu, açık ve AMOLED temalar
- **Yazı Boyutu**: Küçük, normal, büyük seçenekleri
- **Kompakt Mod**: Yoğun ekran kullanımı için
- **Dil Desteği**: Tam Türkçe arayüz

## 🛠️ Teknik Özellikler

### Kullanılan Teknolojiler
- **Frontend**: React 18, Vite
- **Stil**: Tailwind CSS
- **Veritabanı**: Gun.js (Merkezi Olmayan, P2P)
- **Şifreleme**: SEA (Gun.js Security)
- **WebRTC**: PeerJS
- **Temizlik**: DOMPurify

### Mimari
- **Serverless**: Tamamen istemci tarafında çalışan
- **P2P**: Doğrudan eşler arası iletişim
- **Offline-first**: Yerel depolama ile çevrimdışı kullanım
- **Statik Barındırma**: Vercel/Netlify üzerinde ücretsiz dağıtım

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 16+ 
- npm veya yarn
- Modern web tarayıcısı (WebRTC desteği olan)

### Yerel Geliştirme

1. **Depoyu klonlayın:**
```bash
git clone <repo-url>
cd AtaCord
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

4. **Tarayıcınızda açın:**
```
http://localhost:5173
```

### Üretim Derlemesi
```bash
npm run build
npm run preview
```

## ☁️ Vercel'e Dağıtım

### Yöntem 1: Vercel CLI (Önerilen)

1. **Vercel CLI'yi yükleyin:**
```bash
npm install -g vercel
```

2. **Projede oturum açın:**
```bash
vercel login
```

3. **Projeyi dağıtın:**
```bash
vercel
```

4. **Üretim ortamına dağıtın:**
```bash
vercel --prod
```

### Yöntem 2: GitHub ile Otomatik Dağıtım

1. **Kodu GitHub'a push'layın**
2. **Vercel Dashboard'a gidin**
3. **"New Project" seçin**
4. **GitHub reposunuzu seçin**
5. **Ayarları onaylayın ve dağıtın**

### Vercel Yapılandırması
Proje zaten `vercel.json` gerektirmez çünkü Vite ile uyumludur. Ancak özel ayarlar için:

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ]
}
```

## 🔧 Yapılandırma

### Ortam Değişkenleri
Vercel'de aşağıdaki ortam değişkenlerini ayarlayın:

```bash
# Opsiyonel: Özel PeerJS sunucusu
PEERJS_HOST=your-peerjs-host.com
PEERJS_PORT=443
PEERJS_PATH=/
```

### HTTPS Gereksinimi
WebRTC özellikleri için HTTPS gereklidir. Vercel otomatik olarak HTTPS sağlar.

## 📱 Kullanım Kılavuzu

### 1. Hesap Oluşturma
1. "Yeni Hesap Oluştur" seçeneğine tıklayın
2. Kullanıcı adınızı girin
3. **ÖNEMLİ**: "Gizli Anahtarı İndir" seçeneği ile anahtarınızı kaydedin
4. Hesabınız otomatik olarak oluşturulur

### 2. Arkadaş Ekleme
1. Sol panelde "Arkadaşlar" sekmesine gidin
2. "+" butonuna tıklayın
3. Arkadaşınızın Public Key'ini girin
4. Arkadaşlık isteği otomatik olarak eklenir

### 3. Sohbet Etme
1. Arkadaşınızı listeden seçin
2. Mesaj kutusuna yazıp gönder butonuna tıklayın
3. Mesajlar uçtan uca şifrelenir

### 4. Sesli/Görüntülü Arama
1. Arkadaş seçiliyken ses/video butonuna tıklayın
2. Mikrofon/kamera izinlerini verin
3. Arama başlatılır

### 5. Ayarları Yapılandırma
1. Sağ üstteki ayarlar butonuna tıklayın
2. Dört sekmeden seçim yapın:
   - **Hesabım**: Profil ve güvenlik
   - **Görünüm**: Tema ve görünüm ayarları
   - **Ses ve Görüntü**: Cihaz ayarları
   - **Gizlilik**: Gizlilik tercihleri

## 🔒 Güvenlik Uyarıları

### Kritik Önemli
- **Anahtarınızı Kaybederseniz**: Hesabınızı kurtaramazsınız. Dışa aktarılan anahtar dosyasını güvenli bir yerde saklayın.
- **Tarayıcı Verileri**: Tarayıcı önbelleğini/verilerini temizlerseniz anahtarınızı içe aktarmanız gerekir.
- **E2EE**: Mesajlar sadece gönderen ve alıcı tarafından okunabilir.

### En İyi Uygulamalar
- Anahtar dosyasını şifreli USB bellekte saklayın
- Farklı tarayıcılar için ayrı anahtarlar oluşturun
- Düzenli olarak anahtarınızı yedekleyin
- Şüpheli aktivite durumunda anahtarınızı değiştirin

## 🤝 Katkıda Bulunma

1. Forklayın
2. Özellik dalı oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'Add some AmazingFeature'`)
4. Dalı push'layın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır - detaylar için `LICENSE` dosyasına bakın.

## 🆘 Destek

- **Sorunlar**: GitHub Issues bölümünü kullanın
- **Özellik İstekleri**: Enhancement etiketi ile issue oluşturun
- **Güvenlik Açıkları**: security@atacord.com adresine e-posta gönderin

## 🚀 Gelecek Özellikler

- [ ] Topluluk/Sunucu sistemi
- [ ] Dosya paylaşımı
- [ ] Ekran paylaşımı
- [ ] Grup sesli/görüntülü aramalar
- [ ] Mesaj geçmişi yedekleme
- [ ] Mobil uygulama (React Native)
- [ ] Daha fazla emoji ve sticker
- [ ] Özel durumlar (DND, Meşgul)
- [ ] Mesaj sabitleme
- [ ] Arama işlevi

## 🙏 Teşekkürler

- [Gun.js](https://gun.eco/) - Merkezi olmayan veritabanı
- [PeerJS](https://peerjs.com/) - WebRTC kolaylaştırması
- [React](https://reactjs.org/) - Kullanıcı arayüzü
- [Tailwind CSS](https://tailwindcss.com/) - Stil sistemi
- [Vite](https://vitejs.dev/) - Derleme aracı

---

**AtaCord** - Merkezi Olmayan Türkçe Sohbet Devrimi 🇹🇷