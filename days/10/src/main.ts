import line from 'bresenham-line';

(async function() {
    // await part01();
    await part02();
})();




async function part02() {
    console.log('part02');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const coordData = data.split('');
    const {asteroids} = coordData.reduce((accu, current) => {
        if(current === '#' || current === 'X') {
            accu.asteroids.push({
                x: accu.pointer.x,
                y: accu.pointer.y,
            })
        }

        if (current ===  '\n') {
            accu.pointer.y++;
            accu.pointer.x = 0;
        }else {
            accu.pointer.x++
        }
        return  accu;
    }, {asteroids:[] as any, pointer: {x:0, y:0}});

    const visibleValues = asteroids.map(point => calculateVisible(asteroids, point));
    const maxValue = Math.max(...visibleValues.map(value => value[0]));
    const [_, station] = visibleValues.find(value => value[0] === maxValue);
    console.log({station});
    //  too lazym  just find  the asteroid with distance of 314 that
    //  I calculated with calculateVisible  before I switched it to  return
    // const station = visibleValues.filter(value  => {
    //     return Object.values(value)[0] === 314;
    // }); // -> 27-19

    // console.log({station})
    const posInKillQueue = kill(asteroids, station, 200);
    const result = posInKillQueue.original.x * 100 + posInKillQueue.original.y;
    console.log({posInKillQueue, result})
}

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const coordData = data.split('');
    const {asteroids} = coordData.reduce((accu, current) => {
        if(current === '#') {
            accu.asteroids.push({
                x: accu.pointer.x,
                y: accu.pointer.y,
            })
        }

        if (current ===  '\n') {
            accu.pointer.y++;
            accu.pointer.x = 0;
        }else {
            accu.pointer.x++
        }
        // console.log('new line', accu.pointer)

        return  accu;
    }, {asteroids:[] as any, pointer: {x:0, y:0}});

    const visibleValues = asteroids.map(point => calculateVisible(asteroids, point));
    // const maxValue = Math.max(...visibleValues);
    // console.log({maxValue});
}

function cmp(a, b) {
    if (a > b) return +1;
    if (a < b) return -1;
    return 0;
}
function kill(asteroids, station, index) {

    console.log('kill start');
    const slopes = withSlopes(asteroids, station);
    slopes.sort((a,b) => cmp(a.angle, b.angle ) || cmp(a.distance, b.distance));

    let probequeue = [...slopes];
    let killqueue = [] as any;

    while(probequeue.length  > 0)  {
        console.log('probequeue start',  probequeue.length);
        const result = probequeue.reduce((accu, candidate)  => {
            const killed = accu.killed;
            const left = accu.left;

            if(!killed.has(candidate.angle)) {
                killed.set(candidate.angle, candidate)
            }else{
                left.push(candidate)
            }


            return {
                killed, left
            };
        }, {killed: new Map(), left: []});

        probequeue  = result.left;
        killqueue.push(...(result.killed.values()));
    }

    return killqueue[index - 1];

    // const nextBatch = Array.from(nextKills.values());
        // console.log({nextBatch});
    // console.log('kill', {asteroids, station})
}

function calculateVisible(allAsteroids, point) {
    const slopes = withSlopes(allAsteroids, point);

    const values = slopes.map((item) => item.slope);
    const uniqFilter = (value, index, self) => self.indexOf(value) === index;
    const valuesUniq = values.filter( uniqFilter );
    // return { [`${point.x}-${point.y}`]: };
    return [valuesUniq.length, point];
    // return valuesUniq.length
}

function withSlopes(points, point) {
    return points.map(({x, y}) => {
        const x2 = x - point.x;
        const y2 = y - point.y;
        let slope = Math.atan2(y2,x2);
        if (slope > Math.PI){
            slope -= 2 * Math.PI;
        } else if (slope <= -Math.PI) {
            slope += 2 * Math.PI;
        }

        let angle = slope/Math.PI*180 + 90;
        if(angle < 0) {
            angle+=360;
        }

        return {
            x: x2,
            y: y2,
            slope: slope,
            angle:  angle,
            distance: Math.sqrt(x2 * x2 + y2 * y2),
            original: {x, y},
            testPoint: {...point}
        }
    }).filter(value => !(value.x == 0 && value.y == 0))
}


