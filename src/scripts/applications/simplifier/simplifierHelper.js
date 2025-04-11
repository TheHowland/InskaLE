function notLastPicture() {
    // Because on the last picture, this element won't exist
    return document.getElementById("nextElementsContainer") != null;
}

function setSvgColorMode(svgData) {
    if (colors.currentForeground === colors.keyLight) {
        return svgData.replaceAll(colors.lightModeSvgStrokeColor, colors.darkModeSvgStrokeColor);
    } else {
        return svgData.replaceAll(colors.darkModeSvgStrokeColor, colors.lightModeSvgStrokeColor);
    }
}

function enableCheckBtn() {
    document.getElementById("check-btn").disabled = false;
}

function resetSimplifierPage(calledFromResetBtn = false) {
    let checkBtn = document.getElementById("check-btn")
    if (state.currentCircuitMap !== null && checkBtn) {
        // If the check btn is disabled, the user has finished the simplification
        // That means if the page is reset, the user aborted the simplification
        // If calledFromResetBtn, then don't push the event because it's reset, and not aborted
        // Also don't push the event if the user is on the first picture, maybe it was just a missclick
        let checkBtnDisabled = checkBtn.classList.contains("disabled");
        if (!checkBtnDisabled && !calledFromResetBtn && state.pictureCounter > 1) {
            pushCircuitEventMatomo(circuitActions.Aborted, state.pictureCounter);
        }
    }
    clearSimplifierPageContent();
    showSpinnerLoadingCircuit();
    state.valuesShown = new Map();
    state.selectedElements = [];
    state.pictureCounter = 0;
    state.allValuesMap = new Map();
    scrollBodyToTop();
    if (calledFromResetBtn) {
        startSimplifier();  // Draw the first picture again
    }
}

function enableLastCalcButton() {
    setTimeout(() => {
        let lastPicture = state.pictureCounter - 1;
        const lastCalcBtn = document.getElementById(`calcBtn${lastPicture}`);
        lastCalcBtn.disabled = false;
    }, 100);
}

async function getCircuitInfo() {
    let circuitInfoPath = await stepSolve.createCircuitInfo();
    let circuitInfoFile = await state.pyodide.FS.readFile(circuitInfoPath, {encoding: "utf8"});
    return JSON.parse(circuitInfoFile);

}

async function getJsonAndSvgStepFiles() {
    //const files = await state.pyodide.FS.readdir(`${conf.pyodideSolutionsPath}`);
    let files = await state.pyodideAPI.readDir(conf.pyodideSolutionsPath);
    state.jsonFiles_Z = files.filter(file => !file.endsWith("VC.json") && file.endsWith(".json"));
    state.jsonFiles_VC = files.filter(file => file.endsWith("VC.json"));
    if (state.jsonFiles_VC === []) {
        state.jsonFiles_VC = null;
    }
    state.svgFiles = files.filter(file => file.endsWith(".svg"));
    state.currentStep = 0;
}

async function createAndShowStep0(circuitMap) {
    //await clearSolutionsDir();

    let paramMap = new Map();
    paramMap.set("volt", languageManager.currentLang.voltageSymbol);
    paramMap.set("total", languageManager.currentLang.totalSuffix);

    await state.simplifierAPI.initStepSolver(circuitMap.circuitFile, `${conf.pyodideCircuitPath}/${circuitMap.sourceDir}`, paramMap);

    let obj = await state.simplifierAPI.createStep0();
    obj.__proto__ = Step0Object.prototype;
    state.step0Data = obj;
    state.currentStep = 0;
    state.allValuesMap.set(`${languageManager.currentLang.voltageSymbol}${languageManager.currentLang.totalSuffix}`, getSourceVoltageVal());
    state.allValuesMap.set(`I${languageManager.currentLang.totalSuffix}`, getSourceCurrentVal());
    hideSpinnerLoadingCircuit();
    nextSimplifierStep(state.step0Data);
}

function startSimplifier() {
    try{
        if (!state.pyodideReady && (state.currentCircuitMap.selectorGroup === circuitMapper.selectorIds.quick)) {
            // Use the hardcoded step solver for the quick selector while pyodide is not ready
            // so the user can already start with a circuit while pyodide is loading in the background
            state.simplifierAPI = state.hardcodedStepSolverAPI;
        } else {
            state.simplifierAPI = state.stepSolverAPI;
        }
        createAndShowStep0(state.currentCircuitMap);
        //The div element that contains the SVG representation of the circuit diagram.
        const svgDiv = document.querySelector('.svg-container');
        //The div element that contains the list of elements that have been clicked or selected in the circuit diagram.
        const nextElementsContainer = document.querySelector('.next-elements-container');
        if (svgDiv && nextElementsContainer) {
            resetNextElements(svgDiv, nextElementsContainer);
        }
    }
    catch (error){
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertErrorInit, "danger", false);
        }, 0);
    }

}

function createTotalCurrentContainer() {
    const firstStepContainer = document.createElement("div");
    firstStepContainer.id = "firstVCStepContainer";
    firstStepContainer.classList.add("container", "justify-content-center");
    return firstStepContainer;
}

function createSolutionsBtnContainer() {
    const solutionsContainer = document.createElement("div");
    solutionsContainer.id = "solutionsBtnContainer";
    solutionsContainer.classList.add("container", "mb-5", "justify-content-center");
    return solutionsContainer;
}

function createTotalCurrentBtn() {
    const totalCurrentBtn = setupVoltageCurrentBtn();
    totalCurrentBtn.textContent = languageManager.currentLang.firstVCStepBtn;
    totalCurrentBtn.disabled = false;
    return totalCurrentBtn;
}

function createSolutionsBtn() {
    const totalCurrentBtn = setupVoltageCurrentBtn();
    totalCurrentBtn.textContent = languageManager.currentLang.solutionsBtn;
    totalCurrentBtn.disabled = false;
    return totalCurrentBtn;
}

function setStyleAndEvent(element, nextElementsList) {
    element.style.pointerEvents = "bounding-box";
    element.style.cursor = 'pointer';
    element.addEventListener('click', () =>
        chooseElement(element, nextElementsList)
    );
}

function colorArrowsColorful(svgDiv) {
    let labels = svgDiv.querySelectorAll(".arrow");
    for (let label of labels) {
        if (label.classList.contains("voltage-label")) {
            label.style.color = colors.voltageBlue;
            label.style.stroke = colors.voltageBlue;
            label.style.fill = colors.voltageBlue;
            label.style.opacity = "0.8";
        } else if (label.classList.contains("current-label")) {
            label.style.color = colors.currentRed;
            label.style.stroke = colors.currentRed;
            label.style.fill = colors.currentRed;
            label.style.opacity = "0.8";
        }
    }
}
