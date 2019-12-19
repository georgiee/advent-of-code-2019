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

    const WIDTH = 200;
    const HEIGHT = 200;
    const zoom = Math.max(window.innerWidth/WIDTH, window.innerHeight/HEIGHT);
    const observer = createTractorBeamObserver(WIDTH,HEIGHT, zoom * 0.8);

    while(observer.hasNext()) {
        await runComputer(instructions, observer);
    }
}

function* createCoordinateGenerator([x, y]: any) {
    yield x;
    yield y;
}

function* createPositionGenerator(width, height): any {
    const positions = width * height;
    for( let  index =  0; index  <  positions; index+=1){
        const x = index%width;
        const y = (index - x)/height;
        yield [x,y];
    }

    return [-1,-1];
}

function makeBeamChecker(width, height) {
    let currentPosition  = [4,4];
    let counter = 0;
    let maxIterations = width * height;
    let done = false;
    let beamInside = false;
    let lastBeamStart  = [...currentPosition] as any;
    let lastBeamEnd  = null as any;

    function reportStatus(status){

        if(!beamInside && status) {
            beamInside = true;
            lastBeamStart  = [...currentPosition];
            // entering beam
        }

        if(beamInside && !status) {
            // leaving beam
            lastBeamEnd = [currentPosition[0] - 1, currentPosition[1]];
            forwardLine();
            beamInside =  false;
        }else{
            // if(lastBeamEnd) {
            //     currentPosition[0] = lastBeamEnd[0];
            //     lastBeamEnd = null;
            // }
        }



    }

    function forwardLine() {
        currentPosition[0] = lastBeamStart[0];
        currentPosition[1] = lastBeamStart[1] + 1;
        lastBeamStart = null;
    }

    function next() {
        let [x,y] = currentPosition;


        if(x < width){
            x +=1;
            currentPosition =  [x,y];
        }else{
            beamInside = false;

            if(lastBeamStart === null) {
                return {done: true, value: [-1,-1]}
            }else{
                forwardLine();
            }
        }

        counter++;
        if (counter  >= maxIterations || currentPosition[1] >=height) {
            done = true;
            console.log('done');
        }else {
            done  = false
        }

        return { value: currentPosition, done }
    }

    return  {
        reportStatus, next
    }
}

function createTractorBeamObserver(width, height, zoom) {
    const canvas = createCanvas(width,height,zoom);
    canvas.fill('#333333');

    const positionGenerator = createPositionGenerator(width, height);
    const beamChecker = makeBeamChecker(width, height);

    let currentPosition;
    let coordinates;
    let statusSum = 0;

    let hasNext =  true;

    function draw(status, pos) {
        if(status == 1) {
            canvas.drawPixelAt(pos, '#ffd700');
        }else{
            canvas.drawPixelAt(pos, 'hotpink');
        }
    }

    function nextPosition() {
        let resultOld = positionGenerator.next();
        let result = beamChecker.next();
        hasNext = !result.done;

        currentPosition = result.value;
        coordinates = createCoordinateGenerator(currentPosition);
    }

    function process(result) {
        beamChecker.reportStatus(result);

        statusSum += result;
        draw(result, currentPosition);
    }

    let inputCounter = 0;
    const DRAW_INTERVAL = 2;
    async function nextInput() {
        inputCounter++;
        const coordinate = coordinates.next().value;
        const instantResult = inputCounter < DRAW_INTERVAL;

        if(inputCounter > DRAW_INTERVAL){
            inputCounter = 0
        }

        return new Promise(ok => {
            if(instantResult) {
                ok(coordinate)
            }else{
                setTimeout(() => ok(coordinate), 10);
            }
        });
    }

    function start() {
        nextPosition();
    }

    function end() {
        // console.log('statusSum', statusSum);
    }

    return {
        start,
        end,
        process,
        nextInput,
        hasNext: () => {
            return hasNext;
        }
    }
}

function runComputer(codes, observer) {
    const computer = createComputer(codes, input, handleOutput);
    observer.start();

    function handleOutput(status) {
        observer.process(status);
    }

    async function input() {
        const value = await observer.nextInput();
        return value;
    }

    async function run() {
        while(!computer.isStopped()) {
            await computer.step();
        }

        observer.end();
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


function createCanvas(width, height, zoom = 1) {
    const canvasElement = document.createElement('canvas');
    canvasElement.width  = width;
    canvasElement.height = height;
    canvasElement.style.imageRendering =  'crisp-edges';
    canvasElement.style.width = String(width * zoom);
    canvasElement.style.height = String(height * zoom);

    document.body.appendChild(canvasElement);

    const ctx = canvasElement.getContext('2d')!;

    function clear() {
        ctx.clearRect(0,0,width, height);
    }

    function fill(color) {
        ctx.fillStyle  = color;
        ctx.fillRect( 0, 0, width, height );
    }

    function drawPixelAt([x,y], color) {
        ctx.fillStyle = color;
        ctx.fillRect( x, y , 1, 1 );
    }

    return {ctx, drawPixelAt, fill, clear};
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
