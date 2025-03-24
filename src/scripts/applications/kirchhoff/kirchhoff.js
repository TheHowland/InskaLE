// ####################################################################################################################
// #################################### Key function for kirchhoff circuits ###########################################
// ####################################################################################################################
async function startKirchhoff() {
    await clearSolutionsDir();
    state.pictureCounter++;
    initSolverObjects();

    let obj = await state.stepSolve.createStep0().toJs({dict_converter: Object.fromEntries});
    obj.__proto__ = Step0Object.prototype;
    state.step0Data = obj;
    state.currentStep = 0;
    // TODO remove unnecessary values
    state.allValuesMap.set(`${languageManager.currentLang.voltageSymbol}${languageManager.currentLang.totalSuffix}`, getSourceVoltageVal());
    state.allValuesMap.set(`I${languageManager.currentLang.totalSuffix}`, getSourceCurrentVal());

    appendKirchhoffValuesToAllValuesMap();  // Before setupKirchhoffStep because values are needed for labels
    const {circuitContainer, svgContainer} = setupKirchhoffStep();
    const contentCol = document.getElementById("content-col");
    let voltHeading = createVoltHeading();
    let equationsContainer = createEquationsContainer();
    contentCol.appendChild(voltHeading);
    contentCol.append(circuitContainer);
    contentCol.append(equationsContainer);

    const electricalElements = getElementsFromSvgContainer(svgContainer);
    addVoltageSourceToElements(svgContainer, electricalElements);

    const nextElementsContainer = setupNextElementsVoltageLawContainer();
    makeElementsClickableForKirchhoff(nextElementsContainer, electricalElements);
    prepareNextElementsContainer(contentCol, nextElementsContainer);
    MathJax.typeset();
}

function startKirchhoffCurrent() {
    state.pictureCounter++;
    const {circuitContainer, svgContainer} = setupKirchhoffStep();
    const contentCol = document.getElementById("content-col");
    let currentHeading = createCurrentHeading();
    contentCol.append(currentHeading);
    contentCol.append(circuitContainer);

    const electricalElements = getElementsFromSvgContainer(svgContainer);
    const nextElementsContainer = setupNextElementsCurrentLawContainer();
    makeElementsClickableForKirchhoff(nextElementsContainer, electricalElements);
    prepareNextElementsContainer(contentCol, nextElementsContainer);

    let equations = createEquationsOverviewContainer();
    contentCol.append(equations);
    MathJax.typeset();
    // TODO Remove event listeners from voltage law ?
}

// ####################################################################################################################
// ############################################# Helper functions #####################################################
// ####################################################################################################################

// ############################################# Voltage Rule #########################################################
function setupNextElementsVoltageLawContainer() {
    const nextElementsContainer = document.createElement('div');
    nextElementsContainer.className = 'next-elements-container';
    nextElementsContainer.id = "nextElementsContainer";
    nextElementsContainer.classList.add("text-center", "py-1", "mb-3");
    nextElementsContainer.style.color = colors.currentForeground;
    nextElementsContainer.innerHTML = `
        <h5>${languageManager.currentLang.nextElementsVoltLawHeading}</h5>
        <ul class="px-0" id="next-elements-list"></ul>
        <button class="btn btn-secondary mx-1 disabled" id="reset-btn">reset</button>
        <button class="btn btn-primary mx-1" id="check-btn">check</button>
    `;
    nextElementsContainer.querySelector("#reset-btn").addEventListener('click', () => {
        pushCircuitEventMatomo(circuitActions.Reset, state.pictureCounter);
        resetKirchhoffPage();
    });
    let checkBtn = nextElementsContainer.querySelector("#check-btn");
    checkBtn.addEventListener('click', () => {
        checkVoltageLoop();
    });

    return nextElementsContainer;
}

function checkVoltageLoop() {
    let contentCol = document.getElementById("content-col");
    let svgDiv = document.getElementById("svgDiv1");
    let direction;

    if (state.selectedElements.length <= 1) {
        // Timeout so that the message is shown after the click event
        let rect = svgDiv.getBoundingClientRect();
        let y = rect.y + window.scrollY + 20;
        setTimeout(() => {
            showMessage(contentCol, languageManager.currentLang.alertChooseAtLeastTwoElements, "warning",false, y);
        }, 0);
        return;
    }

    direction = getLoopDirection(svgDiv);

    let [errorCode, eq] = state.kirchhoffSolver.checkVoltageLoopRule(state.selectedElements, direction).toJs();
    if (errorCode) {
        handleVoltageError(errorCode, svgDiv);
        return;
    }

    state.voltEquations.push(eq);
    let equationContainer = document.getElementById("equations-container");
    equationContainer.innerHTML = "";
    equationContainer.appendChild(getEquationsTable(state.voltEquations));

    let nextElementsContainer = document.getElementById("nextElementsContainer");
    nextElementsContainer.querySelector("#reset-btn").classList.remove("disabled");

    grayOutSelectedElements(svgDiv);
    resetNextElements(svgDiv, nextElementsContainer);

    if (allElementsGrayedOut(svgDiv)) {
        startKirchhoffCurrent();
    }
    MathJax.typeset();
}

