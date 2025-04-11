# for simplipfy version: 0.1.dev1
import warnings
warnings.filterwarnings('ignore')
from simplipfy.SimplifyStepWise.simplifyStepwise import solve as ssw
solveStepwise = ssw

from simplipfy.SimplifyInUserOrder.solvInUserOrder import SolveInUserOrder as siuo
SolveInUserOrder = siuo


from simplipfy.KirchhoffSolver.kirchhofSolver import KirchhoffSolver as khs
KirchhoffSolver = khs
