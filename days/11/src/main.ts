(async function() {
    await part01();
})();


const OPP_ADD =  1;
const OPP_MULTIPLE =  2;
const OPP_INPUT =  3;
const OPP_OUTPUT =  4;
const OPP_JUMP_IF_TRUE =  5;
const OPP_JUMP_IF_FALSE =  6;
const OPP_LESS_THAN =  7;
const OPP_EQUALS =  8;
const OPP_RELATIVE_BASE =  9;
const OPP_END =  99;

const POSITION_MODE = 0;
const IMMEDIATE_MODE = 1;
const RELATIVE_MODE = 2;

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructions = data.split(',').map(value => parseInt(value, 10));
    runComputer(instructions);
    console.log('done')
}

function createTurtle() {
    const WIDTH = 200;
    const HEIGHT = 100;
    const ZOOM = 4;
    const canvasElement = document.createElement('canvas');
    canvasElement.width  = WIDTH;
    canvasElement.height = HEIGHT;
    canvasElement.style.imageRendering =  'crisp-edges';
    canvasElement.style.width = String(WIDTH * ZOOM);
    canvasElement.style.height = String(HEIGHT * ZOOM);

    document.body.appendChild(canvasElement);

    const ctx = canvasElement.getContext('2d')!;
    ctx.fillStyle  = '#000000';
    ctx.fillRect( 0, 0, 1000, 1000 );

    const COLOR_BLACK = 0;
    const COLOR_WHITE = 1;
    // const DIRECTIONS = [[0,1], [1,0],[0,-1],[-1,0]];
    // flipped direction to mirror result
    const DIRECTIONS = [[0,-1], [1,0],[0,1],[-1,0]];
    let directionCursor = 0;

    let currentPosition = [WIDTH/2,HEIGHT/2];
    let currentDirection = DIRECTIONS[directionCursor];
    let canvas = new Map();
    let color = COLOR_BLACK;


    const setColor = value  => {
        if(value === 0) {
            color  = COLOR_BLACK;
        }
        if(value === 1) {
            color = COLOR_WHITE;
        }
    };

    function draw() {
        const x = currentPosition[0];
        const y = currentPosition[1];
        canvas.set(`${x}-${y}`,color);
        // console.log(`draw ${color} at ${currentPosition}`);

        ctx.fillStyle = color === 1 ? '#ffffff' : '#000000' ;
        ctx.fillRect( x, y, 1, 1 );
    }

    const getCurrentColor = () =>  {
        const x = currentPosition[0];
        const y = currentPosition[1];
        const value = getColor(x, y);

        // console.log('getCurrentColor',{x,y}, value);
        return value;
    };

    function getColor(x, y) {
        const color =  canvas.get(`${x}-${y}`) || COLOR_BLACK;
        return color;
    }

    // initil panel is white
    setColor(COLOR_WHITE);
    draw();

    const process = (color, direction) => {
        setColor(color);
        draw();
        turn(direction);
        forward(1);
    };

    const forward = (steps = 1)  => {
        currentPosition[0] +=  currentDirection[0] * steps;
        currentPosition[1] +=  currentDirection[1] * steps;
    };

    function setDirection(value) {
        if(value < 0) {
            value+=4;
        }else{
            value = value%4;
        }
        directionCursor  = value;
        // console.log('--->setDirection', directionCursor)
        currentDirection = DIRECTIONS[directionCursor];
    }
    const turnLeft = () => {
        setDirection(directionCursor-1);

        // currentDirection = [0,1]; //up
        // currentDirection = [-1,0]; //left
        // currentDirection = [0,-1]; //down
        // currentDirection = [1,0]; //right
    };

    const turnRight = () => {
        setDirection(directionCursor+1);
        // currentDirection = [0,1]; //up
        // currentDirection = [1,0]; //right
        // currentDirection = [0,-1]; //down
        // currentDirection = [-1,0]; //left
    };

    const turn = dir  => {
        if(dir === 0 ) {
            turnLeft()
        }
        if(dir === 1 ) {
            turnRight()
        }
    };

    function done() {
        console.log('turtle complete', Array.from(canvas.keys()).length);
    }
    return  {
        process,
        getCurrentColor,
        done
    }
}

function runComputer(codes) {
    const turtle = createTurtle();

    const commandQueue = [] as any;

    const handleOutput = result => {
        commandQueue.push(result);

        if(commandQueue.length === 2) {
            //flush
            // console.log('handleOutput',...commandQueue);
            turtle.process(commandQueue[0], commandQueue[1]);
            commandQueue.length = 0;
        }
    };

    const handleInput = () => {
        const color = turtle.getCurrentColor();
        // console.log('handleInput',color);
        return color;
    };

    const computer = createComputer(codes, handleInput, handleOutput);
    let c = 0;
    while(!computer.isStopped()) {
        computer.step();
    }

    turtle.done();
}

function createComputer(codes, getInputFn, outputFn) {
    let running = true;
    let cursor =  0;
    let state = [...codes];
    let relativeBase = (0);

    let changeRelativeBase = (value) => {
        return relativeBase += (value);
    };

    function step() {
        const opcode = state[cursor];
        let [stop, newCursor] = processOpcode(opcode, cursor, state,
            {
                relativeBase
            },
            {
                changeRelativeBase,
                inputFn: getInputFn,
                outputFn: outputFn
            });

        if(stop) {
            running = false
        }else {
            cursor = (newCursor);
        }
    }

    return {
        step,
        isStopped() {
            return !running
        }
    }
}
function parseOpCode(value) {
    const digits = value.toString().split('');
    if(value === 203) {
        // debugger;
    }
    const opcode = parseInt(digits.slice(-2).join(''), 10);
    const modes = digits.slice(0, -2).map(value => parseInt(value, 10));
    modes.reverse();

    return [opcode, modes];
}

