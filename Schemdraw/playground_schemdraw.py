import schemdraw
import schemdraw.elements as elm
schemdraw.use(backend='svg')

with schemdraw.Drawing() as d:
    I1 = elm.SourceI().label('5∠0° A').dot()
    d.push()
    elm.Capacitor(id_='C1',value_='-j3Ω').right().label('-j3Ω').dot()
    elm.Inductor(id_='L2',value_='j2Ω').down().label('j2Ω').dot().hold()
    elm.Resistor(id_='R1',value_='5Ω').right().label('5Ω').dot()
    V1 = elm.SourceV().down().reverse().label('5∠-90° V', loc='bot')
    elm.Line().tox(I1.start)
    d.pop()
    elm.Line().up(d.unit*.8)
    L1 = elm.Inductor(id_='L1',value_='j3Ω').tox(V1.start).label('j3Ω')
    elm.Line().down(d.unit*.8)
    elm.CurrentLabel(top=False, ofst=.3).at(L1).label('$i_g$')
    d.save('test_schematic.svg')

print("Schemdraw example created successfully.")