function setupNextElementsVoltageLawContainer() {
    const nextElementsContainer = document.createElement('div');
    nextElementsContainer.className = 'next-elements-container';
    nextElementsContainer.id = "nextElementsContainer";
    nextElementsContainer.classList.add("text-center", "py-1", "mb-3");
    nextElementsContainer.style.color = colors.currentForeground;
    nextElementsContainer.innerHTML = `
        <h5>${languageManager.currentLang.nextElementsVoltLawHeading}</h5>
        <ul class="px-0" id="next-elements-list"></ul>
        <div class="mb-3">
            <button class="btn btn-secondary mx-1 ${state.pictureCounter===1?"disabled":""}" id="reset-btn">reset</button>
            <button class="btn btn-primary mx-1" id="check-btn">check</button>
        </div>  
        <button class="btn btn-secondary mx-1" id="next-btn">${languageManager.currentLang.junctionBtn}</button>
    `;
    nextElementsContainer.querySelector("#reset-btn").addEventListener('click', () => {
        pushCircuitEventMatomo(circuitActions.Reset, state.pictureCounter);
        resetKirchhoffPage(true);
    });
    let checkBtn = nextElementsContainer.querySelector("#check-btn");
    checkBtn.addEventListener('click', async () => {
        checkBtn.innerHTML = "<span class='spinner-border spinner-border-sm'></span>";
        await checkVoltageLoop();
        checkBtn.innerHTML = "check";
    });
    let nextBtn = nextElementsContainer.querySelector("#next-btn");
    nextBtn.addEventListener('click', async () => {
        if (await state.kirchhoffSolverAPI.foundAllVoltEquations()) {
            // Remove last svg
            let svgDiv = document.getElementById(`svgDivVolt${state.pictureCounter}`).parentElement;
            svgDiv.remove();
            //for (let i = 0; i <= state.pictureCounter; i++) {
             //   removeSvgEventHandlers(`svgDivVolt${i}`);
            //}
            state.selectedElements = [];
            await nextKirchhoffCurrStep(true);
            scrollContainerToTop(document.getElementById("junctionHeading"));
        } else {
            setTimeout(() => {
                showMessage(languageManager.currentLang.alertNotAllVoltLoopsFound, "warning");
            });
        }
    });

    return nextElementsContainer;
}

function setupNextElementsCurrentLawContainer() {
    const nextElementsContainer = document.createElement('div');
    nextElementsContainer.className = 'next-elements-container';
    nextElementsContainer.id = "nextElementsContainer";
    nextElementsContainer.classList.add("text-center", "py-1", "mb-3");
    nextElementsContainer.style.color = colors.currentForeground;
    nextElementsContainer.innerHTML = `
        <h5>${languageManager.currentLang.nextElementsCurrentHeading}</h5>
        <ul class="px-0" id="next-elements-list"></ul>
        <div class="mb-3">
            <button class="btn btn-secondary mx-1" id="reset-btn">reset</button>
            <button class="btn btn-primary mx-1" id="check-btn">check</button>
        </div>
        <button class="btn btn-secondary mx-1" id="finish-btn">${languageManager.currentLang.finishBtn}</button>
    `;
    nextElementsContainer.querySelector("#reset-btn").addEventListener('click', () => {
        pushCircuitEventMatomo(circuitActions.Reset, state.pictureCounter);
        resetKirchhoffPage(true);
    });
    let checkBtn = nextElementsContainer.querySelector("#check-btn");
    checkBtn.addEventListener('click', async () => {
        checkJunctionLaw();
    });
    let finishBtn = nextElementsContainer.querySelector("#finish-btn");
    finishBtn.addEventListener('click', async () => {
        checkFinishKirchhoff();
    });
    return nextElementsContainer;
}

async function checkFinishKirchhoff() {
    let contentCol = document.getElementById("content-col");
    let allEqsFound = await state.kirchhoffSolverAPI.foundAllEquations();
    if (allEqsFound) {
        finishKirchhoff(contentCol);
    } else {
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertNotAllEquationsFound, "warning");
        }, 0);
    }
}

async function solveFirstStep() {
    let obj = await state.simplifierAPI.createStep0();
    obj.__proto__ = Step0Object.prototype;
    state.step0Data = obj;
    state.currentStep = 0;
}

