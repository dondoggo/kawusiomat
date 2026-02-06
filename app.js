(function () {
    'use strict';

    // ========================
    // CONFIG
    // ========================

    var COFFEE_TYPES = {
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

    var STRENGTHS = {
        weak:   { label: 'Słaba',   ratio: 16, brewTime: 3 },
        medium: { label: 'Średnia', ratio: 14, brewTime: 4 },
        strong: { label: 'Mocna',   ratio: 12, brewTime: 5 }
    };

    var CUP_SIZES = [150, 200, 250, 300, 350];

    // ========================
    // STATE
    // ========================

    var state = {
        currentStep: 1,
        cupCount: 1,
        cups: [{ size: 250, type: 'czarna' }],
        strength: 'medium'
    };

    // ========================
    // DOM REFS
    // ========================

    var stepSections = {};
    for (var i = 1; i <= 4; i++) {
        stepSections[i] = document.getElementById('step-' + i);
    }
    var recipeSection = document.getElementById('recipe-section');
    var progressFill = document.getElementById('progress-fill');
    var progressDots = document.querySelectorAll('.progress-dot');
    var wizardProgress = document.getElementById('wizard-progress');

    // ========================
    // PROGRESS BAR
    // ========================

    function updateProgress(step, total) {
        var pct = (step / total) * 100;
        progressFill.style.width = pct + '%';

        for (var d = 0; d < progressDots.length; d++) {
            var dotStep = d + 1;
            if (dotStep < step) {
                progressDots[d].className = 'progress-dot done';
            } else if (dotStep === step) {
                progressDots[d].className = 'progress-dot current';
            } else {
                progressDots[d].className = 'progress-dot';
            }
        }
    }

    // ========================
    // NAVIGATION
    // ========================

    function showStep(stepNum) {
        state.currentStep = stepNum;
        for (var s = 1; s <= 4; s++) {
            stepSections[s].classList.toggle('hidden', s !== stepNum);
        }
        recipeSection.classList.add('hidden');
        wizardProgress.classList.remove('hidden');
        updateProgress(stepNum, 4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showRecipe() {
        for (var s = 1; s <= 4; s++) {
            stepSections[s].classList.add('hidden');
        }
        recipeSection.classList.remove('hidden');
        wizardProgress.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========================
    // HELPERS
    // ========================

    function syncCups() {
        while (state.cups.length < state.cupCount) {
            state.cups.push({ size: 250, type: 'czarna' });
        }
        state.cups.length = state.cupCount;
    }

    function setupStaticGroup(groupEl, stateKey, parser) {
        groupEl.addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn || !groupEl.contains(btn)) return;
            groupEl.querySelectorAll('button').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            state[stateKey] = parser ? parser(btn.dataset.value) : btn.dataset.value;
        });
    }

    // ========================
    // STEP 1 — Cup count
    // ========================

    setupStaticGroup(
        document.getElementById('cup-count-group'),
        'cupCount',
        function (v) { return parseInt(v, 10); }
    );

    document.getElementById('next-1').addEventListener('click', function () {
        syncCups();
        renderCupSizes();
        showStep(2);
    });

    // ========================
    // STEP 2 — Cup sizes
    // ========================

    function renderCupSizes() {
        var container = document.getElementById('cup-sizes-container');
        container.innerHTML = '';

        for (var c = 0; c < state.cupCount; c++) {
            var card = document.createElement('div');
            card.className = 'cup-config';

            var title = document.createElement('h3');
            title.textContent = 'Filiżanka ' + (c + 1);
            card.appendChild(title);

            var group = document.createElement('div');
            group.className = 'button-group';

            for (var s = 0; s < CUP_SIZES.length; s++) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.value = CUP_SIZES[s];
                btn.textContent = CUP_SIZES[s] + ' ml';
                if (state.cups[c].size === CUP_SIZES[s]) {
                    btn.classList.add('active');
                }
                group.appendChild(btn);
            }

            (function (idx) {
                group.addEventListener('click', function (e) {
                    var b = e.target.closest('button');
                    if (!b) return;
                    group.querySelectorAll('button').forEach(function (x) {
                        x.classList.remove('active');
                    });
                    b.classList.add('active');
                    state.cups[idx].size = parseInt(b.dataset.value, 10);
                });
            })(c);

            card.appendChild(group);
            container.appendChild(card);
        }
    }

    document.getElementById('back-2').addEventListener('click', function () {
        showStep(1);
    });
    document.getElementById('next-2').addEventListener('click', function () {
        renderCupTypes();
        showStep(3);
    });

    // ========================
    // STEP 3 — Coffee types
    // ========================

    function renderCupTypes() {
        var container = document.getElementById('cup-types-container');
        container.innerHTML = '';

        var typeKeys = Object.keys(COFFEE_TYPES);

        for (var c = 0; c < state.cupCount; c++) {
            var card = document.createElement('div');
            card.className = 'cup-config';

            var title = document.createElement('h3');
            title.textContent = 'Filiżanka ' + (c + 1) + ' (' + state.cups[c].size + ' ml)';
            card.appendChild(title);

            var group = document.createElement('div');
            group.className = 'button-group coffee-type';

            for (var t = 0; t < typeKeys.length; t++) {
                var key = typeKeys[t];
                var ct = COFFEE_TYPES[key];
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.value = key;
                btn.innerHTML =
                    '<span class="type-icon">' + ct.icon + '</span>' +
                    '<span class="type-name">' + ct.label + '</span>';
                if (state.cups[c].type === key) {
                    btn.classList.add('active');
                }
                group.appendChild(btn);
            }

            (function (idx) {
                group.addEventListener('click', function (e) {
                    var b = e.target.closest('button');
                    if (!b) return;
                    group.querySelectorAll('button').forEach(function (x) {
                        x.classList.remove('active');
                    });
                    b.classList.add('active');
                    state.cups[idx].type = b.dataset.value;
                });
            })(c);

            card.appendChild(group);
            container.appendChild(card);
        }
    }

    document.getElementById('back-3').addEventListener('click', function () {
        showStep(2);
    });
    document.getElementById('next-3').addEventListener('click', function () {
        showStep(4);
    });

    // ========================
    // STEP 4 — Strength
    // ========================

    setupStaticGroup(document.getElementById('strength-group'), 'strength');

    document.getElementById('back-4').addEventListener('click', function () {
        showStep(3);
    });
    document.getElementById('brew-btn').addEventListener('click', function () {
        var recipe = calculateRecipe();
        renderRecipe(recipe);
        showRecipe();
    });

    // ========================
    // RECIPE CALCULATION
    // ========================

    function calculateRecipe() {
        var strength = STRENGTHS[state.strength];
        var cupsData = [];
        var totalBase = 0;
        var totalMilk = 0;
        var totalFoam = 0;
        var totalExtraWater = 0;

        for (var c = 0; c < state.cupCount; c++) {
            var cup = state.cups[c];
            var ct = COFFEE_TYPES[cup.type];

            var baseMl = Math.round(cup.size * ct.baseFraction);
            var milkMl = Math.round(cup.size * ct.milk);
            var foamMl = Math.round(cup.size * ct.foam);
            var waterMl = Math.round(cup.size * ct.water);

            cupsData.push({
                index: c + 1,
                size: cup.size,
                type: cup.type,
                typeLabel: ct.label,
                typeIcon: ct.icon,
                baseMl: baseMl,
                milkMl: milkMl,
                foamMl: foamMl,
                waterMl: waterMl
            });

            totalBase += baseMl;
            totalMilk += milkMl;
            totalFoam += foamMl;
            totalExtraWater += waterMl;
        }

        var coffeeGrams = Math.round(totalBase / strength.ratio);

        return {
            cups: cupsData,
            totalBaseWater: totalBase,
            coffeeGrams: coffeeGrams,
            totalMilk: totalMilk,
            totalFoam: totalFoam,
            totalExtraWater: totalExtraWater,
            temperature: '93–96',
            brewTime: strength.brewTime,
            strengthLabel: strength.label
        };
    }

    // ========================
    // RENDER RECIPE
    // ========================

    function renderRecipe(recipe) {
        renderSummary(recipe);
        renderBreakdown(recipe);
        renderSteps(generateSteps(recipe));
        renderTips(recipe);
    }

    function renderSummary(recipe) {
        var el = document.getElementById('recipe-summary');
        var html =
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.coffeeGrams + ' g</span>' +
                '<span class="summary-label">Kawa mielona</span>' +
            '</div>' +
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.totalBaseWater + ' ml</span>' +
                '<span class="summary-label">Woda do zaparzenia</span>' +
            '</div>' +
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.temperature + '°C</span>' +
                '<span class="summary-label">Temperatura</span>' +
            '</div>' +
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.brewTime + ' min</span>' +
                '<span class="summary-label">Czas parzenia</span>' +
            '</div>';

        if (recipe.totalMilk + recipe.totalFoam > 0) {
            html +=
                '<div class="summary-item">' +
                    '<span class="summary-value">' + (recipe.totalMilk + recipe.totalFoam) + ' ml</span>' +
                    '<span class="summary-label">Mleko łącznie</span>' +
                '</div>';
        }

        if (recipe.totalExtraWater > 0) {
            html +=
                '<div class="summary-item">' +
                    '<span class="summary-value">' + recipe.totalExtraWater + ' ml</span>' +
                    '<span class="summary-label">Dodatkowa woda</span>' +
                '</div>';
        }

        el.innerHTML = html;
    }

    function renderBreakdown(recipe) {
        var section = document.getElementById('recipe-breakdown');
        var content = section.querySelector('.breakdown-content');

        // Show breakdown when more than 1 cup or when drink isn't plain black
        var needsBreakdown = state.cupCount > 1;
        if (!needsBreakdown) {
            for (var c = 0; c < recipe.cups.length; c++) {
                if (recipe.cups[c].type !== 'czarna') {
                    needsBreakdown = true;
                    break;
                }
            }
        }

        if (!needsBreakdown) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        var html = '';
        for (var i = 0; i < recipe.cups.length; i++) {
            var cup = recipe.cups[i];
            html +=
                '<div class="cup-breakdown">' +
                    '<div class="cup-breakdown-header">' +
                        '<span class="cup-num">' + cup.typeIcon + '</span>' +
                        '<span>Filiżanka ' + cup.index + ' — ' + cup.typeLabel + ' (' + cup.size + ' ml)</span>' +
                    '</div>' +
                    '<div class="cup-breakdown-details">' +
                        '<span class="detail-chip base">' + cup.baseMl + ' ml bazy</span>';

            if (cup.milkMl > 0) {
                html += '<span class="detail-chip milk">' + cup.milkMl + ' ml mleka</span>';
            }
            if (cup.foamMl > 0) {
                html += '<span class="detail-chip foam">' + cup.foamMl + ' ml pianki</span>';
            }
            if (cup.waterMl > 0) {
                html += '<span class="detail-chip water">' + cup.waterMl + ' ml wody</span>';
            }

            html +=
                    '</div>' +
                '</div>';
        }

        content.innerHTML = html;
    }

    // ========================
    // STEPS
    // ========================

    function generateSteps(recipe) {
        var steps = [];
        var needsMilk = (recipe.totalMilk + recipe.totalFoam) > 0;
        var totalMilkMl = recipe.totalMilk + recipe.totalFoam;

        // Blooming: 2x coffee grams in ml, but cap at 30% of total water
        var bloomWater = recipe.coffeeGrams * 2;
        if (bloomWater > recipe.totalBaseWater * 0.3) {
            bloomWater = Math.round(recipe.totalBaseWater * 0.3);
        }
        var restWater = recipe.totalBaseWater - bloomWater;

        // 1. Boil water
        steps.push('Zagotuj wodę i odstaw na ok. 1 minutę (do ' + recipe.temperature + '°C)');

        // 2. Measure coffee (+ heat milk if needed)
        if (needsMilk) {
            steps.push(
                'Odmierz ' + recipe.coffeeGrams + ' g kawy grubo mielonej — ' +
                'jednocześnie podgrzej ' + totalMilkMl + ' ml mleka do ok. 60°C (nie gotuj!)'
            );
        } else {
            steps.push('Odmierz ' + recipe.coffeeGrams + ' g kawy grubo mielonej');
        }

        // 3. Add coffee
        steps.push('Wsyp kawę do French Pressa');

        // 4. Blooming
        steps.push(
            'Zalej ' + bloomWater + ' ml wody i odczekaj 30 sek — to blooming, ' +
            'uwalnia CO\u2082 z kawy i poprawia ekstrakcję'
        );

        // 5. Rest of water
        steps.push('Dolej pozostałe ' + restWater + ' ml wody');

        // 6. Stir
        steps.push('Zamieszaj delikatnie');

        // 7. Brew
        steps.push('Załóż tłok (nie wciskaj) i odczekaj ' + recipe.brewTime + ' min');

        // 8. Press
        steps.push('Powoli wciśnij tłok do dna');

        // 9+. Distribution
        if (!needsMilk) {
            // No milk — pour directly
            if (state.cupCount === 1) {
                var cup = recipe.cups[0];
                if (cup.type === 'czarna') {
                    steps.push('Przelej kawę do filiżanki');
                } else {
                    steps.push(
                        'Przelej ' + cup.baseMl + ' ml kawy do filiżanki i dolej ' +
                        cup.waterMl + ' ml gorącej wody'
                    );
                }
            } else {
                for (var i = 0; i < recipe.cups.length; i++) {
                    var c = recipe.cups[i];
                    var line = 'Filiżanka ' + c.index + ' (' + c.typeLabel + '): przelej ' + c.baseMl + ' ml bazy';
                    if (c.waterMl > 0) line += ' + dolej ' + c.waterMl + ' ml gorącej wody';
                    steps.push(line);
                }
            }
        } else {
            // Milk needed — pour coffee out, then froth milk in the press

            // Pour base into cups
            if (state.cupCount === 1) {
                var cup = recipe.cups[0];
                steps.push('Przelej ' + cup.baseMl + ' ml kawy do filiżanki');
            } else {
                var pourParts = [];
                for (var i = 0; i < recipe.cups.length; i++) {
                    var c = recipe.cups[i];
                    var part = 'fil. ' + c.index + ': ' + c.baseMl + ' ml';
                    if (c.waterMl > 0) part += ' + ' + c.waterMl + ' ml wody';
                    pourParts.push(part);
                }
                steps.push('Rozlej bazę kawy do filiżanek — ' + pourParts.join(', '));
            }

            // Froth milk in French Press
            steps.push(
                'Przelej podgrzane mleko do French Pressa (max do połowy) ' +
                'i energicznie pompuj tłokiem przez 10–15 sek, aż mleko podwoi objętość'
            );

            // Add frothed milk to cups
            if (state.cupCount === 1) {
                var cup = recipe.cups[0];
                var milkLine = 'Dodaj do filiżanki';
                if (cup.milkMl > 0) milkLine += ' ' + cup.milkMl + ' ml spieninego mleka';
                if (cup.foamMl > 0) milkLine += (cup.milkMl > 0 ? ' i ' : ' ') + cup.foamMl + ' ml pianki';
                steps.push(milkLine);
            } else {
                for (var i = 0; i < recipe.cups.length; i++) {
                    var c = recipe.cups[i];
                    if (c.milkMl > 0 || c.foamMl > 0) {
                        var line = 'Filiżanka ' + c.index + ' (' + c.typeLabel + '): dodaj';
                        if (c.milkMl > 0) line += ' ' + c.milkMl + ' ml mleka';
                        if (c.foamMl > 0) line += (c.milkMl > 0 ? ' i ' : ' ') + c.foamMl + ' ml pianki';
                        steps.push(line);
                    }
                }
            }
        }

        steps.push('Gotowe — smacznej kawy! ☕');
        return steps;
    }

    function renderSteps(stepsArr) {
        var el = document.getElementById('steps-list');
        el.innerHTML = '';

        for (var i = 0; i < stepsArr.length; i++) {
            var li = document.createElement('li');
            li.innerHTML =
                '<span class="step-checkbox"></span>' +
                '<span class="step-text">' + stepsArr[i] + '</span>';

            li.addEventListener('click', function () {
                this.classList.toggle('done');
            });

            el.appendChild(li);
        }
    }

    // ========================
    // INFO TIPS
    // ========================

    function renderTips(recipe) {
        var el = document.getElementById('recipe-tips');
        var needsMilk = (recipe.totalMilk + recipe.totalFoam) > 0;

        var tips = [
            {
                cls: 'bloom',
                icon: '🫧',
                title: 'Blooming',
                text: 'Zalewanie kawy niewielką ilością wody uwalnia CO\u2082 uwięziony ' +
                      'podczas palenia ziaren. Jeśli widzisz bąbelki na powierzchni — Twoja ' +
                      'kawa jest świeża! Blooming poprawia ekstrakcję i daje pełniejszy smak.'
            },
            {
                cls: 'temp',
                icon: '🌡️',
                title: 'Temperatura',
                text: 'Optymalna temperatura parzenia to 93–96°C. Wrzatek parzy kawę ' +
                      'zbyt intensywnie (gorzki smak), a za zimna woda da słabą, ' +
                      'kwaśną ekstrakcję. Wystarczy odczekać ok. 1 min po zagotowaniu.'
            }
        ];

        if (needsMilk) {
            tips.push({
                cls: 'milk',
                icon: '🥛',
                title: 'Spienianie mleka',
                text: 'French Press świetnie sprawdza się jako spieniacz! Podgrzej mleko ' +
                      'do ok. 60°C (nie gotuj — powyżej 70°C białka się rozpadają), ' +
                      'przelej do prasy max do połowy i energicznie pompuj tłokiem. ' +
                      'Mleko podwoi objętość w 10–15 sekund.'
            });
        }

        tips.push({
            cls: 'grind',
            icon: '⚙️',
            title: 'Stopień mielenia',
            text: 'Do French Pressa używaj grubo mielonej kawy (jak gruby piasek). ' +
                  'Zbyt drobne mielenie sprawi, że kawa przejdzie przez filtr siatkowy ' +
                  'i napój będzie mętny i przeparzony.'
        });

        var html = '<h3>Dobre praktyki</h3>';
        for (var i = 0; i < tips.length; i++) {
            var t = tips[i];
            html +=
                '<div class="info-bar ' + t.cls + '">' +
                    '<span class="info-bar-icon">' + t.icon + '</span>' +
                    '<div class="info-bar-body">' +
                        '<span class="info-bar-title">' + t.title + '</span>' +
                        t.text +
                    '</div>' +
                '</div>';
        }

        el.innerHTML = html;
    }

    // ========================
    // BACK TO START
    // ========================

    document.getElementById('back-btn').addEventListener('click', function () {
        showStep(1);
    });

    // ========================
    // INIT
    // ========================

    updateProgress(1, 4);
})();
