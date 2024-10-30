class Configurations {
    constructor() {
        let serverAddress = "https://thehowland.github.io/InskaLE"
        this.sourceCircuitPath = this.serverAddress + "/Circuits.zip"
        this.sourceSolvePath = this.serverAddress + "/solve.py"
        this.sourcePackageDir = this.serverAddress + "/Packages/"

        this.pyodideCircuitPath = "Circuits"
        this.pyodideSolutionsPath = "Solutions"
        this.pyodideSolvePath = "/home/pyodide/solve.py"
    }
}