function generateMultipleChoiceEquations(eqs) {
    let nextElementList = document.querySelector('#nextElementsContainer ul');
    nextElementList.innerHTML = languageManager.currentLang.chooseCorrectEquation;

    eqs = eqs.map((eq, index) => ({
        equation: eq,
        isCorrect: index === 0 // always the correct equation at position 0
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
}

function subtract1Live() {
    if (!state.gamification) return;

    let lives = document.getElementById("lives");
    if (lives.innerHTML === "3") {
        lives.innerHTML = "2";
        showBrokenHeart();
    } else if (lives.innerHTML === "2") {
        lives.innerHTML = "1";
        showBrokenHeart();
    } else if (lives.innerHTML === "1") {
        lives.innerHTML = "0";
        showBrokenHeart();

        setTimeout(() => {
            let msg = document.getElementById("alert-msg");
            if (msg !== null) {
                // for the error message that created the live subtraction
                msg.remove();
                document.removeEventListener("click", removeMsgHandler);
            }
            if (state.extraLiveUsed) {
                let modal = document.getElementById("gameOverModal");
                let modalInstance = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
                modalInstance.show();
            } else {
                setupModalQuestions();
                let modal = document.getElementById("extraLiveModal");
                let modalInstance = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
                modalInstance.show();
            }
        },0);

        document.getElementById("check-btn").classList.add("disabled");
        let cb1 = document.getElementById("option0");
        let cb2 = document.getElementById("option1");
        let cb3 = document.getElementById("option2");
        for (let cb of [cb1, cb2, cb3]) {
            if (cb !== null) cb.disabled = true;
        }
        let resetBtn = document.getElementById("reset-btn");
        if (resetBtn.classList.contains("disabled")) {
            resetBtn.classList.remove("disabled");
        }
    }
}

function setupModalQuestions() {
    let questionParagraph = document.getElementById("extra-live-question");
    // Choose question
    // TODO random question
    let set = languageManager.currentLang.q1;

    let question = set.q;
    let answers = set.a;
    shuffleArray(answers);

    questionParagraph.innerHTML = question;

    let answerBox1 = document.getElementById("saveLive1");
    let answerBox2 = document.getElementById("saveLive2");
    let answerBox3 = document.getElementById("saveLive3");
    let answerBox4 = document.getElementById("saveLive4");
    for (let [i, eq] of [answerBox1, answerBox2, answerBox3, answerBox4].entries()) {
        eq.style.margin = "5px";
        eq.style.padding = "10px";
        eq.style.border = `1px solid ${colors.currentForeground}`;
        eq.style.borderRadius = "5px";
        eq.style.color = colors.currentForeground;
        eq.innerHTML = answers[i][0];
        eq.value = answers[i][1];

        eq.addEventListener("click", () => {
            if (eq.value === 1) {
                eq.style.border = `1px solid ${colors.keyYellow}`;
                eq.style.backgroundColor = colors.keyYellow;
                eq.style.color = colors.currentBackground;
                let img = document.getElementById("extra-live-mascot-img");
                img.src = "./src/resources/mascot/smiling.svg";
                img.style.transform = "rotate(-6deg)";
                let lives = document.getElementById("lives");
                lives.innerHTML = "1";
                let modal = document.getElementById("extraLiveModal");
                let modalInstance = bootstrap.Modal.getInstance(modal);
                setTimeout(() => {
                    modalInstance.hide();
                }, 750);
                let checkBtn = document.getElementById("check-btn");
                if (checkBtn.classList.contains("disabled")) {
                    checkBtn.classList.remove("disabled");
                }
                state.extraLiveUsed = true;
            } else {
                eq.style.border = "1px solid #888";
                eq.style.color = "#888";
            }
        });
    }


}

function showWrongSelection(checkBoxId) {
    setTimeout(() => {
        let nextElementList = document.querySelector('#nextElementsContainer ul');
        let checkBox = nextElementList.querySelector(`#${checkBoxId}`);
        checkBox.style.backgroundColor = colors.wrongEquationColor;
        checkBox.style.borderColor = colors.wrongEquationColor;
        checkBox.disabled = true;
        subtract1Live();

    }, 250);
}

function addLivesField() {
    let live = document.getElementById("lives");
    if (live === null) {
        let logo = document.getElementById("nav-logo");
        logo.hidden = true;
        let toggler = document.getElementById("nav-toggler");
        let heartDiv = document.createElement("div");
        heartDiv.id = "heart-container";
        heartDiv.innerHTML = `<svg id='hearts' xmlns=\"http://www.w3.org/2000/svg\" shape-rendering=\"geometricPrecision\" text-rendering=\"geometricPrecision\" image-rendering=\"optimizeQuality\" fill-rule=\"evenodd\" clip-rule=\"evenodd\" viewBox=\"0 0 512 456.079\"><path fill=\"${colors.keyYellow}\" d=\"M253.647 83.481c130.392-219.054 509.908 65.493-.512 372.598-514.787-328.94-101.874-598.694.512-372.598z\"/><path fill=\"#F4B34A\" d=\"M344.488 10.579c146.33-39.079 316.839 185.127-65.021 429.133C561.646 215.547 470.393 36.15 344.488 10.579zM121.413.645C170.08-4.2 221.438 18.567 250.749 77.574a201.544 201.544 0 013.537 11.587c10.541 34.29.093 49.643-12.872 50.552-18.137 1.271-20.216-14.851-24.967-27.643C192.689 48.096 158.774 12.621 116.43 1.862c1.653-.434 3.315-.84 4.983-1.217z\"/><path fill=\"#FBE393\" d=\"M130.558 35.501c-42.657-4.246-87.652 23.898-99.173 66.067-7.868 25.593-.07 37.052 9.607 37.73 13.537.949 15.088-11.084 18.635-20.632 17.732-47.748 43.045-74.226 74.65-82.256a107.173 107.173 0 00-3.719-.909z\"/></svg>`;
        let heart = heartDiv.firstChild;
        heart.style.height = "15px";
        let lives = document.createElement("span");
        lives.id = "lives";
        lives.style.color = colors.currentForeground;
        lives.innerHTML = "3";
        lives.style.fontFamily = "Roboto Condensed";
        lives.style.fontSize = "large";
        lives.style.fontWeight = "bold";
        lives.style.paddingLeft = "5px";
        lives.style.paddingTop = "5px";
        heartDiv.appendChild(lives);
        toggler.insertAdjacentElement("afterend", heartDiv);
    } else {
        live.innerHTML = "3";
    }
}

function showBrokenHeart() {
    // Create overlay in middle of the visible screen
    let hearts = document.getElementById("hearts");
    let overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = hearts.getBoundingClientRect().top + "px";
    overlay.style.left = hearts.getBoundingClientRect().left + "px";
    overlay.style.zIndex = "2000";
    overlay.innerHTML = `<svg xmlns=\"http://www.w3.org/2000/svg\" shape-rendering=\"geometricPrecision\" text-rendering=\"geometricPrecision\" image-rendering=\"optimizeQuality\" fill-rule=\"evenodd\" clip-rule=\"evenodd\" viewBox=\"0 0 512 446.552\"><path fill=\"${colors.keyYellow}\" d=\"M274.352 55.023c142.916-160.902 456.84 102.665-4.677 390.935l3.115-65.418 31.764-47.077c2.92-4.337 3.598-10.039 1.291-15.155L258.8 214.786l45.415-56.166c3.296-4.106 4.434-9.784 2.507-15.098l-32.37-88.499zm-35.95 391.529c-481.053-317.395-103.859-575.206 7.958-377.206l27.999 76.552-45.933 56.8c-3.805 4.734-4.398 11.011-2.078 16.201l47.41 104.324-29.303 43.414a15.556 15.556 0 00-2.671 8.917l-3.382 70.998z\"/><path fill=\"#F4B34A\" d=\"M121.349.632c46.356-4.613 95.153 15.818 125.022 68.746l9.84 26.902 17.709 48.533c-34.378 2.414-53.845-26.353-65.657-52.676-23.124-51.495-54.164-80.699-91.898-90.285 1.654-.435 3.316-.841 4.984-1.22zM344.485 10.57c146.37-39.089 316.925 185.178-65.038 429.25C561.702 215.594 470.424 36.148 344.485 10.57z\"/><path fill=\"#FBE393\" d=\"M130.498 35.5c-42.67-4.248-87.676 23.904-99.2 66.084-7.87 25.6-.07 37.062 9.609 37.741 13.541.948 15.093-11.087 18.64-20.638 17.737-47.761 43.057-74.246 74.671-82.279a108.342 108.342 0 00-3.72-.908z\"/></svg>`;
    let svg = overlay.querySelector("svg");
    svg.style.height = "17px";
    // Ease in display of overlay
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.1s ease-in, transform 1s ease-in-out, scale 1s ease-in-out";
    document.body.appendChild(overlay);
    // Fade-in-Effect
    setTimeout(() => {
        overlay.style.opacity = "1";
    }, 50);

    setTimeout(() => {
        overlay.style.transition = "opacity 1s ease-in, transform 1s ease-in-out, scale 1s ease-in-out";
        overlay.style.transform = "translate(-400%, 400%) scale(5)";
        overlay.style.opacity = "0";
    }, 250);

    setTimeout(() => {
        overlay.remove();
    }, 2500);
}

function adaptTranslation(checkBox) {
    // Adapt equation float to the correct height
    const sheet = Array.from(document.styleSheets).find(sheet =>
        Array.from(sheet.cssRules).some(rule => rule instanceof CSSKeyframesRule && rule.name === 'floatAndFadeOut')
    );

    const keyframesRule = Array.from(sheet.cssRules).find(
        rule => rule instanceof CSSKeyframesRule && rule.name === 'floatAndFadeOut'
    );

    if (keyframesRule) {
        const toRule = Array.from(keyframesRule.cssRules).find(rule => rule.keyText === '100%');
        if (toRule) {
            // get the correct translation, being the difference between the correct equation
            // and the bottom of the last svg + offset
            let y;
            let equationPos = checkBox.getBoundingClientRect().top + checkBox.getBoundingClientRect().height / 2;
            let goalPos = document.getElementById(`svgDivCurr${state.pictureCounter}`).getBoundingClientRect().bottom;
            y = equationPos - goalPos + 60;
            toRule.style.transform = `translateY(${y})`;
        }
    }
}

async function showCorrectSelection(checkBoxId) {
    let nextElementList = document.querySelector('#nextElementsContainer ul');
    let checkBox = nextElementList.querySelector(`#${checkBoxId}`);
    let label = document.querySelector(`label[for=${checkBoxId}]`);

    // Adapt translation for the correct equation
    adaptTranslation(checkBox);

    setTimeout(() => {
        checkBox.style.backgroundColor = colors.correctEquationColor;
        checkBox.style.borderColor = colors.correctEquationColor;
    }, 250);
    await new Promise(resolve => setTimeout(resolve, 250)); // Wait for animation to start
    label.classList.add("fade-out");
    await new Promise(resolve => setTimeout(resolve, 750)); // Wait for animation to fade out
}

async function showEquations(contentCol) {
    //let equationsContainer = document.getElementById("equations-container");
    //equationsContainer.innerHTML = "";
    let equations = await createEquationsOverviewContainer();
    contentCol.append(equations);
}

async function getCurrentEquationNr() {
    let equations = await state.kirchhoffSolverAPI.equations();
    // get nr of equation from this list where the element is not "-"
    let eqNr = 0;
    for (let i = 0; i < equations.length; i++) {
        if (equations[i] !== "-") {
            eqNr++;
        }
    }
    return eqNr;
}

async function updateEquations() {
    let equationContainer = document.getElementById("equations-overview-container");
    equationContainer.innerHTML = languageManager.currentLang.missingEquations;
    equationContainer.appendChild(getEquationsTable(await state.kirchhoffSolverAPI.equations()));
}

async function waitForCorrectSelection() {
    for (let i = 0; i < 10; i++) {
        const {checkBoxId, isCorrectEq} = await waitForCheckboxSelection();

        if (isCorrectEq) {
            await showCorrectSelection(checkBoxId);
            break;
        } else {
            showWrongSelection(checkBoxId);
        }
    }
}

function waitForCheckboxSelection() {
    let nextElementsContainer = document.getElementById("nextElementsContainer");
    let nextElementList = nextElementsContainer.querySelector('ul');
    return new Promise(resolve => {
        nextElementList.addEventListener('change', function handler(event) {
            if (event.target.classList.contains('form-check-input')) {
                const selectedValue = event.target.value;
                const selectedId = event.target.id;
                resolve({checkBoxId: selectedId, isCorrectEq: selectedValue === "1"});
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
    if (errorCode === 1) {
        // Equation already exists
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertLoopAlreadyExists, "warning");
        }, 0);
       subtract1Live();
    } else if (errorCode === 2) {
        // Invalid selection
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertInvalidVoltageLoop, "warning");
        }, 0);
        subtract1Live();
    } else if (errorCode === 3) {
        // Only for junction law
    } else if (errorCode === 4) {
        // Not a valid loop order
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertInvalidLoopOrder, "warning");
        }, 0);
    } else {
        // Default error
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertSomethingIsWrong, "warning");
        }, 0);
    }
}

