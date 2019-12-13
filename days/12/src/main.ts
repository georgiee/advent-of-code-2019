(async function() {
    await part01();
})();

async function part01() {
    const inputExample1 = `
  <x=-1, y=0, z=2>
<x=2, y=-10, z=-7>
<x=4, y=-8, z=8>
<x=3, y=5, z=-1>
    `;

    const inputExample2 = `
    <x=-8, y=-10, z=0>
<x=5, y=5, z=10>
<x=2, y=-7, z=3>
<x=9, y=-8, z=-3>
    `;
    const input = `
    <x=-8, y=-18, z=6>
<x=-11, y=-14, z=4>
<x=8, y=-3, z=-10>
<x=-2, y=-16, z=1>

    `;

    const moonPositions = parseMoons(input);
    const moons = moonPositions.map((p, index) => createMoon(p, index));

    // simulate(moons, 1000);
    simulateUniverse(moons);
}

function simulateUniverse(moons) {
    const moonSystem = createMoonSystem(moons);
    let counter = 0;
    let found = false;
    let cycles = [0,0,0];

    moonSystem.findCycle();
    console.log('moonSystem done');
}

function info(moons) {
    moons.forEach(moon => moon.info());
}

function createMoonSystem(moons){
    let stepIndex = 0;
    let energyMap = new Map();

    afterStep();

    function calculateEnergy(list) {
        return list.reduce((energy,  moon) => {
            // console.log('moon.energy', moon.energy);
            return energy + moon.energy
        }, 0);
    }

    function storeUniverse() {
        const data = moons.reduce((list,  moon) => {
            // console.log('moon.energy', moon.energy);
            return   {
                positions: [...list.positions, ...moon.position ],
                velocities: [...list.velocities, ...moon.velocity ],
                energy: calculateEnergy(moons)
            }
        }, {
            positions:[],
            velocities: [],
            energy: 0
        });

        return upsert(energyMap, 'energy', data);
    }

    function afterStep(){
        const foundMatch = storeUniverse();
        return foundMatch;
    }

    function universeEqual(a,  b) {
        if(a.energy !== b.energy) return false;
        const posEqual = a.positions.every((value, index) => b.positions[index] === value);
        const velocitiesEqual = a.velocities.every((value, index) => b.velocities[index] === value);

        return posEqual && velocitiesEqual;
    }

    function upsert(map, keyName, newUniverse) {
        const keyValue = newUniverse[keyName];

        if(energyMap.has(keyValue)) {
            const currentList = energyMap.get(keyValue) as  any[];
            const equal = currentList.find((existingUniverse) =>  universeEqual(existingUniverse, newUniverse));

            if(equal) {
                console.log('found  match');
                console.log({equal}, stepIndex);
                return true;
            }
            energyMap.set(keyValue, [...currentList, newUniverse]);
        }else{
            energyMap.set(keyValue, [newUniverse]);
        }

        return false;
    }

    function runStep() {
        step(moons);
        stepIndex++;
    }

    return {
        get totalEnergy() { return calculateEnergy(moons) },
        step: () => {
            runStep();
            return afterStep();
        },
        findCycle: () => {
            let cycs = [0,0,0];
            let found = false;
            let counter = 0;
            while(!found) {
                runStep();
                found = true;
                for(const index of [0,1,2]) {
                    if(cycs[index] != 0) {
                        continue
                    }

                    found = false;

                    const equal = moons.every((moon) => {
                        return moon.position[index] == moon.originalPosition[index] && moon.velocity[index] == 0
                    });

                    if(equal) {
                        console.log('found new component', stepIndex);
                        cycs[index] = stepIndex;
                    }
                }
            }

            const result =cycs.reduce((acc, value) => {
                return acc / gcd_two_numbers(acc, value) * value;
            }, 1);
            console.log('done', result, cycs)

        },
        get energyMap() { return energyMap}
    }
}

//goooogle
function gcd_two_numbers(x, y) {
    if ((typeof x !== 'number') || (typeof y !== 'number'))
        return false;
    x = Math.abs(x);
    y = Math.abs(y);
    while(y) {
        var t = y;
        y = x % y;
        x = t;
    }
    return x;
}

function simulate(moons,  stepCount) {
    let counter = 0;
    // info(moons);

    while(counter < stepCount) {
        step(moons);
        counter++
    }
    // info(moons);
    const totalEnergy = moons.reduce((energy,  moon) => energy + moon.energy, 0);
    console.log({totalEnergy});
}

function step(moons) {
    for(const moon of moons) {
        const otherMoons = moons.reduce((results, other) => {
            if(other.index !== moon.index) {
                results = [...results, other]
            }
            return results;
        }, []);
        moon.applyGravity(otherMoons);
    }

    for(const moon of moons) {
        moon.applyVelocity();
        moon.updateEnergy();
    }

}


function parseMoons(data) {
    const rows = data.split('\n');
    const pattern = /<\D=(-?\d+), \D=(-?\d+), \D=(-?\d+)>/;

    const positions = rows.map(line => {
        const result = pattern.exec(line);
        if(result){
            const [_, x, y, z] = result;
            return [x, y, z].map(v => parseInt(v, 10));
        }
    });

    return positions.filter(v => !!v);
}

function createMoon(pos, index)  {
    let originalPosition = [...pos];
    let position = [...pos];
    let velocity = [0,0,0];
    let potentialEnergy = 0;
    let kineticEnergy = 0;

    updateEnergy();

    function updateEnergy() {
        potentialEnergy = position.reduce((accu, value) =>{return accu + Math.abs(value)}, 0);
        kineticEnergy = velocity.reduce((accu, value) =>{return accu + Math.abs(value)}, 0);
    }

    function applyVelocity(){
        const [x, y, z] = position;
        const [vx, vy, vz] = velocity;
        position = [x + vx, y + vy, z + vz];
    }

    function sign(v1, v2) {
        if( v1 === v2) {return 0}
        return v1 > v2 ? -1 : 1;
    }

    function applyGravity(otherMoons) {
        otherMoons.forEach(other => {
            velocity = velocity.map((value, index) => {
                return value + sign(position[index], other.position[index]);
            });
        });
    }

    function info() {
        console.log('moon',index, {position, velocity},{energy: (potentialEnergy * kineticEnergy)});
    }

    return {
        get originalPosition() {
            return originalPosition;
        },
        applyGravity,
        applyVelocity,
        info,
        updateEnergy,
        get energy() {
            return potentialEnergy * kineticEnergy
        },
        get potentialEnergy() { return potentialEnergy},
        get kineticEnergy() { return kineticEnergy},
        get index() {return index },
        get position() {return [...position] },
        get velocity() {return [...velocity] }
    }
}
