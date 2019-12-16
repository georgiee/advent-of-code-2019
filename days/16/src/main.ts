(async function() {
    await run();
})();

async function run() {
    console.log('part01 2a');

    const input = await fetch('./input.txt');
    const data = await input.text();

    const digits = '12345678'.split('')
            .map(value => parseInt(value, 10))
            .filter(value => Number.isInteger(value));

console.log(digits)
    // part1(digits);
    part2(digits);
}

function repeat(digits, times) {
    let counter =  times;
    let result = [];
    while(counter-- > 0) {
        result = result.concat(digits);
    }
    return result;
}

function part2(digits) {
    //  that's most likely WRONG, as each
    const fullDigitSet = repeat(digits, 2);
    const offset = parseInt(digits.slice(0, 8).join(''),10);
    console.log('run1'  );
    const basephase =  [0, 1, 0, -1];
    const phaseMaker = depth => makePhase(basephase, depth);
    const fftMaker = digitList => makeFFT(digitList, phaseMaker);
    const fft = fftMaker(digits);
    const result = (fft.next().value);

    console.log('run2');
    const fft2 = fftMaker(fullDigitSet);
    const result2 = (fft2.next().value);
    // nothing that points to the underlying systematic
    // instead of brute forcing through the full  set of
    // a  fullDigitSet with 1000 times repeated digits.
    console.log(result, result2);
}

function getResult(digits, offset = 0) {
    return digits.slice(offset, 8);
}

function part1(digits){
    const basephase =  [0, 1, 0, -1];
    const phaseMaker = depth => makePhase(basephase, depth);
    const fftMaker = digitList => makeFFT(digitList, phaseMaker);
    const fft = fftMaker(digits);

    let rounds = 100;
    let current;
    while(rounds > 0)  {
        console.log('round', rounds);
        current = fft.next().value.slice(0,8);
        rounds--;
    }

    console.log('part 1', current.join(''));
}

function* makeFFT(digits, phaseMaker) {
    let currentDigits = digits;

    while(true){
        const newDigits = currentDigits.map((_, outputPosition)  => {
            const phase = phaseMaker(outputPosition + 1);

            const sum =  currentDigits.reduce((result, digit) => {
                const phaseValue = phase.next().value;
                return result  + phaseValue * digit
            }, 0);
            let result =  Math.abs(sum)%10;
            return result;
        });
        currentDigits = newDigits;
        yield newDigits;
    }
}

function* makePhase(baselist, depth) {
    if(depth <=0){
        throw new Error('Phase depth must be greater than 0, received: '+ depth)
    }
    const baselistSize  =  baselist.length;
    let counter  = 0;
    let omitFirst = true;

    while(true) {
        let repeat = depth;
        if(omitFirst) {
            repeat  -= 1;
            omitFirst=  false;
        }


        while(repeat-- > 0) {
            const cursor =  counter % baselistSize;
            yield baselist[cursor];
        }

        counter++;
    }

}