function handleJunctionError(errorCode, svgDiv) {
    if (errorCode === 1) {
        // Equation already exists
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertJunctionAlreadyExists, "warning");
        }, 0);
        subtract1Live();
    } else if (errorCode === 2) {
        // Invalid selection
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertInvalidJunction, "warning");
        }, 0);
        subtract1Live();
    } else if (errorCode === 3) {
        // Only for junction law, if more than 2 elements in series are chosen we can't generate
        // one equation but two, I1 = I2 = I3, but we want I1 = I2 and I2 = I3
        // So throw error if more than 2 series elements are chosen
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertTooManyJunctionNodes, "warning");
        }, 0);
        subtract1Live();
    } else if (errorCode === 4) {
        // Only for voltage law
    } else {
        // Default error
        setTimeout(() => {
            showMessage(languageManager.currentLang.alertSomethingIsWrong, "warning");
        }, 0);
    }
}

async function initSolverObjects(circuitMap) {
    if (state.simplifierAPI !== null) {
        await state.simplifierAPI.resetStepSolver();
    }
    if (state.kirchhoffSolverAPI !== null) {
        await state.kirchhoffSolverAPI.resetKirchhoffSolver();
    }

    let paramMap = new Map();
    paramMap.set("volt", languageManager.currentLang.voltageSymbol);
    paramMap.set("total", languageManager.currentLang.totalSuffix);

    // For Kirchhoff, we know, that pyodide must be ready, so we can use the StepSolverAPI instead of the hardcoded API
    state.simplifierAPI = new StepSolverAPI(worker);
    await state.simplifierAPI.initStepSolver(circuitMap.circuitFile, `${conf.pyodideCircuitPath}/${circuitMap.sourceDir}`, paramMap);

    state.kirchhoffSolverAPI = new KirchhoffSolverAPI(worker);
    await state.kirchhoffSolverAPI.initKirchhoffSolver(circuitMap.circuitFile, `${conf.pyodideCircuitPath}/${circuitMap.sourceDir}`, paramMap);
}

