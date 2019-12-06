(async function() {
    await part01();
})();


const OPP_ADD =  1;
const OPP_MULTIPLE =  2;
const OPP_SAVE_AT_ADDRESS =  3;
const OPP_OUTPUT_ADDRESS =  4;
const OPP_JUMP_IF_TRUE =  5;
const OPP_JUMP_IF_FALSE =  6;
const OPP_LESS_THAN =  7;
const OPP_EQUALS =  8;
const OPP_END =  99;


async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructions = data.split(',').map(value => parseInt(value, 10));

    runComputer(instructions, 5);
    console.log('done')
}

function runComputer(codes, globalInput) {
    let running = true;
    let cursor =  0;
    let state = [...codes];

    while(running) {
        const opcode = state[cursor];
        let [stop, newCursor] = processOpcode(opcode, cursor, state, globalInput);

        if(stop) {
            running = false
        }else {
            cursor = newCursor;
        }
    }

    return state[0];
}
function parseOpCode(value) {
    const digits = value.toString().split('');
    const opcode = parseInt(digits.slice(-2).join(''), 10);
    const modes = digits.slice(0, -2).map(value => parseInt(value, 10));
    modes.reverse();

    return [opcode, modes];
}

const POSITION_MODE = 0;
const IMMEDIATE_MODE = 1;
function getValue(param, state, mode = POSITION_MODE) {
    let value;

    if(mode === POSITION_MODE ) {
        value = state[param];
    }else if(mode === IMMEDIATE_MODE ) {
        value = param;
    }else{
        throw new Error(`Can't handle moode ${mode}`);
    }

    return value;
}

function processOpcode(opcodeValue, cursor, state, globalInput) {
    const [opcode, modes] = parseOpCode(opcodeValue);

    switch(opcode) {
        case OPP_ADD: {
            const [_,  a, b, c] = state.slice(cursor, cursor + 4);
            const paramA = getValue(a,state, modes[0]);
            const paramB = getValue(b, state, modes[1]);
            //output is always position mode
            const paramC = getValue(c, state, IMMEDIATE_MODE);

            //calc
            const result = paramA + paramB;
            state[paramC] = result;
            return [false, cursor + 4];
        }
        case OPP_MULTIPLE: {
            const [_,  a, b, c] = state.slice(cursor, cursor + 4);
            const paramA = getValue(a,state, modes[0]);
            const paramB = getValue(b, state, modes[1]);
            //output is always position mode
            const paramC = getValue(c, state, IMMEDIATE_MODE);
            //calc
            const result = paramA * paramB;
            state[paramC] = result;
            return [false, cursor + 4];
        }
        case OPP_SAVE_AT_ADDRESS: {
            const [_,  address] = state.slice(cursor, cursor + 2);
            const input = globalInput;

            state[address] = input;

            return [false, cursor + 2];
        }
        case OPP_OUTPUT_ADDRESS: {
            const [_,  paramA] = state.slice(cursor, cursor + 2);
            const value = getValue(paramA, state, modes[0]);
            console.log('OPP_OUTPUT', value);

            return [false, cursor + 2];
        }
        case OPP_JUMP_IF_FALSE: {
            const PARAMS_COUNT = 3;
            const [_,  a, b] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a,state, modes[0]);
            const paramB = getValue(b, state, modes[1]);

            if(paramA === 0){
                return [false, paramB];
            }

            return [false, cursor + PARAMS_COUNT];
        }
        case OPP_JUMP_IF_TRUE: {
            const PARAMS_COUNT = 3;

            const [_, a, b] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a,state, modes[0]);
            const paramB = getValue(b, state, modes[1]);

            if(paramA !== 0){
                return [false, paramB];
            }
            // do not forward the cursor, keep the overwritten value
            return [false, cursor + PARAMS_COUNT];
        }
        case OPP_LESS_THAN: {
            const PARAMS_COUNT = 4;

            const [_, a, b, c] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a,state, modes[0]);
            const paramB = getValue(b, state, modes[1]);
            //output
            const paramC = getValue(c, state, IMMEDIATE_MODE);

            if(paramA < paramB){
                state[paramC] = 1;
            }else{
                state[paramC] = 0;
            }

            return [false, cursor + PARAMS_COUNT];
        }
        case OPP_EQUALS: {
            const PARAMS_COUNT = 4;

            const [_, a, b, c ] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a,state, modes[0]);
            const paramB = getValue(b, state, modes[1]);
            //output
            const paramC = getValue(c, state, IMMEDIATE_MODE);

            if(paramA === paramB){
                state[paramC] = 1;
            }else{
                state[paramC] = 0;
            }
            console.log(...state)

            return [false, cursor + PARAMS_COUNT];
        }

        case OPP_END: {
            return [true, cursor + 1];
        }
        default: {
            throw new Error('unhandled op code: ' + opcode );
        }
    }
}
