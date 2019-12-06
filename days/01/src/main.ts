async function part01() {
    const input = await fetch('./input.txt');
    const data = await input.text();
    const rows = data.split('\n');
    rows.pop(); //remove last element

    const result = rows.reduce((accu, valueStr) => {
        const value = parseInt(valueStr);
        return accu + Math.floor(value/3) - 2
    }, 0);

    console.log('day01 - part1', result);
}

async function part02() {

    const input = await fetch('./input.txt');
    const data = await input.text();
    const rows = data.split('\n');
    rows.pop(); //remove last element

    const result = rows.reduce((accu, valueStr) => {
        const value = parseInt(valueStr);
        return accu + calculateFuel(value);
    }, 0);

    console.log('day01 - part2', result);
}

function calculateFuel(value, sum = 0) {
    const result = Math.floor(value/3) - 2;
    if(result > 0) {
        return calculateFuel(result, sum  + result);
    }else {
        return sum;
    }

}

part01();
part02();
