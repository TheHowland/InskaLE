KirchhoffSolver {

    init(circuitFileName, path, language, ...)  # language für U/V unterscheidung

    equations = [eq1, eq2, -, -, -]  # direkt mit - initialisiert für anzahl der benötigten gleichungen

    checkVoltageLoopRule(voltageNames, direction) -> int, string
        - int für fehlercodes:
            0: korrekte masche
            1: equation bereits vorhanden
            2: falsche masche
        - string mit latex equation der korrekten Maschengleichung


    checkJunctionRule(currentNames) -> int, list[string]
        - int für fehlercodes:
            0: korrekte auswahl
            1: equation bereits vorhanden
            2: falsche auswahl
        - liste mit strings aus latex equations für multiple choice wahl, erste davon ist richtig



}