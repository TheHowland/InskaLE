// #####################################################################################
// ########################## Pyodide API Class ########################################
// #####################################################################################

class PyodideAPI {
    constructor(worker) {
        this.worker = worker;
    }

    unpackArchive(pkgArrBuff, packageExtension) {
        return requestResponse(this.worker, {
            action: "unpackArchive",
            data: { buffer: pkgArrBuff, extension: packageExtension }
        });
    }

    readDir(path) {
        return requestResponse(this.worker, {
            action: "readdir",
            data: { path: path }
        });
    }

    writeFile(path, content) {
        return requestResponse(this.worker, {
            action: "writeFile",
            data: {
                path: path,
                content: content,
            }
        });
    }

    loadSolver() {
        return requestResponse(this.worker, {
            action: "loadSolve",
            data: {}
        });
    }

    readFile(path, encoding) {
        return requestResponse(this.worker, {
            action: "readFile",
            data: { path: path, encoding: encoding }
        });
    }

    runPython(code) {
        return requestResponse(this.worker, {
            action: "runPython",
            data: { code: code}
        });
    }

    loadPackage(packageName) {
        return this.runPython("import " + packageName);
    }

    pyimport(moduleName) {
        return requestResponse(this.worker, {
            action: "pyimport",
            data: { module: moduleName }
        });
    }
}

// #####################################################################################
// ########################## StepSolver API Class #####################################
// #####################################################################################

class StepSolverAPI {
    constructor(worker) {
        this.worker = worker;
    }

    initStepSolver(circuitFile, circuitPath, paramMap) {
        return requestResponse(this.worker, {
            action: "initStepSolver",
            data: { circuitFile: circuitFile, circuitPath: circuitPath, paramMap: paramMap }
        });
    }

    resetStepSolver() {
        return requestResponse(this.worker, {
            action: "resetStepSolver",
            data: {}
        });
    }

    createStep0() {
        // Returns a Step0Object, see stepObject.js
        return requestResponse(this.worker, {
            action: "createStep0",
            data: {}
        });
    }

    simplifyNCpts(selectedElements) {
        // Returns a StepObject, see stepObject.js
        return requestResponse(this.worker, {
            action: "simplifyNCpts",
            selectedElements: selectedElements
        });
    }
}

// #####################################################################################
// ########################## Kirchhoff API Class ######################################
// #####################################################################################

class KirchhoffSolverAPI {
    constructor(worker) {
        this.worker = worker;
    }

    initKirchhoffSolver(circuitFile, circuitPath, paramMap) {
        return requestResponse(this.worker, {
            action: "initKirchhoffSolver",
            data: { circuitFile: circuitFile, circuitPath: circuitPath, paramMap: paramMap }
        });
    }

    resetKirchhoffSolver() {
        return requestResponse(this.worker, {
            action: "resetKirchhoffSolver",
            data: {}
        });
    }

    checkVoltageLoopRule(selectedElements) {
        return requestResponse(this.worker, {
            action: "checkVoltageLoopRule",
            selectedElements: selectedElements
        });
    }

    checkJunctionRule(selectedElements) {
        return requestResponse(this.worker, {
            action: "checkJunctionRule",
            selectedElements: selectedElements
        });
    }

    foundAllVoltEquations() {
        return requestResponse(this.worker, {
            action: "foundAllVoltEquations",
            data: {}
        });
    }

    async foundAllEquations() {
        let eqs = await state.kirchhoffSolverAPI.equations();
        // filter "-" out of the list
        let filteredEqs = eqs.filter(eq => eq !== "-");
        // get number of cpts from step0 data
        let cpts = state.step0Data.allComponents.length;
        // check if number of equations is equal to number of cpts
        if (filteredEqs.length < cpts) {
            return false;
        } else {
            return true;
        }
        // TODO !!!
        /*return requestResponse(this.worker, {
            action: "foundAllEquations",
            data: {}
        });*/
    }

    equations() {
        return requestResponse(this.worker, {
            action: "equations",
            data: {}
        });
    }
}

// #####################################################################################
// ########################## Functions for API Calls ##################################
// #####################################################################################

function getPromiseAndResolve() {
    let resolve;
    let promise = new Promise((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

// Use id to identify the message, just a counter
let lastId = 1;
function getId() {
    return lastId++;
}

function getResolve(msg, resolve, event) {
    // Filter the corresponding output, see pyodideWorker.js for return objects
    // Useful to get the objects inside the events instead of an object
    // await readFiles -> [f1, f2, ...] instead of {files: [f1, f2, ...]}
    // With this we don't have to bother on the consumer side which call
    // we made, but always can just get the expected output

    // ###################### Pyodide API ########################
    // Only for functions which require a specific return value
    if (msg.action === "readdir") {
        resolve(event.data.files);
    } else if (msg.action === "pyimport") {
        resolve(event.data.module);
    } else if (msg.action === "readFile") {
        resolve(event.data.file);
    } else if (msg.action === "runPython") {
        resolve(event.data.result);
    }
    // ###################### Simplifier API ########################
    // Only for functions which require a specific return value
    else if (msg.action === "createStep0") {
        resolve(event.data.step0);
    } else if (msg.action === "simplifyNCpts") {
        resolve(event.data.simplifiedStep);
    }
    // ###################### Kirchhoff API ########################
    // Only for functions which require a specific return value
    else if (msg.action === "checkVoltageLoopRule") {
        resolve([event.data.errorCode, event.data.eq]);
    } else if (msg.action === "checkJunctionRule") {
        resolve([event.data.errorCode, event.data.eqs]);
    } else if (msg.action === "foundAllVoltEquations") {
        resolve(event.data.foundAll);
    } else if (msg.action === "foundAllEquations") {
        resolve(event.data.foundAll);
    } else if (msg.action === "equations") {
        resolve(event.data.equations);
    }
    // ###################### Error handling #######################
    else {
        // Always filter out id
        let {id, ...data} = event.data;
        resolve(data);
    }
}

// Common response for pyodide backend, uses promises and resolves
function requestResponse(worker, msg) {
    const { promise, resolve } = getPromiseAndResolve();
    const idWorker = getId();
    worker.addEventListener("message", function listener(event) {
        if (event.data.status === "info") {
            console.log("WORKER INFO: ", event);
        } else if (event.data.status === "error") {
            if (msg.action === "readdir") {
                // Expected for solutions dir
                console.warn("Error when reading dir");
            } else {
                console.error("ERROR IN WORKER");
                console.error(event.data.error);
            }
            resolve(null);
        }
        if (event.data?.id !== idWorker) {
            return; // Ignore messages that don't match our id
        }
        // This listener is done so remove it.
        worker.removeEventListener("message", listener);
        getResolve(msg, resolve, event);
    });
    worker.postMessage({ id: idWorker, ...msg });
    return promise;
}
