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
    const robot = createRobot();

    let status;

    // while(status !== 'oxygenFound') {
    //     status = await runComputer(instructions, robot);
    // }
    // console.log('oxygen found, done', robot.position, robot.map);
    // const goal = robot.map.get(positionToIndex(robot.position));

    // return 12,12 for ozygen chamber
    // retrievePath(goal);

    while(status !== 'mapComplete') {
        status = await runComputer(instructions, robot);
    }
    console.log('map completed');

    const mapItems =  Array.from(robot.map.values()).map(entry => {
        return {
            type: entry.type,
            position: [...entry.position]
        }
    });

    // const xVal = mapItems.map(value => value.position[0];
    // const yVal = mapItems.map(value => value.position[1];
    //
    // const dimensions = {
    //     minX: Math.min(...xVal),
    //     maxX: Math.max(...xVal),
    //     minY: Math.min(...yVal),
    //     maxY: Math.max(...yVal)
    // };

    floodOxygen(robot.map, mapItems, [12,12], robot);
}
function floodOxygen(originalMap, items, oxygenPoint, robot) {
    const waypoints = items.filter(({position}) => {
        const index = positionToIndex(position);
        const item = originalMap.get(index);
        return item.type !== 'wall';
    }).map(({position}) => {
        return {
            position, visited: false
        }
    });

    const oxygenItem = {
        position: [...oxygenPoint],
        visited: true
    };

    waypoints.push(oxygenItem);
    const findNeighbours = (point, list) => {
        const positions = [MOVE_NORTH,MOVE_EAST,MOVE_SOUTH,MOVE_WEST].map(
            direction => getPosition(direction, point)
        );


        return list.filter(item =>
            positions.find(pos => equal(pos, item.position))
        )
    };

    function visit(points, start, depth) {
        console.log('depth', depth)
        start.visited = true;
        robot.draw(start.position);

        const neighbours = findNeighbours(start.position,  points);
        const availableItems = neighbours.filter(item => !item.visited);
        for(const item of availableItems) {
            setTimeout(() => {
                visit(points, item, depth + 1);
            },50)
        }
    }
    visit(waypoints, oxygenItem, 0);
    //328 depth
    //799 visits

    function equal(a, b) {
        return a[0] == b[0] && a[1] == b[1];
    }

    // TODO: process like djikstra/A*, keep open candidates and remove visited nodes

    // let counter = 0;
    // for(let neighbour of neighbours) {
    //     let index = waypoints.findIndex(item => equal(item, neighbour));
    //     if(index > -1) {
    //         waypoints.splice(index, 1);
    //     }
    // }
    // counter++;
    // console.log(counter, waypoints.length)

}

function retrievePath(goal) {
    let item = goal;
    let steps = 0;
    while(item && item.from && item.from.length > 0)  {
        item.from.sort((a,b) => a.visited -  b.visited);
        item = item.from[0];
        steps++;
    }
    console.log('end  at', item, steps);
    return steps;
}

function positionToIndex(pos){
    const [x,y] = pos;
    return y * MAX_WIDTH + x;
}

function getDirection(direction) {
    switch(direction) {
        case MOVE_NORTH: return [0,-1];
        case MOVE_SOUTH: return [0,1];
        case MOVE_EAST: return [1,0];
        case MOVE_WEST: return [-1,0];
    }
}
function getPosition(dir, base) {
    const direction = getDirection(dir)!;
    const newPosition = [
        base[0] + direction[0],
        base[1] + direction[1]
    ];
    return newPosition;
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
    advancePosition();

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
    function drawDot(pos) {
        ctx.translate(DRAW_OFFSET[0], DRAW_OFFSET[1]);
        ctx.fillStyle ="#ffd700";
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

    function getCandidates(){
        const neighbours = [MOVE_NORTH,MOVE_EAST,MOVE_SOUTH,MOVE_WEST]
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
            })
            .filter(item => {
                const [x, y] = item.position;
                // //never reach oxygen to scan all positions
                if (x == 12 &&  y == 12) {
                    return false;
                }

                return true;
            });

        const newItems = [...neighbours];
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


    async function nextProbe() {

        return new Promise(resolve => {
            const nextDirection = nextCandidate();
            // resolve(nextDirection);

            // requestAnimationFrame(() =>  resolve(nextDirection));

            // fastest, non-drawing
            if(FAST_DRAW) {
                resolve(nextDirection)
            }else{
                setTimeout(() => {
                    resolve(nextDirection)
                }, 0)
            }

            //

            //show drawing

        })

    }
    const WALL = 0;
    const FOUND_OXYGEN = 2;


    function saveWall() {
        drawWall(candidateDirection.position);
        const index = positionToIndex(candidateDirection.position);

        if(processed.has(index)) {
            const entry = processed.get(index);
            entry.visited++;
        }else {
            processed.set(index, {
                type: 'wall',
                visited: 1,
                from: [],
                position: [...candidateDirection.position]
            });
        }

    }

    function advancePosition() {

        drawWaypoint(candidateDirection.position);

        const index = positionToIndex(candidateDirection.position);

        if(processed.has(index)) {
            const entry = processed.get(index);
            entry.visited++;
            entry.from.push(processed.get(positionToIndex(currentPosition)));
        }else {
            let from = null as any;

            if(currentPosition[0] == 0 && currentPosition[1] ==0) {
                from =  []
            }else{
                from =  [processed.get(positionToIndex(currentPosition))]
            }
            processed.set(index, {
                type: 'waypoint',
                visited: 1,
                from: from,
                position: [...candidateDirection.position]
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
        const MAX_FIELDS = 1657; //by observation of processed map size
        const total = Array.from(processed.entries()).length;

        if(total >= 1657) {
            return 'mapComplete'
        }

        return false;
    }

    return  {
        processStatus,
        nextProbe,
        end,
        start,
        draw: drawDot,
        get position() {
            return currentPosition;
        },
        get map() {
            return processed;
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
    let outputStatus = null as any;

    function handleOutput(status) {
        let result = robot.processStatus(status);
        if(result==='empty') {
            running = false;
        }else if(result==='complete') {
            running = false;
            outputStatus = 'oxygenFound';
        }else if(result ==='mapComplete') {
            running = false;
            outputStatus = 'mapComplete';
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
        return outputStatus;
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
