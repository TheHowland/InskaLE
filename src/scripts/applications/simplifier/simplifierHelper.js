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

function twoElementsChosen() {
    return state.selectedElements.length === 2;
}

function resetSolverObject() {
    let paramMap = new Map();
    paramMap.set("volt", languageManager.currentLang.voltageSymbol);
    paramMap.set("total", languageManager.currentLang.totalSuffix);

    stepSolve = state.solve.SolveInUserOrder(state.currentCircuitMap.circuitFile, `${conf.pyodideCircuitPath}/${state.currentCircuitMap.sourceDir}`, `${conf.pyodideSolutionsPath}/`, paramMap);
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
    resetSolverObject();
    state.valuesShown = new Map();
    state.selectedElements = [];
    state.pictureCounter = 0;
    state.allValuesMap = new Map();
    state.voltEquations = [];
    scrollBodyToTop();
    if (calledFromResetBtn && state.pyodideReady) {
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

function scrollNextElementsContainerIntoView() {
    setTimeout(() => {
        const nextElementsText = document.getElementById("nextElementsContainer");
        if (nextElementsText != null) {nextElementsText.scrollIntoView()}
    }, 100);
}

async function getCircuitInfo() {
    let circuitInfoPath = await stepSolve.createCircuitInfo();
    let circuitInfoFile = await state.pyodide.FS.readFile(circuitInfoPath, {encoding: "utf8"});
    return JSON.parse(circuitInfoFile);

}

async function getJsonAndSvgStepFiles() {
    const files = await state.pyodide.FS.readdir(`${conf.pyodideSolutionsPath}`);
    state.jsonFiles_Z = files.filter(file => !file.endsWith("VC.json") && file.endsWith(".json"));
    state.jsonFiles_VC = files.filter(file => file.endsWith("VC.json"));
    if (state.jsonFiles_VC === []) {
        state.jsonFiles_VC = null;
    }
    state.svgFiles = files.filter(file => file.endsWith(".svg"));
    state.currentStep = 0;
}

async function createAndShowStep0(circuitMap) {
    await clearSolutionsDir();

    let paramMap = new Map();
    paramMap.set("volt", languageManager.currentLang.voltageSymbol);
    paramMap.set("total", languageManager.currentLang.totalSuffix);

    stepSolve = state.solve.SolveInUserOrder(
        circuitMap.circuitFile,
        `${conf.pyodideCircuitPath}/${circuitMap.sourceDir}`,
        "",
        paramMap);

    let obj = await stepSolve.createStep0().toJs({dict_converter: Object.fromEntries});
    obj.__proto__ = Step0Object.prototype;
    state.step0Data = obj;
    state.currentStep = 0;
    state.allValuesMap.set(`${languageManager.currentLang.voltageSymbol}${languageManager.currentLang.totalSuffix}`, getSourceVoltageVal());
    state.allValuesMap.set(`I${languageManager.currentLang.totalSuffix}`, getSourceCurrentVal());
    nextSimplifierStep(state.step0Data);
}

function startSimplifier() {
    try{
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
            showMessage(document.getElementsByTagName("body")[0],
                languageManager.currentLang.alertErrorInit, "danger", true, 0, false);
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
