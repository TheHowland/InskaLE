// ####################################################################################################################
// #################################### Key function for kirchhoff circuits ###########################################
// ####################################################################################################################
async function startKirchhoff() {
    // Add heart
    if (state.gamification) {
        addLivesField();
    }

    await clearSolutionsDir();
    state.pictureCounter++;
    initSolverObjects();
    await solveFirstStep();

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

    // TODO remove nextElementsContainer parameter
    const nextElementsContainer = setupNextElementsVoltageLawContainer();


    let arrows = svgContainer.querySelectorAll("text.arrow");
    makeElementsClickableForKirchhoff(nextElementsContainer, arrows);
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
}

// ####################################################################################################################
// ############################################# Helper functions #####################################################
// ####################################################################################################################

function checkVoltageLoop() {
    let contentCol = document.getElementById("content-col");
    let svgDiv = document.getElementById("svgDiv1");
    let direction = 1;

    if (state.selectedElements.length <= 1) {
        // Timeout so that the message is shown after the click event
        let rect = svgDiv.getBoundingClientRect();
        let y = rect.y + window.scrollY + 200;
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertChooseAtLeastTwoElements, "warning");
        }, 0);
        return;
    }

    //direction = getLoopDirection(svgDiv);

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

    markVoltagesDone(svgDiv);
    resetHighlights(svgDiv);
    resetNextElementsTextAndList(nextElementsContainer);

    if (allVoltagesDone(svgDiv)) {
        if (state.kirchhoffSolver.foundAllEquations()) {
            showEquations(contentCol);
            finishKirchhoff(contentCol);
        } else {
            // If not all equations are found, start junction node selection
            startKirchhoffCurrent();
        }
    }
    MathJax.typeset();
}

async function checkJunctionLaw() {
    let contentCol = document.getElementById("content-col");
    let svgDiv = document.getElementById("svgDiv2");
    let checkBtn = document.getElementById("check-btn");
    checkBtn.classList.add("disabled");

    if (state.selectedElements.length <= 1) {
        // Timeout so that the message is shown after the click event
        let rect = svgDiv.getBoundingClientRect();
        let y = rect.y + window.scrollY + 200;
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertChooseAtLeastTwoElements, "warning");
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
    generateMultipleChoiceEquations(eqs);
    await waitForCorrectSelection(svgDiv);

    if (state.kirchhoffSolver.foundAllEquations()) {
        finishKirchhoff(contentCol);
    }

    MathJax.typeset();
}


function finishKirchhoff(contentCol) {
    // Remove text above equations
    let equationContainer = document.getElementById("equations-overview-container");
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

