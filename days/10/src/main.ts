import line from 'bresenham-line';

(async function() {
    await part01();
})();



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
    const slopes = withSlopes(asteroids, {x:2, y:2});
    console.log({visibleValues, slopes});

    const maxValue = Math.max(...visibleValues);
    console.log({maxValue});
}

function calculateVisible(allAsteroids, point) {
    const slopes = withSlopes(allAsteroids, point);
    const values = slopes.map((item) => item.slope);
    const uniqFilter = (value, index, self) => self.indexOf(value) === index;
    const valuesUniq = values.filter( uniqFilter );
    // return { [`${point.x}-${point.y}`]: valuesUniq.length};
    return valuesUniq.length};
}

function withSlopes(points, point) {
    return points.map(({x, y}) => {
        const x2 = x - point.x;
        const y2 = y - point.y;
        return {
            x: x2,
            y: y2,
            slope: Math.atan2(y2,x2),
            original: {x, y},
            testPoint: {...point}
        }
    }).filter(value => !(value.x == 0 && value.y == 0))
}


