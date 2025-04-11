// This file contains the HardcodedStepSolverAPI class, which is used to solve the quickstart circuits
// With this, the user doesn't have to wait for pyodide to load and can start solving circuits while
// the pyodide backend is still loading

// ###################################################################################
// #### IMPORTANT #### Has to implement the exact same functions as the StepSolverAPI
// ###################################################################################
class HardcodedStepSolverAPI {
    constructor() {}

    async initStepSolver(circuitFile, circuitPath, paramMap) {
        this.circuitFile = circuitFile;
        this.circuitPath = circuitPath;
        this.paramMap = paramMap;

        // Fetch the solutions file
        let langSuffix;
        if (languageManager.currentLang === english) {
            langSuffix = "en";
        } else {
            langSuffix = "de";
        }
        this.solutionsFile = this.circuitFile.replace(".txt", `_solutions.${langSuffix}.json`);
        let solutionsPath = this.circuitPath + "/" + this.solutionsFile;
        try {
            let content = await state.pyodideAPI.readFile(solutionsPath);
            this.solutions = JSON.parse(content);
        } catch (error) {
            console.error("Error fetching solutions file: " + error);
            this.solutions = null;
        }
    }

    resetStepSolver() {
        // This is a hardcoded solution, so we don't need to reset anything
    }

    async createStep0() {
        // Returns a Step0Object, see stepObject.js
        // StepSolverAPI returns a Promise, but if the function is called with await, and we only return
        // an object instead of promise it will be automatically wrapped in a promise, so nothing to do
        return this.solutions["step0"];
    }

    simplifyNCpts(selectedElements) {
        // Returns a StepObject, see stepObject.js
        // StepSolverAPI returns a Promise, but if the function is called with await, and we only return
        // an object instead of promise it will be automatically wrapped in a promise, so nothing to do
        let key = selectedElements.join(".");
        let mappedKey = this.solutions.map[key];
        return this.solutions[mappedKey];
    }
}