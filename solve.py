# for lcapy version: 1.24+inskale.0.37
import warnings
warnings.filterwarnings('ignore')
from lcapy import Circuit, FileToImpedance
from lcapy.solution import Solution
from lcapy.componentRelation import ComponentRelation
from lcapy.solutionStep import SolutionStep
import os
from lcapy.langSymbols import LangSymbols
from lcapy.dictExportBase import DictExportBase
from json import dump as jdump
from lcapy.dictExportBase import ExportDict
from enum import Enum
import lcapy.KirchhoffSolver.solver as khf


def solve_circuit(filename: str, filePath="Circuits/", savePath="Solutions/", langSymbols: dict = {}):

    langSym = LangSymbols(langSymbols)
    
    cct = Circuit(FileToImpedance(os.path.join(filePath, filename)))
    cct.namer.reset()
    steps = cct.simplify_stepwise()
    sol = Solution(steps, langSymbols=langSym)
    sol.draw(path=savePath, filename=filename)
    sol.exportAsJsonFiles(path=savePath, filename=filename)


class SolveInUserOrder:
    def __init__(self, filename: str, filePath="", savePath="", langSymbols: dict = {}):
        """
        :param filename: str with filename of circuit to simplify
        :param filePath: str with path to circuit file if not in current directory
        :param savePath: str with path to save the result svg and jason files to
        """

        self.filename = os.path.splitext(filename)[0]
        self.filePath = filePath
        self.savePath = savePath
        self.langSymbols = LangSymbols(langSymbols)
        self.circuit = Circuit(FileToImpedance(os.path.join(filePath, filename)))
        self.steps: list[SolutionStep] = [
            SolutionStep(self.circuit, [], None, None, None, None)
        ]
        self.circuit.namer.reset()

        return

    def dictToFiles(self, stepData: dict) -> tuple[bool, str, str]:
        step = stepData["step"]
        jsonFilePath = os.path.join(self.savePath, self.filename) + "_" + step + ".json"
        with open(jsonFilePath, "w", encoding="utf-8") as f:
            jdump(stepData, f, ensure_ascii=False, indent=4)

        svgFilePath = os.path.join(self.savePath, self.filename) + "_" + step + ".svg"
        svgFile = open(svgFilePath, "w", encoding="utf8")
        svgFile.write(stepData["svgData"])
        svgFile.close()

        return True, jsonFilePath, svgFilePath

    def simplifyNCpts(self, cpts: list) -> ExportDict:
        """
        :param cpts: list with two component name strings to simplify ["R1", "R2"]
        :return tuple with bool if simplification is possible, str with json filename, str with svg filename
        """
        # ToDo this only works as long as only simplifiable components are selected which are represented as a
        # impedance internally in the cirucuit
        for idx in range(0, len(cpts)):
            cpts[idx] = "Z" + cpts[idx][1::]

        if all(cpt in self.circuit.in_series(cpts[0]) for cpt in cpts[1::]):
            newNet, newCptName = self.circuit.simplify_N_cpts(self.circuit, cpts)
            self.steps.append(SolutionStep(newNet, cpts=cpts, newCptName=newCptName,
                                           relation=ComponentRelation.series.value,
                                           lastStep=None, nextStep=None))
        elif all(cpt in self.circuit.in_parallel(cpts[0]) for cpt in cpts[1::]):
            newNet, newCptName = self.circuit.simplify_N_cpts(self.circuit, cpts)
            self.steps.append(SolutionStep(newNet, cpts=cpts, newCptName=newCptName,
                                           relation=ComponentRelation.parallel.value,
                                           lastStep=None, nextStep=None))
        else:
            return DictExportBase.emptyExportDict()

        sol = Solution(self.steps, langSymbols=self.langSymbols)
        newestStep = sol.available_steps[-1]
        self.circuit = newNet

        return sol.exportStepAsDict(newestStep)

    def createInitialStep(self) -> ExportDict:
        """
        create the initial step or step0 of the circuit
        :return tuple with bool if simplification is possible, str with json filename, str with svg filename
        """

        sol = Solution(self.steps, langSymbols=self.langSymbols)
        stepData = sol.exportStepAsDict("step0")

        return stepData

    def createCircuitInfo(self) -> str:
        raise NotImplementedError("Use createStep0() or createInitialStep()")

    def createStep0(self) -> ExportDict:
        return self.createInitialStep()

    def getSolution(self):
        return Solution(self.steps, self.langSymbols)


