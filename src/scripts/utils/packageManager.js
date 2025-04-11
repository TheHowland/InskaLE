
class PackageManager {
    constructor() {
        if (PackageManager.instance) {
            return PackageManager.instance;
        }
        else {
            PackageManager.instance = this;
            return PackageManager.instance
        }
    }

    static async getInstance(){
        return new PackageManager();
    }

    async initialize(){
        this.isGitHubPage = conf.isGitHubPage
        this.fetchDirectoryListing = this.isGitHubPage ? this.#fetchGitHubDirectoryContents : this.#fetchDirectoryListing
    }

    async doLoadsAndImports() {
        // Already in map circuits await this.loadCircuits();
        state.loadingProgress = 30;
        updateStartBtnLoadingPgr(state.loadingProgress);
        await this.importPyodidePackages();
        await this.importSolverModule();
        state.loadingProgress = 100;
        updateStartBtnLoadingPgr(state.loadingProgress);
        finishStartBtns();
        state.pyodideReady = true;
        selectorBuilder.enableStartBtns();

        let endTime = new Date().getTime();
        let loadTime = endTime - startTime;
        console.log("Loading time: " + loadTime + "ms");
    }

    async importPyodidePackages() {
        console.log("Loading packages");
        await this.load_packages();
        state.loadingProgress = 50;
        updateStartBtnLoadingPgr(state.loadingProgress);
        await this.import_packages();
    }

    async importSolverModule() {
        let content = await (await fetch(conf.sourceSolvePath)).text();
        await state.pyodideAPI.writeFile(conf.pyodideSolvePath, content);
        await state.pyodideAPI.loadSolver();
    }

    async import_packages() {
        let packages = ["matplotlib", "numpy", "sympy", "networkx", "IPython", "schemdrawInskale", "ordered_set", "lcapyInskale"];
        // 50% remaining
        let len = packages.length;
        let stepSize = Math.floor(50 / len);

        for(const packageName of packages){
            await state.pyodideAPI.loadPackage(packageName);
            state.loadingProgress += stepSize;
            updateStartBtnLoadingPgr(state.loadingProgress);
        }
        console.log("Imported: " + packages);
    }

    async load_packages(optAddNames) {
        let packageAddress = conf.sourcePackageDir;
        let packages = await this.fetchDirectoryListing(packageAddress, ".whl");

        if(Array.isArray(optAddNames)){
            for(let i = 0; i < optAddNames.length; i++){
                packages.push(optAddNames[i]);
            }
        }

        state.loadingProgress = 30;
        updateStartBtnLoadingPgr(state.loadingProgress);
        let len = packages.length;

        let stepSize = 20 / len;
        let packagePromises = packages.map(async function (packageName) {
            let pkgArrBuff = await (await fetch(conf.sourcePackageDir + packageName)).arrayBuffer();
            let packageExtension = packageName.slice(packageName.lastIndexOf("."), packageName.length);
            await state.pyodideAPI.unpackArchive(pkgArrBuff, packageExtension);
            console.log("Unpacking: " + packageName);
            state.loadingProgress += stepSize;
            updateStartBtnLoadingPgr(state.loadingProgress);
        });

        await Promise.all(packagePromises);
        console.log("Loaded packages:" + packages);
    }

    async #fetchDirectoryListing(path, extension = "") {
        const response = await fetch(path);
        if (!response.ok) {
            console.log(response)
            throw new Error('Network response was not ok');
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const fileLinks = doc.querySelectorAll('a');
        const fileNames = [];
        fileLinks.forEach(link => {
            const fileName = link.getAttribute('href');
            if (fileName && !fileName.endsWith('/')) {
                if (extension === "" || (extension !== "" && fileName.endsWith(extension))) {
                    fileNames.push(fileName);
                }
            }
        });
        return fileNames;
    }

    async #fetchGitHubDirectoryContents(path, extension) {

        let url = `https://api.github.com/repos/${conf.gitHubUser}${conf.gitHubProject}contents/${path}`;
        if (!(await fetch(url+".htaccess")).ok) {
            url = `https://api.github.com/repos/${conf.gitHubUser}${conf.gitHubProject}contents/Pyodide/${path}`;
        }
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!response.ok) {
            throw new Error(`Error fetching GitHub directory contents: ${response.status}`);
        }
        const data = await response.json();
        return data.filter(file => file.name.endsWith(extension)).map(file => file.name);
    }
}