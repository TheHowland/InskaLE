// Containing all the necessary information for everything to work,
// compact in one object (what otherwise would be global variables)

class StateObject {
    //Tracks the current step in the circuit simplification process.
    currentStep = 0;

    // Stores the circuit infos (source voltage, components, omega_0, ...)
    step0Data = {};

    //Array to store the names of the circuit files.
    circuitFiles = [];

    //Array to store selected elements in the circuit.
    selectedElements = [];

    //Stores the currently selected circuit map
    currentCircuitMap = null;

    //The Python module imported from the Pyodide environment for solving circuits.
    solve;

    // Solver object
    kirchhoffSolver = null;
    stepSolve = null;
    voltEquations = [];
    gamification = false;
    extraLiveUsed = false;

    //Boolean to track if the Pyodide environment is ready.
    pyodide = null;
    pyodideReady = false;
    pyodideLoading = false;

    //To count how many svgs are on the screen right now
    pictureCounter = 0;

    //To generate the table for all values
    allValuesMap = new Map();

    // Toggle variables
    valuesShown = new Map();

}