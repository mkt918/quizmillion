class QuizApp {
    constructor() {
        // Initialize Managers
        this.storage = new StorageManager();
        this.audioManager = new AudioManager();

        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizDataUrl = 'data/2025_jo03.csv'; // New question set for junior high students

        // Shop State
        this.totalPrize = this.storage.getTotalPrize();
        this.ownedItems = this.storage.getOwnedItems();
        this.activeTheme = this.storage.getActiveTheme();

        this.shopItems = [
            { id: 'default-theme', category: 'theme', name: 'デフォルトブルー', price: 0, desc: '標準的なミリオネアブルー', icon: '💎' },
            { id: 'theme-forest', category: 'theme', name: 'ミスティックフォレスト', price: 1000000, desc: '神秘的な森の緑', icon: '🌲' },
            { id: 'theme-ocean', category: 'theme', name: 'ディープオーシャン', price: 5000000, desc: '深海の静寂', icon: '🌊' },
            { id: 'theme-darknight', category: 'theme', name: 'ダークナイト', price: 10000000, desc: 'クールな黒と紫', icon: '🌙' },
            { id: 'theme-sunset', category: 'theme', name: 'サンセットグロウ', price: 20000000, desc: '夕暮れのグラデーション', icon: '🌅' },
            { id: 'theme-cyber', category: 'theme', name: 'サイバーパンク', price: 40000000, desc: 'ネオン輝く近未来', icon: '🤖' },
            { id: 'theme-gold', category: 'theme', name: 'ゴールド', price: 70000000, desc: '豪華な黄金のテーマ', icon: '✨' },
            { id: 'theme-rose', category: 'theme', name: 'ロイヤルローズ', price: 100000000, desc: '優雅な赤と金', icon: '🌹' },
            { id: 'theme-sakura', category: 'theme', name: '真夜中の桜', price: 150000000, desc: '月夜に舞う幻想的な桜', icon: '🌸' },
            { id: 'theme-galaxy', category: 'theme', name: 'ギャラクシー', price: 200000000, desc: '無限に広がる星々の輝き', icon: '🌌' },
            { id: 'theme-volcano', category: 'theme', name: 'ヴォルカニック', price: 300000000, desc: 'たぎる溶岩の情熱', icon: '🌋' },
            { id: 'theme-snow', category: 'theme', name: 'スノークリスタル', price: 400000000, desc: '絶対零度の美しさ', icon: '❄️' },
            { id: 'theme-marble', category: 'theme', name: 'マーブルラグジュアリー', price: 500000000, desc: '最高級大理石の質感', icon: '🏛️' }
        ];

        this.isReviewMode = false;
        this.mistakes = this.storage.getMistakes();
        this.history = this.storage.getHistory();

        // DOM Elements
        this.screens = {
            start: document.getElementById('start-screen'),
            category: document.getElementById('category-selection-screen'),
            review: document.getElementById('review-selection-screen'),
            history: document.getElementById('history-screen'),
            units: document.getElementById('unit-selection-screen'),
            quiz: document.getElementById('quiz-screen'),
            result: document.getElementById('result-screen'),
            shop: document.getElementById('theme-shop-screen')
        };

        this.els = {
            questionText: document.getElementById('question-text'),
            questionImage: document.getElementById('question-image'),
            imageContainer: document.getElementById('image-container'),
            unitDisplay: document.getElementById('unit-display'),
            qNum: document.getElementById('q-num'),
            scoreVal: document.getElementById('score-val'),
            scoreTable: document.getElementById('score-table'),
            reviewList: document.getElementById('review-list'),
            historyList: document.getElementById('history-list'),
            unitList: document.getElementById('unit-selection-list'),
            unitError: document.getElementById('unit-error'),
            unitCount: document.getElementById('total-selected-questions'),
            totalPrizeDisplay: document.getElementById('shop-total-prize-display'),
            shopItemList: document.getElementById('shop-items-container'),
            options: Array.from(document.querySelectorAll('.option-btn')),
            lifelineBtns: {
                '5050': document.getElementById('lifeline-5050'),
                'phone': document.getElementById('lifeline-phone'),
                'audience': document.getElementById('lifeline-audience')
            },
            feedbackOverlay: document.getElementById('feedback-overlay'),
            feedbackTitle: document.getElementById('feedback-title'),
            feedbackExplanation: document.getElementById('feedback-explanation'),
            feedbackNextPrize: document.getElementById('feedback-next-prize'),
            audienceModal: document.getElementById('audience-modal'),
            audienceBars: {
                'A': document.getElementById('bar-a'),
                'B': document.getElementById('bar-b'),
                'C': document.getElementById('bar-c'),
                'D': document.getElementById('bar-d')
            },
            audiencePercents: {
                'A': document.getElementById('percent-a'),
                'B': document.getElementById('percent-b'),
                'C': document.getElementById('percent-c'),
                'D': document.getElementById('percent-d')
            },
            phoneHintArea: document.getElementById('phone-hint-area'),
            phoneHintText: document.getElementById('phone-hint-text')
        };

        this.prizes = [
            10000, 20000, 30000, 50000, 100000,
            150000, 250000, 500000, 750000, 1000000,
            1500000, 2500000, 5000000, 7500000, 10000000,
            15000000, 25000000, 50000000, 75000000, 100000000
        ];

        // Initialize LifelineManager after els is defined
        this.lifelineManager = new LifelineManager(this.els);

        this.applyTheme(this.activeTheme);
        this.initEventListeners();
        this.updateHeaderUI();
    }

    updateHeaderUI() {
        // No title to update for now as titles were removed
    }


    async init() {
        await this.loadQuestions();
        console.log("Loaded questions:", this.questions);
    }

    initEventListeners() {
        document.getElementById('start-btn').onclick = () => this.showCategorySelection();
        document.getElementById('review-menu-btn').onclick = () => {
            this.audioManager.init();
            this.showReviewSelection();
        };
        document.getElementById('history-menu-btn').onclick = () => this.showHistory();

        document.getElementById('review-back-btn').onclick = () => this.showScreen('start');
        document.getElementById('history-back-btn').onclick = () => this.showScreen('start');
        document.getElementById('category-back-btn').onclick = () => this.showScreen('start');
        document.getElementById('unit-selection-back-btn').onclick = () => this.showScreen('category');

        // Category Selection
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.onclick = () => this.handleCategorySelection(btn.dataset.csv);
        });

        document.getElementById('retry-btn').onclick = () => {
            if (this.isReviewMode) {
                this.showReviewSelection();
            } else {
                this.showUnitSelection();
            }
        };
        document.getElementById('home-btn').onclick = () => {
            this.audioManager.stopBGM();
            this.showScreen('start');
        };
        document.getElementById('next-question-btn').onclick = () => this.nextQuestion();
        document.getElementById('close-audience').addEventListener('click', () => this.els.audienceModal.classList.add('hidden'));

        document.getElementById('select-all-units-btn').onclick = () => this.selectAllUnits();
        document.getElementById('confirm-units-btn').onclick = () => this.confirmUnits();

        // Shop Listeners
        document.getElementById('shop-menu-btn').onclick = () => this.showShop();
        document.getElementById('shop-close-btn').onclick = () => this.showScreen('start');

        // Prize Table Toggle
        document.getElementById('toggle-score-btn').onclick = () => {
            this.els.scoreTable.classList.toggle('visible');
        };

        this.els.options.forEach(btn => {
            btn.onclick = (e) => this.handleAnswer(e);
        });

        // Lifelines
        this.els.lifelineBtns['5050'].addEventListener('click', () => {
            this.lifelineManager.use5050(this.correctShuffledIndex, this.els.options);
        });
        this.els.lifelineBtns['phone'].addEventListener('click', () => {
            this.lifelineManager.usePhone(this.currentQuizSet[this.currentQuestionIndex]);
        });
        this.els.lifelineBtns['audience'].addEventListener('click', () => {
            const recalcIndex = this.lifelineManager.useAudience(this.correctShuffledIndex, this.shuffledOptions);
            if (recalcIndex !== this.correctShuffledIndex) {
                this.correctShuffledIndex = recalcIndex;
            }
        });
    }

    async loadQuestions() {
        try {
            const response = await fetch(this.quizDataUrl);
            const text = await response.text();
            this.questions = this.parseCSV(text);
            console.log(`Successfully loaded ${this.questions.length} questions from ${this.quizDataUrl}`);
        } catch (error) {
            console.error("Error loading CSV:", error);
            alert("データの読み込みに失敗しました。ファイルが存在するか、CSV形式が正しいか確認してください。");
        }
    }

    // --- Shop Methods ---
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

            const btn = card.querySelector('.buy-btn');
            btn.onclick = () => {
                if (isOwned) {
                    this.applyTheme(item.id);
                    this.renderShopItems(); // Refresh button states
                    return;
                }
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

            // Auto-apply purchased theme
            this.applyTheme(item.id);

            this.showShop(); // Refresh UI
            this.audioManager.playSFX('correct');
        }
    }

    applyTheme(themeId) {
        document.body.className = '';
        if (themeId !== 'default-theme') {
            document.body.classList.add(themeId);
        }

        this.activeTheme = themeId;
        this.storage.saveActiveTheme(themeId);
        this.audioManager.playSFX('correct');
    }

    showScreen(screenId) {
        Object.values(this.screens).forEach(s => {
            if (s) s.classList.remove('active');
        });
        if (this.screens[screenId]) {
            this.screens[screenId].classList.add('active');
        } else {
            console.error(`Screen ${screenId} not found`);
        }
    }


    parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        const questions = [];

        // Helper to parse a single CSV line into an array of fields
        const parseRow = (line) => {
            const fields = [];
            let currentField = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                if (char === '"' && inQuotes && nextChar === '"') {
                    currentField += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    fields.push(currentField);
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            fields.push(currentField);
            return fields;
        };

        for (let i = 1; i < lines.length; i++) {
            const row = parseRow(lines[i]);
            if (row.length < 4) continue;

            const q = {
                id: row[0],
                unit: (row[1] || "").trim(),
                text: (row[2] || "").trim(),
                correctAnswer: (row[3] || "").trim(),
                image: (row[4] || "").trim(),
                explanation: (row[5] || "").trim()
            };
            if (q.text) questions.push(q);
        }
        return questions;
    }


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
        this.audioManager.playBGM('main');
        this.showUnitSelection();
    }

    showUnitSelection() {
        this.showScreen('units');
        this.els.unitList.innerHTML = '';
        this.els.unitError.classList.add('hidden');

        const units = [...new Set(this.questions.map(q => q.unit).filter(u => u))];
        units.forEach(unit => {
            const btn = document.createElement('div');
            btn.className = 'unit-select-btn';
            btn.textContent = unit;
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
        const selectedBtns = this.els.unitList.querySelectorAll('.unit-select-btn.selected');
        const selectedUnits = Array.from(selectedBtns).map(btn => btn.textContent);
        const count = this.questions.filter(q => selectedUnits.includes(q.unit)).length;
        this.els.unitCount.textContent = `選択された問題数: ${count}問`;
    }

    selectAllUnits() {
        const btns = this.els.unitList.querySelectorAll('.unit-select-btn');
        btns.forEach(btn => btn.classList.add('selected'));
        this.els.unitError.classList.add('hidden');
        this.updateUnitCount();
    }

    confirmUnits() {
        const selectedBtns = this.els.unitList.querySelectorAll('.unit-select-btn.selected');
        const selectedUnits = Array.from(selectedBtns).map(btn => btn.textContent);

        if (selectedUnits.length === 0) {
            this.els.unitError.classList.remove('hidden');
            return;
        }

        this.startQuiz(false, null, selectedUnits);
    }

    startQuiz(reviewMode = false, specificQuestionId = null, selectedUnits = null) {
        if (!this.audioManager.audioCtx) this.audioManager.init();
        this.audioManager.resumeContext();
        this.audioManager.playBGM('main');

        this.isReviewMode = reviewMode;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.sessionMistakes = []; // Mistakes in THIS session
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
            console.error("Quiz set is empty. Initial questions length:", this.questions.length);
            alert("問題が見つかりませんでした。選択したカテゴリー、またはデータファイルを確認してください。");
            this.audioManager.stopBGM();
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

            row.innerHTML = `<span>${idx + 1}</span> <span>¥${prize.toLocaleString()}</span>`;
            this.els.scoreTable.appendChild(row);
        });
    }

    displayQuestion() {
        if (this.currentQuestionIndex >= this.currentQuizSet.length) {
            this.showResult();
            return;
        }

        const q = this.currentQuizSet[this.currentQuestionIndex];
        // correctShuffledIndex will be set during shuffledOptions mapping/rendering

        // Clear previous lifeline UI
        if (this.els.phoneHintArea) {
            this.els.phoneHintArea.classList.add('hidden');
            this.els.phoneHintText.textContent = "";
        }

        // Reset 50:50 opacity for all buttons
        this.els.options.forEach(btn => btn.style.opacity = '1');

        // Reset audience poll bars
        if (this.els.audienceBars) {
            Object.values(this.els.audienceBars).forEach(bar => {
                if (bar) bar.style.height = '0%';
            });
        }
        if (this.els.audiencePercents) {
            Object.values(this.els.audiencePercents).forEach(p => {
                if (p) {
                    p.textContent = '0%';
                    p.classList.remove('visible');
                }
            });
        }
        if (this.els.audienceModal) {
            this.els.audienceModal.classList.add('hidden');
        }


        this.els.questionText.textContent = q.text;
        this.els.qNum.textContent = this.currentQuestionIndex + 1;
        this.els.unitDisplay.textContent = q.unit || "";
        this.els.scoreVal.textContent = (this.score > 0 ? this.prizes[this.score - 1] : 0).toLocaleString();

        this.renderScoreTable();

        // --- Dynamic Distractor Generation ---
        const correctText = q.correctAnswer;

        // Find all other correct answers from the same unit
        let sameUnitCorrects = [...new Set(
            this.questions
                .filter(item => item.unit === q.unit && item.id !== q.id)
                .map(item => item.correctAnswer)
                .filter(text => text !== correctText)
        )];

        // If not enough unique same-unit distractors, fallback to other units
        if (sameUnitCorrects.length < 3) {
            const others = [...new Set(
                this.questions
                    .filter(item => item.id !== q.id)
                    .map(item => item.correctAnswer)
                    .filter(text => text !== correctText)
            )];
            sameUnitCorrects = [...new Set([...sameUnitCorrects, ...others])];
        }

        // Shuffle and pick 3 distractors
        this.shuffle(sameUnitCorrects);
        const distractors = sameUnitCorrects.slice(0, 3);

        // Combine correct answer and distractors
        const allOptions = [
            { text: correctText, isCorrect: true },
            ...distractors.map(text => ({ text, isCorrect: false }))
        ];

        // Fallback if still not enough (though unlikely with 20 questions)
        while (allOptions.length < 4) {
            allOptions.push({ text: "???", isCorrect: false });
        }

        this.shuffledOptions = this.shuffle([...allOptions]);
        this.correctShuffledIndex = this.shuffledOptions.findIndex(opt => opt.isCorrect);

        if (q.image) {
            this.els.questionImage.src = `assets/images/${q.image}`;
            this.els.imageContainer.classList.remove('hidden');
        } else {
            this.els.imageContainer.classList.add('hidden');
        }

        this.els.options.forEach((btn, idx) => {
            btn.querySelector('.option-text').textContent = this.shuffledOptions[idx].text;
            btn.classList.remove('selected', 'correct', 'wrong', 'hidden');
            btn.style.opacity = '1'; // Ensure opacity is reset here too
            btn.disabled = false;

            // Track the correct index in its shuffled position
            if (this.shuffledOptions[idx].isCorrect) {
                this.correctShuffledIndex = idx;
            }
        });

        console.log(`Question displayed. Correct shuffled index: ${this.correctShuffledIndex}`);
    }

    handleAnswer(e) {
        const btn = e.currentTarget;
        const selectedIndex = parseInt(btn.dataset.index);

        // UI updates
        this.markSelected(btn);

        // Simulated suspense time
        setTimeout(() => {
            if (selectedIndex === this.correctShuffledIndex) {
                this.onCorrect(btn);
            } else {
                this.onWrong(btn, this.correctShuffledIndex);
            }
        }, 1500); // 1.5s suspense
    }

    markSelected(btn) {
        btn.classList.add('selected');
        // Disable all clicks during processing
        this.els.options.forEach(b => b.disabled = true);
        // Play suspense sound here (impl later)
    }

    onCorrect(btn) {
        this.audioManager.playSFX('correct');
        btn.classList.add('correct');
        this.score++;

        // Clear mistake flag if correctly answered in review
        const qId = this.currentQuizSet[this.currentQuestionIndex].id;
        if (this.isReviewMode) {
            this.mistakes = this.mistakes.filter(id => id !== qId);
            this.storage.saveMistakes(this.mistakes);
        }

        setTimeout(() => {
            this.showFeedback(true);
        }, 1500);
    }

    onWrong(btn, correctIndex) {
        this.audioManager.playSFX('wrong');
        btn.classList.add('wrong');
        // Blink correct answer
        if (correctIndex >= 0 && correctIndex < 4) {
            this.els.options[correctIndex].classList.add('correct');
        }

        // Add to mistakes
        const qId = this.currentQuizSet[this.currentQuestionIndex].id;
        if (!this.mistakes.includes(qId)) {
            this.mistakes.push(qId);
            this.storage.saveMistakes(this.mistakes);
        }
        this.sessionMistakes.push(qId); // Track for this session

        setTimeout(() => {
            this.showFeedback(false);
        }, 2000);
    }

    showFeedback(isCorrect) {
        const q = this.currentQuizSet[this.currentQuestionIndex];
        const nextBtn = document.getElementById('next-question-btn');

        this.els.feedbackTitle.textContent = isCorrect ? "CORRECT!" : "GAME OVER";
        this.els.feedbackTitle.style.color = isCorrect ? "var(--correct-green)" : "var(--wrong-red)";
        this.els.feedbackExplanation.textContent = q.explanation || "";

        if (isCorrect) {
            nextBtn.textContent = "NEXT";
            const nextPrize = this.prizes[this.score];
            if (nextPrize) {
                this.els.feedbackNextPrize.textContent = `次の賞金: ¥${nextPrize.toLocaleString()}`;
                this.els.feedbackNextPrize.classList.remove('hidden');
            } else {
                this.els.feedbackNextPrize.textContent = "全問正解！ミリオネア達成！";
                nextBtn.textContent = "RESULT";
            }
        } else {
            nextBtn.textContent = "SHOW RESULT";
            this.els.feedbackNextPrize.textContent = "";
            this.els.feedbackNextPrize.classList.add('hidden');
        }

        this.els.feedbackOverlay.classList.remove('hidden');
    }

    nextQuestion() {
        const isCorrect = this.els.feedbackTitle.textContent === "CORRECT!";
        this.els.feedbackOverlay.classList.add('hidden');

        if (!isCorrect) {
            this.showResult();
            return;
        }

        this.currentQuestionIndex++;

        if (this.currentQuestionIndex >= this.currentQuizSet.length) {
            this.showResult();
        } else {
            this.displayQuestion();
        }
    }

    showResult() {
        this.audioManager.stopBGM();

        if (this.isReviewMode) {
            this.showReviewSelection();
            return;
        }

        this.showScreen('result');
        const finalPrize = this.score > 0 ? this.prizes[this.score - 1] : 0;
        document.getElementById('final-score-val').textContent = finalPrize.toLocaleString() + "円";

        const isWin = (this.score === this.currentQuizSet.length);
        document.getElementById('result-header').textContent = isWin ? "PERFECT!" : "GAME OVER";

        let msg = isWin ? "ミリオネア達成！おめでとう！" : "残念！次こそは1億円を目指しましょう。";
        document.getElementById('result-message').textContent = msg;

        // Show mistake log in result
        const logArea = document.getElementById('result-mistakes-area');
        const logList = document.getElementById('result-mistakes-list');
        logList.innerHTML = '';
        if (this.sessionMistakes.length > 0) {
            logArea.classList.remove('hidden');
            this.sessionMistakes.forEach(id => {
                const q = this.questions.find(item => item.id === id);
                if (q) {
                    const li = document.createElement('li');
                    li.innerHTML = `[${q.unit}] ${q.text}`;
                    logList.appendChild(li);
                }
            });
        } else {
            logArea.classList.add('hidden');
        }

        // Save history (Skip for review mode)
        if (this.isReviewMode) return;

        const result = {
            date: new Date().toLocaleString(),
            score: this.score,
            prize: finalPrize,
            maxQuestions: this.currentQuizSet.length,
            mistakeIds: [...this.sessionMistakes]
        };
        this.history.unshift(result);
        this.storage.saveHistory(this.history);

        // --- Shop Update: Add Prize to Total Prize ---
        this.totalPrize += finalPrize;
        this.storage.saveTotalPrize(this.totalPrize);
    }

    showReviewSelection() {
        this.showScreen('review');
        this.els.reviewList.innerHTML = '';

        if (this.mistakes.length === 0) {
            this.els.reviewList.innerHTML = '<p style="text-align:center;">間違えた問題はありません！</p>';
            return;
        }

        this.mistakes.forEach(id => {
            const q = this.questions.find(item => item.id === id);
            if (q) {
                const div = document.createElement('div');
                div.className = 'review-item';
                div.innerHTML = `
                    <span class="review-unit">${q.unit}</span>
                    <span class="review-text">${q.text}</span>
                `;
                div.onclick = () => this.startQuiz(true, q.id);
                this.els.reviewList.appendChild(div);
            }
        });
    }

    showHistory() {
        this.showScreen('history');
        this.els.historyList.innerHTML = '';

        if (this.history.length === 0) {
            this.els.historyList.innerHTML = '<p style="text-align:center;">まだ履歴がありません。</p>';
            return;
        }

        this.history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';

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
                <div class="history-prize">獲得: ¥${item.prize.toLocaleString()}</div>
                <div class="history-score">${item.score} / ${item.maxQuestions} 正解</div>
                ${mistakesHtml}
            `;
            this.els.historyList.appendChild(card);
        });
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Init App
document.addEventListener('DOMContentLoaded', () => {
    const app = new QuizApp();
    app.init();
});
