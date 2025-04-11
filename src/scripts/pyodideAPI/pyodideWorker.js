self.pyodide = null;
self.solveModule = null;
self.stepSolve = null;
self.kirchhoffSolver = null;

if( 'function' === typeof importScripts) {
    importScripts("../../../pyodide.js");
    self.pyodideReadyPromise = loadPyodide();
    self.onmessage = async (event) => {
        let _id = event.data.id;

        try {
            // Make sure pyodide and micropip is loaded before doing anything else
            self.pyodide = await self.pyodideReadyPromise;

            // ###################### Pyodide API ########################
            if (event.data.action === "unpackArchive") {
                await self.pyodide.unpackArchive(event.data.data.buffer, event.data.data.extension);
                self.postMessage({id: _id});
            } else if (event.data.action === "readdir") {
                const files = self.pyodide.FS.readdir(event.data.data.path);
                self.postMessage({files: files, id: _id});
            } else if (event.data.action === "unlink") {
                await self.pyodide.FS.unlink(event.data.data.path);
                self.postMessage({id: _id});
            } else if (event.data.action === "pyimport") {
                const importedModule = await self.pyodide.pyimport(event.data.data.module);
                self.postMessage({module: importedModule, id: _id});
            } else if (event.data.action === "writeFile") {
                self.pyodide.FS.writeFile(event.data.data.path, event.data.data.content);
                self.postMessage({id: _id});
            } else if (event.data.action === "readFile") {
                const file = self.pyodide.FS.readFile(event.data.data.path, {encoding: event.data.data.encoding});
                self.postMessage({file: file, id: _id});
            } else if (event.data.action === "runPython") {
                //await self.pyodide.loadPackagesFromImports(event.data.data.code);
                const result = await self.pyodide.runPythonAsync(event.data.data.code);
                self.postMessage({result: result, id: _id});
            } else if (event.data.action === "loadSolve") {
                self.solveModule = await self.pyodide.pyimport("solve");
                self.postMessage({id: _id});
            }
            // ###################### Simplifier API ########################
            else if (event.data.action === "initStepSolver") {
                let kwargs = {
                    filename: event.data.data.circuitFile,
                    filePath: event.data.data.circuitPath,
                    langSymbols: event.data.data.paramMap};
                self.stepSolve = await self.solveModule.SolveInUserOrder.callKwargs(kwargs);
                self.postMessage({id: _id});
            } else if (event.data.action === "resetStepSolver") {
                self.stepSolve = null;
                self.postMessage({id: _id, message: "reset"});
            }
            else if (event.data.action === "createStep0") {
                const step0 = await self.stepSolve.createStep0().toJs({dict_converter: Object.fromEntries});
                self.postMessage({step0: step0, id: _id});
            } else if (event.data.action === "simplifyNCpts") {
                const simplified = await self.stepSolve.simplifyNCpts(event.data.selectedElements).toJs({dict_converter: Object.fromEntries});
                self.postMessage({simplifiedStep: simplified, id: _id});
            }
            // ###################### Kirchhoff API ########################
            else if (event.data.action === "initKirchhoffSolver") {
                let kwargs = {
                    circuitFileName: event.data.data.circuitFile,
                    path: event.data.data.circuitPath,
                    langSymbols: event.data.data.paramMap
                };
                self.kirchhoffSolver = await self.solveModule.KirchhoffSolver.callKwargs(kwargs);
                self.postMessage({id: _id});
            } else if (event.data.action === "resetKirchhoffSolver") {
                self.kirchhoffSolver = null;
                self.postMessage({id: _id, message: "reset"});
            }
            else if (event.data.action === "checkVoltageLoopRule") {
                const [errorCode, eq] = await self.kirchhoffSolver.checkVoltageLoopRule(event.data.selectedElements).toJs();
                self.postMessage({errorCode: errorCode, eq: eq, id: _id});
            } else if (event.data.action === "checkJunctionRule") {
                const [errorCode, eqs] = await self.kirchhoffSolver.checkJunctionRule(event.data.selectedElements).toJs();
                self.postMessage({errorCode: errorCode, eqs: eqs, id: _id});
            } else if (event.data.action === "foundAllVoltEquations") {
                const foundAll = await self.kirchhoffSolver.foundAllVoltEquations();
                self.postMessage({foundAll: foundAll, id: _id});
            } else if (event.data.action === "foundAllEquations") {
                const foundAll = await self.kirchhoffSolver.foundAllEquations();
                self.postMessage({foundAll: foundAll, id: _id});
            } else if (event.data.action === "equations") {
                const equations = await self.kirchhoffSolver.equations().toJs();
                self.postMessage({equations: equations, id: _id});
            }

        } catch (error) {
            if (self.pyodide === null) {
                self.postMessage({status: "error", error: "Pyodide not loaded", id: _id});
                return;
            } else {
                self.postMessage({status: "error", error: error, id: _id});
            }
        }
    }
}
