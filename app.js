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
        cupCount: 1,
        cups: [{ size: 250, type: 'czarna' }],
        strength: 'medium'
    };

    const MAX_CUPS = 6;

    const STRENGTH_INFO = {
        weak: 'Łagodna i lekka, dobra na popołudnie',
        medium: 'Klasyczna, zbalansowana na co dzień',
        strong: 'Intensywna i pełna, dla miłośników mocy'
    };

    const COLORS = {
        coffee: '#4a2c1e',
        americano: '#7b4b30',
        milk: '#eedfc8',
        foam: '#fffaf1',
        weak: '#8c5d3f',
        medium: '#5a3524',
        strong: '#2c1a11'
    };

    // ========================
    // DOM REFS
    // ========================

    const $ = (id) => document.getElementById(id);
    const screens = {
        1: $('screen-1'),
        2: $('screen-2'),
        3: $('screen-3'),
        4: $('screen-4'),
        recipe: $('screen-recipe')
    };
    const dots = document.querySelectorAll('#dots .dot');
    const dotsNav = $('dots');
    const navBack = $('nav-back');
    const primaryBtn = $('primary-btn');
    const secondaryBtn = $('secondary-btn');
    const favoritesPanel = $('favorites-panel');
    const favoritesList = $('favorites-list');
    const favoritesCount = $('favorites-count');
    const toastEl = $('toast');

    let currentScreen = 1;

    // ========================
    // HELPERS
    // ========================

    const escapeHtml = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const pluralizeCups = (n) => {
        if (n === 1) return 'filiżanka';
        if (n >= 2 && n <= 4) return 'filiżanki';
        return 'filiżanek';
    };

    const syncCups = () => {
        while (state.cups.length < state.cupCount) {
            state.cups.push({ ...state.cups[state.cups.length - 1] || { size: 250, type: 'czarna' } });
        }
        state.cups.length = state.cupCount;
    };

    const restartAnim = (el, cls) => {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
    };

    // Rysunek filiżanki z warstwami (od dołu): [{ fraction, color }]
    let svgUid = 0;
    const cupSvg = (layers, { steam = false } = {}) => {
        const id = `cup${++svgUid}`;
        const top = 22;
        const bottom = 56;
        const fillMax = 0.9;
        let y = bottom;
        let rects = '';
        for (const layer of layers) {
            const h = (bottom - top) * fillMax * layer.fraction;
            y -= h;
            rects += `<rect x="0" y="${y.toFixed(2)}" width="64" height="${(h + 0.4).toFixed(2)}" fill="${layer.color}"/>`;
        }
        const steamPaths = steam
            ? '<g class="steam"><path d="M26 16c-3-4 3-6 0-10"/><path d="M33 16c-3-4 3-6 0-10"/><path d="M40 16c-3-4 3-6 0-10"/></g>'
            : '';
        return `<svg class="cup-svg" viewBox="0 0 72 64" aria-hidden="true">` +
            `<defs><clipPath id="${id}"><path d="M14 22h40l-3.5 28a7 7 0 0 1-7 6h-19a7 7 0 0 1-7-6z"/></clipPath></defs>` +
            `${steamPaths}<g clip-path="url(#${id})">${rects}</g>` +
            `<path class="cup-outline" d="M14 22h40l-3.5 28a7 7 0 0 1-7 6h-19a7 7 0 0 1-7-6z"/>` +
            `<path class="cup-outline" d="M53.4 28h3.6a6 6 0 0 1 0 12h-4.9"/>` +
            `<path class="cup-saucer" d="M8 60h52"/>` +
            `</svg>`;
    };

    const typeLayers = (key) => {
        const ct = COFFEE_TYPES[key];
        if (key === 'americano') return [{ fraction: 1, color: COLORS.americano }];
        const layers = [{ fraction: ct.baseFraction, color: COLORS.coffee }];
        if (ct.milk) layers.push({ fraction: ct.milk, color: COLORS.milk });
        if (ct.foam) layers.push({ fraction: ct.foam, color: COLORS.foam });
        return layers;
    };

    // ========================
    // NAVIGATION
    // ========================

    const SCREEN_ORDER = [1, 2, 3, 4, 'recipe'];

    const showScreen = (target) => {
        const from = SCREEN_ORDER.indexOf(currentScreen);
        const to = SCREEN_ORDER.indexOf(target);
        const dir = to >= from ? 'fwd' : 'back';
        currentScreen = target;

        for (const key of SCREEN_ORDER) {
            screens[key].classList.toggle('hidden', key !== target);
        }
        const el = screens[target];
        el.classList.remove('enter-fwd', 'enter-back');
        void el.offsetWidth;
        el.classList.add(`enter-${dir}`);

        const isRecipe = target === 'recipe';
        navBack.classList.toggle('invisible', target === 1);
        dotsNav.classList.toggle('hidden', isRecipe);
        dots.forEach((d, i) => {
            d.classList.toggle('active', i + 1 === target);
            d.classList.toggle('done', !isRecipe && i + 1 < target);
        });

        secondaryBtn.classList.toggle('hidden', !isRecipe);
        primaryBtn.disabled = false;
        if (isRecipe) {
            primaryBtn.textContent = 'Zapisz przepis';
        } else if (target === 4) {
            primaryBtn.textContent = 'Pokaż przepis';
        } else {
            primaryBtn.textContent = 'Dalej';
        }

        if (target === 1) renderFavoritesList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goNext = () => {
        if (currentScreen === 1) {
            syncCups();
            renderSizes();
            showScreen(2);
        } else if (currentScreen === 2) {
            renderTypes();
            showScreen(3);
        } else if (currentScreen === 3) {
            renderStrength();
            showScreen(4);
        } else if (currentScreen === 4) {
            openRecipe();
        } else {
            saveCurrentRecipe();
        }
    };

    const goBack = () => {
        if (currentScreen === 'recipe') {
            stopTimer();
            showScreen(4);
        } else if (currentScreen > 1) {
            showScreen(currentScreen - 1);
        }
    };

    primaryBtn.addEventListener('click', goNext);
    navBack.addEventListener('click', goBack);
    secondaryBtn.addEventListener('click', () => {
        stopTimer();
        showScreen(1);
    });

    // ========================
    // STEP 1: liczba filiżanek
    // ========================

    const countValue = $('count-value');
    const countLabel = $('count-label');
    const countIllus = $('count-illus');
    const countMinus = $('count-minus');
    const countPlus = $('count-plus');

    const renderCount = (animate) => {
        countValue.textContent = String(state.cupCount);
        countLabel.textContent = pluralizeCups(state.cupCount);
        countMinus.disabled = state.cupCount <= 1;
        countPlus.disabled = state.cupCount >= MAX_CUPS;

        const existing = countIllus.children.length;
        if (!animate || existing === 0) {
            countIllus.innerHTML = '';
            for (let i = 0; i < state.cupCount; i++) {
                countIllus.insertAdjacentHTML('beforeend',
                    `<span class="illus-cup">${cupSvg([{ fraction: 0.85, color: COLORS.coffee }], { steam: true })}</span>`);
            }
        } else if (state.cupCount > existing) {
            countIllus.insertAdjacentHTML('beforeend',
                `<span class="illus-cup pop-in">${cupSvg([{ fraction: 0.85, color: COLORS.coffee }], { steam: true })}</span>`);
        } else if (state.cupCount < existing) {
            countIllus.lastElementChild.remove();
        }
        countIllus.dataset.count = String(state.cupCount);
        restartAnim(countValue, 'bump');
    };

    countMinus.addEventListener('click', () => {
        if (state.cupCount > 1) {
            state.cupCount--;
            renderCount(true);
        }
    });

    countPlus.addEventListener('click', () => {
        if (state.cupCount < MAX_CUPS) {
            state.cupCount++;
            renderCount(true);
        }
    });

    const setGreeting = () => {
        const h = new Date().getHours();
        let text = 'Dobry wieczór';
        if (h >= 5 && h < 12) text = 'Dzień dobry';
        else if (h >= 12 && h < 18) text = 'Miłego popołudnia';
        $('greeting').textContent = text;
    };

    // ========================
    // STEP 2: pojemność
    // ========================

    const cupHeader = (c, extra) =>
        `<div class="cup-card-head"><span class="cup-index">${c + 1}</span>` +
        `<span class="cup-card-title">Filiżanka ${c + 1}</span>` +
        `${extra ? `<span class="cup-card-meta">${extra}</span>` : ''}</div>`;

    const bindChoice = (container, onPick) => {
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-value]');
            if (!btn || !container.contains(btn)) return;
            const group = btn.closest('.choice-row');
            group.querySelectorAll('button').forEach((b) => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
            });
            restartAnim(btn, 'pressed');
            onPick(Number(group.dataset.cup), btn.dataset.value, btn);
        });
    };

    const sizesContainer = $('sizes-container');

    const renderSizes = () => {
        let html = '';
        for (let c = 0; c < state.cupCount; c++) {
            html += `<div class="cup-card" style="--i:${c}">${cupHeader(c)}<div class="choice-row sizes" data-cup="${c}">`;
            for (const size of CUP_SIZES) {
                const active = state.cups[c].size === size;
                const scale = (0.62 + (size - 150) / 200 * 0.38).toFixed(2);
                html += `<button type="button" class="choice size-choice${active ? ' active' : ''}" data-value="${size}" aria-pressed="${active}">` +
                    `<span class="size-cup" style="--s:${scale}">${cupSvg([{ fraction: 0.8, color: COLORS.coffee }])}</span>` +
                    `<span class="choice-label">${size}<small>ml</small></span></button>`;
            }
            html += '</div></div>';
        }
        sizesContainer.innerHTML = html;
    };

    bindChoice(sizesContainer, (c, value) => {
        state.cups[c].size = parseInt(value, 10);
    });

    // ========================
    // STEP 3: rodzaj kawy
    // ========================

    const typesContainer = $('types-container');

    const renderTypes = () => {
        let html = '';
        for (let c = 0; c < state.cupCount; c++) {
            html += `<div class="cup-card" style="--i:${c}">${cupHeader(c, `${state.cups[c].size} ml`)}<div class="choice-row types" data-cup="${c}">`;
            for (const key of Object.keys(COFFEE_TYPES)) {
                const active = state.cups[c].type === key;
                html += `<button type="button" class="choice type-choice${active ? ' active' : ''}" data-value="${key}" aria-pressed="${active}">` +
                    `<span class="type-cup">${cupSvg(typeLayers(key))}</span>` +
                    `<span class="choice-label">${COFFEE_TYPES[key].label}</span></button>`;
            }
            html += '</div></div>';
        }
        typesContainer.innerHTML = html;
    };

    bindChoice(typesContainer, (c, value) => {
        state.cups[c].type = value;
    });

    // ========================
    // STEP 4: moc
    // ========================

    const strengthGroup = $('strength-group');

    const renderStrength = () => {
        let html = '<div class="choice-row strengths" data-cup="0">';
        Object.keys(STRENGTHS).forEach((key, i) => {
            const s = STRENGTHS[key];
            const active = state.strength === key;
            html += `<button type="button" class="choice strength-choice${active ? ' active' : ''}" data-value="${key}" aria-pressed="${active}" style="--i:${i}">` +
                `<span class="strength-cup">${cupSvg([{ fraction: 0.85, color: COLORS[key] }])}</span>` +
                `<span class="strength-text"><span class="strength-name">${s.label}</span>` +
                `<span class="strength-desc">${STRENGTH_INFO[key]}</span>` +
                `<span class="strength-meta">1:${s.ratio} · ${s.brewTime} min</span></span>` +
                `<span class="radio" aria-hidden="true"></span></button>`;
        });
        html += '</div>';
        strengthGroup.innerHTML = html;
    };

    bindChoice(strengthGroup, (_c, value) => {
        state.strength = value;
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
            temperature: '93–96',
            brewTime: strength.brewTime,
            strengthLabel: strength.label
        };
    };

    const generateSteps = (recipe) => {
        const steps = [];
        const needsMilk = (recipe.totalMilk + recipe.totalFoam) > 0;
        const totalMilkMl = recipe.totalMilk + recipe.totalFoam;

        let bloomWater = recipe.coffeeGrams * 2;
        if (bloomWater > recipe.totalBaseWater * 0.3) {
            bloomWater = Math.round(recipe.totalBaseWater * 0.3);
        }
        const restWater = recipe.totalBaseWater - bloomWater;

        steps.push(`Zagotuj wodę i odstaw na ok. 1 minutę (do ${recipe.temperature}°C)`);

        if (needsMilk) {
            steps.push(
                `Odmierz ${recipe.coffeeGrams} g kawy grubo mielonej — ` +
                `jednocześnie podgrzej ${totalMilkMl} ml mleka do ok. 60°C (nie gotuj!)`
            );
        } else {
            steps.push(`Odmierz ${recipe.coffeeGrams} g kawy grubo mielonej`);
        }

        steps.push('Wsyp kawę do French Pressa');

        steps.push(
            `Zalej ${bloomWater} ml wody i odczekaj 30 sek — to blooming, ` +
            `uwalnia CO₂ z kawy i poprawia ekstrakcję`
        );

        steps.push(`Dolej pozostałe ${restWater} ml wody`);
        steps.push('Zamieszaj delikatnie');
        steps.push(`Załóż tłok (nie wciskaj) i odczekaj ${recipe.brewTime} min`);
        steps.push('Powoli wciśnij tłok do dna');

        if (!needsMilk) {
            if (recipe.cups.length === 1) {
                const cup = recipe.cups[0];
                if (cup.type === 'czarna') {
                    steps.push('Przelej kawę do filiżanki');
                } else {
                    steps.push(
                        `Przelej ${cup.baseMl} ml kawy do filiżanki i dolej ` +
                        `${cup.waterMl} ml gorącej wody`
                    );
                }
            } else {
                for (const c of recipe.cups) {
                    let line = `Filiżanka ${c.index} (${c.typeLabel}): przelej ${c.baseMl} ml bazy`;
                    if (c.waterMl > 0) line += ` + dolej ${c.waterMl} ml gorącej wody`;
                    steps.push(line);
                }
            }
        } else {
            if (recipe.cups.length === 1) {
                const cup = recipe.cups[0];
                steps.push(`Przelej ${cup.baseMl} ml kawy do filiżanki`);
            } else {
                const pourParts = recipe.cups.map((c) => {
                    let part = `fil. ${c.index}: ${c.baseMl} ml`;
                    if (c.waterMl > 0) part += ` + ${c.waterMl} ml wody`;
                    return part;
                });
                steps.push(`Rozlej bazę kawy do filiżanek — ${pourParts.join(', ')}`);
            }

            steps.push(
                'Przelej podgrzane mleko do French Pressa (max do połowy) ' +
                'i energicznie pompuj tłokiem przez 10–15 sek, aż mleko podwoi objętość'
            );

            if (recipe.cups.length === 1) {
                const cup = recipe.cups[0];
                let milkLine = 'Dodaj do filiżanki';
                if (cup.milkMl > 0) milkLine += ` ${cup.milkMl} ml spienionego mleka`;
                if (cup.foamMl > 0) milkLine += `${cup.milkMl > 0 ? ' i ' : ' '}${cup.foamMl} ml pianki`;
                steps.push(milkLine);
            } else {
                for (const c of recipe.cups) {
                    if (c.milkMl > 0 || c.foamMl > 0) {
                        let line = `Filiżanka ${c.index} (${c.typeLabel}): dodaj`;
                        if (c.milkMl > 0) line += ` ${c.milkMl} ml mleka`;
                        if (c.foamMl > 0) line += `${c.milkMl > 0 ? ' i ' : ' '}${c.foamMl} ml pianki`;
                        steps.push(line);
                    }
                }
            }
        }

        steps.push('Gotowe — smacznej kawy! ☕');
        return steps;
    };

    // ========================
    // RECIPE VIEW
    // ========================

    const tabs = document.querySelectorAll('.tab');
    const tabIndicator = $('tab-indicator');

    const selectTab = (name) => {
        tabs.forEach((t) => {
            const on = t.dataset.tab === name;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
            if (on) {
                tabIndicator.style.width = `${t.offsetWidth}px`;
                tabIndicator.style.transform = `translateX(${t.offsetLeft}px)`;
            }
        });
        document.querySelectorAll('.tab-panel').forEach((p) => {
            const on = p.dataset.panel === name;
            p.classList.toggle('hidden', !on);
            if (on) restartAnim(p, 'panel-in');
        });
    };

    tabs.forEach((t) => t.addEventListener('click', () => selectTab(t.dataset.tab)));
    window.addEventListener('resize', () => {
        const active = document.querySelector('.tab.active');
        if (active && currentScreen === 'recipe') selectTab(active.dataset.tab);
    });

    const countUp = (el, target) => {
        const start = performance.now();
        const dur = 700;
        const step = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = String(Math.round(target * eased));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const renderHero = (recipe) => {
        const first = state.cups[0].type;
        $('hero-illus').innerHTML = cupSvg(typeLayers(first), { steam: true });
        countUp($('stat-coffee'), recipe.coffeeGrams);
        countUp($('stat-water'), recipe.totalBaseWater);

        const chips = [
            `<span class="chip">🌡 ${recipe.temperature}°C</span>`,
            `<span class="chip">⏱ ${recipe.brewTime} min</span>`,
            `<span class="chip">${recipe.strengthLabel}</span>`
        ];
        if (recipe.totalMilk + recipe.totalFoam > 0) {
            chips.push(`<span class="chip">🥛 ${recipe.totalMilk + recipe.totalFoam} ml mleka</span>`);
        }
        if (recipe.totalExtraWater > 0) {
            chips.push(`<span class="chip">💧 +${recipe.totalExtraWater} ml wody</span>`);
        }
        $('recipe-chips').innerHTML = chips.join('');
    };

    const renderBreakdown = (recipe) => {
        const el = $('recipe-breakdown');
        const needs = recipe.cups.length > 1 || recipe.cups.some((c) => c.type !== 'czarna');
        el.classList.toggle('hidden', !needs);
        if (!needs) return;

        el.innerHTML = recipe.cups.map((cup) => {
            const parts = [`${cup.baseMl} ml kawy`];
            if (cup.waterMl) parts.push(`${cup.waterMl} ml wody`);
            if (cup.milkMl) parts.push(`${cup.milkMl} ml mleka`);
            if (cup.foamMl) parts.push(`${cup.foamMl} ml pianki`);
            return `<div class="breakdown-item">` +
                `<span class="breakdown-cup">${cupSvg(typeLayers(cup.type))}</span>` +
                `<span class="breakdown-text"><span><strong>${cup.typeLabel}</strong> · ${cup.size} ml</span>` +
                `<small>${parts.join(' · ')}</small></span></div>`;
        }).join('');
    };

    const stepsProgressEl = $('steps-progress');

    const updateStepsProgress = () => {
        const all = document.querySelectorAll('#steps-list li');
        const done = document.querySelectorAll('#steps-list li.done');
        stepsProgressEl.textContent = `${done.length}/${all.length}`;
        stepsProgressEl.classList.toggle('complete', all.length > 0 && done.length === all.length);
    };

    const renderSteps = (stepsArr) => {
        const el = $('steps-list');
        el.innerHTML = stepsArr.map((text, i) =>
            `<li style="--i:${i}"><span class="step-check" aria-hidden="true"></span>` +
            `<span class="step-text">${text}</span></li>`).join('');
        el.querySelectorAll('li').forEach((li) => {
            li.addEventListener('click', () => {
                li.classList.toggle('done');
                updateStepsProgress();
            });
        });
        updateStepsProgress();
    };

    const renderTips = (recipe) => {
        const needsMilk = (recipe.totalMilk + recipe.totalFoam) > 0;

        const tips = [
            {
                cls: 'bloom',
                icon: '\uD83E\uDEE7',
                title: 'Blooming',
                text: 'Zalewanie kawy niewielką ilością wody uwalnia CO₂ uwięziony ' +
                      'podczas palenia ziaren. Jeśli widzisz bąbelki na powierzchni — Twoja ' +
                      'kawa jest świeża! Blooming poprawia ekstrakcję i daje pełniejszy smak.'
            },
            {
                cls: 'temp',
                icon: '\uD83C\uDF21\uFE0F',
                title: 'Temperatura',
                text: 'Optymalna temperatura parzenia to 93–96°C. Wrzątek parzy kawę ' +
                      'zbyt intensywnie (gorzki smak), a za zimna woda da słabą, ' +
                      'kwaśną ekstrakcję. Wystarczy odczekać ok. 1 min po zagotowaniu.'
            }
        ];

        if (needsMilk) {
            tips.push({
                cls: 'milk',
                icon: '\uD83E\uDD5B',
                title: 'Spienianie mleka',
                text: 'French Press świetnie sprawdza się jako spieniacz! Podgrzej mleko ' +
                      'do ok. 60°C (nie gotuj — powyżej 70°C białka się rozpadają), ' +
                      'przelej do prasy max do połowy i energicznie pompuj tłokiem. ' +
                      'Mleko podwoi objętość w 10–15 sekund.'
            });
        }

        tips.push({
            cls: 'grind',
            icon: '⚙',
            title: 'Stopień mielenia',
            text: 'Do French Pressa używaj grubo mielonej kawy (jak gruby piasek). ' +
                  'Zbyt drobne mielenie sprawi, że kawa przejdzie przez filtr siatkowy ' +
                  'i napój będzie mętny i przeparzony.'
        });

        $('recipe-tips').innerHTML = tips.map((t, i) =>
            `<details class="tip"${i === 0 ? ' open' : ''}>` +
            `<summary><span class="tip-icon">${t.icon}</span><span class="tip-title">${t.title}</span></summary>` +
            `<p>${t.text}</p></details>`).join('');
    };

    const openRecipe = () => {
        const recipe = calculateRecipe();
        renderHero(recipe);
        renderBreakdown(recipe);
        renderSteps(generateSteps(recipe));
        renderTips(recipe);
        initTimer(recipe);
        showScreen('recipe');
        requestAnimationFrame(() => selectTab('steps'));
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
        brewSeconds: 0,
        phaseEndsAt: 0
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

    let audioCtx = null;
    const timerBeep = () => {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const beep = (freq, startTime, duration) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            const now = audioCtx.currentTime;
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
                timer.phaseEndsAt = Date.now() + timer.brewSeconds * 1000;
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
        // Liczymy od zapisanej godziny końca fazy, bo setInterval zwalnia przy zablokowanym ekranie
        timer.secondsLeft = Math.max(0, Math.ceil((timer.phaseEndsAt - Date.now()) / 1000));
        updateTimerDisplay();
    };

    const startTimer = () => {
        if (timer.phase === 'done') return;
        timer.running = true;
        timerEls.startBtn.textContent = 'Pauza';
        timer.phaseEndsAt = Date.now() + timer.secondsLeft * 1000;
        timer.intervalId = setInterval(tickTimer, 250);
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
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
        } catch {
            showToast('Nie udało się zapisać przepisów');
        }
    };

    const generateFavoriteLabel = () => {
        if (state.cupCount === 1) {
            const c = state.cups[0];
            return `${COFFEE_TYPES[c.type].icon} ${COFFEE_TYPES[c.type].label} · ${c.size} ml`;
        }
        const icons = state.cups.map((c) => COFFEE_TYPES[c.type].icon).join('');
        const uniqueTypes = [...new Set(state.cups.map((c) => COFFEE_TYPES[c.type].label))];
        const summary = uniqueTypes.length === 1 ? uniqueTypes[0] : `${state.cupCount} ${pluralizeCups(state.cupCount)}`;
        return `${icons} ${summary}`;
    };

    const formatFavDate = (ts) => new Date(ts).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short'
    });

    let toastTimer = null;
    let lastDeletedFav = null;

    const showToast = (msg) => {
        toastEl.textContent = msg;
        toastEl.classList.add('toast-show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('toast-show'), 2500);
    };

    const showUndoToast = (msg, onUndo) => {
        if (toastTimer) clearTimeout(toastTimer);
        toastEl.innerHTML =
            `<span>${escapeHtml(msg)}</span>` +
            `<button type="button" class="toast-undo-btn">Cofnij</button>`;
        toastEl.classList.add('toast-show');
        toastEl.querySelector('.toast-undo-btn').addEventListener('click', () => {
            clearTimeout(toastTimer);
            toastEl.classList.remove('toast-show');
            onUndo();
        });
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('toast-show');
        }, 5000);
    };

    const isSameRecipe = (fav) =>
        fav.strength === state.strength &&
        fav.cupCount === state.cupCount &&
        fav.cups.every((c, i) => state.cups[i] && c.type === state.cups[i].type && c.size === state.cups[i].size);

    const deleteFavorite = (id) => {
        const favs = loadFavorites();
        const idx = favs.findIndex((f) => f.id === id);
        if (idx === -1) return;
        lastDeletedFav = { fav: { ...favs[idx] }, idx };
        saveFavorites(favs.filter((f) => f.id !== id));
        renderFavoritesList();
        showUndoToast(`Usunięto „${lastDeletedFav.fav.label}"`, () => {
            const current = loadFavorites();
            current.splice(lastDeletedFav.idx, 0, lastDeletedFav.fav);
            saveFavorites(current);
            lastDeletedFav = null;
            renderFavoritesList();
        });
    };

    const loadFavoriteToState = (fav) => {
        state.cupCount = fav.cupCount;
        state.cups = fav.cups.map((c) => ({ ...c }));
        state.strength = fav.strength;
        renderCount(false);
        openRecipe();
    };

    const startEditFavName = (labelEl, id) => {
        const fav = loadFavorites().find((f) => f.id === id);
        if (!fav) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = fav.label;
        input.className = 'fav-name-input';
        input.maxLength = 50;
        labelEl.replaceWith(input);
        input.focus();
        input.select();

        let committed = false;

        const confirm = () => {
            if (committed) return;
            committed = true;
            const newLabel = input.value.trim() || fav.label;
            const updated = loadFavorites().map((f) => f.id === id ? { ...f, label: newLabel } : f);
            saveFavorites(updated);
            renderFavoritesList();
        };

        const cancel = () => {
            if (committed) return;
            committed = true;
            renderFavoritesList();
        };

        input.addEventListener('blur', confirm);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.removeEventListener('blur', confirm);
                confirm();
            }
            if (e.key === 'Escape') {
                input.removeEventListener('blur', confirm);
                cancel();
            }
        });
    };

    const renderFavoritesList = () => {
        const favs = loadFavorites();
        favoritesPanel.classList.toggle('hidden', favs.length === 0);
        if (favs.length === 0) return;

        favoritesCount.textContent = String(favs.length);
        favoritesList.innerHTML = favs.map((fav) =>
            `<div class="fav-item">` +
                `<span class="fav-cup">${cupSvg(typeLayers(fav.cups[0] ? fav.cups[0].type : 'czarna'))}</span>` +
                `<div class="fav-info">` +
                    `<div class="fav-label" data-id="${fav.id}" title="Kliknij, aby zmienić nazwę">${escapeHtml(fav.label)}</div>` +
                    `<div class="fav-meta">${escapeHtml(fav.strengthLabel)} · ${formatFavDate(fav.date)}</div>` +
                `</div>` +
                `<button type="button" class="fav-load" data-id="${fav.id}">Parz</button>` +
                `<button type="button" class="fav-del" data-id="${fav.id}" aria-label="Usuń">✕</button>` +
            `</div>`).join('');

        favoritesList.querySelectorAll('.fav-load').forEach((btn) => {
            btn.addEventListener('click', () => {
                const fav = loadFavorites().find((f) => f.id === Number(btn.dataset.id));
                if (fav) loadFavoriteToState(fav);
            });
        });
        favoritesList.querySelectorAll('.fav-del').forEach((btn) => {
            btn.addEventListener('click', () => deleteFavorite(Number(btn.dataset.id)));
        });
        favoritesList.querySelectorAll('.fav-label').forEach((el) => {
            el.addEventListener('click', () => startEditFavName(el, Number(el.dataset.id)));
        });
    };

    const saveCurrentRecipe = () => {
        if (loadFavorites().some(isSameRecipe)) {
            showToast('Ten przepis jest już zapisany');
            return;
        }
        const favs = loadFavorites();
        favs.unshift({
            id: Date.now(),
            label: generateFavoriteLabel(),
            strengthLabel: STRENGTHS[state.strength].label,
            date: Date.now(),
            cupCount: state.cupCount,
            cups: state.cups.map((c) => ({ ...c })),
            strength: state.strength
        });
        if (favs.length > 20) favs.length = 20;
        saveFavorites(favs);
        showToast('Zapisano w ulubionych');
        primaryBtn.textContent = 'Zapisano ✓';
        primaryBtn.disabled = true;
        setTimeout(() => {
            if (currentScreen === 'recipe') {
                primaryBtn.textContent = 'Zapisz przepis';
                primaryBtn.disabled = false;
            }
        }, 2000);
    };

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

    // iOS Safari — brak beforeinstallprompt, pokazujemy ręczną instrukcję
    // iPadOS 13+ przedstawia się jako Macintosh, rozpoznajemy go po ekranie dotykowym
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const isStandalone = navigator.standalone === true;
    const iosBannerDismissed = sessionStorage.getItem('ios_banner_dismissed');
    if (isIos && !isStandalone && !iosBannerDismissed) {
        document.getElementById('ios-install-banner').classList.remove('hidden');
    }
    document.getElementById('ios-banner-close').addEventListener('click', () => {
        document.getElementById('ios-install-banner').classList.add('hidden');
        sessionStorage.setItem('ios_banner_dismissed', '1');
    });

    // ========================
    // THEME
    // ========================

    const THEME_KEY = 'kawusiomat_theme';
    const themeToggleBtn = $('theme-toggle-btn');
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    const updateThemeBtn = () => {
        const isModern = document.documentElement.getAttribute('data-theme') === 'modern';
        themeColorMeta.setAttribute('content', isModern ? '#f2f2f2' : '#f7f1e8');
        themeToggleBtn.title = isModern
            ? 'Motyw: Nowoczesny. Kliknij, aby przełączyć na Ciepły'
            : 'Motyw: Ciepły. Kliknij, aby przełączyć na Nowoczesny';
    };

    themeToggleBtn.addEventListener('click', () => {
        const isModern = document.documentElement.getAttribute('data-theme') === 'modern';
        try {
            if (isModern) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem(THEME_KEY, 'classic');
            } else {
                document.documentElement.setAttribute('data-theme', 'modern');
                localStorage.setItem(THEME_KEY, 'modern');
            }
        } catch {
            // brak dostępu do localStorage
        }
        updateThemeBtn();
    });

    // ========================
    // INIT
    // ========================

    setGreeting();
    updateThemeBtn();
    renderCount(false);
    showScreen(1);
})();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}