function createVoltHeading() {
    let voltHeading = document.createElement("h3");
    voltHeading.innerHTML = languageManager.currentLang.kirchhoffVoltageHeading;
    voltHeading.style.color = colors.currentForeground;
    return voltHeading;
}

function createEquationsContainer() {
    let equationsContainer = document.createElement("div");
    equationsContainer.id = "equations-container";
    equationsContainer.style.color = colors.currentForeground;
    return equationsContainer;
}

async function createEquationsOverviewContainer() {
    let equations = document.createElement("div");
    equations.id = "equations-overview-container";
    equations.style.color = colors.currentForeground;
    equations.classList.add("text-center", "py-1", "mb-3", "mx-auto");
    let text = document.createElement("p");
    text.classList.add("text-center", "my-3", "mx-auto");
    text.innerHTML = languageManager.currentLang.missingEquations;
    text.style.color = colors.currentForeground;
    text.style.maxWidth = "350px";
    equations.appendChild(text);
    let eqs = await state.kirchhoffSolverAPI.equations();
    // Filter out "-" equations
    eqs = eqs.filter(eq => eq !== "-");
    equations.appendChild(getEquationsTable(eqs));

    return equations;
}

function createCurrentHeading() {
    let currentHeading = document.createElement("h3");
    currentHeading.innerHTML = languageManager.currentLang.kirchhoffCurrentHeading;
    currentHeading.style.color = colors.currentForeground;
    currentHeading.classList.add("pt-3");
    currentHeading.id = "junctionHeading";
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
    // TODO sources list []
    state.allValuesMap.set("element_" + state.step0Data.source.sources.U.name, state.step0Data.source.sources.Z.name);
    state.allValuesMap.set("volt_" + state.step0Data.source.sources.Z.name, state.step0Data.source.sources.U.name);
}

