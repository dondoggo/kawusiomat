(() => {
    'use strict';

    // ========================
    // CONFIG
    // ========================

    const COFFEE_TYPES = {
        czarna: {
            label: 'Czarna',
            icon: '☕',
            baseFraction: 1.0,
            milk: 0,
            foam: 0,
            water: 0
        },
        americano: {
            label: 'Americano',
            icon: '💧',
            baseFraction: 0.5,
            milk: 0,
            foam: 0,
            water: 0.5
        },
        cappuccino: {
            label: 'Cappuccino',
            icon: '🤎',
            baseFraction: 0.4,
            milk: 0.3,
            foam: 0.3,
            water: 0
        },
        flatwhite: {
            label: 'Flat White',
            icon: '🥛',
            baseFraction: 0.4,
            milk: 0.6,
            foam: 0,
            water: 0
        },
        latte: {
            label: 'Latte',
            icon: '🍼',
            baseFraction: 0.25,
            milk: 0.6,
            foam: 0.15,
            water: 0
        }
    };

    const STRENGTHS = {
        weak:   { label: 'Słaba',   ratio: 16, brewTime: 3 },
        medium: { label: 'Średnia', ratio: 14, brewTime: 4 },
        strong: { label: 'Mocna',   ratio: 12, brewTime: 5 }
    };

    const CUP_SIZES = [150, 200, 250, 300, 350];

    // ========================
    // STATE
    // ========================

    const state = {
        currentStep: 1,
        cupCount: 1,
        cups: [{ size: 250, type: 'czarna' }],
        strength: 'medium'
    };

    // ========================
    // DOM REFS
    // ========================

    const stepSections = {};
    for (let i = 1; i <= 4; i++) {
        stepSections[i] = document.getElementById(`step-${i}`);
    }
    const recipeSection = document.getElementById('recipe-section');
    const progressFill = document.getElementById('progress-fill');
    const progressDots = document.querySelectorAll('.progress-dot');
    const wizardProgress = document.getElementById('wizard-progress');
    const favoritesPanel = document.getElementById('favorites-panel');
    const favoritesList = document.getElementById('favorites-list');
    const favoritesCount = document.getElementById('favorites-count');
    const toastEl = document.getElementById('toast');

    // ========================
    // PROGRESS BAR
    // ========================

    const updateProgress = (step, total) => {
        const pct = (step / total) * 100;
        progressFill.style.width = `${pct}%`;

        progressDots.forEach((dot, d) => {
            const dotStep = d + 1;
            if (dotStep < step) {
                dot.className = 'progress-dot done';
            } else if (dotStep === step) {
                dot.className = 'progress-dot current bounce';
            } else {
                dot.className = 'progress-dot';
            }
        });
    };

    // ========================
    // NAVIGATION
    // ========================

    const animateCard = (el) => {
        el.classList.remove('card-enter');
        void el.offsetWidth;
        el.classList.add('card-enter');
    };

    const showStep = (stepNum) => {
        state.currentStep = stepNum;
        for (let s = 1; s <= 4; s++) {
            stepSections[s].classList.toggle('hidden', s !== stepNum);
        }
        recipeSection.classList.add('hidden');
        wizardProgress.classList.remove('hidden');
        if (stepNum === 1) {
            renderFavoritesList();
        } else {
            favoritesPanel.classList.add('hidden');
        }
        updateProgress(stepNum, 4);
        animateCard(stepSections[stepNum]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showRecipe = () => {
        for (let s = 1; s <= 4; s++) {
            stepSections[s].classList.add('hidden');
        }
        recipeSection.classList.remove('hidden');
        wizardProgress.classList.add('hidden');
        favoritesPanel.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        requestAnimationFrame(() => {
            animateCard(recipeSection);
            animateRecipeChildren();
        });
    };

    const resetAnimationClasses = () => {
        const summary = document.getElementById('recipe-summary');
        summary.classList.remove('summary-pop');

        recipeSection.querySelectorAll('.stagger-item').forEach((el) => {
            el.classList.remove('stagger-item');
            el.style.removeProperty('animation-delay');
        });
    };

    const animateRecipeChildren = () => {
        resetAnimationClasses();
        void recipeSection.offsetWidth;

        const summary = document.getElementById('recipe-summary');
        summary.classList.add('summary-pop');
        summary.querySelectorAll('.summary-item').forEach((item, i) => {
            item.style.animationDelay = `${i * 0.08}s`;
        });

        const staggerEls = recipeSection.querySelectorAll(
            '.timer-section, .steps-list li, .info-bar, .cup-breakdown'
        );
        staggerEls.forEach((el, i) => {
            el.classList.add('stagger-item');
            el.style.animationDelay = `${0.15 + i * 0.05}s`;
        });
    };

    // ========================
    // HELPERS
    // ========================

    const syncCups = () => {
        while (state.cups.length < state.cupCount) {
            state.cups.push({ size: 250, type: 'czarna' });
        }
        state.cups.length = state.cupCount;
    };

    const popButton = (btn) => {
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
    };

    const setupStaticGroup = (groupEl, stateKey, parser) => {
        groupEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || !groupEl.contains(btn)) return;
            groupEl.querySelectorAll('button').forEach((b) => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            popButton(btn);
            state[stateKey] = parser ? parser(btn.dataset.value) : btn.dataset.value;
        });
    };

    // ========================
    // STEP 1 — Cup count
    // ========================

    setupStaticGroup(
        document.getElementById('cup-count-group'),
        'cupCount',
        (v) => parseInt(v, 10)
    );

    document.getElementById('next-1').addEventListener('click', () => {
        syncCups();
        renderCupSizes();
        showStep(2);
    });

    // ========================
    // STEP 2 — Cup sizes
    // ========================

    const renderCupSizes = () => {
        const container = document.getElementById('cup-sizes-container');
        container.innerHTML = '';

        for (let c = 0; c < state.cupCount; c++) {
            const card = document.createElement('div');
            card.className = 'cup-config';

            const title = document.createElement('h3');
            title.textContent = `Filiżanka ${c + 1}`;
            card.appendChild(title);

            const group = document.createElement('div');
            group.className = 'button-group';

            for (const size of CUP_SIZES) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.value = size;
                btn.textContent = `${size} ml`;
                if (state.cups[c].size === size) {
                    btn.classList.add('active');
                }
                group.appendChild(btn);
            }

            group.addEventListener('click', (e) => {
                const b = e.target.closest('button');
                if (!b) return;
                group.querySelectorAll('button').forEach((x) => {
                    x.classList.remove('active');
                });
                b.classList.add('active');
                popButton(b);
                state.cups[c].size = parseInt(b.dataset.value, 10);
            });

            card.appendChild(group);
            card.classList.add('cup-config-enter');
            card.style.animationDelay = `${c * 0.08}s`;
            container.appendChild(card);
        }
    };

    document.getElementById('back-2').addEventListener('click', () => {
        showStep(1);
    });
    document.getElementById('next-2').addEventListener('click', () => {
        renderCupTypes();
        showStep(3);
    });

    // ========================
    // STEP 3 — Coffee types
    // ========================

    const renderCupTypes = () => {
        const container = document.getElementById('cup-types-container');
        container.innerHTML = '';

        const typeKeys = Object.keys(COFFEE_TYPES);

        for (let c = 0; c < state.cupCount; c++) {
            const card = document.createElement('div');
            card.className = 'cup-config';

            const title = document.createElement('h3');
            title.textContent = `Filiżanka ${c + 1} (${state.cups[c].size} ml)`;
            card.appendChild(title);

            const group = document.createElement('div');
            group.className = 'button-group coffee-type';

            for (const key of typeKeys) {
                const ct = COFFEE_TYPES[key];
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.value = key;
                btn.innerHTML =
                    `<span class="type-icon">${ct.icon}</span>` +
                    `<span class="type-name">${ct.label}</span>`;
                if (state.cups[c].type === key) {
                    btn.classList.add('active');
                }
                group.appendChild(btn);
            }

            group.addEventListener('click', (e) => {
                const b = e.target.closest('button');
                if (!b) return;
                group.querySelectorAll('button').forEach((x) => {
                    x.classList.remove('active');
                });
                b.classList.add('active');
                popButton(b);
                state.cups[c].type = b.dataset.value;
            });

            card.appendChild(group);
            card.classList.add('cup-config-enter');
            card.style.animationDelay = `${c * 0.08}s`;
            container.appendChild(card);
        }
    };

    document.getElementById('back-3').addEventListener('click', () => {
        showStep(2);
    });
    document.getElementById('next-3').addEventListener('click', () => {
        showStep(4);
    });

    // ========================
    // STEP 4 — Strength
    // ========================

    setupStaticGroup(document.getElementById('strength-group'), 'strength');

    document.getElementById('back-4').addEventListener('click', () => {
        showStep(3);
    });
    document.getElementById('brew-btn').addEventListener('click', () => {
        const recipe = calculateRecipe();
        renderRecipe(recipe);
        showRecipe();
    });

    // ========================
    // RECIPE CALCULATION
    // ========================

    const calculateRecipe = () => {
        const strength = STRENGTHS[state.strength];
        const cupsData = [];
        let totalTargetBrew = 0;
        let totalMilk = 0;
        let totalFoam = 0;
        let totalExtraWater = 0;

        for (let c = 0; c < state.cupCount; c++) {
            const cup = state.cups[c];
            const ct = COFFEE_TYPES[cup.type];

            const baseMl = Math.round(cup.size * ct.baseFraction);
            const milkMl = Math.round(cup.size * ct.milk);
            const foamMl = Math.round(cup.size * ct.foam);
            const waterMl = Math.round(cup.size * ct.water);

            cupsData.push({
                index: c + 1,
                size: cup.size,
                type: cup.type,
                typeLabel: ct.label,
                typeIcon: ct.icon,
                baseMl,
                milkMl,
                foamMl,
                waterMl
            });

            totalTargetBrew += baseMl;
            totalMilk += milkMl;
            totalFoam += foamMl;
            totalExtraWater += waterMl;
        }

        // Fusy kawy pochłaniają ~2 ml wody na gram kawy (standard SCA).
        // Aby uzyskać targetową objętość naparu, trzeba zalać więcej wody:
        //   waterNeeded = targetBrew * ratio / (ratio - 2)
        const totalBaseWater = Math.round(totalTargetBrew * strength.ratio / (strength.ratio - 2));
        const coffeeGrams = Math.round(totalBaseWater / strength.ratio);

        return {
            cups: cupsData,
            totalBaseWater,
            coffeeGrams,
            totalMilk,
            totalFoam,
            totalExtraWater,
            temperature: '93\u201396',
            brewTime: strength.brewTime,
            strengthLabel: strength.label
        };
    };

    // ========================
    // RENDER RECIPE
    // ========================

    const renderRecipe = (recipe) => {
        renderBrewAnimation();
        renderSummary(recipe);
        renderBreakdown(recipe);
        initTimer(recipe);
        renderSteps(generateSteps(recipe));
        renderTips(recipe);
    };

    const renderBrewAnimation = () => {
        let anim = document.getElementById('brew-anim');
        if (anim) anim.remove();
        anim = document.createElement('div');
        anim.className = 'brew-animation';
        anim.id = 'brew-anim';
        anim.innerHTML =
            `<div class="brew-cup">` +
                `<div class="brew-pour"></div>` +
                `<div class="brew-liquid"></div>` +
                `<div class="brew-steam"></div>` +
                `<div class="brew-steam"></div>` +
                `<div class="brew-steam"></div>` +
                `<div class="brew-cup-handle"></div>` +
            `</div>`;
        const summary = document.getElementById('recipe-summary');
        summary.parentNode.insertBefore(anim, summary);
    };

    const renderSummary = (recipe) => {
        const el = document.getElementById('recipe-summary');
        let html =
            `<div class="summary-item">` +
                `<span class="summary-value">${recipe.coffeeGrams} g</span>` +
                `<span class="summary-label">Kawa mielona</span>` +
            `</div>` +
            `<div class="summary-item">` +
                `<span class="summary-value">${recipe.totalBaseWater} ml</span>` +
                `<span class="summary-label">Woda do zaparzenia</span>` +
            `</div>` +
            `<div class="summary-item">` +
                `<span class="summary-value">${recipe.temperature}\u00B0C</span>` +
                `<span class="summary-label">Temperatura</span>` +
            `</div>` +
            `<div class="summary-item">` +
                `<span class="summary-value">${recipe.brewTime} min</span>` +
                `<span class="summary-label">Czas parzenia</span>` +
            `</div>`;

        if (recipe.totalMilk + recipe.totalFoam > 0) {
            html +=
                `<div class="summary-item">` +
                    `<span class="summary-value">${recipe.totalMilk + recipe.totalFoam} ml</span>` +
                    `<span class="summary-label">Mleko łącznie</span>` +
                `</div>`;
        }

        if (recipe.totalExtraWater > 0) {
            html +=
                `<div class="summary-item">` +
                    `<span class="summary-value">${recipe.totalExtraWater} ml</span>` +
                    `<span class="summary-label">Dodatkowa woda</span>` +
                `</div>`;
        }

        el.innerHTML = html;
    };

    const renderBreakdown = (recipe) => {
        const section = document.getElementById('recipe-breakdown');
        const content = section.querySelector('.breakdown-content');

        let needsBreakdown = state.cupCount > 1;
        if (!needsBreakdown) {
            needsBreakdown = recipe.cups.some((cup) => cup.type !== 'czarna');
        }

        if (!needsBreakdown) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        let html = '';
        for (const cup of recipe.cups) {
            html +=
                `<div class="cup-breakdown">` +
                    `<div class="cup-breakdown-header">` +
                        `<span class="cup-num">${cup.typeIcon}</span>` +
                        `<span>Filiżanka ${cup.index} \u2014 ${cup.typeLabel} (${cup.size} ml)</span>` +
                    `</div>` +
                    `<div class="cup-breakdown-details">` +
                        `<span class="detail-chip base">${cup.baseMl} ml bazy</span>`;

            if (cup.milkMl > 0) {
                html += `<span class="detail-chip milk">${cup.milkMl} ml mleka</span>`;
            }
            if (cup.foamMl > 0) {
                html += `<span class="detail-chip foam">${cup.foamMl} ml pianki</span>`;
            }
            if (cup.waterMl > 0) {
                html += `<span class="detail-chip water">${cup.waterMl} ml wody</span>`;
            }

            html +=
                    `</div>` +
                `</div>`;
        }

        content.innerHTML = html;
    };

    // ========================
    // STEPS
    // ========================

    const generateSteps = (recipe) => {
        const steps = [];
        const needsMilk = (recipe.totalMilk + recipe.totalFoam) > 0;
        const totalMilkMl = recipe.totalMilk + recipe.totalFoam;

        let bloomWater = recipe.coffeeGrams * 2;
        if (bloomWater > recipe.totalBaseWater * 0.3) {
            bloomWater = Math.round(recipe.totalBaseWater * 0.3);
        }
        const restWater = recipe.totalBaseWater - bloomWater;

        steps.push(`Zagotuj wod\u0119 i odstaw na ok. 1 minut\u0119 (do ${recipe.temperature}\u00B0C)`);

        if (needsMilk) {
            steps.push(
                `Odmierz ${recipe.coffeeGrams} g kawy grubo mielonej \u2014 ` +
                `jednocze\u015Bnie podgrzej ${totalMilkMl} ml mleka do ok. 60\u00B0C (nie gotuj!)`
            );
        } else {
            steps.push(`Odmierz ${recipe.coffeeGrams} g kawy grubo mielonej`);
        }

        steps.push('Wsyp kaw\u0119 do French Pressa');

        steps.push(
            `Zalej ${bloomWater} ml wody i odczekaj 30 sek \u2014 to blooming, ` +
            `uwalnia CO\u2082 z kawy i poprawia ekstrakcj\u0119`
        );

        steps.push(`Dolej pozosta\u0142e ${restWater} ml wody`);
        steps.push('Zamieszaj delikatnie');
        steps.push(`Za\u0142\u00F3\u017C t\u0142ok (nie wciskaj) i odczekaj ${recipe.brewTime} min`);
        steps.push('Powoli wci\u015Bnij t\u0142ok do dna');

        if (!needsMilk) {
            if (state.cupCount === 1) {
                const cup = recipe.cups[0];
                if (cup.type === 'czarna') {
                    steps.push('Przelej kaw\u0119 do fili\u017Canki');
                } else {
                    steps.push(
                        `Przelej ${cup.baseMl} ml kawy do fili\u017Canki i dolej ` +
                        `${cup.waterMl} ml gor\u0105cej wody`
                    );
                }
            } else {
                for (const c of recipe.cups) {
                    let line = `Fili\u017Canka ${c.index} (${c.typeLabel}): przelej ${c.baseMl} ml bazy`;
                    if (c.waterMl > 0) line += ` + dolej ${c.waterMl} ml gor\u0105cej wody`;
                    steps.push(line);
                }
            }
        } else {
            if (state.cupCount === 1) {
                const cup = recipe.cups[0];
                steps.push(`Przelej ${cup.baseMl} ml kawy do fili\u017Canki`);
            } else {
                const pourParts = recipe.cups.map((c) => {
                    let part = `fil. ${c.index}: ${c.baseMl} ml`;
                    if (c.waterMl > 0) part += ` + ${c.waterMl} ml wody`;
                    return part;
                });
                steps.push(`Rozlej baz\u0119 kawy do fili\u017Canek \u2014 ${pourParts.join(', ')}`);
            }

            steps.push(
                'Przelej podgrzane mleko do French Pressa (max do po\u0142owy) ' +
                'i energicznie pompuj t\u0142okiem przez 10\u201315 sek, a\u017C mleko podwoi obj\u0119to\u015B\u0107'
            );

            if (state.cupCount === 1) {
                const cup = recipe.cups[0];
                let milkLine = 'Dodaj do fili\u017Canki';
                if (cup.milkMl > 0) milkLine += ` ${cup.milkMl} ml spieninego mleka`;
                if (cup.foamMl > 0) milkLine += `${cup.milkMl > 0 ? ' i ' : ' '}${cup.foamMl} ml pianki`;
                steps.push(milkLine);
            } else {
                for (const c of recipe.cups) {
                    if (c.milkMl > 0 || c.foamMl > 0) {
                        let line = `Fili\u017Canka ${c.index} (${c.typeLabel}): dodaj`;
                        if (c.milkMl > 0) line += ` ${c.milkMl} ml mleka`;
                        if (c.foamMl > 0) line += `${c.milkMl > 0 ? ' i ' : ' '}${c.foamMl} ml pianki`;
                        steps.push(line);
                    }
                }
            }
        }

        steps.push('Gotowe \u2014 smacznej kawy! \u2615');
        return steps;
    };

    const renderSteps = (stepsArr) => {
        const el = document.getElementById('steps-list');
        el.innerHTML = '';

        for (const text of stepsArr) {
            const li = document.createElement('li');
            li.innerHTML =
                `<span class="step-checkbox"></span>` +
                `<span class="step-text">${text}</span>`;

            li.addEventListener('click', function () {
                this.classList.toggle('done');
                if (this.classList.contains('done')) {
                    this.classList.add('check-anim');
                    setTimeout(() => {
                        this.classList.remove('check-anim');
                    }, 350);
                }
            });

            el.appendChild(li);
        }
    };

    // ========================
    // INFO TIPS
    // ========================

    const renderTips = (recipe) => {
        const el = document.getElementById('recipe-tips');
        const needsMilk = (recipe.totalMilk + recipe.totalFoam) > 0;

        const tips = [
            {
                cls: 'bloom',
                icon: '\uD83E\uDEE7',
                title: 'Blooming',
                text: 'Zalewanie kawy niewielk\u0105 ilo\u015Bci\u0105 wody uwalnia CO\u2082 uwi\u0119ziony ' +
                      'podczas palenia ziaren. Je\u015Bli widzisz b\u0105belki na powierzchni \u2014 Twoja ' +
                      'kawa jest \u015Bwie\u017Ca! Blooming poprawia ekstrakcj\u0119 i daje pe\u0142niejszy smak.'
            },
            {
                cls: 'temp',
                icon: '\uD83C\uDF21\uFE0F',
                title: 'Temperatura',
                text: 'Optymalna temperatura parzenia to 93\u201396\u00B0C. Wrzatek parzy kaw\u0119 ' +
                      'zbyt intensywnie (gorzki smak), a za zimna woda da s\u0142ab\u0105, ' +
                      'kwa\u015Bn\u0105 ekstrakcj\u0119. Wystarczy odczeka\u0107 ok. 1 min po zagotowaniu.'
            }
        ];

        if (needsMilk) {
            tips.push({
                cls: 'milk',
                icon: '\uD83E\uDD5B',
                title: 'Spienianie mleka',
                text: 'French Press \u015Bwietnie sprawdza si\u0119 jako spieniacz! Podgrzej mleko ' +
                      'do ok. 60\u00B0C (nie gotuj \u2014 powy\u017Cej 70\u00B0C bia\u0142ka si\u0119 rozpadaj\u0105), ' +
                      'przelej do prasy max do po\u0142owy i energicznie pompuj t\u0142okiem. ' +
                      'Mleko podwoi obj\u0119to\u015B\u0107 w 10\u201315 sekund.'
            });
        }

        tips.push({
            cls: 'grind',
            icon: '\u2699\uFE0F',
            title: 'Stopie\u0144 mielenia',
            text: 'Do French Pressa u\u017Cywaj grubo mielonej kawy (jak gruby piasek). ' +
                  'Zbyt drobne mielenie sprawi, \u017Ce kawa przejdzie przez filtr siatkowy ' +
                  'i nap\u00F3j b\u0119dzie m\u0119tny i przeparzony.'
        });

        let html = '<h3>Dobre praktyki</h3>';
        for (const t of tips) {
            html +=
                `<div class="info-bar ${t.cls}">` +
                    `<span class="info-bar-icon">${t.icon}</span>` +
                    `<div class="info-bar-body">` +
                        `<span class="info-bar-title">${t.title}</span>` +
                        `${t.text}` +
                    `</div>` +
                `</div>`;
        }

        el.innerHTML = html;
    };

    // ========================
    // TIMER
    // ========================

    const RING_CIRCUMFERENCE = 2 * Math.PI * 54;
    const timer = {
        intervalId: null,
        phase: 'bloom',
        running: false,
        secondsLeft: 0,
        totalSeconds: 0,
        bloomSeconds: 30,
        brewSeconds: 0
    };

    const timerEls = {
        time: document.getElementById('timer-time'),
        phase: document.getElementById('timer-phase'),
        ring: document.getElementById('timer-ring-progress'),
        startBtn: document.getElementById('timer-start'),
        resetBtn: document.getElementById('timer-reset'),
        phaseBloom: document.getElementById('phase-bloom'),
        phaseBrew: document.getElementById('phase-brew'),
        ringWrap: document.querySelector('.timer-ring-wrap')
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const updateTimerDisplay = () => {
        timerEls.time.textContent = formatTime(timer.secondsLeft);

        const fraction = 1 - (timer.secondsLeft / timer.totalSeconds);
        const offset = fraction * RING_CIRCUMFERENCE;
        timerEls.ring.style.strokeDasharray = RING_CIRCUMFERENCE;
        timerEls.ring.style.strokeDashoffset = RING_CIRCUMFERENCE - offset;

        timerEls.ring.setAttribute('class', 'timer-ring-progress');
        if (timer.phase === 'bloom') {
            timerEls.phase.textContent = 'Blooming';
            timerEls.ring.classList.add('blooming');
        } else if (timer.phase === 'brew') {
            timerEls.phase.textContent = 'Parzenie';
            timerEls.ring.classList.add('brewing');
        } else {
            timerEls.phase.textContent = 'Gotowe!';
            timerEls.ring.classList.add('done');
        }
    };

    const updateTimerPhaseIndicators = () => {
        timerEls.phaseBloom.className = 'timer-phase-indicator';
        timerEls.phaseBrew.className = 'timer-phase-indicator';

        if (timer.phase === 'bloom') {
            timerEls.phaseBloom.classList.add('active');
        } else if (timer.phase === 'brew') {
            timerEls.phaseBloom.classList.add('completed');
            timerEls.phaseBrew.classList.add('active');
        } else {
            timerEls.phaseBloom.classList.add('completed');
            timerEls.phaseBrew.classList.add('completed');
        }
    };

    const timerBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const beep = (freq, startTime, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            const now = ctx.currentTime;
            beep(880, now, 0.15);
            beep(880, now + 0.2, 0.15);
            beep(1100, now + 0.4, 0.25);
        } catch {
            // AudioContext not available
        }

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    };

    const stopTimer = () => {
        timer.running = false;
        if (timer.intervalId) {
            clearInterval(timer.intervalId);
            timer.intervalId = null;
        }
        timerEls.startBtn.textContent = 'Start';
    };

    const initTimer = (recipe) => {
        stopTimer();
        timer.brewSeconds = recipe.brewTime * 60;
        timer.phase = 'bloom';
        timer.secondsLeft = timer.bloomSeconds;
        timer.totalSeconds = timer.bloomSeconds;
        timer.running = false;
        timerEls.startBtn.textContent = 'Start';
        updateTimerDisplay();
        updateTimerPhaseIndicators();
    };

    const tickTimer = () => {
        if (timer.secondsLeft <= 0) {
            if (timer.phase === 'bloom') {
                timerBeep();
                timer.phase = 'brew';
                timer.secondsLeft = timer.brewSeconds;
                timer.totalSeconds = timer.brewSeconds;
                updateTimerPhaseIndicators();
                timerEls.ringWrap.classList.add('pulsing');
                setTimeout(() => {
                    timerEls.ringWrap.classList.remove('pulsing');
                }, 1800);
            } else {
                timerBeep();
                timer.phase = 'done';
                timer.running = false;
                clearInterval(timer.intervalId);
                timer.intervalId = null;
                timerEls.startBtn.textContent = 'Start';
                updateTimerPhaseIndicators();
                timerEls.ringWrap.classList.add('pulsing');
                setTimeout(() => {
                    timerEls.ringWrap.classList.remove('pulsing');
                }, 1800);
            }
            updateTimerDisplay();
            return;
        }
        timer.secondsLeft--;
        updateTimerDisplay();
    };

    const startTimer = () => {
        if (timer.phase === 'done') return;
        timer.running = true;
        timerEls.startBtn.textContent = 'Pauza';
        timer.intervalId = setInterval(tickTimer, 1000);
    };

    timerEls.startBtn.addEventListener('click', () => {
        if (timer.phase === 'done') {
            initTimer({ brewTime: timer.brewSeconds / 60 });
            return;
        }
        if (timer.running) {
            stopTimer();
        } else {
            startTimer();
        }
    });

    timerEls.resetBtn.addEventListener('click', () => {
        initTimer({ brewTime: timer.brewSeconds / 60 });
    });

    // ========================
    // BACK TO START
    // ========================

    document.getElementById('back-btn').addEventListener('click', () => {
        stopTimer();
        const anim = document.getElementById('brew-anim');
        if (anim) anim.remove();
        resetAnimationClasses();
        recipeSection.classList.remove('card-enter');
        showStep(1);
    });

    // ========================
    // FAVORITES
    // ========================

    const STORAGE_KEY = 'kawusiomat_favorites';

    const loadFavorites = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    };

    const saveFavorites = (favs) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    };

    const generateFavoriteLabel = () => {
        if (state.cupCount === 1) {
            const c = state.cups[0];
            return `${COFFEE_TYPES[c.type].icon} ${COFFEE_TYPES[c.type].label} · ${c.size} ml`;
        }
        const icons = state.cups.map((c) => COFFEE_TYPES[c.type].icon).join('');
        const uniqueTypes = [...new Set(state.cups.map((c) => COFFEE_TYPES[c.type].label))];
        const summary = uniqueTypes.length === 1 ? uniqueTypes[0] : `${state.cupCount} filiżanki`;
        return `${icons} ${summary}`;
    };

    const formatFavDate = (ts) => new Date(ts).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short'
    });

    let toastTimer = null;
    const showToast = (msg) => {
        toastEl.textContent = msg;
        toastEl.classList.add('toast-show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('toast-show'), 2500);
    };

    const deleteFavorite = (id) => {
        saveFavorites(loadFavorites().filter((f) => f.id !== id));
        renderFavoritesList();
    };

    const loadFavoriteToState = (fav) => {
        state.cupCount = fav.cupCount;
        state.cups = fav.cups.map((c) => ({ ...c }));
        state.strength = fav.strength;

        document.querySelectorAll('#cup-count-group button').forEach((b) => {
            b.classList.toggle('active', parseInt(b.dataset.value, 10) === fav.cupCount);
        });
        document.querySelectorAll('#strength-group button').forEach((b) => {
            b.classList.toggle('active', b.dataset.value === fav.strength);
        });

        const recipe = calculateRecipe();
        renderRecipe(recipe);
        showRecipe();
    };

    const renderFavoritesList = () => {
        const favs = loadFavorites();
        if (favs.length === 0) {
            favoritesPanel.classList.add('hidden');
            return;
        }

        favoritesPanel.classList.remove('hidden');
        favoritesCount.textContent = String(favs.length);

        let html = '';
        for (const fav of favs) {
            html +=
                `<div class="fav-item">` +
                    `<div class="fav-info">` +
                        `<div class="fav-label">${fav.label}</div>` +
                        `<div class="fav-meta">${fav.strengthLabel} \u00b7 ${formatFavDate(fav.date)}</div>` +
                    `</div>` +
                    `<div class="fav-actions">` +
                        `<button type="button" class="btn-fav-load" data-id="${fav.id}">Za\u0142aduj</button>` +
                        `<button type="button" class="btn-fav-del" data-id="${fav.id}" aria-label="Usu\u0144">\u00d7</button>` +
                    `</div>` +
                `</div>`;
        }
        favoritesList.innerHTML = html;

        favoritesList.querySelectorAll('.btn-fav-load').forEach((btn) => {
            btn.addEventListener('click', () => {
                const fav = loadFavorites().find((f) => f.id === Number(btn.dataset.id));
                if (fav) loadFavoriteToState(fav);
            });
        });

        favoritesList.querySelectorAll('.btn-fav-del').forEach((btn) => {
            btn.addEventListener('click', () => {
                deleteFavorite(Number(btn.dataset.id));
            });
        });
    };

    document.getElementById('favorites-toggle').addEventListener('click', () => {
        const isOpen = favoritesPanel.classList.toggle('favorites-open');
        document.getElementById('favorites-chevron').textContent = isOpen ? '\u25b2' : '\u25bc';
    });

    const saveBtnEl = document.getElementById('save-btn');
    saveBtnEl.addEventListener('click', () => {
        const newFav = {
            id: Date.now(),
            label: generateFavoriteLabel(),
            strengthLabel: STRENGTHS[state.strength].label,
            date: Date.now(),
            cupCount: state.cupCount,
            cups: state.cups.map((c) => ({ ...c })),
            strength: state.strength
        };
        const favs = loadFavorites();
        favs.unshift(newFav);
        if (favs.length > 20) favs.length = 20;
        saveFavorites(favs);
        renderFavoritesList();
        showToast('Przepis zapisany \u2b50');
        saveBtnEl.textContent = 'Zapisano \u2713';
        saveBtnEl.disabled = true;
        setTimeout(() => {
            saveBtnEl.textContent = 'Zapisz \u2b50';
            saveBtnEl.disabled = false;
        }, 2000);
    });

    // ========================
    // PWA
    // ========================

    let pwaInstallPrompt = null;
    const pwaInstallBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        pwaInstallPrompt = e;
        pwaInstallBtn.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
        pwaInstallPrompt = null;
        pwaInstallBtn.classList.add('hidden');
    });

    pwaInstallBtn.addEventListener('click', async () => {
        if (!pwaInstallPrompt) return;
        await pwaInstallPrompt.prompt();
        const { outcome } = await pwaInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            pwaInstallBtn.classList.add('hidden');
        }
        pwaInstallPrompt = null;
    });

    // ========================
    // INIT
    // ========================

    updateProgress(1, 4);
    renderFavoritesList();
})();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}
