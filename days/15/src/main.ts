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

const WIDTH = 100;
const HEIGHT = 100;


const MOVE_NORTH = 1;
const MOVE_SOUTH = 2;
const MOVE_WEST = 3;
const MOVE_EAST = 4;
const MAX_WIDTH = 1000;

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructions = data.split(',').map(value => parseInt(value, 10));
    const robot = createRobot();

    let maxRuns = 2;
    let oxygenFound  = false;
    while(!oxygenFound) {
        oxygenFound = await runComputer(instructions, robot);
    }

    console.log('oxygen found, done', robot.position);
}

function createRobot() {
    const processed: Map<Number, any> = new Map();

    const {ctx} =  createCanvas();
    ctx.fillStyle  = '#ff0000';
    ctx.fillRect( 0, 0, WIDTH, HEIGHT );
    const DRAW_OFFSET = [WIDTH/2, HEIGHT/2];

    let currentPosition = [0,0];
    let candidateDirection = {direction:0, position:[0,0]};
    let currentCandidates = [] as any;
    drawRobot(currentPosition);

    function drawWall(pos) {
        ctx.translate(DRAW_OFFSET[0], DRAW_OFFSET[1]);
        ctx.fillStyle ="#000000";
        ctx.fillRect( pos[0], pos[1], 1, 1 );
        ctx.resetTransform();
    }

    function drawWaypoint(pos) {
        ctx.translate(DRAW_OFFSET[0], DRAW_OFFSET[1]);
        ctx.fillStyle ="#00ff00";
        ctx.fillRect( pos[0], pos[1], 1, 1 );
        ctx.resetTransform();
    }

    function drawRobot(pos) {
        ctx.translate(DRAW_OFFSET[0], DRAW_OFFSET[1]);
        ctx.fillStyle ="#00ffec";
        ctx.fillRect( pos[0], pos[1], 1, 1 );
        ctx.resetTransform();
    }

    function drawOxygen(pos) {
        ctx.translate(DRAW_OFFSET[0], DRAW_OFFSET[1]);
        ctx.fillStyle ="#3a5dff";
        ctx.fillRect( pos[0], pos[1], 1, 1 );
        ctx.resetTransform();
    }

    function start(){
        console.log('start run')
        currentPosition = [0,0];
        currentCandidates = [];
        updateCandidates();
    }

    function end(){
        console.log('end run')
    }

    function getDirection(direction) {
        switch(direction) {
            case MOVE_NORTH: return [0,-1];
            case MOVE_SOUTH: return [0,1];
            case MOVE_EAST: return [1,0];
            case MOVE_WEST: return [-1,0];
        }
    }

    function getCandidates(){
        const items = [MOVE_NORTH,MOVE_EAST,MOVE_SOUTH,MOVE_WEST]
            .map(dir => {
                const entry = processed.get(positionToIndex(getPosition(dir, currentPosition)));
                return {
                    position: getPosition(dir, currentPosition),
                    type:  entry ? entry.type :  'unknow',
                    direction: dir,
                    visited: entry ?  entry.visited  : 0
                }
            })
            .filter(item => {
                return item.type !== 'wall';
            });

        const newItems = [...items];
        // move visited to the end of the queue (start of array as we pop)
        newItems.sort((a,b) => {
            return b.visited - a.visited;
        });

        return newItems;
    }

    function nextCandidate() {
        candidateDirection = currentCandidates.pop();
        // console.log('nextCandidate', candidateDirection);
        return candidateDirection.direction;
    }

    function updateCandidates() {
        // console.log('updateCandidates');
        currentCandidates = getCandidates();
    }

    function getPosition(dir, base) {
        const direction = getDirection(dir)!;
        const newPosition = [
            base[0] + direction[0],
            base[1] + direction[1]
        ];
        return newPosition;
    }

    let counter = 1000;
    async function nextProbe() {

        return new Promise(resolve => {
            if(counter <= 0) {
                return;
            }

            counter--;
            const nextDirection = nextCandidate();

            setTimeout(() => {
                resolve(nextDirection);
            }, 1)
        })

    }
    const WALL = 0;
    const FOUND_OXYGEN = 2;

    function positionToIndex(pos){
        const [x,y] = pos;
        return y * MAX_WIDTH + x;
    }

    function saveWall() {
        drawWall(candidateDirection.position);
        const index = positionToIndex(candidateDirection.position);

        if(processed.has(index)) {
            const entry = processed.get(index);
            entry.visited++;
        }else {
            processed.set(index, {
                type: 'wall',
                visited: 1
            });
        }

    }

    function advancePosition() {
        drawWaypoint(candidateDirection.position);

        const index = positionToIndex(candidateDirection.position);

        if(processed.has(index)) {
            const entry = processed.get(index);
            entry.visited++;
        }else {
            processed.set(index, {
                type: 'waypoint',
                visited: 1
            });
        }


        currentPosition = [...candidateDirection.position];
        updateCandidates();
    }

    function processStatus(status) {
        if(status === WALL) {
            saveWall();
        } else {
            advancePosition();
        }
        if(currentCandidates.length === 0) {
            return 'empty'
        }

        if(status === FOUND_OXYGEN) {
            advancePosition();
            drawOxygen(currentPosition);
            return 'complete'
        }

        return false;
    }

    return  {
        processStatus,
        nextProbe,
        end,
        start,
        get position() {
            return currentPosition;
        }
    }
}



function createCanvas() {
    const ZOOM = 10;
    const canvasElement = document.createElement('canvas');
    canvasElement.width  = WIDTH;
    canvasElement.height = HEIGHT;
    canvasElement.style.imageRendering =  'crisp-edges';
    canvasElement.style.width = String(WIDTH * ZOOM);
    canvasElement.style.height = String(HEIGHT * ZOOM);

    document.body.appendChild(canvasElement);

    const ctx = canvasElement.getContext('2d')!;

    return {ctx};
}


function runComputer(codes, robot) {
    console.log('new computer run started');

    const computer = createComputer(codes, input, handleOutput);
    robot.start();

    let running = true;
    let oxygenFound = false;
    function handleOutput(status) {
        let result = robot.processStatus(status);
        if(result==='empty') {
            running = false;
        }else if(result==='complete') {
            running = false;
            oxygenFound = true;
        }
    }

    async function input() {
        const input = await robot.nextProbe();
        return input;
    }

    async function run() {
        while(!computer.isStopped() && running) {
            await computer.step();
        }

        robot.end();
        return oxygenFound;
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
