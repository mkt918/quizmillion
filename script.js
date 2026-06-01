class QuizApp {
    constructor() {
        this.storage = new StorageManager();
        this.audioManager = new AudioManager();

        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizDataUrl = 'data/2025_jo03.csv';
        this.pendingMode = 'quiz'; // 'quiz' or 'flashcard'

        // Flashcard state
        this.fcCards = [];
        this.fcIndex = 0;
        this.fcKnownIds = [];
        this.fcUnknownIds = [];
        this.fcSelectedUnits = [];

        // Shop
        this.totalPrize = this.storage.getTotalPrize();
        this.ownedItems = this.storage.getOwnedItems();
        this.activeTheme = this.storage.getActiveTheme();

        this.shopItems = [
            { id: 'default-theme',  category: 'theme', name: 'デフォルトブルー',     price: 0,         desc: '標準的なミリオネアブルー',   icon: '💎' },
            { id: 'theme-forest',   category: 'theme', name: 'ミスティックフォレスト', price: 1000000,   desc: '神秘的な森の緑',            icon: '🌲' },
            { id: 'theme-ocean',    category: 'theme', name: 'ディープオーシャン',    price: 5000000,   desc: '深海の静寂',                icon: '🌊' },
            { id: 'theme-darknight',category: 'theme', name: 'ダークナイト',          price: 10000000,  desc: 'クールな黒と紫',            icon: '🌙' },
            { id: 'theme-sunset',   category: 'theme', name: 'サンセットグロウ',      price: 20000000,  desc: '夕暮れのグラデーション',    icon: '🌅' },
            { id: 'theme-cyber',    category: 'theme', name: 'サイバーパンク',        price: 40000000,  desc: 'ネオン輝く近未来',          icon: '🤖' },
            { id: 'theme-gold',     category: 'theme', name: 'ゴールド',             price: 70000000,  desc: '豪華な黄金のテーマ',        icon: '✨' },
            { id: 'theme-rose',     category: 'theme', name: 'ロイヤルローズ',        price: 100000000, desc: '優雅な赤と金',              icon: '🌹' },
            { id: 'theme-sakura',   category: 'theme', name: '真夜中の桜',           price: 150000000, desc: '月夜に舞う幻想的な桜',      icon: '🌸' },
            { id: 'theme-galaxy',   category: 'theme', name: 'ギャラクシー',          price: 200000000, desc: '無限に広がる星々の輝き',    icon: '🌌' },
            { id: 'theme-volcano',  category: 'theme', name: 'ヴォルカニック',        price: 300000000, desc: 'たぎる溶岩の情熱',          icon: '🌋' },
            { id: 'theme-snow',     category: 'theme', name: 'スノークリスタル',      price: 400000000, desc: '絶対零度の美しさ',          icon: '❄️' },
            { id: 'theme-marble',   category: 'theme', name: 'マーブルラグジュアリー', price: 500000000, desc: '最高級大理石の質感',        icon: '🏛️' },
        ];

        this.isReviewMode = false;
        this.mistakes = this.storage.getMistakes();
        this.history = this.storage.getHistory();

        this.screens = {
            start:             document.getElementById('start-screen'),
            flashcard:         document.getElementById('flashcard-screen'),
            flashcardComplete: document.getElementById('flashcard-complete-screen'),
            category:          document.getElementById('category-selection-screen'),
            review:            document.getElementById('review-selection-screen'),
            history:           document.getElementById('history-screen'),
            units:             document.getElementById('unit-selection-screen'),
            quiz:              document.getElementById('quiz-screen'),
            result:            document.getElementById('result-screen'),
            shop:              document.getElementById('theme-shop-screen'),
        };

        this.els = {
            questionText:    document.getElementById('question-text'),
            questionImage:   document.getElementById('question-image'),
            imageContainer:  document.getElementById('image-container'),
            unitDisplay:     document.getElementById('unit-display'),
            qNum:            document.getElementById('q-num'),
            scoreVal:        document.getElementById('score-val'),
            scoreTable:      document.getElementById('score-table'),
            reviewList:      document.getElementById('review-list'),
            historyList:     document.getElementById('history-list'),
            unitList:        document.getElementById('unit-selection-list'),
            unitError:       document.getElementById('unit-error'),
            unitCount:       document.getElementById('total-selected-questions'),
            totalPrizeDisplay: document.getElementById('shop-total-prize-display'),
            shopItemList:    document.getElementById('shop-items-container'),
            options:         Array.from(document.querySelectorAll('.option-btn')),
            lifelineBtns: {
                '5050':     document.getElementById('lifeline-5050'),
                'phone':    document.getElementById('lifeline-phone'),
                'audience': document.getElementById('lifeline-audience'),
            },
            feedbackOverlay:       document.getElementById('feedback-overlay'),
            feedbackTitle:         document.getElementById('feedback-title'),
            feedbackExplanation:   document.getElementById('feedback-explanation'),
            feedbackCorrectAnswer: document.getElementById('feedback-correct-answer'),
            feedbackNextPrize:     document.getElementById('feedback-next-prize'),
            audienceModal:         document.getElementById('audience-modal'),
            audienceBars: {
                'A': document.getElementById('bar-a'),
                'B': document.getElementById('bar-b'),
                'C': document.getElementById('bar-c'),
                'D': document.getElementById('bar-d'),
            },
            audiencePercents: {
                'A': document.getElementById('percent-a'),
                'B': document.getElementById('percent-b'),
                'C': document.getElementById('percent-c'),
                'D': document.getElementById('percent-d'),
            },
            phoneHintArea: document.getElementById('phone-hint-area'),
            phoneHintText: document.getElementById('phone-hint-text'),
            introModal:    document.getElementById('intro-modal'),
            introNextBtn:  document.getElementById('intro-next-btn'),
            introDontShow: document.getElementById('intro-dont-show'),
        };

        this.prizes = [
            10000, 20000, 30000, 50000, 100000,
            150000, 250000, 500000, 750000, 1000000,
            1500000, 2500000, 5000000, 7500000, 10000000,
            15000000, 25000000, 50000000, 75000000, 100000000,
        ];

        this.lifelineManager = new LifelineManager(this.els);
        window.fcApp = this; // expose for flashcard click handler

        this.applyTheme(this.activeTheme);
        this.initEventListeners();
    }

    async init() {
        await this.loadQuestions();
        if (!this.storage.getIntroSeen()) this.showIntro();
    }

    // ============================================================
    //  EVENT LISTENERS
    // ============================================================
    initEventListeners() {
        // Start screen
        document.getElementById('start-btn').onclick = () => {
            this.pendingMode = 'quiz';
            this.showCategorySelection();
        };
        document.getElementById('flashcard-btn').onclick = () => {
            this.pendingMode = 'flashcard';
            this.audioManager.init();
            document.getElementById('category-screen-title').textContent = '単語学習するカテゴリを選んでください';
            document.getElementById('unit-screen-title').textContent = '学習する単元を選んでください';
            document.getElementById('confirm-units-btn').textContent = '学習開始';
            this.showScreen('category');
        };
        document.getElementById('review-menu-btn').onclick = () => {
            this.audioManager.init();
            this.showReviewSelection();
        };
        document.getElementById('history-menu-btn').onclick = () => this.showHistory();
        document.getElementById('shop-menu-btn').onclick = () => this.showShop();

        // Category
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.onclick = () => this.handleCategorySelection(btn.dataset.csv);
        });
        document.getElementById('category-back-btn').onclick = () => {
            this._resetCategoryUI();
            this.showScreen('start');
        };

        // Unit selection
        document.getElementById('select-all-units-btn').onclick = () => this.selectAllUnits();
        document.getElementById('confirm-units-btn').onclick = () => this.confirmUnits();
        document.getElementById('unit-selection-back-btn').onclick = () => this.showScreen('category');

        // Review
        document.getElementById('review-back-btn').onclick = () => this.showScreen('start');

        // History
        document.getElementById('history-back-btn').onclick = () => this.showScreen('start');

        // Quiz
        document.getElementById('next-question-btn').onclick = () => this.nextQuestion();
        document.getElementById('toggle-score-btn').onclick = () => this.els.scoreTable.classList.toggle('visible');
        document.getElementById('close-audience').addEventListener('click', () => this.els.audienceModal.classList.add('hidden'));
        document.getElementById('give-up-btn').onclick = () => {
            if (confirm('本当にあきらめますか？現在の賞金で終了します。')) this.showResult(true);
        };

        this.els.options.forEach(btn => btn.onclick = (e) => this.handleAnswer(e));

        this.els.lifelineBtns['5050'].addEventListener('click', () => {
            this.lifelineManager.use5050(this.correctShuffledIndex, this.els.options);
        });
        this.els.lifelineBtns['phone'].addEventListener('click', () => {
            this.lifelineManager.usePhone(this.currentQuizSet[this.currentQuestionIndex]);
        });
        this.els.lifelineBtns['audience'].addEventListener('click', () => {
            const r = this.lifelineManager.useAudience(this.correctShuffledIndex, this.shuffledOptions);
            if (r !== this.correctShuffledIndex) this.correctShuffledIndex = r;
        });

        // Result
        document.getElementById('retry-btn').onclick = () => {
            if (this.isReviewMode) { this.showReviewSelection(); }
            else { this.showUnitSelection(); }
        };
        document.getElementById('home-btn').onclick = () => {
            this.audioManager.stopBGM();
            this.showScreen('start');
        };
        const reviewFromResult = document.getElementById('review-from-result-btn');
        if (reviewFromResult) {
            reviewFromResult.onclick = () => {
                this.audioManager.stopBGM();
                this.showReviewSelection();
            };
        }

        // Shop
        document.getElementById('shop-close-btn').onclick = () => this.showScreen('start');

        // Intro
        this.els.introNextBtn.onclick = () => {
            const current = this.els.introModal.querySelector('.intro-slide.active');
            const next = current.nextElementSibling;
            if (next && next.classList.contains('intro-slide')) {
                current.classList.remove('active');
                next.classList.add('active');
                if (!next.nextElementSibling?.classList.contains('intro-slide')) {
                    this.els.introNextBtn.textContent = 'START';
                }
            } else {
                if (this.els.introDontShow.checked) this.storage.setIntroSeen(true);
                this.els.introModal.classList.add('hidden');
            }
        };

        // Flashcard screen
        document.getElementById('fc-exit-btn').onclick = () => {
            this._resetCategoryUI();
            this.showScreen('start');
        };
        document.getElementById('fc-known-btn').onclick = () => this.rateCard(true);
        document.getElementById('fc-unknown-btn').onclick = () => this.rateCard(false);

        // Flashcard complete screen
        document.getElementById('fc-quiz-btn').onclick = () => {
            // Start quiz with the cards from this session (unknown first, or all)
            const targetIds = this.fcUnknownIds.length > 0 ? this.fcUnknownIds : this.fcCards.map(q => q.id);
            const quizSet = this.questions.filter(q => targetIds.includes(q.id));
            this._resetCategoryUI();
            this.pendingMode = 'quiz';
            this.startQuizWithSet(quizSet);
        };
        document.getElementById('fc-retry-unknown-btn').onclick = () => {
            if (this.fcUnknownIds.length === 0) {
                this.startFlashcards(this.fcCards, this.fcSelectedUnits);
            } else {
                const unknowns = this.questions.filter(q => this.fcUnknownIds.includes(q.id));
                this.startFlashcards(unknowns, this.fcSelectedUnits);
            }
        };
        document.getElementById('fc-retry-all-btn').onclick = () => {
            this.startFlashcards(this.fcCards, this.fcSelectedUnits);
        };
        document.getElementById('fc-home-btn').onclick = () => {
            this._resetCategoryUI();
            this.showScreen('start');
        };
    }

    _resetCategoryUI() {
        document.getElementById('category-screen-title').textContent = '大単元を選んでください';
        document.getElementById('unit-screen-title').textContent = '出題する単元を選んでください';
        document.getElementById('confirm-units-btn').textContent = '開始';
    }

    // ============================================================
    //  DATA LOADING
    // ============================================================
    async loadQuestions() {
        try {
            const response = await fetch(this.quizDataUrl);
            const text = await response.text();
            this.questions = this.parseCSV(text);
        } catch (error) {
            alert('データの読み込みに失敗しました。');
        }
    }

    parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        const questions = [];

        const parseRow = (line) => {
            const fields = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const c = line[i];
                if (c === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                else if (c === '"') { inQuotes = !inQuotes; }
                else if (c === ',' && !inQuotes) { fields.push(current); current = ''; }
                else { current += c; }
            }
            fields.push(current);
            return fields;
        };

        for (let i = 1; i < lines.length; i++) {
            const row = parseRow(lines[i]);
            if (row.length < 4) continue;
            const q = {
                id:            row[0],
                unit:          (row[1] || '').trim(),
                text:          (row[2] || '').trim(),
                correctAnswer: (row[3] || '').trim(),
                image:         (row[4] || '').trim(),
                explanation:   (row[5] || '').trim(),
            };
            if (q.text) questions.push(q);
        }
        return questions;
    }

    // ============================================================
    //  SCREEN MANAGEMENT
    // ============================================================
    showScreen(screenId) {
        Object.values(this.screens).forEach(s => s && s.classList.remove('active'));
        if (this.screens[screenId]) this.screens[screenId].classList.add('active');
    }

    showIntro() {
        const slides = this.els.introModal.querySelectorAll('.intro-slide');
        slides.forEach(s => s.classList.remove('active'));
        slides[0].classList.add('active');
        this.els.introNextBtn.textContent = 'NEXT';
        this.els.introModal.classList.remove('hidden');
    }

    // ============================================================
    //  CATEGORY & UNIT SELECTION
    // ============================================================
    showCategorySelection() {
        this.audioManager.init();
        this.audioManager.resumeContext();
        this.showScreen('category');
    }

    async handleCategorySelection(csvPath) {
        this.quizDataUrl = csvPath;
        await this.loadQuestions();
        if (this.questions.length === 0) {
            alert('問題データの読み込みに失敗しました。');
            return;
        }
        if (this.pendingMode === 'quiz') this.audioManager.playBGM('main');
        this.showUnitSelection();
    }

    showUnitSelection() {
        this.showScreen('units');
        this.els.unitList.innerHTML = '';
        this.els.unitError.classList.add('hidden');

        const unitStats = this.storage.getUnitStats();
        const units = [...new Set(this.questions.map(q => q.unit).filter(u => u))];

        units.forEach(unit => {
            const stats = unitStats[unit];
            const accuracy = stats && stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : null;

            const btn = document.createElement('div');
            btn.className = 'unit-select-btn';

            let progressHtml = '';
            if (accuracy !== null) {
                const color = accuracy >= 80 ? '#4ade80' : accuracy >= 50 ? '#fbbf24' : '#f87171';
                progressHtml = `
                    <div class="unit-progress">
                        <div class="unit-progress-fill" style="width:${accuracy}%; background:${color}"></div>
                    </div>
                    <span class="unit-accuracy-label" style="color:${color}">${accuracy}% 正解 (${stats.total}回)</span>
                `;
            }

            btn.innerHTML = `<span>${unit}</span>${progressHtml}`;
            btn.onclick = () => {
                btn.classList.toggle('selected');
                this.els.unitError.classList.add('hidden');
                this.updateUnitCount();
            };
            this.els.unitList.appendChild(btn);
        });
        this.updateUnitCount();
    }

    updateUnitCount() {
        const selected = Array.from(this.els.unitList.querySelectorAll('.unit-select-btn.selected')).map(b => b.querySelector('span').textContent);
        const count = this.questions.filter(q => selected.includes(q.unit)).length;
        this.els.unitCount.textContent = `選択された問題数: ${count}問`;
    }

    selectAllUnits() {
        this.els.unitList.querySelectorAll('.unit-select-btn').forEach(b => b.classList.add('selected'));
        this.els.unitError.classList.add('hidden');
        this.updateUnitCount();
    }

    confirmUnits() {
        const selected = Array.from(this.els.unitList.querySelectorAll('.unit-select-btn.selected')).map(b => b.querySelector('span').textContent);
        if (selected.length === 0) {
            this.els.unitError.classList.remove('hidden');
            return;
        }

        if (this.pendingMode === 'flashcard') {
            const cards = this.questions.filter(q => selected.includes(q.unit));
            this.startFlashcards(cards, selected);
        } else {
            this.startQuiz(false, null, selected);
        }
    }

    // ============================================================
    //  FLASHCARD MODE
    // ============================================================
    startFlashcards(cards, selectedUnits) {
        this.fcCards = this.shuffle([...cards]);
        this.fcIndex = 0;
        this.fcKnownIds = [];
        this.fcUnknownIds = [];
        this.fcSelectedUnits = selectedUnits || [];

        document.getElementById('fc-known-num').textContent = '0';
        document.getElementById('fc-unknown-num').textContent = '0';

        this.showScreen('flashcard');
        this.showCurrentCard();
    }

    showCurrentCard() {
        if (this.fcIndex >= this.fcCards.length) {
            this.showFlashcardComplete();
            return;
        }

        const card = this.fcCards[this.fcIndex];
        const total = this.fcCards.length;
        const pct = Math.round(this.fcIndex / total * 100);

        document.getElementById('fc-progress-text').textContent = `${this.fcIndex + 1} / ${total}`;
        document.getElementById('fc-progress-fill').style.width = pct + '%';
        document.getElementById('fc-unit').textContent = card.unit;
        document.getElementById('fc-question').textContent = card.text;
        document.getElementById('fc-answer').textContent = card.correctAnswer;
        document.getElementById('fc-explanation').textContent = card.explanation || '';

        // Reset flip state
        const fcCard = document.getElementById('fc-card');
        fcCard.classList.remove('flipped');

        document.getElementById('fc-actions').classList.add('hidden');
    }

    flipCard() {
        const fcCard = document.getElementById('fc-card');
        if (fcCard.classList.contains('flipped')) return;
        fcCard.classList.add('flipped');
        setTimeout(() => {
            document.getElementById('fc-actions').classList.remove('hidden');
        }, 280);
    }

    rateCard(knew) {
        const card = this.fcCards[this.fcIndex];
        if (knew) {
            this.fcKnownIds.push(card.id);
        } else {
            this.fcUnknownIds.push(card.id);
        }

        document.getElementById('fc-known-num').textContent = this.fcKnownIds.length;
        document.getElementById('fc-unknown-num').textContent = this.fcUnknownIds.length;

        this.fcIndex++;
        this.showCurrentCard();
    }

    showFlashcardComplete() {
        const known = this.fcKnownIds.length;
        const unknown = this.fcUnknownIds.length;
        const total = this.fcCards.length;

        document.getElementById('fc-known-count').textContent = known;
        document.getElementById('fc-unknown-count').textContent = unknown;

        let msg = '';
        if (unknown === 0) {
            msg = `完璧です！全 ${total} 問すべてわかりました🎉\nクイズで腕試しをしてみましょう！`;
        } else {
            msg = `${total} 問中 ${known} 問わかりました。\nわからなかった ${unknown} 問を重点的に復習しましょう。`;
        }
        document.getElementById('fc-complete-msg').textContent = msg;

        const retryUnknownBtn = document.getElementById('fc-retry-unknown-btn');
        retryUnknownBtn.textContent = unknown > 0
            ? `🔄 わからなかった ${unknown} 問を再学習`
            : '🔄 もう一度学習する';

        this.showScreen('flashcardComplete');
    }

    // ============================================================
    //  QUIZ
    // ============================================================
    startQuiz(reviewMode = false, specificQuestionId = null, selectedUnits = null) {
        if (!this.audioManager.audioCtx) this.audioManager.init();
        this.audioManager.resumeContext();
        this.audioManager.playBGM('main');

        this.isReviewMode = reviewMode;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.sessionMistakes = [];
        this.lifelineManager.reset();

        let quizSet = [...this.questions];

        if (specificQuestionId) {
            quizSet = quizSet.filter(q => q.id === specificQuestionId);
        } else if (this.isReviewMode) {
            quizSet = quizSet.filter(q => this.mistakes.includes(q.id));
            this.shuffle(quizSet);
        } else if (selectedUnits && selectedUnits.length > 0) {
            quizSet = quizSet.filter(q => selectedUnits.includes(q.unit));
            this.shuffle(quizSet);
        } else {
            this.shuffle(quizSet);
        }

        this.currentQuizSet = quizSet.slice(0, 20);

        if (this.currentQuizSet.length === 0) {
            alert('問題が見つかりませんでした。');
            this.audioManager.stopBGM();
            return;
        }

        this.showScreen('quiz');
        this.displayQuestion();
    }

    startQuizWithSet(quizSet) {
        if (!this.audioManager.audioCtx) this.audioManager.init();
        this.audioManager.resumeContext();
        this.audioManager.playBGM('main');

        this.isReviewMode = false;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.sessionMistakes = [];
        this.lifelineManager.reset();

        this.shuffle(quizSet);
        this.currentQuizSet = quizSet.slice(0, 20);

        if (this.currentQuizSet.length === 0) {
            alert('問題が見つかりませんでした。');
            return;
        }

        this.showScreen('quiz');
        this.displayQuestion();
    }

    renderScoreTable() {
        this.els.scoreTable.innerHTML = '';
        this.prizes.forEach((prize, idx) => {
            const row = document.createElement('div');
            row.className = 'score-row';
            if (idx === this.currentQuestionIndex) row.classList.add('active');
            if (idx < this.score) row.classList.add('passed');
            if ((idx + 1) % 5 === 0) row.classList.add('safe-point');
            row.innerHTML = `<span>${idx + 1}</span><span>¥${prize.toLocaleString()}</span>`;
            this.els.scoreTable.appendChild(row);
        });
    }

    displayQuestion() {
        if (this.currentQuestionIndex >= this.currentQuizSet.length) {
            this.showResult();
            return;
        }

        const q = this.currentQuizSet[this.currentQuestionIndex];

        if (this.els.phoneHintArea) {
            this.els.phoneHintArea.classList.add('hidden');
            if (this.els.phoneHintText) this.els.phoneHintText.textContent = '';
        }

        this.els.options.forEach(btn => btn.style.opacity = '1');

        if (this.els.audienceBars) {
            Object.values(this.els.audienceBars).forEach(bar => { if (bar) bar.style.height = '0%'; });
        }
        if (this.els.audiencePercents) {
            Object.values(this.els.audiencePercents).forEach(p => {
                if (p) { p.textContent = '0%'; p.classList.remove('visible'); }
            });
        }
        if (this.els.audienceModal) this.els.audienceModal.classList.add('hidden');

        this.els.questionText.textContent = q.text;
        this.els.qNum.textContent = this.currentQuestionIndex + 1;
        this.els.unitDisplay.textContent = q.unit || '';
        this.els.scoreVal.textContent = (this.score > 0 ? this.prizes[this.score - 1] : 0).toLocaleString();

        this.renderScoreTable();

        // Build distractors
        const correctText = q.correctAnswer;
        let pool = [...new Set(
            this.questions
                .filter(item => item.unit === q.unit && item.id !== q.id)
                .map(item => item.correctAnswer)
                .filter(t => t !== correctText)
        )];
        if (pool.length < 3) {
            const extra = [...new Set(
                this.questions.filter(item => item.id !== q.id).map(item => item.correctAnswer).filter(t => t !== correctText)
            )];
            pool = [...new Set([...pool, ...extra])];
        }
        this.shuffle(pool);
        const distractors = pool.slice(0, 3);

        const allOptions = [
            { text: correctText, isCorrect: true },
            ...distractors.map(text => ({ text, isCorrect: false })),
        ];
        while (allOptions.length < 4) allOptions.push({ text: '???', isCorrect: false });

        this.shuffledOptions = this.shuffle([...allOptions]);
        this.correctShuffledIndex = this.shuffledOptions.findIndex(o => o.isCorrect);

        if (q.image) {
            this.els.questionImage.src = `assets/images/${q.image}`;
            this.els.imageContainer.classList.remove('hidden');
        } else {
            this.els.imageContainer.classList.add('hidden');
        }

        this.els.options.forEach((btn, idx) => {
            btn.querySelector('.option-text').textContent = this.shuffledOptions[idx].text;
            btn.classList.remove('selected', 'correct', 'wrong', 'hidden');
            btn.style.opacity = '1';
            btn.disabled = false;
            if (this.shuffledOptions[idx].isCorrect) this.correctShuffledIndex = idx;
        });
    }

    handleAnswer(e) {
        const btn = e.currentTarget;
        const selectedIndex = parseInt(btn.dataset.index);
        this.markSelected(btn);
        setTimeout(() => {
            if (selectedIndex === this.correctShuffledIndex) {
                this.onCorrect(btn);
            } else {
                this.onWrong(btn, this.correctShuffledIndex);
            }
        }, 1500);
    }

    markSelected(btn) {
        btn.classList.add('selected');
        this.els.options.forEach(b => b.disabled = true);
    }

    onCorrect(btn) {
        this.audioManager.playSFX('correct');
        btn.classList.add('correct');
        this.score++;

        const q = this.currentQuizSet[this.currentQuestionIndex];
        this.storage.recordUnitAnswer(q.unit, true);

        if (this.isReviewMode) {
            this.mistakes = this.mistakes.filter(id => id !== q.id);
            this.storage.saveMistakes(this.mistakes);
        }

        setTimeout(() => this.showFeedback(true), 1500);
    }

    onWrong(btn, correctIndex) {
        this.audioManager.playSFX('wrong');
        btn.classList.add('wrong');
        if (correctIndex >= 0 && correctIndex < 4) {
            this.els.options[correctIndex].classList.add('correct');
        }

        const q = this.currentQuizSet[this.currentQuestionIndex];
        this.storage.recordUnitAnswer(q.unit, false);

        if (!this.mistakes.includes(q.id)) {
            this.mistakes.push(q.id);
            this.storage.saveMistakes(this.mistakes);
        }
        this.sessionMistakes.push(q.id);

        setTimeout(() => this.showFeedback(false), 2000);
    }

    showFeedback(isCorrect) {
        const q = this.currentQuizSet[this.currentQuestionIndex];
        const nextBtn = document.getElementById('next-question-btn');

        this.els.feedbackTitle.textContent = isCorrect ? 'CORRECT!' : 'WRONG...';
        this.els.feedbackTitle.style.color = isCorrect ? 'var(--correct-green)' : 'var(--wrong-red)';
        this.els.feedbackExplanation.textContent = q.explanation || '';

        if (!isCorrect && this.els.feedbackCorrectAnswer) {
            this.els.feedbackCorrectAnswer.textContent = `正解: ${q.correctAnswer}`;
            this.els.feedbackCorrectAnswer.classList.remove('hidden');
        } else if (this.els.feedbackCorrectAnswer) {
            this.els.feedbackCorrectAnswer.classList.add('hidden');
        }

        if (isCorrect) {
            nextBtn.textContent = 'NEXT →';
            const nextPrize = this.prizes[this.score];
            if (nextPrize) {
                this.els.feedbackNextPrize.textContent = `次の賞金: ¥${nextPrize.toLocaleString()}`;
                this.els.feedbackNextPrize.classList.remove('hidden');
            } else {
                this.els.feedbackNextPrize.textContent = '全問正解！ミリオネア達成！🎉';
                nextBtn.textContent = 'RESULT';
            }
        } else {
            nextBtn.textContent = '結果を見る';
            this.els.feedbackNextPrize.classList.add('hidden');
        }

        this.els.feedbackOverlay.classList.remove('hidden');
    }

    nextQuestion() {
        const isCorrect = this.els.feedbackTitle.textContent === 'CORRECT!';
        this.els.feedbackOverlay.classList.add('hidden');

        if (!isCorrect) { this.showResult(); return; }

        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.currentQuizSet.length) {
            this.showResult();
        } else {
            this.displayQuestion();
        }
    }

    showResult(isRetired = false) {
        this.audioManager.stopBGM();
        if (this.isReviewMode) { this.showReviewSelection(); return; }

        this.showScreen('result');
        const finalPrize = this.score > 0 ? this.prizes[this.score - 1] : 0;
        document.getElementById('final-score-val').textContent = finalPrize.toLocaleString();

        const isWin = this.score === this.currentQuizSet.length;
        let header, msg;
        if (isRetired) { header = 'RETIRED'; msg = '挑戦をあきらめました。'; }
        else if (isWin) { header = 'PERFECT!'; msg = 'ミリオネア達成！おめでとう！🎉'; }
        else { header = 'GAME OVER'; msg = '次こそ1億円を目指しましょう！'; }

        document.getElementById('result-header').textContent = header;
        document.getElementById('result-message').textContent = msg;

        const accuracy = this.currentQuizSet.length > 0
            ? Math.round(this.score / this.currentQuizSet.length * 100)
            : 0;
        const accuracyEl = document.getElementById('result-accuracy');
        if (accuracyEl) {
            accuracyEl.textContent = `正答率: ${this.score} / ${this.currentQuizSet.length} 問正解 (${accuracy}%)`;
        }

        // Mistake log
        const logArea = document.getElementById('result-mistakes-area');
        const logList = document.getElementById('result-mistakes-list');
        logList.innerHTML = '';
        if (this.sessionMistakes.length > 0) {
            logArea.classList.remove('hidden');
            this.sessionMistakes.forEach(id => {
                const q = this.questions.find(item => item.id === id);
                if (q) {
                    const li = document.createElement('li');
                    li.textContent = `[${q.unit}] ${q.text}`;
                    logList.appendChild(li);
                }
            });
        } else {
            logArea.classList.add('hidden');
        }

        // Show review shortcut if mistakes exist
        const reviewBtn = document.getElementById('review-from-result-btn');
        if (reviewBtn) {
            if (this.sessionMistakes.length > 0) {
                reviewBtn.classList.remove('hidden');
            } else {
                reviewBtn.classList.add('hidden');
            }
        }

        // Save history
        const result = {
            date: new Date().toLocaleString(),
            score: this.score,
            prize: finalPrize,
            maxQuestions: this.currentQuizSet.length,
            mistakeIds: [...this.sessionMistakes],
        };
        this.history.unshift(result);
        this.storage.saveHistory(this.history);

        this.totalPrize += finalPrize;
        this.storage.saveTotalPrize(this.totalPrize);
    }

    // ============================================================
    //  REVIEW & HISTORY
    // ============================================================
    showReviewSelection() {
        this.showScreen('review');
        this.els.reviewList.innerHTML = '';

        if (this.mistakes.length === 0) {
            this.els.reviewList.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">間違えた問題はありません！</p>';
            return;
        }

        this.mistakes.forEach(id => {
            const q = this.questions.find(item => item.id === id);
            if (q) {
                const div = document.createElement('div');
                div.className = 'review-item';
                div.innerHTML = `<span class="review-unit">${q.unit}</span><span class="review-text">${q.text}</span>`;
                div.onclick = () => this.startQuiz(true, q.id);
                this.els.reviewList.appendChild(div);
            }
        });
    }

    showHistory() {
        this.showScreen('history');
        this.els.historyList.innerHTML = '';

        if (this.history.length === 0) {
            this.els.historyList.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">まだ履歴がありません。</p>';
            return;
        }

        this.history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';
            const accuracy = item.maxQuestions > 0 ? Math.round(item.score / item.maxQuestions * 100) : 0;

            let mistakesHtml = '';
            if (item.mistakeIds && item.mistakeIds.length > 0) {
                mistakesHtml = `<div class="mistakes-log">
                    <h3>間違いの記録:</h3>
                    <ul>${item.mistakeIds.map(id => {
                        const q = this.questions.find(q => q.id === id);
                        return q ? `<li>[${q.unit}] ${q.text}</li>` : '';
                    }).join('')}</ul>
                </div>`;
            }

            card.innerHTML = `
                <div class="history-date">${item.date}</div>
                <div class="history-prize">¥${item.prize.toLocaleString()}</div>
                <div class="history-score">${item.score} / ${item.maxQuestions} 正解 (${accuracy}%)</div>
                ${mistakesHtml}
            `;
            this.els.historyList.appendChild(card);
        });
    }

    // ============================================================
    //  SHOP
    // ============================================================
    showShop() {
        this.showScreen('shop');
        if (this.els.totalPrizeDisplay) {
            this.els.totalPrizeDisplay.textContent = `¥${this.totalPrize.toLocaleString()}`;
        }
        this.renderShopItems();
    }

    renderShopItems() {
        if (!this.els.shopItemList) return;
        this.els.shopItemList.innerHTML = '';
        this.shopItems.forEach(item => {
            const isOwned = this.ownedItems.includes(item.id);
            const canAfford = this.totalPrize >= item.price;
            const isActive = this.activeTheme === item.id;

            const card = document.createElement('div');
            card.className = 'shop-item-card';
            card.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">¥${item.price.toLocaleString()}</div>
                <div class="item-desc">${item.desc}</div>
                <button class="buy-btn ${isOwned ? 'owned' : ''} ${isActive ? 'active-item' : ''}"
                    ${(!isOwned && !canAfford) ? 'disabled' : ''}>
                    ${isOwned ? (isActive ? '使用中' : '変更する') : '購入'}
                </button>
            `;
            card.querySelector('.buy-btn').onclick = () => {
                if (isOwned) { this.applyTheme(item.id); this.renderShopItems(); return; }
                this.buyItem(item);
            };
            this.els.shopItemList.appendChild(card);
        });
    }

    buyItem(item) {
        if (this.totalPrize >= item.price) {
            this.totalPrize -= item.price;
            this.ownedItems.push(item.id);
            this.storage.saveOwnedItems(this.ownedItems);
            this.storage.saveTotalPrize(this.totalPrize);
            this.applyTheme(item.id);
            this.showShop();
        }
    }

    applyTheme(themeId) {
        document.body.className = '';
        if (themeId !== 'default-theme') document.body.classList.add(themeId);
        this.activeTheme = themeId;
        this.storage.saveActiveTheme(themeId);
    }

    // ============================================================
    //  UTILS
    // ============================================================
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new QuizApp();
    app.init();
});
