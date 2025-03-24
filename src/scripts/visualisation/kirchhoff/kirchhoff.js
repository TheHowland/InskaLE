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

    // TODO define direction
    let [errorCode, eq] = state.kirchhoffSolver.checkVoltageLoopRule(state.selectedElements).toJs();
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

    for (let i = 0; i < 1000; i++) {
        const {id, value} = await waitForCheckboxSelection(); // wait for user input
        let eq = "";

        if (value === "0") {
            // wrong answer
            setTimeout(() => {
                let checkBox = nextElementList.querySelector(`#${id}`);
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
                label.classList.add("fade-out");
            }, 250);
            await new Promise(resolve => setTimeout(resolve, 1000))
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
            }
            break;
        }
    }
    MathJax.typeset();
}

// ####################################################################################################################

function waitForCheckboxSelection() {
    let nextElementsContainer = document.getElementById("nextElementsContainer");
    let nextElementList = nextElementsContainer.querySelector('ul');
    return new Promise(resolve => {
        nextElementList.addEventListener('change', function handler(event) {
            if (event.target.classList.contains('form-check-input')) {
                const selectedValue = event.target.value;
                const selectedId = event.target.id;
                resolve({id: selectedId, value: selectedValue});
                nextElementList.removeEventListener('change', handler);
            }
        });
    });
}