// ############################################# Junction Rule ########################################################
function setupNextElementsCurrentLawContainer() {
    const nextElementsContainer = document.createElement('div');
    nextElementsContainer.className = 'next-elements-container';
    nextElementsContainer.id = "nextElementsContainer";
    nextElementsContainer.classList.add("text-center", "py-1", "mb-3");
    nextElementsContainer.style.color = colors.currentForeground;
    nextElementsContainer.innerHTML = `
        <h5>${languageManager.currentLang.nextElementsCurrentHeading}</h5>
        <ul class="px-0" id="next-elements-list"></ul>
        <button class="btn btn-secondary mx-1" id="reset-btn">reset</button>
        <button class="btn btn-primary mx-1" id="check-btn">check</button>
    `;
    nextElementsContainer.querySelector("#reset-btn").addEventListener('click', () => {
        pushCircuitEventMatomo(circuitActions.Reset, state.pictureCounter);
        resetKirchhoffPage();
    });
    let checkBtn = nextElementsContainer.querySelector("#check-btn");
    checkBtn.addEventListener('click', () => {
        checkJunctionLaw();

    });
    return nextElementsContainer;
}

async function checkJunctionLaw() {
    let contentCol = document.getElementById("content-col");
    let svgDiv = document.getElementById("svgDiv2");
    let checkBtn = document.getElementById("check-btn");
    checkBtn.classList.add("disabled");

    if (state.selectedElements.length <= 1) {
        // Timeout so that the message is shown after the click event
        let rect = svgDiv.getBoundingClientRect();
        let y = rect.y + window.scrollY + 20;
        setTimeout(() => {
            showMessage(contentCol, languageManager.currentLang.alertChooseAtLeastTwoElements, "warning", false, y);
        }, 0);
        checkBtn.classList.remove("disabled");
        return;
    }
    let nextElementsContainer = document.getElementById("nextElementsContainer");
    nextElementsContainer.querySelector("#reset-btn").classList.remove("disabled");

    let [errorCode, eqs] = state.kirchhoffSolver.checkJunctionRule(state.selectedElements).toJs();
    if (errorCode) {
        handleJunctionError(errorCode, svgDiv);
        checkBtn.classList.remove("disabled");
        return;
    }

    // Multiple choice for different junction law equations
    let nextElementList = nextElementsContainer.querySelector('ul');
    nextElementList.innerHTML = 'Wähle die korrekte Gleichung aus';

    eqs = eqs.map((eq, index) => ({
        equation: eq,
        isCorrect: index === 0 // always the correct one at position 0
    }));

    shuffleArray(eqs);

    for (let [i, {equation, isCorrect}] of eqs.entries()) {
        let choice = document.createElement('li');
        choice.innerHTML = `
        <div class="form-check d-flex justify-content-center" style="gap: 5px">
            <input class="form-check-input" type="checkbox" id="option${i}" value="${isCorrect ? '1' : '0'}">
            <label class="form-check-label equation" for="option${i}">\\(${equation}\\)</label>
        </div>`;
        nextElementList.appendChild(choice);
    }
    MathJax.typeset();

    for (let i = 0; i < 10; i++) {
        const {id, value} = await waitForCheckboxSelection(); // wait for user input
        let eq = "";

        if (value === "0") {
            // wrong answer
            setTimeout(() => {
                let checkBox = nextElementList.querySelector(`#${id}`);
                // TODO add color to color definitions
                checkBox.style.backgroundColor = "red";
                checkBox.style.borderColor = "red";
                checkBox.disabled = true;
            }, 250);
        } else {
            // right answer
            let checkBox = nextElementList.querySelector(`#${id}`);
            let label = document.querySelector(`label[for=${id}]`);
            setTimeout(() => {
                checkBox.style.backgroundColor = "green";
                checkBox.style.borderColor = "green";
            }, 250);
            await new Promise(resolve => setTimeout(resolve, 250)); // Wait for animation to start
            label.classList.add("fade-out");
            await new Promise(resolve => setTimeout(resolve, 750)); // Wait for animation to fade out
            eq = eqs.find(e => e.isCorrect).equation;
            checkBtn.classList.remove("disabled");

            let equationContainer = document.getElementById("equations-overview-container");
            equationContainer.innerHTML = languageManager.currentLang.missingEquations;
            equationContainer.appendChild(getEquationsTable(state.kirchhoffSolver.equations().toJs()));

            resetNextElements(svgDiv, nextElementsContainer);

            if (state.kirchhoffSolver.foundAllEquations()) {
                // Remove text above equations
                equationContainer.innerHTML = "";
                equationContainer.appendChild(getEquationsTable(state.kirchhoffSolver.equations().toJs()));
                confetti({
                    particleCount: 150,
                    angle: 90,
                    spread: 60,
                    scalar: 0.8,
                    origin: {x: 0.5, y: 1}
                });
                document.getElementById("nextElementsContainer").remove();
                let resetContainer = document.createElement("div");
                resetContainer.classList.add("text-center", "justify-content-center", "mt-4");
                resetContainer.innerHTML = `
                    <button class="btn btn-secondary mx-1" id="reset-btn">reset</button>
                `;
                resetContainer.querySelector("#reset-btn").addEventListener('click', () => {
                    pushCircuitEventMatomo(circuitActions.Reset, state.pictureCounter);
                    resetKirchhoffPage();
                });
                contentCol.appendChild(resetContainer);
            }
            break;
        }
    }
    MathJax.typeset();
}
