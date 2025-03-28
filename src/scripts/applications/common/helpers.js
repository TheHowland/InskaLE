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

function getElementsFromSvgContainer(svgContainer) {
    const pathElements = svgContainer.querySelectorAll('path');
    return Array.from(pathElements).filter(path => (path.getAttribute('class') !== 'na')
        && (!path.getAttribute('class').includes("arrow")));
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

function getClassAndEmoji(prio) {
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
    } else {
        emoji = "";
        bootstrapAlert = "secondary";
    }
    return {bootstrapAlert, emoji};
}

function createAlert(bootstrapAlert) {
    const msg = document.createElement('div');
    msg.id = "alert-msg";
    msg.classList.add("alert", `alert-${bootstrapAlert}`);
    msg.style.position = "fixed";
    msg.style.zIndex = "2000";
    msg.style.top = "50%";
    msg.style.left = "50%";
    msg.style.transform = "translate(-50%, -50%)";
    msg.style.width = "90%";
    msg.style.maxWidth = "400px";
    msg.style.textAlign = "center";
    return msg;
}

function removeMsgHandler() {
    let body = document.getElementsByTagName("body")[0];
    let msg = document.getElementById("alert-msg");
    if (document.contains(msg)) {
        body.removeChild(msg);
    }
}

function showMessage(message, prio = "warning", autoHide = true) {
    let body = document.getElementsByTagName("body")[0];
    let {bootstrapAlert, emoji} = getClassAndEmoji(prio);
    let msg = createAlert(bootstrapAlert);

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
    body.appendChild(msg);

    // Remove the message when the user clicks anywhere
    if (autoHide) {
        document.addEventListener("click", removeMsgHandler, { once: true });
        // Remove the message after 3 seconds if not clicked already
        setTimeout(() => {
            if (body.contains(msg)) {
                body.removeChild(msg);
            }
        }, 3000);

    } else {
        msg.classList.add("alert-dismissible", "fade", "show");
        const closeButton = document.createElement('button');
        closeButton.classList.add("btn-close");
        closeButton.setAttribute("data-bs-dismiss", "alert");
        closeButton.setAttribute("aria-label", "Close");
        msg.appendChild(closeButton);
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
        console.log("%cSolutions directory not found or already cleared", "color: gray;");
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

function removeLivesAndShowLogo() {
    let logo = document.getElementById("nav-logo");
    logo.hidden = false;
    let heartContainer = document.getElementById("heart-container");
    if (heartContainer !== null) {
        heartContainer.remove();
    }
}

function checkIfSimplifierPageNeedsReset() {
    if (simplifierPageCurrentlyVisible()) {
        resetSimplifierPage();
        if (state.gamification) {
            removeLivesAndShowLogo();
            state.extraLiveUsed = false;
            resetExtraLiveModal();
        }
        let msg = document.getElementById("alert-msg");
        if (msg !== null) {
            msg.remove();
        }
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
