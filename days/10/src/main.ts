import line from 'bresenham-line';

(async function() {
    await part01();
})();



async function part01() {
    console.log('part01');

    const input = await fetch('./example01.txt');
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

    const result = line({x:3, y:4}, {x:4, y:0});
    const result2 = line({x:3, y:4}, {x:1, y:0});
    console.log({r1: Array.from(result), r2: Array.from(result2)});
}


