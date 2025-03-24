function showWaitingNote() {
    const note = document.getElementById("progress-bar-note");
    note.style.color = colors.currentForeground;
    note.innerHTML = languageManager.currentLang.selectorWaitingNote;
    return note;
}

function enableStartBtnAndSimplifierLink() {
    document.getElementById("nav-select").classList.remove("disabled");
    document.getElementById("start-button").classList.remove("disabled");
    document.getElementById("start-button").style.animation = "pulse 2s infinite";
}

function disableStartBtnAndSimplifierLink() {
    document.getElementById("nav-select").classList.add("disabled");
    document.getElementById("start-button").classList.add("disabled");
    document.getElementById("start-button").style.animation = "";
}

function sanitizeSelector(selector) {
    return selector.replace(/[^\w-]/g, '_');
}

function hideAllSelectors() {
    for (const circuitSet of circuitMapper.circuitSets) {
        const carousel = document.getElementById(`${circuitSet.identifier}-carousel`);
        const heading = document.getElementById(`${circuitSet.identifier}-heading`);
        carousel.hidden = true;
        heading.hidden = true;
    }
}

function hideQuickstart() {
    document.getElementById("quick-carousel").hidden = true;
    document.getElementById("quick-heading").hidden = true;
}

function hideAccordion() {
    document.getElementById("selector-accordion").hidden = true;
}

function showQuickstart() {
    document.getElementById("quick-carousel").hidden = false;
    document.getElementById("quick-heading").hidden = false;
}

function showAccordion() {
    document.getElementById("selector-accordion").hidden = false;
}

function showAllSelectors() {
    for (const circuitSet of circuitMapper.circuitSets) {
        const carousel = document.getElementById(`${circuitSet.identifier}-carousel`);
        const heading = document.getElementById(`${circuitSet.identifier}-heading`);
        carousel.hidden = false;
        heading.hidden = false;
    }
}

// Displays a temporary message to the user in a message box.
function showMessage(container, message, prio = "warning", fixedBottom = true, yPxHeight = 0, autoHide = true) {
    let bootstrapAlert;
    let emoji;
    if (prio === "only2") {
        emoji = onlyChoose2Emojis[Math.floor(Math.random() * onlyChoose2Emojis.length)];
        bootstrapAlert = "warning";
    } else if (prio === "warning") {
        emoji = badEmojis[Math.floor(Math.random() * badEmojis.length)];
        bootstrapAlert = "warning";
    } else if (prio === "success") {
        emoji = goodEmojis[Math.floor(Math.random() * goodEmojis.length)];
        bootstrapAlert = "success";
    } else if (prio === "info") {
        emoji = "";
        bootstrapAlert = "secondary";
    } else if (prio === "danger") {
        emoji = "";
        bootstrapAlert = "danger";
    }
    else {
        emoji = "";
        bootstrapAlert = "secondary";
    }
    const msg = document.createElement('div');
    msg.classList.add("alert", `alert-${bootstrapAlert}`);
    if (fixedBottom) {
        msg.classList.add("fixed-bottom");
        msg.style.bottom = "170px";
    } else {
        msg.style.position = "absolute";
        msg.style.top = `${yPxHeight}px`;
        msg.style.left = "0";
        msg.style.right = "0";
    }
    msg.classList.add("mx-auto");  // centers it when max-width is set
    msg.style.maxWidth = "400px";

    if (emoji !== "") {
        let emojiSpan = document.createElement('span');
        emojiSpan.style.fontSize = '1.66em';
        emojiSpan.innerHTML = emoji;
        msg.appendChild(emojiSpan);
        msg.appendChild(document.createElement('br'));
    }

    let msgSpan = document.createElement('span');
    msgSpan.innerHTML = message;
    msg.appendChild(msgSpan);
    container.appendChild(msg);

    // Remove the message when the user clicks anywhere
    // Distinction between info messages and others because info message will be created by clicking on something
    // this would already remove it again with this handler. Warning and so on are created by something done wrong
    // without a click on the screen
    if (prio !== "info") {
        document.addEventListener("click", () => {
            if (container.contains(msg)) {
                container.removeChild(msg);
            }
        });
    }
    if (autoHide) {
        // Remove the message after 3 seconds if not clicked already
        setTimeout(() => {
            if (container.contains(msg)) {
                container.removeChild(msg);
            }
        }, 3000);
    }
}

