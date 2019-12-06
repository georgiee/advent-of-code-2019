(async function() {
    await part01();
})();

// part01();

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const rows = data.split('\n');
    rows.pop();
    const size = {x1:0, y1:0, x2: 0, y2:0};
    const instructions = rows.map(row  => row.split(','));

    const wires =  instructions.map(values  => {
        const [coords, minmax] = createWire(values);
        size.x1 = Math.min(minmax.x1, size.x1);
        size.x2 = Math.max(minmax.x2, size.x2);
        size.y1 = Math.min(minmax.y1, size.y1);
        size.y2 = Math.max(minmax.y2, size.y2);

        const lines = createLines(coords);
        return {coords, lines};
    });

    walkWires(instructions);
    drawWires(wires, size);
}

function walkWires(wires){
    let map = new Map();
    let wireindex = 0;
    let crossings =  [] as   any;
    for (let wire of wires) {
        let position = {x:0, y:0};
        let steps = [] as any;
        wireindex++;

        for(let path of wire) {
            const direction = path.substring(0,1);
            const length = parseInt(path.substring(1), 10);
            const line = getLine(direction, length)!;
            // create an array  of positions we are walking by
            // to save them in a map where we can check each
            // coordinate if a wire previous crossed
            const positions = walk(position, line);
            for(let pos of positions) {
                const key = `x${pos[0]},y${pos[1]}`;
                const dx = Math.abs(position.x-pos[0]);
                const dy = Math.abs(position.y-pos[1]);
                const currentSteps = [...steps,  dx + dy  ];

                if(map.has(key)) {
                    const existingWires = map.get(key);
                    const indices = existingWires.map(data => data.index);
                    if(!indices.includes(wireindex)) {
                        existingWires.push({
                            index: wireindex,
                            pos: pos,
                            steps: [...currentSteps],
                            stepsSum: currentSteps.reduce((value, accu) => accu + value, 0)
                        });
                        crossings.push(pos);
                    }

                } else {
                    map.set(key, [{
                        index: wireindex,
                        pos: pos,
                        steps: [...currentSteps],
                        stepsSum: currentSteps.reduce((accu, value) => accu + value, 0)
                    }]);
                }
            }
            steps.push(Math.abs(line.x) + Math.abs(line.y));

            position.x += line.x;
            position.y += line.y;
        }
    }
    const values = Array.from(map.values()).filter(list => list.length > 1);

    // part 01
    const distances = crossings.map(value => {
        return Math.abs(value[0]) + Math.abs(value[1]);
    }).filter(value => value > 0);

    const minDistance = Math.min(...distances);
    console.log('part01',    {minDistance});

    // part 02
    const totalSums = values.map(list => {
        let total = list.reduce((accu, entry) => {
            return accu + entry.stepsSum;
        }, 0);
        return total;
    }).filter(value => value > 0);

    const minSum = Math.min(...totalSums);
    console.log('part02', {minSum});
 }

function walk(pos, line) {
    const result = [] as any;
    if(line.x != 0) {
        const sign = Math.sign(line.x);
        for(let i = 0; i< Math.abs(line.x); i++) {
            result.push([pos.x + sign  * i,  pos.y]);
        }
    }
    if(line.y !== 0) {
        const sign = Math.sign(line.y);
        for(let i = 0; i< Math.abs(line.y); i++) {
            result.push([pos.x, pos.y + sign  * i]);
        }
    }

    return result;
}
function createLines(coords) {
    let currentPosition = {x: 0, y: 0};
    let lines = [];
    for(const coord of coords) {
        let line = {
            from: currentPosition,
            to: coord
        };
        currentPosition = coord;

        lines.push(line);
    }

    return lines;
}

function drawWires(wires, size){
    const svg = createSVGElement('svg');
    svg.setAttribute('viewBox', `${size.x1}, ${size.y1},${size.x2 - size.x1},${ size.y2 - size.y1}`);
    document.body.appendChild(svg);

    const startCircle = createSVGElement('circle');
    startCircle.setAttribute('r', '1');
    startCircle.setAttribute('fill', 'red');
    svg.appendChild(startCircle);

    for(const wire of wires) {
        drawWire(wire, svg);
    }
}

function createSVGElement(element)  {
    return document.createElementNS('http://www.w3.org/2000/svg',element);
}

function drawWire(wire, svg) {
    let currentPosition = {x: 0, y: 0};
    const group = createSVGElement('g')!;
    svg.appendChild(group);
    for (const line of wire.lines) {
        let newPosition = line;
        const svgLine = createSVGElement('line')!;
        svgLine.setAttribute('x1', line.from.x);
        svgLine.setAttribute('y1', line.from.y);
        svgLine.setAttribute('x2', line.to.x);
        svgLine.setAttribute('y2', line.to.y);
        svgLine.setAttribute("stroke", "black");
        svgLine.setAttribute("stroke-linecap", "square");
        svgLine.setAttribute("stroke-width", "1");

        group.appendChild(svgLine);

        currentPosition = newPosition;
    }

}

function addPoints(p1,  p2){
    return  {
        x: p1.x +  p2.x,
        y: p1.y +  p2.y
    }
}

function createWire(codes){
    let currentPosition = {x:0,  y: 0};
    let coords: any  = [currentPosition];

    let minMax = {x1:0, y1:0, x2:0,  y2:0};
    for(let path of codes) {
        const direction = path.substring(0,1);
        const length = parseInt(path.substring(1), 10);
        const line = getLine(direction, length);
        currentPosition  =  addPoints(currentPosition,  line);
        minMax.x1 = Math.min(minMax.x1, currentPosition.x);
        minMax.y1 = Math.min(minMax.y1, currentPosition.y);
        minMax.x2 = Math.max(minMax.x2, currentPosition.x);
        minMax.y2 = Math.max(minMax.y2, currentPosition.y);
        coords.push(currentPosition);
    }

    return [coords, minMax];
}

function getLine(direction, length) {
    switch(direction) {
        case 'R': return { x: length, y: 0 };
        case 'L': return { x:  - length, y: 0 };
        case 'U': return { x: 0,  y : - length };
        case 'D': return { x: 0, y : length };
    }
}

