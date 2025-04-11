// ####################################################################################################################
// #################################### Key function for kirchhoff circuits ###########################################
// ####################################################################################################################
async function startKirchhoff() {
    await initSolverObjects(state.currentCircuitMap);
    await solveFirstStep();  // to generate SVG and data
    nextKirchhoffVoltStep();
}

async function nextKirchhoffVoltStep() {
    //await clearSolutionsDir();
    state.pictureCounter++;

    appendKirchhoffValuesToAllValuesMap();

    const {circuitContainer, svgContainer} = setupKirchhoffStep("volt");
    const contentCol = document.getElementById("content-col");

    if (state.pictureCounter === 1) {
        let voltHeading = createVoltHeading();
        contentCol.appendChild(voltHeading);
        hideSpinnerLoadingCircuit();
    }
    contentCol.append(circuitContainer);

    let equationsContainer = createEquationsContainer();
    equationsContainer.appendChild(getEquationsTable(state.voltEquations));
    contentCol.append(equationsContainer);

    const nextElementsContainer = setupNextElementsVoltageLawContainer();

    let arrows = svgContainer.querySelectorAll("text.arrow.voltage-label");
    makeElementsClickableForKirchhoff(svgContainer, nextElementsContainer, arrows, "volt");
    prepareNextElementsContainer(contentCol, nextElementsContainer);
    MathJax.typeset();
}

async function nextKirchhoffCurrStep(first=false) {
    state.pictureCounter++;
    const {circuitContainer, svgContainer} = setupKirchhoffStep("curr", first);
    const contentCol = document.getElementById("content-col");
    if (first) {
        let currentHeading = createCurrentHeading();
        contentCol.append(currentHeading);
    }
    contentCol.append(circuitContainer);

    const nextElementsContainer = setupNextElementsCurrentLawContainer();

    let arrows = svgContainer.querySelectorAll("text.arrow.current-label");
    makeElementsClickableForKirchhoff(svgContainer, nextElementsContainer, arrows, "curr");
    prepareNextElementsContainer(contentCol, nextElementsContainer);

    let equations = await createEquationsOverviewContainer();
    contentCol.append(equations);
    MathJax.typeset();
}

// ####################################################################################################################
// ############################################# Helper functions #####################################################
// ####################################################################################################################

async function checkVoltageLoop() {
    let contentCol = document.getElementById("content-col");
    let svgDiv = document.getElementById(`svgDivVolt${state.pictureCounter}`);

    if (state.selectedElements.length <= 1) {
        // Timeout so that the message is shown after the click event
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertChooseAtLeastTwoElements, "warning");
        }, 0);
        resetArrowHighlights(document.getElementById(`svgDivVolt${state.pictureCounter}`));
        const nextElementList = document.getElementById("next-elements-list");
        nextElementList.innerHTML = '';
        return;
    }

    let [errorCode, eq] = await state.kirchhoffSolverAPI.checkVoltageLoopRule(state.selectedElements);
    if (errorCode) {
        handleVoltageError(errorCode, svgDiv);
        resetArrowHighlights(document.getElementById(`svgDivVolt${state.pictureCounter}`));
        const nextElementList = document.getElementById("next-elements-list");
        nextElementList.innerHTML = '';
        return;
    }
    state.voltEquations.push(eq);
    let eqNr = state.voltEquations.length;
    addEquationToSvg(svgDiv, eqNr, eq, colors.voltageBlue);
    MathJax.typeset();
    // Equation is added to svg, remove to container where old equations are shown
    let equationsContainer = document.getElementById("equations-container");
    equationsContainer.remove();

    removeSvgEventHandlers(`svgDivVolt${state.pictureCounter}`);

    markVoltagesDone();
    state.selectedElements = [];

    await nextKirchhoffVoltStep();
    scrollContainerToTop(document.getElementById(`svgDivVolt${state.pictureCounter}`));


    /* TODO need to discuss what we want to do here
    if (await state.kirchhoffSolverAPI.foundAllVoltEquations()) {
        if (await state.kirchhoffSolverAPI.foundAllEquations()) {
            finishKirchhoff(contentCol);
    }*/
}

async function checkJunctionLaw() {
    let svgDiv = document.getElementById(`svgDivCurr${state.pictureCounter}`);
    let checkBtn = document.getElementById("check-btn");
    checkBtn.classList.add("disabled");

    if (state.selectedElements.length <= 1) {
        // Timeout so that the message is shown after the click event
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertChooseAtLeastTwoElements, "warning");
        }, 0);
        checkBtn.classList.remove("disabled");
        document.getElementById("check-btn").innerHTML = "check";
        return;
    }
    let nextElementsContainer = document.getElementById("nextElementsContainer");
    nextElementsContainer.querySelector("#reset-btn").classList.remove("disabled");

    let [errorCode, eqs] = await state.kirchhoffSolverAPI.checkJunctionRule(state.selectedElements);
    if (errorCode) {
        handleJunctionError(errorCode, svgDiv);
        checkBtn.classList.remove("disabled");
        checkBtn.innerHTML = "check";
        return;
    }

    // Multiple choice for different junction law equations
    generateMultipleChoiceEquations(eqs);
    await waitForCorrectSelection();
    // Correct equation selected
    await updateEquations();
    checkBtn.classList.remove("disabled");

    let nr = await getCurrentEquationNr();
    addEquationToSvg(svgDiv, nr, eqs[0], colors.currentRed);
    MathJax.typeset();

    removeSvgEventHandlers(`svgDivCurr${state.pictureCounter}`); // old picture counter

    let overview = document.getElementById("equations-overview-container");
    overview.remove();

    markCurrentsDone();
    state.selectedElements = [];

    await nextKirchhoffCurrStep(); // will increment pictureCounter
    scrollContainerToTop(document.getElementById(`svgDivCurr${state.pictureCounter}`));
}

async function finishKirchhoff(contentCol) {
    // Remove last curr svg if it exists
    if (document.getElementById("junctionHeading") !== null) {
        let svgDiv = document.getElementById(`svgDivCurr${state.pictureCounter}`).parentElement;
        svgDiv.remove();
        removeSvgEventHandlers(`svgDivCurr${state.pictureCounter}`);
    }
    // Remove text above equations
    let equationContainer = document.getElementById("equations-overview-container");
    equationContainer.innerHTML = "";
    equationContainer.appendChild(getEquationsTable(await state.kirchhoffSolverAPI.equations()));
    confetti({
        particleCount: 150,
        angle: 90,
        spread: 60,
        scalar: 0.8,
        origin: {x: 0.5, y: 1}
    });
    document.getElementById("nextElementsContainer").remove();

    // Show values and solutions button
    let valuesContainer = createValuesContainer();
    contentCol.appendChild(valuesContainer);
    const solBtnContainer = createKirchhoffSolutions();
    contentCol.appendChild(solBtnContainer);
    appendResetBtn(contentCol);
    let nextCircuitBtn = createNextCircuitButton();
    contentCol.appendChild(nextCircuitBtn);
    MathJax.typeset();
}

