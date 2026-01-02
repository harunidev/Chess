# ♔ Star Chess

Modern, animasyonlu satranç oyunu. Yapay zekaya karşı oyna, taktik çöz ve açılışları öğren.

![Star Chess](https://img.shields.io/badge/version-1.0.0-red) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Özellikler

### 🎮 Oyun Modları
- **⚔️ Oyna** - 3 zorluk seviyesinde yapay zekaya karşı oyna
- **🧩 Taktik** - Günlük puzzles ile becerilerini geliştir
- **📚 Öğren** - Popüler açılışları adım adım öğren

### 🎨 Tasarım
- Modern koyu tema (kırmızı/siyah)
- Animasyonlu taş hareketleri
- Şık hover efektleri
- Mobil uyumlu tasarım

### 🧠 Yapay Zeka
- Minimax algoritması
- Alpha-beta budama optimizasyonu
- 3 zorluk seviyesi (Kolay, Orta, Zor)

### 🌐 API Entegrasyonu
- Lichess günlük puzzle API'si

## 🚀 Kurulum

```bash
# Projeyi klonla
git clone https://github.com/username/star-chess.git
cd star-chess

# Yerel sunucu başlat
python3 -m http.server 8000

# veya Node.js ile
npx serve
```

Tarayıcıda aç: `http://localhost:8000`

## 📁 Proje Yapısı

```
StarPackage/
├── index.html          # Ana HTML dosyası
├── styles.css          # CSS stilleri (temalar, animasyonlar)
├── game.js             # Ana oyun mantığı
├── chess-engine.js     # Satranç motoru
├── ai-engine.js        # Yapay zeka
├── puzzle-mode.js      # Taktik modu
├── tutorial.js         # Öğrenme modu
├── lichess-api.js      # Lichess API entegrasyonu
└── storage.js          # Yerel depolama
```

## 🎯 Kullanım

1. **Oyun Başlatma**: "Oyna" butonuna tıkla, zorluk seç, renk seç
2. **Hamle Yapma**: Taşa tıkla, hedef kareye tıkla
3. **İptal**: Aynı taşa tekrar tıkla
4. **Geri Al**: "Geri Al" butonu

## 🛠️ Teknolojiler

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Font**: Google Fonts (Outfit, Inter)
- **API**: Lichess REST API

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

**Star Chess** - Harun Isik tarafından geliştirildi ♟️
