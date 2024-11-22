let state = new StateObject();
let colors = new ColorDefinitions();
let selectorBuilder = new SelectorBuilder();
let languageManager = new LanguageManager();
let conf = null;
let packageManager = null;
let circuitMapper;
let pageManager;

// #####################################################################################################################
// The navigation for this website is not via different html files (mostly), but by showing and not
// showing different containers that act as pages
// #####################################################################################################################

async function main() {
    disableStartBtnAndSimplifierLink();
    conf = new Configurations();
    await conf.initialize();
    packageManager = new PackageManager();
    await packageManager.initialize();

    // Setup landing page first to make sure nothing else is shown at start
    pageManager = new PageManager(document);
    pageManager.setupLandingPage(pageManager);
    pageManager.showLandingPage();

    // Get the pyodide instance and setup pages with functionality
    let pyodide = await loadPyodide();
    pageManager.setPyodide(pyodide);

    // Map all circuits into map and build the selectors, needs pyodide for the FS
    circuitMapper = new CircuitMapper(pyodide);
    await circuitMapper.mapCircuits();

    pageManager.setupNavigation();
    setupDarkModeSwitch();
    enableStartBtnAndSimplifierLink();
}
