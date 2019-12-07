(async function() {
    await part02Test();
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

function amplifyProcessor(phase, instructions) {
    const noop = () => {};

    let firstInput = true;
    let outputFn = noop as any;
    let inputFn = noop;

    const handleInput = () => {
        let value;
        if(firstInput) {
            value = phase;
            firstInput = false;
        }else{
            return inputFn();
        }
        return value;
    };

    const handleOutput = result => {
        outputFn(result)
    };
    const computer = createComputer(instructions, handleInput, handleOutput);

    return {
        computer: computer,
        step: () => computer.step(),
        get stopped() {
            return computer.isStopped()
        },
        setOutput: (value) => outputFn = value,
        setInput: (value) => inputFn = value,
    }
}

async function part02Test() {
    console.log(new Date());

    console.log('part02Test');
    let max = 0;

    const createAmplifier = (name = 'n/a', phase, done = () => {}, instructions) => {
        let currentOutput = 0;
        const processor = amplifyProcessor(phase, instructions);
        let nextAmp;
        let processing = false;
        let currentInput = 0;

        const outputFn = value => {
            currentOutput = value;

            processing = false;
        };

        const requestInput = value => {
            return currentInput;
        };

        processor.setOutput(outputFn);
        processor.setInput(requestInput);

        return {
            next: (amp) =>  { },
            name,
            phase,
            connect(value) {
                nextAmp = value;
            },
            getValue() {
                return currentInput
            },
            start() {
                this.take(0);
                this.run();
            },

            take(value) {
                currentInput = value;
            },
            run() {
                processing = true;
                // console.log(max);
                while(processing && !this.stopped) {
                    max++;
                    this.step();
                }

                if(this.stopped) {
                    processing = false
                    done();
                }else{
                    nextAmp.take(currentOutput);

                    if(!nextAmp.stopped){
                        setTimeout(
                            () => nextAmp.run(), 0
                        );
                    }
                }
            },
            get output() {
                return currentOutput;
            },
            get stopped() {
                return processor.stopped
            },
            step: () => processor.step()
        }
    };


    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructionSet = data.split(',').map(value => parseInt(value, 10));

    async function runWithPhase(phases) {
        console.log('runWithPhase', phases);

        return new Promise((resolve) => {
            const amplifierA = createAmplifier('A',phases[0], done, instructionSet );
            const amplifierB = createAmplifier('B',phases[1], done, instructionSet);
            const amplifierC = createAmplifier('C',phases[2], done, instructionSet );
            const amplifierD = createAmplifier('D',phases[3], done, instructionSet );
            const amplifierE = createAmplifier('E',phases[4], done, instructionSet );

            function done() {
                resolve(amplifierA.getValue())
            }

            amplifierA.connect(amplifierB);
            amplifierB.connect(amplifierC);
            amplifierC.connect(amplifierD);
            amplifierD.connect(amplifierE);
            amplifierE.connect(amplifierA);

            amplifierA.start();
        })
    }
    const phasesToCheck = [5,6,7,8,9];
    const phasePermutations = permutations(phasesToCheck);

    let maxPhase = {
        phase: [0,0,0,0,0],
        value: 0
    };

    // console.log(phasePermutations);
    // let counter  = 0;
    for(const phase of phasePermutations) {
        console.log('processing', phase);
        const result = await runWithPhase(phase) as any;
        console.log('done');
        //
        if(result > maxPhase.value){
            maxPhase = {
                value: result,
                phase: phase
            };
        }
    }

    console.log(maxPhase)
    console.log(new Date());

    //
    // const maxThrusterPhaseConfig = allThrusterValues.reduce((current, element) => {
    //     return current.signal > element.signal ? current : element
    // });

    // console.log({maxThrusterPhaseConfig});

    //
    // runAmplifiers([
    //     amplifierA, amplifierB, amplifierC, amplifierD,  amplifierE
    // ]);

    // const amplifierB = createAmplifier('B', 8);
    // const amplifierC = createAmplifier('C', 7);
    // const amplifierD = createAmplifier('D', 6);
    // const amplifierE = createAmplifier('E', 5);
    //
    // const ampNodeA = new AmpNode(amplifierA);
    // const ampNodeB = new AmpNode(amplifierB);
    // const ampNodeC = new AmpNode(amplifierC);
    // const ampNodeD = new AmpNode(amplifierD);
    // const ampNodeE = new AmpNode(amplifierE);
    //
    // ampNodeA.connect(ampNodeB);
    // ampNodeB.connect(ampNodeC);
    // ampNodeC.connect(ampNodeD);
    // ampNodeD.connect(ampNodeE);
    // ampNodeE.connect(ampNodeA);
    //
    // const executor = new Execution(ampNodeA);
    // executor.start();
}

async function part02() {
    console.log('part02');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructions = data.split(',').map(value => parseInt(value, 10));

    const phasesToCheck = [5,6,7,8,9];
    const phasePermutations = permutations(phasesToCheck);

    const createAmplifier = (name = 'n/a', phase) => {
        let currentOutput = 0;
        const processor = amplifyProcessor(phase, instructions);

        const outputFn = value => {
            currentOutput = value;
            console.log('output' + name, value)
        };

        processor.setOutput(outputFn);

        return {
            name,
            phase,
            get output() {
                return currentOutput;
            },
            set outputFn(value) {
                processor.setOutput(value)
            },
            set inputFn(value) {
                processor.setInput(value)
            },
            get stopped() {
                return processor.stopped
            },
            step: () => processor.step()
        }
    };

    const amplifierA = createAmplifier('A',9 );
    const amplifierB = createAmplifier('B',8 );
    const amplifierC = createAmplifier('C',7 );
    const amplifierD = createAmplifier('D',6 );
    const amplifierE = createAmplifier('E',5 );

    const runAmplifiers =  amplifiers => {
        let running  = true;
        let count = 0;

        while(running ) {
            count++;
            for(const amplifier of amplifiers) {
                amplifier.step();
                if(amplifier.name === 'E' && amplifier.stopped) {
                    running = false;
                }
            }
        }

        console.log('end', count);
    };

    amplifierA.inputFn = () => amplifierE.output;
    amplifierB.inputFn = () => amplifierA.output;
    amplifierC.inputFn = () => amplifierB.output;
    amplifierD.inputFn = () => amplifierC.output;
    amplifierE.inputFn = () => amplifierD.output;

    runAmplifiers([
        amplifierA, amplifierB, amplifierC, amplifierD,  amplifierE
    ]);
    // const amplifierB = createAmplifier('B', 8);
    // const amplifierC = createAmplifier('C', 7);
    // const amplifierD = createAmplifier('D', 6);
    // const amplifierE = createAmplifier('E', 5);
    //
    // const ampNodeA = new AmpNode(amplifierA);
    // const ampNodeB = new AmpNode(amplifierB);
    // const ampNodeC = new AmpNode(amplifierC);
    // const ampNodeD = new AmpNode(amplifierD);
    // const ampNodeE = new AmpNode(amplifierE);
    //
    // ampNodeA.connect(ampNodeB);
    // ampNodeB.connect(ampNodeC);
    // ampNodeC.connect(ampNodeD);
    // ampNodeD.connect(ampNodeE);
    // ampNodeE.connect(ampNodeA);
    //
    // const executor = new Execution(ampNodeA);
    // executor.start();
}

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    const data = await input.text();
    const instructions = data.split(',').map(value => parseInt(value, 10));

    const phasesToCheck = [0,1,2,3,4];
    const phasePermutations = permutations(phasesToCheck);

    // now check all 120 permutations

    const createAmplifier = (name = 'n/a') => ({phase, signal = 0}) => {
        return amplifyProcessor(phase, signal, instructions);
    };

    const calculateThrusterSignal = (currentPhaseConfiguration) => {
        return currentPhaseConfiguration.reduce((previouSignal, currentPhase) => {
            const amplify = createAmplifier()  as any;
            const signalValue = amplify({phase:  currentPhase, signal: previouSignal});
            return signalValue;
        }, 0);
    };


    const allThrusterValues = phasePermutations.map(phase => {
        return {
            phase,
            signal: calculateThrusterSignal(phase)
        }
    });
    console.log(allThrusterValues);

    const maxThrusterPhaseConfig = allThrusterValues.reduce((current, element) => {
        return current.signal > element.signal ? current : element
    });

    console.log({maxThrusterPhaseConfig});
}


// google 😬
function permutations(list) {
    let ret = []  as any;

    for (let i = 0; i < list.length; i = i + 1) {
        let rest = permutations(list.slice(0, i).concat(list.slice(i + 1)));

        if(!rest.length) {
            ret.push([list[i]])
        } else {
            for(let j = 0; j < rest.length; j = j + 1) {
                ret.push([list[i]].concat(rest[j]))
            }
        }
    }
    return ret;
}

function createComputer(codes, getInputFn, outputFn) {
    let running = true;
    let cursor =  0;
    let state = [...codes];

    let result = null;

    function step() {
        const opcode = state[cursor];
        let [stop, newCursor] = processOpcode(opcode, cursor, state, {
            inputFn: getInputFn,
            outputFn: outputFn
        });


        if(stop) {
            running = false
        }else {
            cursor = newCursor;
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

function processOpcode(opcodeValue, cursor, state, {inputFn, outputFn}) {
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
            const input = inputFn();
            // console.log('OPP_INNPUT', input);

            state[address] = input;

            return [false, cursor + 2];
        }
        case OPP_OUTPUT_ADDRESS: {
            const [_,  paramA] = state.slice(cursor, cursor + 2);
            const value = getValue(paramA, state, modes[0]);
            // console.log('OPP_OUTPUT', value);
            outputFn(value);

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

// class Execution {
//     private _signal = 0;
//     private _hops = 0;
//     constructor(
//         public node
//     ){ }
//
//     start() {
//         this.take(this.node);
//     }
//
//     set signal(value) {
//         this._signal = value;
//     }
//     get signal() {
//         return this._signal;
//     }
//
//     next() {
//         this.take(this.node.nextAmplifier)
//     }
//
//     take(node) {
//         console.log('take node', node);
//
//         this._hops++;
//         if(this._hops > 10) {
//             console.log('interupted');
//             return;
//         }
//         this.node = node;
//         this.node.execute(this);
//     }
// }
//
// class AmpNode {
//     private nextAmplifier;
//     constructor(
//         private _amplifier
//     ) { }
//
//     connect(value) {
//         this.nextAmplifier = value;
//     }
//
//     execute(execution: Execution) {
//         const signal = this._amplifier.run({signal: execution.signal});
//         console.log('executing node', this._amplifier.name);
//         console.log({incoming: execution.signal, calculated: execution.signal});
//
//         execution.signal = signal;
//         execution.next();
//     }
// }
