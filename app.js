(function () {
    'use strict';

    const RATIOS = {
        classic: 15,
        strong: 12,
        mild: 18,
    };

    const BREW_TIMES = {
        classic: 4,
        strong: 5,
        mild: 3,
    };

    const TYPE_LABELS = {
        classic: 'Klasyczna',
        strong: 'Mocna',
        mild: 'Łagodna',
    };

    let cupSize = 250;
    let cupCount = 1;
    let coffeeType = 'classic';

    // DOM elements
    const cupSizeGroup = document.getElementById('cup-size-group');
    const cupCountGroup = document.getElementById('cup-count-group');
    const coffeeTypeGroup = document.getElementById('coffee-type-group');
    const brewBtn = document.getElementById('brew-btn');
    const backBtn = document.getElementById('back-btn');
    const formSection = document.getElementById('form-section');
    const recipeSection = document.getElementById('recipe-section');
    const recipeSummary = document.getElementById('recipe-summary');
    const stepsList = document.getElementById('steps-list');

    // Button group selection
    function setupButtonGroup(group, onChange) {
        group.addEventListener('click', function (e) {
            const btn = e.target.closest('button');
            if (!btn || !group.contains(btn)) return;

            group.querySelectorAll('button').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            onChange(btn.dataset.value);
        });
    }

    setupButtonGroup(cupSizeGroup, function (val) {
        cupSize = parseInt(val, 10);
    });

    setupButtonGroup(cupCountGroup, function (val) {
        cupCount = parseInt(val, 10);
    });

    setupButtonGroup(coffeeTypeGroup, function (val) {
        coffeeType = val;
    });

    // Calculate recipe
    function calculateRecipe() {
        var totalWater = cupSize * cupCount;
        var ratio = RATIOS[coffeeType];
        var coffeeGrams = Math.round(totalWater / ratio);
        var brewTime = BREW_TIMES[coffeeType];

        return {
            coffeeGrams: coffeeGrams,
            waterMl: totalWater,
            temperature: '93-96',
            brewTime: brewTime,
            grind: 'gruby',
            type: coffeeType,
        };
    }

    // Render recipe summary
    function renderSummary(recipe) {
        recipeSummary.innerHTML =
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.coffeeGrams + ' g</span>' +
                '<span class="summary-label">Kawa mielona</span>' +
            '</div>' +
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.waterMl + ' ml</span>' +
                '<span class="summary-label">Woda</span>' +
            '</div>' +
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.temperature + '°C</span>' +
                '<span class="summary-label">Temperatura</span>' +
            '</div>' +
            '<div class="summary-item">' +
                '<span class="summary-value">' + recipe.brewTime + ' min</span>' +
                '<span class="summary-label">Czas parzenia</span>' +
            '</div>';
    }

    // Generate steps
    function generateSteps(recipe) {
        return [
            'Zagotuj wodę i odstaw na ok. 1 minutę (do ' + recipe.temperature + '°C)',
            'Odmierz ' + recipe.coffeeGrams + ' g kawy grubo mielonej',
            'Wsyp kawę do French Pressa',
            'Zalej ' + recipe.waterMl + ' ml wody',
            'Zamieszaj delikatnie',
            'Załóż tłok (nie wciskaj) i odczekaj ' + recipe.brewTime + ' min',
            'Powoli wciśnij tłok do dna',
            'Natychmiast przelej kawę do ' + (cupCount === 1 ? 'filiżanki' : 'filiżanek'),
            'Gotowe \u2014 smacznej kawy! ☕',
        ];
    }

    // Render steps
    function renderSteps(steps) {
        stepsList.innerHTML = '';

        steps.forEach(function (text) {
            var li = document.createElement('li');
            li.innerHTML =
                '<span class="step-checkbox"></span>' +
                '<span class="step-text">' + text + '</span>';

            li.addEventListener('click', function () {
                li.classList.toggle('done');
            });

            stepsList.appendChild(li);
        });
    }

    // Brew button
    brewBtn.addEventListener('click', function () {
        var recipe = calculateRecipe();
        renderSummary(recipe);
        renderSteps(generateSteps(recipe));

        formSection.classList.add('hidden');
        recipeSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Back button
    backBtn.addEventListener('click', function () {
        recipeSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();