function addKirchhoffComponentValues(component) {
    if (component.Z.name !== null && component.Z.name !== undefined) {
        if (component.hasConversion) {
            state.allValuesMap.set(component.Z.name, component.Z.val);
        } else {
            state.allValuesMap.set(component.Z.name, component.Z.impedance);
        }
        if (state.step0Data.componentTypes === "RLC") {
            state.allValuesMap.set(`Z_{${component.Z.name}}`, component.Z.cpxVal);
            state.allValuesMap.set(`Zpolar_{${component.Z.name}}`, toPolar(component.Z.impedance, component.Z.phase));
            state.allValuesMap.set(component.U.name, toPolar(component.U.val, component.U.phase));
            state.allValuesMap.set(component.I.name, toPolar(component.I.val, component.I.phase));
        } else {
            state.allValuesMap.set(component.U.name, component.U.val);
            state.allValuesMap.set(component.I.name, component.I.val);
        }
        // To map U1 to R1, I1 to R1
        state.allValuesMap.set(`element_${component.U.name}`, component.Z.name);
        state.allValuesMap.set(`element_${component.I.name}`, component.Z.name);
        // To map from R1 to U1, R1 to I1
        state.allValuesMap.set(`volt_${component.Z.name}`, component.U.name);
        state.allValuesMap.set(`curr_${component.Z.name}`, component.I.name);
    }
}

function makeElementsClickableForKirchhoff(svgContainer, nextElementsContainer, electricalElements, selector) {
    const nextElementsList = nextElementsContainer.querySelector(`#next-elements-list`);
    electricalElements.forEach(element => setKirchhoffStyleAndEvent(svgContainer, element, nextElementsList, selector));
}

function setKirchhoffStyleAndEvent(svgContainer, element, nextElementsList, selector) {
    element.style.cursor = "pointer";
    element.addEventListener('click', () => {
        chooseKirchhoffElement(svgContainer, element, nextElementsList, selector);
    });
}

function checkIfAlreadySelected(nextElementsList, element) {
    let alreadyClicked = false,
        nextElements = nextElementsList.querySelectorAll("li");
    for (let nextElement of nextElements) {
        let id = "li-" + element.classList[2];
        if (nextElement.id === id) {
            alreadyClicked = true;
            break;
        }
    }
    return alreadyClicked;
}

function selectKirchArrow(svgContainer, element) {
    highlightElement(element);
    let arrows = svgContainer.querySelectorAll(`path.arrow.${element.classList[2]}`);
    for (let arrow of arrows) {
        highlightElement(arrow);
    }
}

