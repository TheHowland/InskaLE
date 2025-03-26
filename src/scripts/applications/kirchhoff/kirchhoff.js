// ####################################################################################################################
// #################################### Key function for kirchhoff circuits ###########################################
// ####################################################################################################################
async function startKirchhoff() {
    // Add heart
    let live = document.getElementById("lives");
    if (live === null) {
        let toggler = document.getElementById("nav-toggler");
        let heartDiv = document.createElement("div");
        heartDiv.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" shape-rendering=\"geometricPrecision\" text-rendering=\"geometricPrecision\" image-rendering=\"optimizeQuality\" fill-rule=\"evenodd\" clip-rule=\"evenodd\" viewBox=\"0 0 512 456.081\"><path fill=\"#F44336\" d=\"M253.648 83.482c130.392-219.055 509.908 65.493-.513 372.599-514.788-328.941-101.874-598.696.513-372.599z\"/><path fill=\"#C62828\" d=\"M344.488 10.579c146.331-39.079 316.84 185.128-65.02 429.134 282.18-224.165 190.925-403.563 65.02-429.134zM121.413.646c48.667-4.845 100.025 17.921 129.336 76.929 1.259 3.71 2.44 7.571 3.537 11.586 10.541 34.29.094 49.643-12.872 50.552-18.136 1.271-20.215-14.85-24.966-27.643C192.689 48.096 158.774 12.621 116.43 1.863c1.653-.435 3.314-.841 4.983-1.217z\"/><path fill=\"#FF847A\" d=\"M130.558 35.502C87.9 31.255 42.906 59.4 31.385 101.568c-7.868 25.593-.07 37.052 9.607 37.731 13.537.949 15.088-11.084 18.634-20.632 17.733-47.749 43.046-74.227 74.651-82.257a104.925 104.925 0 00-3.719-.908z\"/></svg>";
        let heart = heartDiv.firstChild;
        heart.style.height = "15px";
        let lives = document.createElement("span");
        lives.id = "lives";
        lives.innerHTML = "3";
        lives.style.fontFamily = "Roboto Condensed";
        lives.style.fontSize = "large";
        lives.style.fontWeight = "bold";
        lives.style.color = "white";
        lives.style.paddingLeft = "5px";
        lives.style.paddingTop = "5px";
        heartDiv.appendChild(lives);
        toggler.insertAdjacentElement("afterend", heartDiv);
    } else {
        live.innerHTML = "3";
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
}

// ####################################################################################################################
// ############################################# Helper functions #####################################################
// ####################################################################################################################

function showEquations(contentCol) {
    let equationsContainer = document.getElementById("equations-container");
    equationsContainer.innerHTML = "";
    let equations = createEquationsOverviewContainer();
    contentCol.append(equations);
}

function checkVoltageLoop() {
    let contentCol = document.getElementById("content-col");
    let svgDiv = document.getElementById("svgDiv1");
    let direction;

    if (state.selectedElements.length <= 1) {
        // Timeout so that the message is shown after the click event
        let rect = svgDiv.getBoundingClientRect();
        let y = rect.y + window.scrollY + 200;
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

