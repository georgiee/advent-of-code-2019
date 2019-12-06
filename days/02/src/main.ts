const OPP_ADD =  1;
const OPP_MULTIPLE =  2;
const OPP_END =  99;

async function part02() {
    const input = await fetch('./input.txt');
    const datax = await input.text();
    const codes = datax.split(',').map(value => parseInt(value, 10));
    let searching  = true;

    for( let  i = 0; i< 100 && searching; i++) {
        for( let  j = 0; j< 100 && searching; j++) {
            const result =  runComputer(codes.concat(), i, j );
            if(result === 19690720) {
                console.log('end', {noun: i, verb: j, result});
                searching = false
            }
        }
    }

}

function  runComputer(input, noun = null, verb = null) {
    let running = true;
    let cursor =  0;
    let state = input;

    if(noun) {
        state[1]  = noun;
    }

    if(verb){
        state[2]  = verb;
    }

    while(running) {
        const opcode = state[cursor];
        let [stop, newCursor] = processOpcode(opcode, cursor, state);

        if(stop) {
            running = false
        }else {
            cursor = newCursor;
        }
    }
    return state[0];
}
function processOpcode(opcode, cursor, state) {
    switch(opcode) {
        case OPP_ADD: {
            const [_,  a, b, __] = state.slice(cursor, cursor + 4);
            const result = state[a] + state[b];
            const target = state[cursor + 3];
            state[target] = result;
            return [false, cursor + 4];
        }
        case OPP_MULTIPLE: {
            const [_,  a, b, __] = state.slice(cursor, cursor + 4);
            const result = state[a] * state[b];
            const target = state[cursor + 3];
            state[target] = result;
            return [false, cursor + 4];
        }
        case OPP_END: {
            return [true, cursor + 4];
        }
        default: {
            debugger;
            throw new Error('unhandled op code: ' + opcode );
        }
    }
}
(async function() {
    await part02();
})();

// part01();

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const codes = data.split(',').map(value => parseInt(value, 10));

    const OPP_ADD =  1;
    const OPP_MULTIPLE =  2;
    const OPP_END =  99;

    let cursor = 0;
    let running = true;

    //hotfix 1202 program alarm
    codes[1]  = 12;
    codes[2]  = 2;
    while(running) {
        process(cursor, codes);
        cursor += 4;
    }
    console.log('result', codes[0]);

    function process(cursor, data) {
        const [opcode,  a, b, _] = data.slice(cursor, cursor + 4);
        console.log('process@', cursor, 'opcode: ',opcode);

        switch(opcode) {
            case OPP_ADD: {
                const result = data[a] + data[b];
                const target = data[cursor + 3];
                data[target] = result;
                console.log('write',  result,  'to', target);
                break;
            }
            case OPP_MULTIPLE: {
                const result = data[a] * data[b];
                const target = data[cursor + 3];
                data[target] = result;
                console.log('write',  result,  'to', target);
                break
            }
            case OPP_END: {
                running  = false;
                break;
            }
            default: {
                running = false;
                throw new Error('unhandled op code', );
            }
        }
    }
}
