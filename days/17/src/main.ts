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

const WIDTH = 42;
const HEIGHT = 42;


const MOVE_NORTH = 1;
const MOVE_SOUTH = 2;
const MOVE_WEST = 3;
const MOVE_EAST = 4;
const MAX_WIDTH = 1000;

const FAST_DRAW = false;
async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructions = data.split(',').map(value => parseInt(value, 10));
    const camera = createAsciiCamera();

    await runComputer(instructions, camera);
    // console.log('part 1', camera.alignmentSum());

    // wake up robot for part 2
    instructions[0] = 2;
    await runComputer(instructions, camera);
}

function createAsciiCamera() {
    // by observation
    const WIDTH = 37;
    const HEIGHT = 33;
    const {ctx} =  createCanvas(WIDTH, HEIGHT, 10);
    ctx.fillStyle  = '#000000';
    ctx.fillRect( 0, 0, WIDTH, HEIGHT );

    let currentPosition = [0,0];
    let scaffoldPositions = new Map();

    function drawPixel(color) {
        ctx.fillStyle = color;
        ctx.fillRect( currentPosition[0], currentPosition[1], 1, 1 );
    }

    function saveScaffold(position) {
        const index = positionToIndex(position, WIDTH, HEIGHT);
        scaffoldPositions.set(index, [...position]);
    }

    function positionToIndex(position, w, h) {
        const [x,y] = position;
        return y * w + x * h;
    }

    function getNeighbours(position, positionMap) {
        const [x,y] = position;
        const candidates = [[0,-1], [1,0],[0,1],[-1,0]].map(direction => {
            const xPos = x + direction[0];
            const yPos = y + direction[1];
            return [xPos, yPos]
        });

        const result = candidates.filter(([x,y]) => {
            if(x < 0 || x > WIDTH) return false;
            if(y < 0 || y > HEIGHT) return false;

            const index = positionToIndex([x,y], WIDTH, HEIGHT);
            return positionMap.has(index);
        });

        return result;
    }

    function draw(character){
        // scaffold
        if(character === 35) {
            saveScaffold(currentPosition);
            drawPixel("#ff00b9");
        }
        if(character === 46) {
            drawPixel("#ffd700");
        }
    }
    function process(character) {
        if (character === 10) {
            currentPosition[0] = 0;
            currentPosition[1] += 1;

        }else{
            draw(character);
            currentPosition[0] += 1;
        }
    }

    function alignmentSum() {
        const list = Array.from(scaffoldPositions.values());
        const intersections = list.map(position => {
            const neighbours = getNeighbours(position, scaffoldPositions);
            return {
                position,
                neighbours,
                neighboursCount: neighbours.length
            }
        }).filter(item => item.neighboursCount === 4);

        const alignmentParametersSum = intersections.reduce((accu, item) => {
            const [x,y] = item.position;
            return accu + x*y
        }, 0);

        return alignmentParametersSum;
    }

    function start() {
        console.log('ascii start');
    }

    function end() {
        console.log('ascii end');
    }

    return  {
        start, end, process, alignmentSum
    }
}

function createCanvas(width, height, zoom = 1) {
    const canvasElement = document.createElement('canvas');
    canvasElement.width  = width;
    canvasElement.height = height;
    canvasElement.style.imageRendering =  'crisp-edges';
    canvasElement.style.width = String(width * zoom);
    canvasElement.style.height = String(height * zoom);

    document.body.appendChild(canvasElement);

    const ctx = canvasElement.getContext('2d')!;

    return {ctx};
}

function runComputer(codes, asciiCamera) {
    console.log('computer started');

    const computer = createComputer(codes, input, handleOutput);
    asciiCamera.start();

    function handleOutput(status) {
        asciiCamera.process(status);
    }

    async function input() {
        console.log('input');
        throw new Error('handle input, part 2 is missing');

        return null;
    }

    async function run() {
        while(!computer.isStopped()) {
            await computer.step();
        }

        asciiCamera.end();
    }

    return run();
}

function createComputer(codes, getInputFn, outputFn) {
    let running = true;
    let cursor =  0;
    let state = [...codes];
    let relativeBase = (0);

    let changeRelativeBase = (value) => {
        return relativeBase += (value);
    };

    async function step() {
        const opcode = state[cursor];
        let [stop, newCursor,  debugData] = await processOpcode(opcode, cursor, state,
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

        return debugData;
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
async function processOpcode(opcodeValue, cursor, state, {relativeBase},  {changeRelativeBase, inputFn, outputFn}) {
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
            const input = await inputFn();
            writeState(address, input, modes[0]);

            return [false, cursor + 2,  'input-op'];
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
