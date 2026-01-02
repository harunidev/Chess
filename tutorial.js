/**
 * Star Chess - Tutorial Module
 * Chess Opening Tutorials
 */

class ChessTutorial {
    constructor() {
        this.openings = this.initOpenings();
        this.currentOpening = null;
        this.currentStep = 0;
    }

    initOpenings() {
        return {
            'italian': {
                name: 'İtalyan Açılışı',
                nameEn: 'Italian Game',
                description: 'Başlangıç seviyesi için ideal. Fil ile merkeze baskı yapar.',
                moves: [
                    {
                        white: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
                        notation: '1. e4',
                        explanation: 'Beyaz, e4 piyonu ile merkezi kontrol altına alır. Bu, satranç tarihindeki en popüler açılış hamlesidir. Merkez kontrolü, taşlara hareket alanı sağlar.'
                    },
                    {
                        black: { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } },
                        notation: '1... e5',
                        explanation: 'Siyah da merkeze piyon sürerek cevap verir. Her iki taraf da merkezi kontrol etmeye çalışır. Bu simetrik yapı, açık oyunların temelini oluşturur.'
                    },
                    {
                        white: { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
                        notation: '2. Nf3',
                        explanation: 'At, f3 karesine gelir. Bu hamle hem e5 piyonuna saldırır hem de kısa rok için hazırlık yapar. At, en iyi şekilde merkeze yakın karelerde konumlanır.'
                    },
                    {
                        black: { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } },
                        notation: '2... Nc6',
                        explanation: 'Siyah at, e5 piyonunu savunur. At geliştirmek her zaman iyi bir fikirdir - "Taşlarınızı geliştirin!" satranç\'ın temel kuralıdır.'
                    },
                    {
                        white: { from: { row: 7, col: 5 }, to: { row: 4, col: 2 } },
                        notation: '3. Bc4',
                        explanation: 'İtalyan Açılışı\'nın karakteristik hamlesi! Fil, f7 karesini hedef alır. Bu kare siyahın en zayıf noktasıdır çünkü sadece şah tarafından korunur.'
                    },
                    {
                        black: { from: { row: 0, col: 5 }, to: { row: 3, col: 2 } },
                        notation: '3... Bc5',
                        explanation: 'Siyah da filini geliştirir ve beyazın f2 karesini hedef alır. İki taraf da rok için hazırdır. Bu pozisyondan sonra Giuoco Piano veya Evans Gambiti gibi varyantlar oynanabilir.'
                    }
                ],
                finalPosition: 'İtalyan Açılışı tamamlandı! Bu açılış, taşların hızlı gelişimini ve merkez kontrolünü öğretir. Sonraki adımlar genellikle rok atmak ve d3 veya c3 ile merkezi güçlendirmektir.'
            },
            'sicilian': {
                name: 'Sicilya Savunması',
                nameEn: 'Sicilian Defense',
                description: 'En popüler siyah savunması. Asimetrik ve dinamik oyun sağlar.',
                moves: [
                    {
                        white: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } },
                        notation: '1. e4',
                        explanation: 'Beyaz klasik e4 açılışını yapar. Merkezi kontrol edip, fil ve vezirine yol açar.'
                    },
                    {
                        black: { from: { row: 1, col: 2 }, to: { row: 3, col: 2 } },
                        notation: '1... c5',
                        explanation: 'Sicilya Savunması! Siyah, e5 yerine c5 oynayarak asimetrik bir yapı kurar. Bu hamle beyazın d4 ile merkez genişlemesini engeller ve vezir kanadında alan kazanma fırsatı verir.'
                    },
                    {
                        white: { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } },
                        notation: '2. Nf3',
                        explanation: 'Beyaz at geliştirir ve d4 hamlesine hazırlanır. Nf3 en doğal ve en popüler devam yoludur.'
                    },
                    {
                        black: { from: { row: 1, col: 3 }, to: { row: 2, col: 3 } },
                        notation: '2... d6',
                        explanation: 'Siyah, d6 ile filine yol açar ve e5 karesini kontrol eder. Bu, Najdorf ve Dragon gibi ünlü varyantların temelidir.'
                    },
                    {
                        white: { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } },
                        notation: '3. d4',
                        explanation: 'Beyaz merkezi açar! Bu hamle çok önemlidir - c5 piyonu d4\'ü alırsa, beyaz güçlü bir şövalye d4\'e yerleştirebilir.'
                    },
                    {
                        black: { from: { row: 3, col: 2 }, to: { row: 4, col: 3 } },
                        notation: '3... cxd4',
                        explanation: 'Siyah merkez piyonunu alır. Sicilya\'nın temel fikri budur: c piyonunu d piyonuyla değiştirerek merkezdeki beyaz üstünlüğünü azaltmak.'
                    },
                    {
                        white: { from: { row: 5, col: 5 }, to: { row: 4, col: 3 } },
                        notation: '4. Nxd4',
                        explanation: 'At merkeze yerleşir. Açık Sicilya pozisyonu! Bu pozisyondan yüzlerce farklı varyant türer. Siyah genellikle Nf6, a6, veya Nc6 ile devam eder.'
                    }
                ],
                finalPosition: 'Açık Sicilya pozisyonuna ulaştık! Bu, satranç tarihinin en çok analiz edilmiş ve en keskin açılışlarından biridir. Profesyonel oyuncular arasında çok popülerdir.'
            },
            'queens-gambit': {
                name: 'Vezir Gambiti',
                nameEn: "Queen's Gambit",
                description: 'Klasik ve stratejik açılış. Pozisyonel üstünlük hedefler.',
                moves: [
                    {
                        white: { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } },
                        notation: '1. d4',
                        explanation: 'Beyaz d4 ile açar. Bu açılış, e4\'e göre daha kapalı ve stratejik oyunlara yol açar. Vezir piyonu merkezi kontrol eder.'
                    },
                    {
                        black: { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } },
                        notation: '1... d5',
                        explanation: 'Siyah da d5 ile merkezi tutar. Simetrik piyon yapısı oluşur. Bu pozisyon, Vezir Gambiti ailesinin temelidir.'
                    },
                    {
                        white: { from: { row: 6, col: 2 }, to: { row: 4, col: 2 } },
                        notation: '2. c4',
                        explanation: 'Vezir Gambiti! Beyaz c piyonunu "feda" eder gibi görünür. Aslında bu gerçek bir gambit değildir çünkü siyah piyonu uzun süre tutamaz. Amaç d5 piyonuna baskı yapmaktır.'
                    },
                    {
                        black: { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } },
                        notation: '2... e6',
                        explanation: 'Vezir Gambiti Reddedildi (QGD)! Siyah d5 piyonunu e6 ile destekler. Bu savunma çok sağlamdır ama siyahın c8 filini biraz kısıtlar.'
                    },
                    {
                        white: { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } },
                        notation: '3. Nc3',
                        explanation: 'Beyaz at merkeze gelir ve d5\'e baskı yapar. c4 ve Nc3 kombinasyonu d5 piyonuna önemli baskı oluşturur.'
                    },
                    {
                        black: { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } },
                        notation: '3... Nf6',
                        explanation: 'Siyah da at geliştirir ve d5\'i savunur. Ayrıca kısa rok için hazırlık yapar. Klasik QGD pozisyonu oluştu.'
                    },
                    {
                        white: { from: { row: 7, col: 2 }, to: { row: 4, col: 6 } },
                        notation: '4. Bg5',
                        explanation: 'Fil, atı pim altına alır! Bu hamle siyahın Nxe4 oynamasını engeller. Ayrıca h4-Bxf6 tehdidiyle siyahın piyon yapısını bozmayı hedefler.'
                    }
                ],
                finalPosition: 'Klasik Vezir Gambiti Reddedildi pozisyonu! Bu açılış yüzyıllar boyunca dünya şampiyonları tarafından oynanmıştır. Netflix dizisi "The Queen\'s Gambit" bu açılıştan adını alır.'
            }
        };
    }

    // Start a tutorial
    startTutorial(openingKey) {
        if (!this.openings[openingKey]) {
            return null;
        }
        this.currentOpening = openingKey;
        this.currentStep = 0;
        return this.openings[openingKey];
    }

    // Get current opening info
    getCurrentOpening() {
        if (!this.currentOpening) return null;
        return this.openings[this.currentOpening];
    }

    // Get current step
    getCurrentStep() {
        if (!this.currentOpening) return null;
        const opening = this.openings[this.currentOpening];
        if (this.currentStep >= opening.moves.length) {
            return {
                isFinal: true,
                message: opening.finalPosition
            };
        }
        return {
            isFinal: false,
            step: this.currentStep + 1,
            total: opening.moves.length,
            move: opening.moves[this.currentStep]
        };
    }

    // Go to next step
    nextStep() {
        if (!this.currentOpening) return null;
        const opening = this.openings[this.currentOpening];
        if (this.currentStep < opening.moves.length) {
            this.currentStep++;
        }
        return this.getCurrentStep();
    }

    // Go to previous step
    prevStep() {
        if (!this.currentOpening) return null;
        if (this.currentStep > 0) {
            this.currentStep--;
        }
        return this.getCurrentStep();
    }

    // Reset tutorial
    resetTutorial() {
        this.currentStep = 0;
        return this.getCurrentStep();
    }

    // Get board position at current step
    getBoardAtStep(step) {
        if (!this.currentOpening) return null;

        const engine = new ChessEngine();
        const opening = this.openings[this.currentOpening];

        for (let i = 0; i < step && i < opening.moves.length; i++) {
            const move = opening.moves[i];
            if (move.white) {
                engine.makeMove(move.white.from.row, move.white.from.col,
                    move.white.to.row, move.white.to.col);
            }
            if (move.black) {
                engine.makeMove(move.black.from.row, move.black.from.col,
                    move.black.to.row, move.black.to.col);
            }
        }

        return engine.board;
    }

    // Get all openings for menu
    getAllOpenings() {
        return Object.entries(this.openings).map(([key, value]) => ({
            key,
            name: value.name,
            nameEn: value.nameEn,
            description: value.description,
            moveCount: value.moves.length
        }));
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessTutorial;
}
