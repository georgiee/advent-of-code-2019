(async function() {
    try {
        await part02();
    }catch (error) {
        console.error(error);
    }
})();


const IMAGE_WIDTH = 25;
const IMAGE_HEIGHT = 6;
const PIXEL_PER_LAYER = IMAGE_WIDTH * IMAGE_HEIGHT;

const BLACK = {
    r: 0, g: 0, b: 0,  a: 255
};

const WHITE = {
    r: 255, g: 255, b: 255,  a: 255
};

const TRANSPARENT = {
    r: 0, g: 0, b: 0,  a: 0
};

async function part02() {
    const input = await fetch('./input.txt');
    let data = await input.text();
    data = data.trim();

    const pixels = data.split('').map(value => parseInt(value, 10));

    const WIDTH = IMAGE_WIDTH;
    const HEIGHT = IMAGE_HEIGHT;
    const layers = chunk(pixels, IMAGE_WIDTH * IMAGE_HEIGHT);

    const canvas = document.createElement('canvas');
    canvas.width  = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.width = '250';
    canvas.style.height = '60';
    canvas.style.imageRendering =  'crisp-edges';

    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;

    const pixelData = new Uint8ClampedArray(WIDTH * HEIGHT *  4);
    let imageData = new ImageData(pixelData, WIDTH);

    layers.reverse().forEach(layer => {
        drawLayer(pixelData, layer);
    });

    // resulting image is UBUFP
    ctx.putImageData(imageData, 0, 0);
}

function drawLayer(pixelData, layerData) {
    for (let i = 0; i < pixelData.length; i += 4) {
        const spaceColor = layerData[i/4];w
        const currentColor  = getColor(i, pixelData);
        const newColor  = spaceColorToRGB(spaceColor);

        if(colorEqual(newColor, TRANSPARENT)) {
            continue;
        }

        drawColorMutate(pixelData, i, newColor);
    }
}


function colorEqual(a, b) {
    return  a.r ==  b.r && a.g == b.g && a.b == b.b  && a.a == b.a
}


function spaceColorToRGB(color) {
    // black
    if(color === 0){
        return BLACK
    }

    // white
    if(color === 1){
        return WHITE
    }

    // transparent
    if(color === 2){
        return TRANSPARENT;
    }

    throw new Error('unknown  color' +  index);
}

function getColor(position, data) {
    return {
        r: data[position + 0],
        g: data[position + 1],
        b: data[position + 2],
        a: data[position + 3]
    }
}
function drawColorMutate(data, position, {r, g, b, a = 255})  {
    data[position + 0] = r;
    data[position + 1] = g;
    data[position + 2] = b;
    data[position + 3] = a;
}
function mutateDrawColor(data, pixelindex) {
    data[pixelindex] = 1;
    data[pixelindex+1] = 1;
    data[pixelindex+2] = 1;
    data[pixelindex+3] = 1;
}

async function part01() {
    console.log('part01');

    const input = await fetch('./input.txt');
    let data = await input.text();
    data = data.trim();

    const pixels = data.split('').map(value => parseInt(value, 10));

    const layers = chunk(pixels, PIXEL_PER_LAYER);
    const zeros = getDigit(0, layers[1]);

    const bestLayer = layers.reduce((accu, layer) => {
        const zeroCount = getDigit(0, layer).length;
        const oneCount = getDigit(1, layer).length;
        const twoCount = getDigit(2, layer).length;

        if(zeroCount < accu.zeroCount) {
            accu  = {
                zeroCount, oneCount, twoCount,  layer
            }
        }
        return accu;
    }, {zeroCount: Infinity,  layer: null });

    console.log(bestLayer,  bestLayer.oneCount * bestLayer.twoCount);
}
function getDigit(digit, layer) {
    return layer.filter(value => value === digit)
}

function chunk (arr, size) {
    return arr.reduce((chunks, el, i) => {
        if (i % size === 0) {
            chunks.push([el])
        } else {
            chunks[chunks.length - 1].push(el)
        }
        return chunks
    }, [])
}