function chooseKirchhoffElement(svgContainer, element, nextElementsList, selector) {
    let alreadyClicked = checkIfAlreadySelected(nextElementsList, element);
    if (alreadyClicked) {
        unselectKirchArrow(svgContainer, element, selector);
    }
    else {
        selectKirchArrow(svgContainer, element);
        addKirchhoffElementToTextBox(element, nextElementsList);
    }
    MathJax.typeset();
}

function resetArrowHighlights(svgDiv) {
    let arrows = svgDiv.querySelectorAll(".arrow");
    for (let arrow of arrows) {
        removeHighlight(arrow);
    }
}

function highlightElement(element) {
    element.style.fontWeight = "bold";
    if (element.classList.contains("voltage-label")) {
        element.style.color = "#9898ff";
        element.style.stroke = "#9898ff";
        element.style.fill = "#9898ff";
    } else {
        element.style.color = "red";
        element.style.stroke = "red";
        element.style.fill = "red";
    }
}

function lightHighlightElement(svgDiv, element, selector) {
    // Check if element is of type string
    let volt_name = "";
    let curr_name = "";

    if (typeof element === "string") {
        let id = element;
        // Translate Rx to Ux
        if (selector === "volt") {
            volt_name = state.allValuesMap.get("volt_" + id);
        } else {
            curr_name = state.allValuesMap.get("curr_" + id);
        }
    } else {
        // Element is node (for example arrow), symbol is in class name
        if (selector === "volt") {
            volt_name = element.classList[2];
        } else {
            curr_name = element.classList[2];
        }
    }
    if (selector === "volt") {
        let ele = svgDiv.querySelectorAll(`.voltage-label.arrow.${volt_name}`);
        for (let e of ele) {
            e.style.fontWeight = "normal";
            e.style.color = colors.lightVoltageBlue;
            e.style.stroke = colors.lightVoltageBlue;
            e.style.fill = colors.lightVoltageBlue;
        }
    } else if (selector === "curr") {
        let ele = svgDiv.querySelectorAll(`.current-label.arrow.${curr_name}`);
        for (let e of ele) {
            e.style.fontWeight = "normal";
            e.style.color = colors.lightCurrentRed;
            e.style.stroke = colors.lightCurrentRed;
            e.style.fill = colors.lightCurrentRed;
        }
    }
}

function grayOutElement(element) {
    element.style.fontWeight = "normal";
    element.style.color = colors.kirchhoffGray;
    element.style.stroke = colors.kirchhoffGray;
    element.style.fill = colors.kirchhoffGray;
}

function removeHighlight(element) {
    element.style.fontWeight = "normal";
    element.style.color = colors.currentForeground;
    element.style.stroke = colors.currentForeground;
    element.style.fill = colors.currentForeground;
}

function elementMarkedDone(element, selector) {
    let elementId = "";
    if (selector === "volt") {
        elementId = state.allValuesMap.get("element_" + element.classList[2]);
    } else {
        elementId = state.allValuesMap.get("element_" + element.classList[2]);
    }
    if (selector === "volt") {
        return state.doneVoltages.includes(elementId);
    } else if (selector === "curr") {
        return state.doneCurrents.includes(elementId);
    }
}

function unselectKirchArrow(svgContainer, element, selector) {
    let arrows = svgContainer.querySelectorAll(`path.arrow.${element.classList[2]}`);

    if (elementMarkedDone(element, selector)) {
        lightHighlightElement(svgContainer, element, selector);
        for (let arrow of arrows) {
            lightHighlightElement(svgContainer, arrow, selector);
        }
    } else {
        removeHighlight(element);
        for (let arrow of arrows) {
            removeHighlight(arrow);
        }
    }

    const listItem = document.querySelector(`#li-${element.classList[2]}`);
    if (listItem) {
        listItem.remove();
        let correspondingElement = state.allValuesMap.get("element_" + element.classList[2]);
        state.selectedElements = state.selectedElements.filter(e => e !== correspondingElement);
    }
}

