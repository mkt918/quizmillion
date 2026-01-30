class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizDataUrl = 'data/2025_jo03.csv'; // New question set for junior high students // Local path, can be replaced with Google Sheet URL

        // Lifeline states
        this.lifelines = {
            '5050': true,
            'phone': true,
            'audience': true
        };

        this.isReviewMode = false;
        this.mistakes = JSON.parse(localStorage.getItem('quizMillionaireMistakes')) || [];
        this.history = JSON.parse(localStorage.getItem('quizMillionaireHistory')) || [];

        // DOM Elements
        this.screens = {
            start: document.getElementById('start-screen'),
            review: document.getElementById('review-selection-screen'),
            history: document.getElementById('history-screen'),
            units: document.getElementById('unit-selection-screen'),
            quiz: document.getElementById('quiz-screen'),
            result: document.getElementById('result-screen')
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
            options: Array.from(document.querySelectorAll('.option-btn')),
            lifelineBtns: {
                '5050': document.getElementById('lifeline-5050'),
                'phone': document.getElementById('lifeline-phone'),
                'audience': document.getElementById('lifeline-audience')
            },
            feedbackOverlay: document.getElementById('feedback-overlay'),
            feedbackTitle: document.getElementById('feedback-title'),
            feedbackExplanation: document.getElementById('feedback-explanation'),
            audienceModal: document.getElementById('audience-modal'),
            audienceBars: {
                'A': document.getElementById('bar-a'),
                'B': document.getElementById('bar-b'),
                'C': document.getElementById('bar-c'),
                'D': document.getElementById('bar-d')
            }
        };

        this.prizes = [
            10000, 20000, 30000, 50000, 100000,
            150000, 250000, 500000, 750000, 1000000,
            1500000, 2500000, 5000000, 7500000, 10000000,
            15000000, 25000000, 50000000, 75000000, 100000000
        ];

        this.isMuted = true; // User requested audio to be muted by default
        this.bgmOscillators = [];
        this.initEventListeners();
    }

    async init() {
        await this.loadQuestions();
        console.log("Loaded questions:", this.questions);
    }

    initEventListeners() {
        document.getElementById('start-btn').onclick = () => this.showUnitSelection();
        document.getElementById('review-menu-btn').onclick = () => {
            this.initAudio();
            this.showReviewSelection();
        };
        document.getElementById('history-menu-btn').onclick = () => this.showHistory();

        document.getElementById('review-back-btn').onclick = () => this.showScreen('start');
        document.getElementById('history-back-btn').onclick = () => this.showScreen('start');
        document.getElementById('unit-selection-back-btn').onclick = () => this.showScreen('start');

        document.getElementById('retry-btn').onclick = () => {
            if (this.isReviewMode) {
                this.showReviewSelection();
            } else {
                this.showUnitSelection();
            }
        };
        document.getElementById('home-btn').onclick = () => {
            this.stopBGM();
            this.showScreen('start');
        };
        document.getElementById('next-question-btn').onclick = () => this.nextQuestion();
        document.getElementById('close-audience').addEventListener('click', () => this.els.audienceModal.classList.add('hidden'));

        document.getElementById('select-all-units-btn').onclick = () => this.selectAllUnits();
        document.getElementById('confirm-units-btn').onclick = () => this.confirmUnits();

        this.els.options.forEach(btn => {
            btn.onclick = (e) => this.handleAnswer(e);
        });

        // Lifelines
        this.els.lifelineBtns['5050'].addEventListener('click', () => this.use5050());
        this.els.lifelineBtns['phone'].addEventListener('click', () => this.usePhone());
        this.els.lifelineBtns['audience'].addEventListener('click', () => this.useAudience());
    }

    async loadQuestions() {
        try {
            const response = await fetch(this.quizDataUrl);
            const text = await response.text();
            this.questions = this.parseCSV(text);
        } catch (error) {
            console.error("Error loading CSV:", error);
            alert("データの読み込みに失敗しました。");
        }
    }

    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const questions = [];

        for (let i = 1; i < lines.length; i++) {
            // Handle CSV parsing carefully (simpler split for now, assuming no commas in fields)
            // A more robust regex splitter would be better for complex CSVs
            const row = lines[i].split(',');
            if (row.length < 4) continue;

            const q = {
                id: row[0],
                unit: (row[1] || "").trim(),
                text: row[2],
                correctAnswer: (row[3] || "").trim(),
                image: row[4],
                explanation: row[5] ? row[5].trim() : ''
            };
            if (q.text) questions.push(q);
        }
        return questions;
    }

    showUnitSelection() {
        this.initAudio();
        this.resumeAudioContext();
        this.playBGM('main');

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
        if (!this.audioCtx) this.initAudio();
        this.resumeAudioContext();
        this.playBGM('main');

        this.isReviewMode = reviewMode;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.sessionMistakes = []; // Mistakes in THIS session
        this.resetLifelines();

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
            alert("問題が見つかりませんでした。");
            this.stopBGM();
            return;
        }

        this.showScreen('quiz');
        this.displayQuestion();
    }

    displayQuestion() {
        const q = this.currentQuizSet[this.currentQuestionIndex];

        this.els.qNum.textContent = this.currentQuestionIndex + 1;
        const currentPrize = this.score > 0 ? this.prizes[this.score - 1] : 0;
        this.els.scoreVal.textContent = currentPrize.toLocaleString();
        this.els.questionText.textContent = q.text;
        this.els.unitDisplay.textContent = q.unit || "不明";

        this.renderScoreTable();

        // --- Dynamic Distractor Generation (Simplified CSV) ---
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
            btn.disabled = false;
        });
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
        this.playSFX('correct');
        btn.classList.add('correct');
        this.score++;

        // Clear mistake flag if correctly answered in review
        const qId = this.currentQuizSet[this.currentQuestionIndex].id;
        if (this.isReviewMode) {
            this.mistakes = this.mistakes.filter(id => id !== qId);
            localStorage.setItem('quizMillionaireMistakes', JSON.stringify(this.mistakes));
        }

        setTimeout(() => {
            this.showFeedback(true);
        }, 1500);
    }

    onWrong(btn, correctIndex) {
        this.playSFX('wrong');
        btn.classList.add('wrong');
        // Blink correct answer
        if (correctIndex >= 0 && correctIndex < 4) {
            this.els.options[correctIndex].classList.add('correct');
        }

        // Add to mistakes
        const qId = this.currentQuizSet[this.currentQuestionIndex].id;
        if (!this.mistakes.includes(qId)) {
            this.mistakes.push(qId);
            localStorage.setItem('quizMillionaireMistakes', JSON.stringify(this.mistakes));
        }
        this.sessionMistakes.push(qId); // Track for this session

        setTimeout(() => {
            this.showFeedback(false);
        }, 2000);
    }

    showFeedback(isCorrect) {
        const q = this.currentQuizSet[this.currentQuestionIndex];

        this.els.feedbackTitle.textContent = isCorrect ? "CORRECT!" : "GAME OVER";
        this.els.feedbackTitle.style.color = isCorrect ? "var(--correct-green)" : "var(--wrong-red)";
        this.els.feedbackExplanation.textContent = q.explanation || "";

        // If wrong, change button to "RESULT"
        const nextBtn = document.getElementById('next-question-btn');
        if (isCorrect) {
            nextBtn.textContent = "NEXT";
        } else {
            nextBtn.textContent = "SHOW RESULT";
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
        this.stopBGM();

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
        localStorage.setItem('quizMillionaireHistory', JSON.stringify(this.history.slice(0, 50)));
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

    showScreen(screenName) {
        Object.values(this.screens).forEach(el => el.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }

    // --- Lifelines ---

    resetLifelines() {
        this.lifelines = { '5050': true, 'phone': true, 'audience': true };
        Object.values(this.els.lifelineBtns).forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('used');
        });
    }

    use5050() {
        if (!this.lifelines['5050']) return;
        this.lifelines['5050'] = false;
        this.els.lifelineBtns['5050'].classList.add('used');
        this.els.lifelineBtns['5050'].disabled = true;

        let correctIndex = this.correctShuffledIndex;

        // Find wrong indices
        let wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
        this.shuffle(wrongIndices);

        // Hide 2 wrong options
        this.els.options[wrongIndices[0]].classList.add('hidden');
        this.els.options[wrongIndices[1]].classList.add('hidden');
    }

    usePhone() {
        if (!this.lifelines['phone']) return;
        this.lifelines['phone'] = false;
        this.els.lifelineBtns['phone'].classList.add('used');
        this.els.lifelineBtns['phone'].disabled = true;

        const correctText = this.shuffledOptions[this.correctShuffledIndex].text;

        alert(`電話の相手: 「たぶん、${correctText} だと思うよ！」`);
    }

    useAudience() {
        if (!this.lifelines['audience']) return;
        this.lifelines['audience'] = false;
        this.els.lifelineBtns['audience'].classList.add('used');
        this.els.lifelineBtns['audience'].disabled = true;

        let correctIndex = this.correctShuffledIndex;

        // Generate percentages
        let percentages = [0, 0, 0, 0];
        // Give correct answer high prob (e.g., 60-90%)
        let correctProb = Math.floor(Math.random() * 30) + 60; // 60-90
        percentages[correctIndex] = correctProb;

        let remaining = 100 - correctProb;
        for (let i = 0; i < 4; i++) {
            if (i === correctIndex) continue;
            let p = Math.floor(Math.random() * remaining);
            percentages[i] = p;
            remaining -= p;
        }
        // Add remainder to last zero
        percentages[percentages.indexOf(0)] += remaining;

        // Show Modal
        this.els.audienceBars.A.style.height = percentages[0] + '%';
        this.els.audienceBars.B.style.height = percentages[1] + '%';
        this.els.audienceBars.C.style.height = percentages[2] + '%';
        this.els.audienceBars.D.style.height = percentages[3] + '%';

        this.els.audienceModal.classList.remove('hidden');
    }

    getCorrectIndex(q) {
        let correctIndex = -1;
        correctIndex = q.options.indexOf(q.answer);
        if (correctIndex === -1) {
            const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
            if (map[q.answer] !== undefined) correctIndex = map[q.answer];
        }
        if (correctIndex === -1) {
            correctIndex = q.options.findIndex(opt => opt.trim() === q.answer.trim());
        }
        return correctIndex;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Audio System (Web Audio API) ---

    initAudio() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.bgmOscillators = [];
        this.isMuted = true;
    }

    playTone(freq, type, duration, startTime = 0, vol = 0.1) {
        if (this.isMuted) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + startTime);

        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + startTime);
        osc.stop(this.audioCtx.currentTime + startTime + duration);
    }

    playBGM(type) {
        if (this.isMuted) return;
        this.stopBGM();

        if (type === 'main') {
            // Dark pad sound
            const freqs = [55, 110, 165]; // Low A chord
            freqs.forEach(f => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = f;

                // LFO for suspense
                const lfo = this.audioCtx.createOscillator();
                const lfoGain = this.audioCtx.createGain();
                lfo.frequency.value = 0.2; // Slow pulse
                lfo.connect(lfoGain);
                lfoGain.gain.value = 200;
                lfoGain.connect(osc.detune);
                lfo.start();

                gain.gain.value = 0.03;

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();

                this.bgmOscillators.push({ osc, gain, lfo });
            });
        }
    }

    stopBGM() {
        this.bgmOscillators.forEach(o => {
            try {
                o.osc.stop();
                if (o.lfo) o.lfo.stop();
            } catch (e) { }
        });
        this.bgmOscillators = [];
    }

    playSFX(type) {
        if (this.isMuted) return;
        this.resumeAudioContext();

        switch (type) {
            case 'correct':
                // Fanfare
                this.playTone(440, 'triangle', 0.1, 0); // A4
                this.playTone(554, 'triangle', 0.1, 0.1); // C#5
                this.playTone(659, 'triangle', 0.4, 0.2); // E5
                this.playTone(880, 'triangle', 0.8, 0.3); // A5
                break;
            case 'wrong':
                // Low shock
                this.playTone(100, 'sawtooth', 0.5, 0, 0.2);
                this.playTone(90, 'sawtooth', 0.5, 0.1, 0.2);
                break;
            case 'suspense':
                // Heartbeat
                this.playTone(60, 'sine', 0.1, 0, 0.3);
                this.playTone(60, 'sine', 0.1, 0.3, 0.2);
                break;
            case 'select':
                this.playTone(800, 'sine', 0.05, 0, 0.1);
                break;
        }
    }

    resumeAudioContext() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
}

// Init App
document.addEventListener('DOMContentLoaded', () => {
    const app = new QuizApp();
    app.init();
});
