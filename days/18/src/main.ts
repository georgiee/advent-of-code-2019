import Graph from 'node-dijkstra';


(async function() {
    await run();
})();

const WALL = 1;
const FREE = 2;
const KEY = 3;
const DOOR = 4;
const CURRENT_POSITION = 5;

async function run() {
    console.log('part01 2a');


    const input = await fetch('./probe.txt');
    const data = await input.text();
    const rows = data.split('');
    rows.pop(); //remove newline

    const {list, size} = parseMap(rows);
    const grid = createGrid(list, size);

    // that works,
    // TODO: implement canWalkWithoutDoor
    // then loop over nearest keys  we can walk too without doors
    // and open doors with keys
    // migh require a key `cache` or sth liek that.

    const key = grid.nextKey();
    grid.remove(key);
    console.log({key});
    grid.moveTo(key);


    // const key2 = grid.nextKey();
    // console.log({key2, key})
}

function createGrid(list: GridItem[], size) {
    const mapDrawer = createMapDrawer(size);

    let walkableTiles, graph;

    const positionItem = getPositionItem()!;
    update();

    function update() {
        walkableTiles = list.filter(item => item.isWalkable());
        graph =  createGraph(walkableTiles);
        mapDrawer.draw(list);
    }

    function nextKey() {
        const costs = graph.costMapFor(positionItem, KEY);
        const item = costs[0]; //cheapest/nearest
        return item.path.pop();
    }
    function nextDoor() {
        const costs = graph.costMapFor(positionItem, DOOR);
        const item = costs.pop();

        return item.path.pop();
    }

    function getPositionItem() {
        return list.find(item => item.isPosition())
    }

    function canWalkWithoutDoor(target) {
        // const costs = graph.pathTo(positionItem, DOOR);
    }

    function remove(item) {
        const index =  list.findIndex(other => other.equal(item));
        list.splice(index, 1);

        update();
    }

    function moveTo(item: GridItem){
        const position = item.position;
        positionItem.position.x = position.x;
        positionItem.position.y = position.y;
        update();
    }

    function refresh() {
        update();
    }

    return {
        list,
        nextKey,
        nextDoor,
        remove,
        moveTo,
        refresh,
        get walkable() {
            return
        },
        get positionItem() {
            return positionItem;
        }
    }
}

function createMapDrawer(size) {
    const canvas = createCanvas(size[0],size[1],  10);
    canvas.fill('#ff00b9');

    function draw(items: GridItem[]) {
        canvas.clear();
        for(const item of items) {
            switch(item.type) {
                case WALL:
                    canvas.drawPixelAt([item.position.x, item.position.y], '#000000');
                    break;
                case FREE:
                    canvas.drawPixelAt([item.position.x, item.position.y], '#ffffff');
                    break;
                case DOOR:
                    canvas.drawPixelAt([item.position.x, item.position.y], '#00ff2d');
                    break;
                case KEY:
                    canvas.drawPixelAt([item.position.x, item.position.y], '#ffd700');
                    break;
                case CURRENT_POSITION:
                    canvas.drawPixelAt([item.position.x, item.position.y], '#3100ff');
                    break;
            }
        }
    }

    return {
        canvas, draw
    }
}

function createGraph(list:  GridItem[]) {

    const route = new Graph();

    function getNeighboursWithCost(item: GridItem) {
        return item.neighbours.reduce((map, item) => {
            map.set(item,  1);
            return map;
        }, new Map());
    }
    for(const item of list) {
        route.addNode(item, getNeighboursWithCost(item));
    }

    function costMapFor(item, filterForType)  {
        const currentList = list.filter(item => item.is(filterForType));

        const result = currentList.map(other => {
            return route.path(item, other, {cost: true});
        }).filter(item => !!item.path);
        result.sort((a,b) => a.cost - b.cost);

        return result;
    }

    return{
        costMapFor
    }
}

class GridItem {
    public position: Point;
    public value: string;
    public type: number;
    public neighbours: GridItem[] = [];

    equal(other: GridItem)  {
        const {x:x1, y: y1} = this.position;
        const {x:x2, y: y2} = other.position;

        return x1 == x2 && y1 ==  y2;
    }

    constructor({position, value, type}){
        this.position = position;
        this.value = value;
        this.type = type;
    }

    is(type) {
        if(type === null) return true;
        return this.type === type;
    }

    isPosition() {
        return this.type === CURRENT_POSITION;
    }

    isWalkable() {
        return this.type !== WALL;
    }

    addNeighbours(...other: GridItem[]) {
        this.neighbours.push(...other);
    }

    isAdjacentTo(other: GridItem) {
        return this.position.isAdjacentTo(other.position);
    }

    distance(other: GridItem) {
        return this.position.distanceTo(other.position);
    }

}

function parseMap(data) {
    let size = [0,0];
    let list: GridItem[]= [];
    function isLowerCase(str)
    {
        return str == str.toLowerCase() && str != str.toUpperCase();
    }
    function getType(value: string) {
        if(value === '@')  return CURRENT_POSITION;
        if(value === '#')  return WALL;
        if(value === '.')  return FREE;

        if(isLowerCase(value))  return KEY;
        return DOOR;
    }
    const result = data.reduce(({currentPosition, list}, mapItem) => {
        if(mapItem  === '\n') {
            currentPosition[0] = 0;
            currentPosition[1] += 1;
        }else{
            const item = new GridItem({
                position: new Point(currentPosition[0], currentPosition[1]),
                value: mapItem,
                type: getType(mapItem)
            });

            list.push(item);

            currentPosition[0] += 1;
        }

        size[0] = Math.max(size[0], currentPosition[0]);
        size[1] = Math.max(size[1], currentPosition[1]);

        return {currentPosition, list};
    }, {currentPosition:[0,0], list: []});

    list = result.list;

    for(const item of list)   {
        const neighbours = list.filter(other => item.isAdjacentTo(other)).filter(other => other.isWalkable());
        item.addNeighbours(...neighbours);


    }

    size[1]++;
    return {list, size};
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

class Point {
    constructor(
        public x: number, public y: number
    ) { }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;

        return  Math.abs(dx) + Math.abs(dy);
    }

    isAdjacentTo(other: Point): boolean {
        let [dx, dy] = this.delta(other);

        if (dx == 1 && dy == 0) return true;
        if (dx == -1 && dy == 0) return true;
        if (dx == 0 && dy == 1) return true;
        if (dx == 0 && dy == -1) return true;

        return false;
    }

    delta(other:  Point) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return [dx,  dy];
    }

}

