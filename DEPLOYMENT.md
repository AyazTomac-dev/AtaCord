# AtaCord Deployment Guide

## 🎯 Proje Özeti

AtaCord, tamamen sunucusuz, şifreli bir Web3 sohbet uygulamasıdır. Kullanıcılar:
- Kriptografik anahtar çiftleri ile kimlik oluşturur
- Uçtan uca şifreli mesajlaşma yapar
- WebRTC ile sesli/görüntülü arama yapar
- Arkadaş sistemini kullanır
- Tamamen Türkçe arayüz ile çalışır

## 📁 Proje Yapısı

```
AtaCord/
├── src/
│   ├── components/
│   │   ├── Auth.jsx          # Kimlik doğrulama ve kayıt
│   │   ├── Chat.jsx          # Ana sohbet arayüzü
│   │   ├── Call.jsx          # Sesli/Görüntülü arama
│   │   └── SettingsModal.jsx # Ayarlar paneli
│   ├── context/
│   │   └── SettingsContext.jsx # Tema ve ayar yönetimi
│   ├── utils/
│   │   ├── gun.js           # Gun.js yapılandırması ve SEA
│   │   └── security.js      # Güvenlik ve yardımcı fonksiyonlar
│   ├── App.jsx             # Ana uygulama bileşeni
│   ├── main.jsx            # Uygulama giriş noktası
│   └── index.css           # Global stiller
├── index.html              # HTML şablonu
├── package.json            # Bağımlılıklar
├── vite.config.js          # Vite yapılandırması
├── tailwind.config.js      # Tailwind CSS yapılandırması
├── postcss.config.js       # PostCSS yapılandırması
└── README.md              # Detaylı dökümantasyon
```

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- Node.js 16+ 
- npm veya yarn
- Git (isteğe bağlı)

### 2. Yerel Kurulum

```bash
# Depoyu klonlayın (veya klasörü açın)
cd AtaCord

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışmaya başlar.

### 3. Üretim Derlemesi

```bash
# Üretim sürümünü oluşturun
npm run build

# Yerel sunucuda test edin
npm run preview
```

## ☁️ Vercel'e Dağıtım

### Yöntem 1: Vercel CLI (En Kolay)

1. **Vercel CLI'yi yükleyin:**
```bash
npm install -g vercel
```

2. **Projede giriş yapın:**
```bash
vercel login
```

3. **İlk dağıtımı yapın:**
```bash
vercel
```

4. **Üretim ortamına alın:**
```bash
vercel --prod
```

### Yöntem 2: GitHub ile Otomatik Dağıtım

1. Kodu GitHub reposuna push'layın
2. Vercel dashboard'una gidin
3. "New Project" seçin
4. GitHub reposunu seçin
5. Deploy butonuna tıklayın

### Yapılandırma
Proje Vercel ile uyumlu olduğu için ek yapılandırmaya gerek yoktur.

## 🔧 Gerekli Ayarlar

### package.json Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "gun": "^0.2020.1239",
    "peerjs": "^1.5.2",
    "dompurify": "^3.0.8"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "tailwindcss": "^3.4.1",
    "vite": "^5.0.8"
  }
}
```

### Önemli Notlar:
- Gun.js için `optimizeDeps.exclude: ['gun']` ayarı vite.config.js içinde
- Tailwind CSS darkMode: 'class' olarak ayarlandı
- WebRTC özellikler için HTTPS gerekli (Vercel otomatik HTTPS sağlar)

## 🛡️ Güvenlik Özellikleri

1. **SEA Şifreleme**: Tüm mesajlar uçtan uca şifrelenir
2. **DOM Temizliği**: DOMPurify ile XSS önlenir
3. **Hesap Kurtarma**: Anahtar dışa/içe aktarım
4. **Engelleme Sistemi**: Kullanıcıları engelleme
5. **İzin Kontrolleri**: Mikrofon/kamera erişimi

## 🎨 Tema ve Özelleştirme

### Mevcut Temalar:
- Koyu (Dark) - Varsayılan
- Açık (Light)
- AMOLED (Siyah)

### Özelleştirme:
Tüm tema ayarları `SettingsContext.jsx` içinde tanımlanmıştır.
CSS değişkenleri kullanılarak dinamik tema değiştirme sağlanır.

## 📱 Mobil Uyumluluk

- Responsive tasarım
- Dokunmatik uyumlu
- Mobil cihazlara optimize edilmiş arayüz
- WebRTC desteği ile mobil aramalar

## 🔧 Sorun Giderme

### Yaygın Sorunlar:

1. **Yükleme Hatası**: 
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **WebRTC Çalışmaz**:
   - HTTPS gerekli (localhost hariç)
   - Tarayıcı izinlerini kontrol edin
   - Güncel tarayıcı kullanın

3. **Gun.js Senkronizasyonu**:
   - Ağ bağlantısını kontrol edin
   - PeerJS sunucusunun aktif olduğundan emin olun

4. **Tema Uygulanmıyor**:
   - localStorage izinlerini kontrol edin
   - Tarayıcı cache'ini temizleyin

## 📊 Performans İpuçları

- P2P doğası gereği merkezi sunucu maliyeti yok
- Yerel IndexedDB depolama kullanır
- Code splitting ile hızlı yükleme
- Lazy loading bileşenleri
- Görüntü optimizasyonu

## 🤝 Geliştirici İçin Notlar

### Git Hooks (İsteğe Bağlı)
```bash
npx husky init
```

### ESLint Konfigürasyonu
Proje React için özel ESLint kuralları içerir

### Commit Formatı
```bash
git commit -m "feat: yeni özellik"
git commit -m "fix: hata düzeltmesi"
git commit -m "docs: dökümantasyon güncellemesi"
```

## 🌐 DNS ve Domain Ayarları

### Vercel ile Domain:
1. Dashboard → Projects → Your Project → Settings
2. Domains bölümünden domain ekleyin
3. DNS kayıtlarınızı güncelleyin

### Özel PeerJS Sunucusu:
Opsiyonel olarak kendi PeerJS sunucunuzu kurabilirsiniz:
```
PEERJS_HOST=your-peer-server.com
PEERJS_PORT=9000
```

## 🚀 Projenin Bugünün Sonrasi İçin Olabilecekleri

### Planlanan Özellikler:
- [ ] Topluluk/Sunucu sistemi
- [ ] Dosya paylaşımı
- [ ] Grup aramaları
- [ ] Mesaj arama
- [ ] Bildirimler
- [ ] Mobil uygulama
- [ ] Daha fazla dil desteği

## 📞 Destek

- GitHub Issues: Hata raporları ve özellik istekleri
- E-posta: destek@atacord.com (varsa)
- Discord: Topluluk kanalı (gelecekte)

---

**AtaCord** - Web3 Sohbet Devrimi 🇹🇷