function setPgrBarTo(percent) {
    let progressBar = document.getElementById("pgr-bar");
    progressBar.style.width = `${percent}%`;
}

function clearSimplifierPageContent() {
    const contentCol = document.getElementById("content-col");
    contentCol.innerHTML = '';

    const simplifierPage = document.getElementById("simplifier-page-container");
    const selectorPage = document.getElementById("select-page-container");
    simplifierPage.classList.remove("slide-in-right");
    selectorPage.classList.remove("slide-out-left");
    selectorPage.style.opacity = "1";
}

function scrollBodyToTop() {
    window.scrollTo(0,0);
}

async function clearSolutionsDir() {
    try {
        //An array of file names representing the solution files in the Solutions directory.
        let solutionFiles = await state.pyodide.FS.readdir(`${conf.pyodideSolutionsPath}`);
        solutionFiles.forEach(file => {
            if (file !== "." && file !== "..") {
                state.pyodide.FS.unlink(`${conf.pyodideSolutionsPath}/${file}`);
            }
        });
    } catch (error) {
        console.warn("Solutions directory not found or already cleared.");
    }
}

function resetNextElementsTextAndList(nextElementsContainer) {
    const nextElementList = nextElementsContainer.querySelector('ul');
    if (nextElementList) {
        nextElementList.innerHTML = '';
    } else {
        console.warn('nextElementsContainer ul-list not found');
    }
    state.selectedElements = [];
}

function resetHighlightedBoundingBoxes(svgDiv) {
    const boundingBoxes = svgDiv.querySelectorAll('.bounding-box');
    if (boundingBoxes.length > 0) {
        boundingBoxes.forEach(box => box.remove());
    }
}

function moreThanOneCircuitInSet(circuitSet) {
    return circuitSet.set.length > 1;
}

function simplifierPageCurrentlyVisible() {
    return document.getElementById("simplifier-page-container").style.display === "block";
}

function checkIfSimplifierPageNeedsReset() {
    if (simplifierPageCurrentlyVisible()) {
        resetSimplifierPage();
    }
}

function closeNavbar() {
    const navbarToggler = document.getElementById("nav-toggler");
    navbarToggler.classList.add("collapsed");
    const navDropdown = document.getElementById("navbarSupportedContent");
    navDropdown.classList.remove("show");

    pageManager.updatePagesOpacity();
}

function resetNextElements(svgDiv, nextElementsContainer) {
    resetHighlightedBoundingBoxes(svgDiv);
    resetNextElementsTextAndList(nextElementsContainer);
}

function whenAvailable(name, callback) {
    var interval = 10; // ms
    window.setTimeout(function() {
        if (window[name]) {
            callback(window[name]);
        } else {
            whenAvailable(name, callback);
        }
    }, interval);
}

function setLanguageAndScheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkModeSwitch = document.getElementById("darkmode-switch");
    darkModeSwitch.checked = true;
    if (!prefersDark) {
        changeToLightMode();
        darkModeSwitch.checked = false;
    }

    var userLang = navigator.language;
    if (userLang === "de-DE" || userLang === "de-AT" || userLang === "de-CH" || userLang === "de") {
        languageManager.currentLang = german;
    } else {
        languageManager.currentLang = english;
    }
}

function modalConfig() {
    // This is to prevent the focus from staying on the modal when it is closed
    document.addEventListener('hide.bs.modal', function (event) {
        if (document.activeElement) {
            document.activeElement.blur();
        }
    });
}

function currentCircuitIsSymbolic() {
    return state.currentCircuitMap.selectorGroup === circuitMapper.selectorIds.symbolic;
}

function setBodyPaddingForFixedTopNavbar() {
    const navBar = document.getElementById("navbar");
    let height = navBar.offsetHeight;
    const body = document.getElementsByTagName("body")[0];
    body.style.paddingTop = height + "px";
}

function getSourceVoltageVal() {
    return state.step0Data.source.sources.U.val;
}

function getSourceCurrentVal() {
    return state.step0Data.source.sources.I.val;
}

function getSourceFrequency() {
    return state.step0Data.source.frequency;
}

function sourceIsAC() {
    return getSourceFrequency() !== "0";
}