function addKirchhoffElementToTextBox(element, nextElementsList) {
    let name = element.classList[2];
    let listItem = document.createElement('li');
    listItem.innerHTML = `\\(${name}\\)`;
    listItem.setAttribute("id", "li-" + name);
    nextElementsList.appendChild(listItem);
    state.selectedElements.push(state.allValuesMap.get("element_" + name));
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

async function resetKirchhoffPage(calledFromResetBtn = false) {
    clearSimplifierPageContent();
    showSpinnerLoadingCircuit();
    state.valuesShown = new Map();
    state.selectedElements = [];
    state.pictureCounter = 0;
    state.allValuesMap = new Map();
    state.doneVoltages = [];
    state.doneCurrents = [];
    state.voltEquations = [];
    state.extraLiveUsed = false;
    resetExtraLiveModal();
    scrollBodyToTop();
    if (calledFromResetBtn) {
        startKirchhoff();  // Draw the first picture again
    }
}


function appendResetBtn(contentCol) {
    let resetContainer = document.createElement("div");
    resetContainer.classList.add("text-center", "justify-content-center", "mt-4");
    resetContainer.innerHTML = `
                    <button class="btn btn-secondary mx-1" id="reset-btn">reset</button>
                `;
    resetContainer.querySelector("#reset-btn").addEventListener('click', () => {
        pushCircuitEventMatomo(circuitActions.Reset, state.pictureCounter);
        resetKirchhoffPage(true);
    });
    contentCol.appendChild(resetContainer);
}

function createValuesContainer() {
    const valuesContainer = document.createElement("div");
    valuesContainer.id = "valuesContainer";
    valuesContainer.classList.add("container", "mb-5", "justify-content-center");
    valuesContainer.style.color = colors.currentForeground;

    let list = document.createElement("ul");
    list.style.lineHeight = "2";
    list.style.padding = "0";

    let given = document.createElement("li");
    given.innerHTML = languageManager.currentLang.givenValues;
    list.appendChild(given);

    let source = document.createElement("li");
    source.innerHTML = `\\(${languageManager.currentLang.voltageSymbol}${languageManager.currentLang.totalSuffix}=${getSourceVoltageVal()}\\)`;
    list.appendChild(source);

    for (let element of state.step0Data.allComponents) {
        let liElement = document.createElement("li");
        liElement.innerHTML = `\\(${element.Z.name}=${element.Z.val}\\)`;
        list.appendChild(liElement);
    }
    valuesContainer.appendChild(list);
    return valuesContainer;
}

function createKirchhoffSolutions() {
    const solBtnContainer = createSolutionsBtnContainer();
    const solutionsBtn = createSolutionsBtn();
    solBtnContainer.appendChild(solutionsBtn);
    prepareAllValuesMap();
    let table = generateSolutionsTable();
    let results = document.createElement("div");
    results.classList.add("circuit-container", "row", "justify-content-center");
    results.appendChild(table);
    solutionsBtn.addEventListener("click", () => {
        if (solutionsBtn.textContent === languageManager.currentLang.solutionsBtn) {
            // Open explanation
            solutionsBtn.textContent = languageManager.currentLang.hideVoltageBtn;
            solBtnContainer.appendChild(results);
            MathJax.typeset();
            pushCircuitEventMatomo(circuitActions.ViewSolutions);
        } else {
            // Close explanation
            solutionsBtn.textContent = languageManager.currentLang.solutionsBtn;
            solBtnContainer.removeChild(results);
        }
    })
    return solBtnContainer;
}

function removeSvgEventHandlers(id) {
    let svgDiv = document.getElementById(id);
    if (svgDiv === null) return;
    let svg = svgDiv.querySelector("svg");
    let svgClone = svg.cloneNode(true);
    svgDiv.replaceChild(svgClone, svg);
}

function resetExtraLiveModal() {
    if (state.gamification) {
        let img = document.getElementById("extra-live-mascot-img");
        img.src = "./src/resources/mascot/sad.svg";
        img.style.transform = "rotate(6deg) scale(0.5)";
        let eq1 = document.getElementById("saveLive1");
        let eq2 = document.getElementById("saveLive2");
        let eq3 = document.getElementById("saveLive3");
        let eq4 = document.getElementById("saveLive4");
        for (let eq of [eq1, eq2, eq3, eq4]) {
            eq.style.border = `1px solid ${colors.currentForeground}`;
            eq.style.backgroundColor = "transparent";
            eq.style.color = colors.currentForeground;
            eq.value = 0;
        }
    }
}

function allVoltagesDone(svgDiv) {
    // Check if all elements including the source are grayed out
    let arrows = svgDiv.querySelectorAll("text.voltage-label.arrow");
    for (let arrow of arrows) {
        if (arrow.getAttribute("value") !== "done") {
            return false;
        }
    }
    return true;
}

function markVoltagesDone() {
    for (let elementId of state.selectedElements) {
        state.doneVoltages.push(elementId);
    }
}

function markCurrentsDone() {
    for (let elementId of state.selectedElements) {
        state.doneCurrents.push(elementId);
    }
}

function createSolutionsContainer() {
    let solutionsContainer = document.createElement("div");
    solutionsContainer.id = "solutions-container";
    solutionsContainer.style.color = colors.currentForeground;
    solutionsContainer.classList.add("text-center", "py-1", "mb-3", "mx-auto");
    solutionsContainer.innerHTML = "languageManager.currentLang.solutions";
    return solutionsContainer;
}

function setupKirchhoffStep(selector, first=false) {
    const circuitContainer = document.createElement('div');
    circuitContainer.classList.add("circuit-container", "row", "justify-content-center", "mt-4", "mb-2");
    const svgContainer = setupKirchhoffSVGandData(selector, state.step0Data, first);
    circuitContainer.appendChild(svgContainer)
    return {circuitContainer, svgContainer};
}

function setupKirchhoffSVGandData(selector, stepObject, first) {
    let svgData = stepObject.svgData;
    const svgDiv = document.createElement('div');
    if (selector === "volt") {
        svgDiv.id = `svgDivVolt${state.pictureCounter}`;
    } else if (selector === "curr") {
        svgDiv.id = `svgDivCurr${state.pictureCounter}`;
    }
    svgDiv.classList.add("svg-container", "p-2");
    svgData = setSvgWidthTo(svgData, "100%");
    svgDiv.style.border = `1px solid ${colors.currentForeground}`;
    svgDiv.style.borderRadius = "6px";
    svgDiv.style.width = "350px";
    svgDiv.style.maxWidth = "350px;";
    svgDiv.style.position = "relative";

    // Svg manipulation
    svgData = setKirchSvgColorToGray(svgData);
    svgDiv.innerHTML = svgData;
    let containsZ = divContainsZLabels(svgDiv);

    if (svgDiv.id === "svgDivVolt1" || containsZ) {
        // First svg, set valuesShown to false
        // Also set to zero if labels contain Z because they can't be toggled
        state.valuesShown.set(svgDiv.id, false);
    } else {
        // Set valuesShown to the previous state
        if (selector === "volt") {
            state.valuesShown.set(svgDiv.id, state.valuesShown.get(`svgDivVolt${state.pictureCounter - 1}`));
        } else if (selector === "curr") {
            state.valuesShown.set(svgDiv.id, state.valuesShown.get(`svgDivCurr${state.pictureCounter - 1}`));
        }
    }

    fillLabels(svgDiv);
    colorArrows(svgDiv);

    increaseLabelFontSize(svgDiv);
    hideSourceLabel(svgDiv);
    hideElementLabels(svgDiv);

    if (selector === "volt") {
        hideCurrentArrows(svgDiv);
        for (let element of state.doneVoltages) {
            lightHighlightElement(svgDiv, element, selector);
        }
    } else if (selector === "curr") {
        hideVoltageArrows(svgDiv);
        hideItotArrow(svgDiv);
        for (let element of state.doneCurrents) {
            lightHighlightElement(svgDiv, element, selector);
        }
    }

    // SVG Data written, now add eventListeners, only afterward because they would be removed on rewrite of svgData
    // Add button on first voltage and first current svg
    if (state.pictureCounter === 1 || first) {
        addKirchhoffInfoHelpButton(svgDiv);
    }

    return svgDiv;
}

function addEquationToSvg(svgDiv, nr, eq, color) {
    let overlay = document.createElement("div");
    overlay.id = `equation-overlay${state.pictureCounter}`;
    let table = document.createElement("table");
    table.classList.add("table", "table-borderless", "mx-auto");
    if (colors.currentBackground === colors.keyDark) {
        table.classList.add("table-dark");
    } else {
        table.classList.add("table-light");
    }
    table.style.width = "fit-content";
    let row = table.insertRow();
    let cell = row.insertCell();
    cell.innerHTML = `\\(\\mathrm{${romanNumbersMap.get(nr)}})\\)`;
    cell = row.insertCell();
    cell.innerHTML = `\\(${eq}\\)`;
    table.querySelectorAll("td").forEach(td => {
            td.style.textAlign = "left";
            td.style.color = color;
        }
    );
    overlay.appendChild(table);
    svgDiv.appendChild(overlay);
}

function colorArrows(svgDiv) {
    let labels = svgDiv.querySelectorAll(".arrow");
    for (let label of labels) {
        if (label.classList.contains("voltage-label")) {
            label.style.color = colors.currentForeground;
            label.style.stroke = colors.currentForeground;
            label.style.fill = colors.currentForeground;
        } else if (label.classList.contains("current-label")) {
            label.style.color = colors.currentForeground;
            label.style.stroke = colors.currentForeground;
            label.style.fill = colors.currentForeground;
        }
    }
}

function increaseLabelFontSize(svgDiv) {
    let labels = svgDiv.querySelectorAll("text.arrow");
    labels.forEach(label => label.style.fontSize = "20px");
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
    } else {
        // Add explanation for current law
        infoBtn.setAttribute("data-bs-target", "#kirchhoffIInfoGif");
        infoBtn.id = "open-info-gif-btn-2";
    }
    infoBtn.onclick = () => {infoBtn.blur()};  // make sure focus is removed when opening modal
    svgDiv.insertAdjacentElement("afterbegin", infoBtn);
}

function setKirchSvgColorToGray(svgData) {
    return svgData.replaceAll(colors.lightModeSvgStrokeColor, "gray");
}