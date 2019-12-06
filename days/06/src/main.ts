(async function() {
    await part02();
})();

async function part02() {
    console.log('part02');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const rows = data.split('\n');
    rows.pop();

    const objects =  new  Map();

    for(const entry of  rows) {
        const [baseID, satelliteID] = entry.split(')');

        const satellite = upsert(satelliteID, objects);
        const base = upsert(baseID, objects);

        base.satellites.push(satellite);
        satellite.orbits = base;
    }

    const start =  objects.get('YOU').orbits;
    const destination =  objects.get('SAN').orbits;
    const result = findCommonBaseAndJumps(start, destination);
    console.log({result});

    function findCommonBaseAndJumps(objA, objB) {
        const startOrbits = collectOrbits(objA);
        const destinationOrbits = collectOrbits(objB);
        const commonBases = destinationOrbits.filter(value => startOrbits.includes(value));
        const firstCommonBase = commonBases[0];

        const jumpsA = startOrbits.indexOf(firstCommonBase) + 1;
        const jumpsB = destinationOrbits.indexOf(firstCommonBase) + 1;
        const totalJumps = jumpsA + jumpsB;
        return {commonBase: firstCommonBase, totalJumps}
    }

    function collectOrbits(object, result = [] as any):any[] {
        if(object.orbits === null) {
            return result;
        }else {
            const list = [...result, object.orbits.id];
            return collectOrbits(object.orbits, list);
        }
    }
}

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const rows = data.split('\n');
    rows.pop();

    const objects =  new  Map();

    for(const entry of  rows) {
        const [baseID, satelliteID] = entry.split(')');

        const satellite = upsert(satelliteID, objects);
        const base = upsert(baseID, objects);

        base.satellites.push(satellite);
        satellite.orbits = base;
    }

    const totalOrbits = Array.from(objects.values()).reduce((accu, object) => {
        const count = countOrbit(object);
        return accu + count;
    }, 0);
    console.log({totalOrbits})
}

function countOrbit(obj, counter = 1, direct = true) {
    if(!obj.orbits) {
        return 0;
    }else{
        counter += countOrbit(obj.orbits, 1, false);
    }
    return counter;
}

function upsert(id,  map){
    if (!map.has(id)) {
        map.set(id, {
            id: id,
            satellites:  [],
            orbits:  null
        });
    }

    return  map.get(id);
}
