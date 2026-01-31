/**
 * LifelineManager - ライフライン機能の管理クラス
 */
class LifelineManager {
    constructor(els) {
        this.els = els;
        this.lifelines = {
            '5050': true,
            'phone': true,
            'audience': true
        };
    }

    reset() {
        this.lifelines = { '5050': true, 'phone': true, 'audience': true };
        Object.values(this.els.lifelineBtns).forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('used');
        });
    }

    use5050(correctIndex, optionElements) {
        if (!this.lifelines['5050']) return;

        this.lifelines['5050'] = false;
        this.els.lifelineBtns['5050'].classList.add('used');
        this.els.lifelineBtns['5050'].disabled = true;

        // Find wrong indices
        let wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
        this.shuffle(wrongIndices);

        // Hide 2 wrong options with staggered delay
        setTimeout(() => {
            optionElements[wrongIndices[0]].style.opacity = '0';
            setTimeout(() => {
                optionElements[wrongIndices[0]].classList.add('hidden');
            }, 800);
        }, 500);

        setTimeout(() => {
            optionElements[wrongIndices[1]].style.opacity = '0';
            setTimeout(() => {
                optionElements[wrongIndices[1]].classList.add('hidden');
            }, 800);
        }, 1500);
    }

    usePhone(question) {
        if (!this.lifelines['phone']) return;

        this.lifelines['phone'] = false;
        this.els.lifelineBtns['phone'].classList.add('used');
        this.els.lifelineBtns['phone'].disabled = true;

        const hint = question.explanation || "うーん、少し難しいですね...でも、落ち着いて考えれば分かるはずです！";

        if (this.els.phoneHintArea) {
            this.els.phoneHintText.textContent = hint;
            this.els.phoneHintArea.classList.remove('hidden');
        } else {
            alert(`電話の相手: 「${hint}」`);
        }
    }

    useAudience(correctIndex, shuffledOptions) {
        if (!this.lifelines['audience']) return;

        console.log("[DEBUG] Audience Lifeline Triggered");
        console.log("[DEBUG] Correct Shuffled Index:", correctIndex);

        if (correctIndex === undefined || correctIndex === -1) {
            console.warn("[DEBUG] correctShuffledIndex was -1. Emergency recalc...");
            correctIndex = shuffledOptions.findIndex(opt => opt.isCorrect);
        }

        if (correctIndex === -1) {
            console.error("[DEBUG] Failed to identify correct answer index for Audience!");
            return;
        }

        this.lifelines['audience'] = false;
        this.els.lifelineBtns['audience'].classList.add('used');
        this.els.lifelineBtns['audience'].disabled = true;

        // Calculate Percentages
        let percentages = [0, 0, 0, 0];
        let correctProb = Math.floor(Math.random() * 15) + 70; // 70-85% for clarity
        percentages[correctIndex] = correctProb;

        let remaining = 100 - correctProb;
        let others = [0, 1, 2, 3].filter(i => i !== correctIndex);
        this.shuffle(others);

        let p1 = Math.floor(Math.random() * (remaining - 5));
        percentages[others[0]] = p1;
        remaining -= p1;

        let p2 = Math.floor(Math.random() * remaining);
        percentages[others[1]] = p2;
        percentages[others[2]] = remaining - p2;

        console.log("[DEBUG] Generated Percentages:", percentages);

        // Reset UI before showing
        Object.values(this.els.audienceBars).forEach(bar => {
            if (bar) bar.style.height = '0%';
        });
        Object.values(this.els.audiencePercents).forEach(p => {
            if (p) {
                p.textContent = '0%';
                p.classList.remove('visible');
            }
        });

        // Show Modal
        this.els.audienceModal.classList.remove('hidden');

        // Trigger animation after a slight delay
        requestAnimationFrame(() => {
            setTimeout(() => {
                const keys = ['A', 'B', 'C', 'D'];
                keys.forEach((key, idx) => {
                    const bar = this.els.audienceBars[key];
                    const pText = this.els.audiencePercents[key];
                    const val = percentages[idx];

                    if (bar) {
                        bar.style.height = val + '%';
                        console.log(`[DEBUG] Animating Bar ${key} to ${val}%`);
                    }
                    if (pText) {
                        pText.textContent = val + '%';
                        pText.classList.add('visible');
                    }
                });
            }, 50);
        });

        return correctIndex; // Return the correct index in case it was recalculated
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    isAvailable(type) {
        return this.lifelines[type];
    }
}
