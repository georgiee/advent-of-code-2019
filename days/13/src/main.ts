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
    console.log('part01 a');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructions = data.split(',').map(value => parseInt(value, 10));
    runComputer(instructions);
}

const TILE_EMPTY = 0;
const TILE_WALL = 1;
const TILE_BLOCK = 2;
const TILE_H_PADDLE = 3;
const TILE_BALL = 4;

function createGame() {
    const tiles = new Set();
    const WIDTH = 45;
    const HEIGHT = 45;
    const ZOOM = 10;
    const canvasElement = document.createElement('canvas');
    canvasElement.width  = WIDTH;
    canvasElement.height = HEIGHT;
    canvasElement.style.imageRendering =  'crisp-edges';
    canvasElement.style.width = String(WIDTH * ZOOM);
    canvasElement.style.height = String(HEIGHT * ZOOM);

    document.body.appendChild(canvasElement);

    const ctx = canvasElement.getContext('2d')!;
    ctx.fillStyle  = '#ffffff';
    ctx.fillRect( 0, 0, 1000, 1000 );
    let lastPaddlePos = [-1,-1];
    let lastBallPos = [-1,-1];
    let lastBallPositions = [];

    let count = 0;
    let score = 0;
    function drawTile(tile, x, y) {
        switch(tile){
            case TILE_EMPTY:
                // nothing to do
                break;
            case TILE_WALL:
                ctx.fillStyle ="#000000";
                ctx.fillRect( x, y, 1, 1 );
                break;

            case TILE_BLOCK:
                tiles.add(y * WIDTH + x);
                ctx.fillStyle ="#ffe600";
                ctx.fillRect( x, y, 1, 1 );
                count++;
                break;

            case TILE_H_PADDLE:
                ctx.fillStyle ="#00ff00";
                ctx.clearRect( lastPaddlePos[0], lastPaddlePos[1], 1, 1 );
                ctx.fillRect( x, y, 1, 1 );
                lastPaddlePos = [x,y];
                // console.log('tile');
                // debugger;
                break;


            case TILE_BALL:
                ctx.clearRect( lastBallPos[0], lastBallPos[1], 1, 1 );
                ctx.fillStyle ="#ff0099";
                ctx.fillRect( x, y, 1, 1 );
                lastBallPos = [x,y];
                lastBallPositions.push([x,y]);
                break;


        }
    }

    function draw(x, y, tile) {
        drawTile(tile, x, y);
    }

    function drawDisplay(value){
        console.log('score', score, lastBallPos);
        // score which means the ball touched a block
        // but we don't know in which direction.
        // console.log(lastBallPositions)
        // debugger;
        // ctx.clearRect( lastBallPos[0], lastBallPos[1] -  1, 1, 1 );

        score = value;
    }
    function clear()  {
        ctx.clearRect(0,0,WIDTH,HEIGHT );
    }

    const process = (x, y, payload) => {
        if(x ==-1 && y == 0) {
            //display
            drawDisplay(payload)
        }else{
            //tile
            draw(x,y,payload);
        }
    };

    function gameOver(){
        console.log('gameOver', score)
    }

    function joystickOutput() {
        const dx = lastBallPos[0] - lastPaddlePos[0];
        return dx;
    }

    return  {
        process,
        joystickOutput,
        gameOver,
        clear
    }
}

function runComputer(codes) {
    codes[0] = 2; //free games (part 2

    const OUTPUT_PACKAGE_SIZE = 3;
    const game = createGame();

    const commandQueue = [] as any;

    const handleOutput = result => {
        // console.log(result)
        commandQueue.push(result);

        if(commandQueue.length === OUTPUT_PACKAGE_SIZE) {
            game.process(commandQueue[0], commandQueue[1], commandQueue[2]);
            commandQueue.length = 0;
        }
    };
    const computer = createComputer(codes, input, handleOutput);

    function input() {
        return new Promise((ok, bad) => {
            requestAnimationFrame(() => {
                ok(game.joystickOutput());
            });
        })
    }

    async function run() {
        while(!computer.isStopped()) {
            const result = await computer.step();
        }

        game.gameOver();
    }

    const promise = run();
    promise.then(() => {
        console.log('---end');
    })
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
