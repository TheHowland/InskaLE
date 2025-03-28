function setSvgWidthTo(svgData, width) {
    // Search the string: width="dd.ddddpt"
    let match = svgData.match(/width="(\d*.\d*pt)"/);
    let foundWidth = match[1];   // dd.dddd
    return svgData.replace(foundWidth, width);   // replace dd.ddd with width
}

function showArrows(contentCol) {
    // Show arrows and symbol labels
    let arrows = contentCol.querySelectorAll(".arrow");
    for (let arrow of arrows) {
        arrow.style.display = "block";
        arrow.style.opacity = "0.5";
    }
}

function hideVoltageArrows(svgDiv) {
    let voltageArrows = svgDiv.querySelectorAll(".arrow.voltage-label");
    for (let arrow of voltageArrows) {
        arrow.style.display = "none";
    }
}

function hideItotArrow(svgDiv) {
    let itotArrow = svgDiv.querySelectorAll(`.current-label.arrow.I${languageManager.currentLang.totalSuffix}`);
    for (let arrow of itotArrow) {
        arrow.style.display = "none";
    }
}

function showVoltageArrows(svgDiv) {
    let voltageArrows = svgDiv.querySelectorAll(".arrow.voltage-label");
    for (let arrow of voltageArrows) {
        arrow.style.display = "block";
    }
}

function hideCurrentArrows(svgDiv) {
    let currentArrows = svgDiv.querySelectorAll(".arrow.current-label");
    for (let arrow of currentArrows) {
        arrow.style.display = "none";
    }
}

function showCurrentArrows(svgDiv) {
    let currentArrows = svgDiv.querySelectorAll(".arrow.current-label");
    for (let arrow of currentArrows) {
        arrow.style.display = "block";
    }
}

function hideSourceLabel(svgDiv) {
    let sourceLabel = svgDiv.querySelector(".element-label.V1");
    if (sourceLabel !== null) {
        sourceLabel.style.display = "none";
    }
}

function hideElementLabels(svgDiv) {
    let labels = svgDiv.querySelectorAll(".element-label");
    labels.forEach(label => label.style.display = "none");
}

function hideLabels(svgDiv) {
    let labels = svgDiv.querySelectorAll(".element-label");
    labels.forEach(label => label.style.display = "none");
}

function hideSvgArrows(circuitDiv) {
    let arrows = circuitDiv.getElementsByClassName("arrow");
    for (let arrow of arrows) arrow.style.display = "none";
}