class KirchhoffStates(Enum):
    isNewEquation = 0
    duplicateEquation = 1
    notAValidEquation = 2

class KirchhoffSolver:
    def __init__(self, circuitFileName: str, path: str, langSymbols: dict = {}):
        self.elementSetsOfEquations: list[set] = []
        self.language = LangSymbols(langSymbols)
        self.fileName = circuitFileName
        self.path = path
        self.circuit = Circuit(os.path.join(path, circuitFileName))
        self.foundEq = 0
        elementNames = self.circuit.branch_list
        self.numUnknownElements = len([elm for elm in elementNames if elm[0] != "V"]) # voltages of sources are known
        self._equations: list[str] = []
        for addPlaceholder in range(self.numUnknownElements):
            self._equations.append("-")
        self.missingElmInVoltEq = set(elementNames)

    def foundAllEquations(self) -> bool:
        return self.numUnknownElements == self.foundEq

    def foundAllVoltEquations(self) -> bool:
        return not self.missingElmInVoltEq

    def equations(self):
        return self._equations

    def setEquation(self, value, cptNames) -> int:
        nameSet = set(cptNames)
        if nameSet in self.elementSetsOfEquations:
            return KirchhoffStates.duplicateEquation.value
        self._equations[self.foundEq] = value
        self.foundEq += 1
        self.elementSetsOfEquations.append(nameSet)
        return KirchhoffStates.isNewEquation.value

    def checkVoltageLoopRule(self, cptNames: list[str]) -> tuple[int, str]:
        eq = ""
        if self.foundAllVoltEquations():
            return KirchhoffStates.duplicateEquation.value, eq
        state = KirchhoffStates.notAValidEquation.value
        loop = khf.isValidVoltageLoop(self.circuit, cptNames)

        if loop:
            eq = khf.makeVoltageEquations(self.circuit, cptNames, loop, self.language)
            state = self.setEquation(eq, cptNames)
            self.missingElmInVoltEq -= set(cptNames)

        return  state, eq

    def checkJunctionRule(self, cptNames: list[str]) -> tuple[int, tuple[str, str, str]]:
        implicitCommonNode = khf.isImplicitCurrentEquation(self.circuit, cptNames)
        commonNode = khf.isCurrentEquation(self.circuit, cptNames)
        if implicitCommonNode:
            eq = khf.makeCurrentEquation(self.circuit, cptNames, implicitCommonNode, self.language)
            state = self.setEquation(eq, cptNames)
            return state, (eq, eq, eq)
        elif commonNode:
            eq = khf.makeCurrentEquation(self.circuit, cptNames, commonNode, self.language)
            state = self.setEquation(eq, cptNames)
            return state, (eq, eq, eq)
        else:
            return KirchhoffStates.notAValidEquation.value, ("", "", "")

    @staticmethod
    def makeDummy() -> 'KirchhoffSolver':
        circuit = '''V1 2 0 dc {10}; up
                                W 2 3; up
                                W 3 4; right
                                R1 4 5 {1000}; down
                                R2 5 6 {2000}; down
                                R3 6 7 {200}; down
                                R4 7 8 {400}; down
                                W 7 11; right
                                R5 11 12 {200}; down
                                W 12 8; left
                                W 8 9; left
                                W 9 10; up
                                W 10 0; up
                                '''
        f = open("tmp.txt", "w")
        f.write(circuit)
        f.close()
        dummy = KirchhoffSolver("tmp.txt", "", {"volt": "U", "total": "ges"})
        dummy._equations = {0: "0 = Uges - U1 - U2 - U3 - U4", 1: "0 = U3 - U4", 2: "0 = I3 - I4 - I5", 3: "0 = I1 - I2", 4: "0 = I2 - I3"}
        dummy.language = LangSymbols()
        dummy.fileName = "##DummyHasNoName##"
        dummy.path = "##DummyHasNoPath##"
        os.remove("tmp.txt")
        return dummy

