(async function() {
    await part01();
})();

async function part01() {
    console.log('part01 2a');

    const input = await fetch('./probe.txt');
    const data = await input.text();
    const rows = data.split('\n');
    rows.pop();

    const elements = parse(rows);
    console.log({elements});

}

function parse(rows) {
    let inputElements = [] as any;
    let outputElements = [] as any;
    let sourceList  = [] as  any;
    for(const row of rows){
        const regex = /(?<count>\d+) (?<element>[A-Z]+)/gm;
        let result = regex.exec(row) as any;
        let elements = [] as any;
        while(result) {
            let {count, element} = result.groups;
            count =  parseInt(count, 10);
            elements.push({
                name: element, count
            });
            result = regex.exec(row);
        }

        const outputElement = elements.pop();

        inputElements.push(...elements);
        outputElements.push(outputElement);
        sourceList.push([outputElement,  elements])
    }

    const inputElementsMap = inputElements.reduce((map, {name, count}) => {
        if(name === 'ORE') {
            return map;
        }

        if(!map.has(name)) {
            map.set(name, 0)
        }

        let currentCount = map.get(name);
        map.set(name, currentCount + count);
        return map;
    }, new Map());

    const sourceListMap = sourceList.reduce((map, [{name,  count}, ingredients]) => {
        map.set(name, {
            name,
            count,
            ingredients
        });
        return map;
    }, new Map());

    function mapIngredient(elements) {
        return elements.map(element => {
            sourceListMap.get(element.name)
        })
    }

    const fuel = sourceListMap.get('FUEL');
    const ingredients = mapIngredient(fuel.ingredients);
    console.log({ingredients})
}