function getValueAddress(param, state, mode = POSITION_MODE, relativeBase = 0) {
    let value;

    if(mode === POSITION_MODE ) {
        value = state[param];
    }else if(mode === IMMEDIATE_MODE ) {
        value = param;
    }else if(mode === RELATIVE_MODE ) {
        const address = param + relativeBase;
        value = state[Number(address)];

    }else{
        throw new Error(`Can't handle moode ${mode}`);
    }
    return value || 0;
}

function writeValueAddress(state, address, value, relativeBase, mode = POSITION_MODE) {

    let targetAddress = -1;
    if(mode === POSITION_MODE ) {
        targetAddress = address;
    }else if(mode === RELATIVE_MODE ) {
        const addressBigInt = address + relativeBase;
        targetAddress = (addressBigInt);
    }else{
        throw new Error(`Can't handle mode ${mode}`);
    }

    // console.log('writeValueAddress', {address, targetAddress, value});
    state[targetAddress] = value;

}

let temp = 0;
function processOpcode(opcodeValue, cursor, state, {relativeBase},  {changeRelativeBase, inputFn, outputFn}) {
    const [opcode, modes] = parseOpCode(opcodeValue);
    // console.log({opcode,  modes});
    // curry getValue with locally constant values like state and relativeBase etcs
    const getValue = (value, accessMode): any  => {
        // console.log('getValue', value,accessMode,relativeBase )
        return getValueAddress(value, state, accessMode, relativeBase);
    };

    const writeState = (address, value, mode) => {
        writeValueAddress(state, address, value, relativeBase, mode);
        // state[address] = value;
    };


    switch(opcode) {
        case OPP_ADD: {
            const [_,  a, b, c] = state.slice(cursor, cursor + 4);
            const paramA = getValue(a, modes[0]);
            const paramB = getValue(b, modes[1]);
            //output is always position mode
            const paramC = getValue(c, IMMEDIATE_MODE);

            //calc
            // const result = BigInt(paramA) + BigInt(paramB);
            const result = (paramA) + (paramB);
            const writeAddress =  modes[2] || POSITION_MODE;
            writeState(paramC, result, writeAddress);

            return [false, cursor + 4];
        }
        case OPP_MULTIPLE: {
            const [_,  a, b, c] = state.slice(cursor, cursor + 4);
            const paramA = getValue(a, modes[0]);
            const paramB = getValue(b, modes[1]);
            //output is always position mode

            const paramC = getValue(c, IMMEDIATE_MODE);
            // console.log({c,  modes})

            //calc
            // const result = BigInt(paramA) * BigInt(paramB);
            const result = (paramA) * (paramB);

            const writeAddress =  modes[2] || POSITION_MODE;
            writeState(paramC, result, writeAddress);

            return [false, cursor + 4];
        }
        case OPP_INPUT: {
            const [_,  address] = state.slice(cursor, cursor + 2);
            const input = inputFn();

            writeState(address, input, modes[0]);

            return [false, cursor + 2];
        }
        case OPP_OUTPUT: {
            const [_,  paramA] = state.slice(cursor, cursor + 2);
            const value = getValue(paramA, modes[0]);
            outputFn(value);

            return [false, cursor + 2];
        }
        case OPP_JUMP_IF_FALSE: {
            const PARAMS_COUNT = 3;
            const [_,  a, b] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a, modes[0]);
            const paramB = getValue(b, modes[1]);

            if(paramA === 0){
                return [false, paramB];
            }

            return [false, cursor + PARAMS_COUNT];
        }
        case OPP_JUMP_IF_TRUE: {
            const PARAMS_COUNT = 3;

            const [_, a, b] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a, modes[0]);
            const paramB = getValue(b, modes[1]);

            if(paramA !== 0){
                return [false, paramB];
            }
            // do not forward the cursor, keep the overwritten value
            return [false, cursor + PARAMS_COUNT];
        }
        case OPP_LESS_THAN: {
            const PARAMS_COUNT = 4;

            const [_, a, b, c] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a, modes[0]);
            const paramB = getValue(b, modes[1]);
            //output
            const paramC = getValue(c, IMMEDIATE_MODE);

            const writeAddress =  modes[2] || POSITION_MODE;

            if(paramA < paramB){
                writeState(paramC, 1, writeAddress);
            }else{
                writeState(paramC, 0, writeAddress);
            }

            return [false, cursor + PARAMS_COUNT];
        }
        case OPP_EQUALS: {
            const PARAMS_COUNT = 4;

            const [_, a, b, c ] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a, modes[0]);
            const paramB = getValue(b, modes[1]);
            //output
            const paramC = getValue(c, IMMEDIATE_MODE);

            const writeAddress =  modes[2] || POSITION_MODE;

            if(paramA === paramB){
                writeState(paramC, 1, writeAddress);
            }else{
                writeState(paramC, 0, writeAddress);
            }

            return [false, cursor + PARAMS_COUNT];
        }
        case OPP_RELATIVE_BASE: {
            const PARAMS_COUNT = 2;

            const [_, a] = state.slice(cursor, cursor + PARAMS_COUNT);
            const paramA = getValue(a, modes[0]);
            changeRelativeBase(paramA);

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
