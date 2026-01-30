class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizDataUrl = 'data/quiz_data.csv'; // Local path, can be replaced with Google Sheet URL

        // Lifeline states
        this.lifelines = {
            '5050': true,
            'phone': true,
            'audience': true
        };

        this.isReviewMode = false;
        this.mistakes = JSON.parse(localStorage.getItem('quizMillionaireMistakes')) || [];

        // DOM Elements
        this.screens = {
            start: document.getElementById('start-screen'),
            quiz: document.getElementById('quiz-screen'),
            result: document.getElementById('result-screen')
        };

        this.els = {
            questionText: document.getElementById('question-text'),
            questionImage: document.getElementById('question-image'),
            imageContainer: document.getElementById('image-container'),
            qNum: document.getElementById('q-num'),
            scoreVal: document.getElementById('score-val'),
            scoreTable: document.getElementById('score-table'),
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

        this.initEventListeners();
    }

    async init() {
        await this.loadQuestions();
        console.log("Loaded questions:", this.questions);
    }

    initEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startQuiz(false));
        document.getElementById('review-btn').addEventListener('click', () => this.startQuiz(true));
        document.getElementById('retry-btn').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('home-btn').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('next-question-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('close-audience').addEventListener('click', () => this.els.audienceModal.classList.add('hidden'));

        this.els.options.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e));
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
            if (row.length < 7) continue;

            questions.push({
                id: row[0],
                unit: row[1],
                text: row[2],
                options: [row[3], row[4], row[5], row[6]],
                answer: row[7].trim(), // Text or Index (1-4) or A-D
                image: row[8] ? row[8].trim() : '',
                explanation: row[9] ? row[9].trim() : ''
            });
        }
        return questions;
    }

    startQuiz(reviewMode = false) {
        if (!this.audioCtx) this.initAudio();
        this.resumeAudioContext();
        this.playBGM('main');

        this.isReviewMode = reviewMode;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.resetLifelines();

        let quizSet = [...this.questions];

        if (this.isReviewMode) {
            if (this.mistakes.length === 0) {
                alert("復習する問題がありません！");
                return;
            }
            // Filter questions using stored IDs or text
            quizSet = quizSet.filter(q => this.mistakes.includes(q.id));
        }

        // Shuffle questions
        this.currentQuizSet = this.shuffle(quizSet).slice(0, 20); // Limit to 20 or available

        if (this.currentQuizSet.length === 0) {
            alert(this.isReviewMode ? "一致する問題が見つかりませんでした。" : "問題がありません。");
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

        this.renderScoreTable();

        // Image handling
        if (q.image) {
            this.els.questionImage.src = `assets/images/${q.image}`;
            this.els.imageContainer.classList.remove('hidden');
        } else {
            this.els.imageContainer.classList.add('hidden');
        }

        // Options
        this.els.options.forEach((btn, idx) => {
            btn.querySelector('.option-text').textContent = q.options[idx];
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
        const q = this.currentQuizSet[this.currentQuestionIndex];

        // Determine correct index
        let correctIndex = -1;
        // Try to match exact text
        correctIndex = q.options.indexOf(q.answer);

        // Try to match "A"/"B" etc
        if (correctIndex === -1) {
            const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
            if (map[q.answer] !== undefined) correctIndex = map[q.answer];
        }

        // Fallback: compare trimmed strings
        if (correctIndex === -1) {
            correctIndex = q.options.findIndex(opt => opt.trim() === q.answer.trim());
        }

        // UI updates
        this.markSelected(btn);

        // Simulated suspense time
        setTimeout(() => {
            if (selectedIndex === correctIndex) {
                this.onCorrect(btn);
            } else {
                this.onWrong(btn, correctIndex);
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
        btn.classList.add('correct');
        this.score++;

        // Remove from mistakes if in review mode (optional logic, keep for now)
        if (this.isReviewMode) {
            this.mistakes = this.mistakes.filter(id => id !== this.currentQuizSet[this.currentQuestionIndex].id);
            localStorage.setItem('quizMillionaireMistakes', JSON.stringify(this.mistakes));
        }

        setTimeout(() => {
            this.showFeedback(true);
        }, 1000);
    }

    onWrong(btn, correctIndex) {
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
        this.showScreen('result');
        const finalPrize = this.score > 0 ? this.prizes[this.score - 1] : 0;
        document.getElementById('final-score-val').textContent = finalPrize.toLocaleString() + "円";
        let msg = "Nice try!";
        if (this.score === this.currentQuizSet.length) msg = "PERFECT!! MILLIONAIRE!!";
        else if (this.score >= this.currentQuizSet.length * 0.8) msg = "Great Job!";
        document.getElementById('result-message').textContent = msg;
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