function shuffleArray(array) {
    let currentIndex = array.length;
    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function handleVoltageError(errorCode, svgDiv) {
    let contentCol = document.getElementById("content-col");
    let rect = svgDiv.getBoundingClientRect();
    let y = rect.y + window.scrollY + 20;
    if (errorCode === 1) {
        // Equation already exists
        setTimeout(() => {
            showMessage(contentCol, languageManager.currentLang.alertLoopAlreadyExists, "warning", false, y);
        }, 0);
    } else if (errorCode === 2) {
        // Invalid selection
        setTimeout(() => {
            showMessage(contentCol, languageManager.currentLang.alertInvalidVoltageLoop, "warning", false, y);
        }, 0);
    } else if (errorCode === 3) {
        // Only for junction law
    }
}

function handleJunctionError(errorCode, svgDiv) {
    let contentCol = document.getElementById("content-col");
    let rect = svgDiv.getBoundingClientRect();
    let y = rect.y + window.scrollY + 20;
    if (errorCode === 1) {
        // Equation already exists
        setTimeout(() => {
            showMessage(contentCol, languageManager.currentLang.alertJunctionAlreadyExists, "warning", false, y);
        }, 0);
    } else if (errorCode === 2) {
        // Invalid selection
        setTimeout(() => {
            showMessage(contentCol, languageManager.currentLang.alertInvalidJunction, "warning", false, y);
        }, 0);
    } else if (errorCode === 3) {
        // Only for junction law, if more than 2 elements in series are chosen we can't generate
        // one equation but two, I1 = I2 = I3, but we want I1 = I2 and I2 = I3
        // So throw error if more than 2 series elements are chosen
        setTimeout(() => {
            showMessage(contentCol, languageManager.currentLang.alertTooManyJunctionNodes, "warning", false, y);
        }, 0);
    }
}

function initSolverObjects() {
    let paramMap = new Map();
    paramMap.set("volt", languageManager.currentLang.voltageSymbol);
    paramMap.set("total", languageManager.currentLang.totalSuffix);

    state.stepSolve = state.solve.SolveInUserOrder(
        state.currentCircuitMap.circuitFile,
        `${conf.pyodideCircuitPath}/${state.currentCircuitMap.sourceDir}`,
        "",
        paramMap);

    state.kirchhoffSolver = state.solve.KirchhoffSolver(
        state.currentCircuitMap.circuitFile,
        `${conf.pyodideCircuitPath}/${state.currentCircuitMap.sourceDir}`,
        paramMap);
}

function getLoopDirection(svgDiv) {
    let direction;
    if (svgDiv.querySelector("#loop-dir-btn").innerText === kirchhoffLoopDirectionSymbol.clockwise) {
        direction = "clockwise";
    } else {
        direction = "counterclockwise";
    }
    return direction;
}

function createVoltHeading() {
    let voltHeading = document.createElement("h3");
    voltHeading.innerHTML = languageManager.currentLang.kirchhoffVoltageHeading;
    voltHeading.style.color = colors.currentForeground;
    return voltHeading;
}

function createEquationsContainer() {
    let equationsContainer = document.createElement("div");
    equationsContainer.id = `equations-container`;
    equationsContainer.style.color = colors.currentForeground;
    return equationsContainer;
}

function createEquationsOverviewContainer() {
    let equations = document.createElement("div");
    equations.id = "equations-overview-container";
    equations.style.color = colors.currentForeground;
    equations.classList.add("text-center", "py-1", "mb-3", "mx-auto");
    equations.innerHTML = languageManager.currentLang.missingEquations;
    equations.appendChild(getEquationsTable(state.kirchhoffSolver.equations().toJs()));

    return equations;
}

function createCurrentHeading() {
    let currentHeading = document.createElement("h3");
    currentHeading.innerHTML = languageManager.currentLang.kirchhoffCurrentHeading;
    currentHeading.style.color = colors.currentForeground;
    currentHeading.classList.add("mt-4");
    return currentHeading;
}

function addVoltageSourceToElements(svgContainer, electricalElements) {
    // Add voltage source in kirchhoff because it needs to be clickable as well
    let sources = svgContainer.querySelectorAll("circle");
    for (let source of sources) {
        const classAttr = source.getAttribute("class");
        if (classAttr && classAttr !== "na" && classAttr.includes("V")) {
            electricalElements.push(source);
        }
    }
}

function appendKirchhoffValuesToAllValuesMap() {
    for (let component of state.step0Data.allComponents) {
        addKirchhoffComponentValues(component);
    }
    state.allValuesMap.set(`volt_V1`, `${languageManager.currentLang.voltageSymbol}${languageManager.currentLang.totalSuffix}`);
}

function addKirchhoffComponentValues(component) {
    if (component.Z.name !== null && component.Z.name !== undefined) {
        if (component.hasConversion) {
            state.allValuesMap.set(component.Z.name, component.Z.val);
        } else {
            state.allValuesMap.set(component.Z.name, component.Z.impedance);
        }
        state.allValuesMap.set(`volt_${component.Z.name}`, component.U.name);
        state.allValuesMap.set(`curr_${component.Z.name}`, component.I.name);
        state.allValuesMap.set(component.U.name, component.U.val);
        state.allValuesMap.set(component.I.name, component.I.val);
    }
}

function makeElementsClickableForKirchhoff(nextElementsContainer, electricalElements) {
    const nextElementsList = nextElementsContainer.querySelector(`#next-elements-list`);
    electricalElements.forEach(element => setKirchhoffStyleAndEvent(element, nextElementsList));

}

function setKirchhoffStyleAndEvent(element, nextElementsList) {
    element.style.pointerEvents = "bounding-box";
    element.style.cursor = 'pointer';
    element.addEventListener('click', () =>
        chooseKirchhoffElement(element, nextElementsList)
    );
}

function chooseKirchhoffElement(element, nextElementsList) {
    const bboxId = `bbox-${element.getAttribute('id')}`;
    const existingBox = document.getElementById(bboxId);

    if (existingBox) {
        removeExistingBoxAndText(existingBox, bboxId, element);
    }
    else {
        createNewHighlightedBoundingBox(element, bboxId);
        if (state.pictureCounter === 1) {
            addKirchhoffVoltageTextToBox(element, bboxId, nextElementsList);
        } else if (state.pictureCounter === 2) {
            addKirchhoffCurrentTextToBox(element, bboxId, nextElementsList);
        }
    }
    MathJax.typeset();
}

function addKirchhoffVoltageTextToBox(element, bboxId, nextElementsList) {
    let id = element.getAttribute('id') || 'no id';
    let index = `volt_${id}`;
    let listItem = document.createElement('li');
    listItem.innerHTML = `\\(${state.allValuesMap.get(index)}\\)`;
    listItem.setAttribute('data-bbox-id', bboxId);
    nextElementsList.appendChild(listItem);
    state.selectedElements.push(element.getAttribute('id') || 'no id');
}

function addKirchhoffCurrentTextToBox(element, bboxId, nextElementsList) {
    let id = element.getAttribute('id') || 'no id';
    let index = `curr_${id}`;
    let listItem = document.createElement('li');
    listItem.innerHTML = `\\(${state.allValuesMap.get(index)}\\)`;
    listItem.setAttribute('data-bbox-id', bboxId);
    nextElementsList.appendChild(listItem);
    state.selectedElements.push(element.getAttribute('id') || 'no id');
}

function getEquationsTable(equations) {
    let table = document.createElement("table");
    table.classList.add("table", "table-borderless", "mx-auto");
    if (colors.currentBackground === colors.keyDark) {
        table.classList.add("table-dark");
    } else {
        table.classList.add("table-light");
    }
    table.style.width = "fit-content";
    for (let [i, eq] of equations.entries()) {
        let row = table.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = `\\(\\mathrm{${romanNumbersMap.get(i+1)}})\\)`;
        cell = row.insertCell();
        cell.innerHTML = `\\(${eq}\\)`;
    }
    table.querySelectorAll("td").forEach(td => td.style.textAlign = "left");
    return table;
}

function resetKirchhoffPage() {
    clearSimplifierPageContent();
    //resetSolverObject();
    //resetKirchhoffSolverObject();
    state.valuesShown = new Map();
    state.selectedElements = [];
    state.pictureCounter = 0;
    state.allValuesMap = new Map();
    state.voltEquations = [];
    scrollBodyToTop();
    startKirchhoff();
}

function allElementsGrayedOut(svgDiv) {
    // Check if all elements including the source are grayed out
    for (let cpt of state.step0Data.allComponents) {
        let element = svgDiv.querySelector(`#${cpt.Z.name}`);
        if (element.style.opacity !== "0.5") {
            return false;
        }
    }
    let source = svgDiv.querySelector("#V1");
    if (source.style.opacity !== "0.5") {
        return false;
    }
    return true;
}

function grayOutSelectedElements(svgDiv) {
    let selectedElements = state.selectedElements;
    for (let elementId of selectedElements) {
        let element = svgDiv.querySelector(`#${elementId}`);
        element.style.opacity = "0.5";
        let elementLabel = svgDiv.querySelector(`.element-label.${elementId}`);
        elementLabel.style.opacity = "0.5";
    }
}

function setupKirchhoffStep() {
    const circuitContainer = document.createElement('div');
    circuitContainer.classList.add("circuit-container", "row", "justify-content-center", "my-2");
    const svgContainer = setupKirchhoffSVGandData(state.step0Data);
    circuitContainer.appendChild(svgContainer)
    return {circuitContainer, svgContainer};
}

function setupKirchhoffSVGandData(stepObject) {
    let svgData = stepObject.svgData;
    const svgDiv = document.createElement('div');
    svgDiv.id = `svgDiv${state.pictureCounter}`;
    svgDiv.classList.add("svg-container", "p-2");
    svgData = setSvgWidthTo(svgData, "100%");
    svgDiv.style.border = `1px solid ${colors.currentForeground}`;
    svgDiv.style.borderRadius = "6px";
    svgDiv.style.width = "350px";
    svgDiv.style.maxWidth = "350px;";
    svgDiv.style.position = "relative";

    // Svg manipulation - set width and color for dark mode
    svgData = setSvgColorMode(svgData);
    svgDiv.innerHTML = svgData;
    let containsZ = divContainsZLabels(svgDiv);

    if (svgDiv.id === "svgDiv1" || containsZ) {
        // First svg, set valuesShown to false
        // Also set to zero if labels contain Z because they can't be toggled
        state.valuesShown.set(svgDiv.id, false);
    } else {
        // Set valuesShown to the previous state
        state.valuesShown.set(svgDiv.id, state.valuesShown.get(`svgDiv${state.pictureCounter - 1}`));
    }

    fillLabels(svgDiv);
    hideSourceLabel(svgDiv);
    if (state.pictureCounter === 1) {
        hideCurrentArrows(svgDiv);
        addVoltageOverlay(svgDiv);
    } else if (state.pictureCounter === 2) {
        hideVoltageArrows(svgDiv);
        hideItotArrow(svgDiv);
    }

    // TODO Remove this when the svg data is fixed
    let source = svgDiv.querySelector("circle");
    source.classList.add("10V")
    source.id = "V1";

    // SVG Data written, now add eventListeners, only afterward because they would be removed on rewrite of svgData
    addKirchhoffInfoHelpButton(svgDiv);
    addNameValueToggleBtn(svgDiv);
    if (state.pictureCounter === 1) {
        addLoopDirectionBtn(svgDiv);
    }

    return svgDiv;
}

function addLoopDirectionBtn(svgDiv) {
    const dirBtn = document.createElement("button");
    dirBtn.type = "button";
    dirBtn.id = `loop-dir-btn`;
    dirBtn.classList.add("btn", "btn-secondary");
    dirBtn.style.position = "absolute";
    dirBtn.style.bottom = "5px";
    dirBtn.style.left = "5px";
    dirBtn.style.zIndex = "1000";
    dirBtn.style.color = colors.currentForeground;
    dirBtn.style.border = `1px solid ${colors.currentForeground}`;
    dirBtn.style.background = "none";
    dirBtn.innerText = kirchhoffLoopDirectionSymbol.clockwise;

    dirBtn.onclick = () => {
        if (dirBtn.innerText === kirchhoffLoopDirectionSymbol.clockwise) {
            dirBtn.innerText = kirchhoffLoopDirectionSymbol.counterclockwise;
        } else {
            dirBtn.innerText = kirchhoffLoopDirectionSymbol.clockwise;
        }
    };
    svgDiv.insertAdjacentElement("afterbegin", dirBtn);
}

function addKirchhoffInfoHelpButton(svgDiv) {
    let infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.classList.add("btn", "btn-primary", "open-info-gif-btn");
    infoBtn.style.position = "absolute";
    infoBtn.style.top = "5px";
    infoBtn.style.left = "5px";
    infoBtn.style.float = "left";
    infoBtn.style.color = colors.keyYellow;
    infoBtn.style.border = `1px solid ${colors.keyYellow}`;
    infoBtn.style.background = "none";
    infoBtn.style.fontWeight = "bold";
    infoBtn.innerText = "?";
    infoBtn.setAttribute("data-bs-toggle", "modal");
    if (state.pictureCounter === 1) {
        // Add explanation for voltage law
        infoBtn.setAttribute("data-bs-target", "#kirchhoffVInfoGif");
        infoBtn.id = "open-info-gif-btn-1";
    } else if (state.pictureCounter === 2) {
        // Add explanation for current law
        infoBtn.setAttribute("data-bs-target", "#kirchhoffIInfoGif");
        infoBtn.id = "open-info-gif-btn-2";
    }
    infoBtn.onclick = () => {infoBtn.blur()};  // make sure focus is removed when opening modal
    svgDiv.insertAdjacentElement("afterbegin", infoBtn);
}