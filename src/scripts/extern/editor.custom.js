/*/ scaling up circuit editor to fill screen - bug: offset of drag and drop is wrong
window.addEventListener("resize", resizeEditor);
document.getElementById("nav-editor").addEventListener("click", resizeEditor);

const editorTableSize = [
    document.getElementById("editor-page-container").getElementsByClassName("schematic")[0].getAttribute("width") * 1 + 100,
    document.getElementById("editor-page-container").getElementsByClassName("schematic")[0].getAttribute("height") * 1 + 65.5
];

function resizeEditor() {
    const paddingParent = document.getElementById("editor-page-container").getElementsByClassName("container-fluid")[0];

    // console.log(("window.innerWidth - paddingParent.offsetWidth" + (window.innerWidth - paddingParent.offsetWidth)));

    const factorWidth = (window.innerWidth - 2 - parseFloat(window.getComputedStyle(paddingParent).getPropertyValue("padding-left")) - parseFloat(window.getComputedStyle(paddingParent).getPropertyValue("padding-right"))) / editorTableSize[0];
    const factorHeight = (window.innerHeight - paddingParent.offsetTop) / editorTableSize[1];

    // console.log(paddingParent.style.paddingLeft);


    const factor = Math.max(0, Math.min( factorWidth, factorHeight));
    document.getElementById("editor-wrapper").style.transform = `scale(${factor})`;
    document.getElementById("editor-wrapper").style.height = `${editorTableSize[1] * factor}px`;
    // console.log(`scale(${factor})`);
}
/**/
