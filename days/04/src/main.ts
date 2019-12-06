const EXPECTED_DIGIT_COUNT = 6;

(async function() {
    await part02();
})();


async function part01() {
    console.log('part01');

    // analyze(223450);
    // return ;

    const LOWER_LIMIT = 153517;
    const UPPER_LIMIT = 630395;

    let counter = 0;
    for(let current = LOWER_LIMIT;  current <= UPPER_LIMIT;  current+=1 ) {
        const result = analyze(current);

        if(result){
            counter+=1;
        }
    }

    console.log('done', counter)
}
async function part02() {
    console.log('part02');
    // analyze2(123444);
    // analyze2(111122);
    // analyze2(112233);
    // return;

    const LOWER_LIMIT = 153517;
    const UPPER_LIMIT = 630395;

    let counter = 0;
    for(let current = LOWER_LIMIT;  current <= UPPER_LIMIT;  current+=1 ) {
        const result = analyze2(current);

        if(result){
            counter+=1;
        }
    }

    console.log('done', counter)
}

function log(...msg){
    // console.log(...msg);
}

function analyze2(value) {
    log('--- analyze2', value);
    const digitList = value
        .toString()
        .split('')
        .map(value =>  parseInt(value, 10));

    const checkCount =  hashDigitsCount(digitList);
    if (!checkCount) {
        log('⛔️ smaller than 6');
        return false;
    }

    const decreasing = hasDecreasingDigits(digitList);
    if (!decreasing) {
        log('⛔️ decreasing digits');
        return false;
    }


    const correctDigits = hasCorrectDigits(digitList);
    if (!correctDigits) {
        log('⛔️ no correct digits (double/triple etc)');
        return false;
    }

    log('✅ good');
    return  true;
}

function analyze(value) {
    log('--- analyze', value);
    const digitList = value
            .toString()
            .split('')
            .map(value =>  parseInt(value, 10));

    const checkCount =  hashDigitsCount(digitList);
    if (!checkCount) {
        log('⛔️ smaller than 6');
        return false;
    }

    const decreasing = hasDecreasingDigits(digitList);
    if (!decreasing) {
        log('⛔️ decreasing digits');
        return false;
    }

    const doubleDigit = hasDoubleDigits(digitList);
    if (!doubleDigit) {
        log('⛔️ no double digit');
        return false;
    }

    log('✅ good');
    return  true;
}

function hashDigitsCount(digitList) {
    return digitList.length === EXPECTED_DIGIT_COUNT
}

function getDigitsMap(digits)  {
    const iterator = analyzeDigitsLeftRight(digits);
    let countMap = new Map();
    for (const [past,  current] of iterator) {

        if(past ===  current) {
            if(countMap.has(past)) {
                countMap.set(past, countMap.get(past) + 1);
            }else {
                countMap.set(past, 2);
            }
        }
    }

    return countMap;
    // const values = Array.from(countMap.values());
    // return values.find(value => {
    //     return value >=3;
    // });
}

function hasCorrectDigits(digits)  {
    const digitMap = getDigitsMap(digits);
    const counts = Array.from(digitMap.values());

    // must include double digits
    return counts.includes(2);
}

function hasDoubleDigits(digits)  {
    const iterator = analyzeDigitsLeftRight(digits);
    for (const [past,  current] of iterator) {
        if(past ===  current) {
            return true;
        }
    }

    return false;
}

function hasDecreasingDigits(digits) {
    const iterator = analyzeDigitsLeftRight(digits);
    for (const [past,  current] of iterator) {
        // console.log('check', `${current} >= ${past}`)
        if(current < past) {
            return false;
        }
    }

    return true;
}

function* analyzeDigitsLeftRight(digits)  {
    let past = digits[0];
    for(let index= 1; index < EXPECTED_DIGIT_COUNT; index+=1) {
        let current = digits[index];
        yield [past, current];
        past = current;
    }
}
