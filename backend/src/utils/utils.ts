export function splitEvery<T>(every: number, arr: T[]): T[][] {

    let chunkArray: T[][] = []
    let chunk: T[] = []

    for (const t of arr) {

        chunk.push(t)

        if (chunk.length === every) {
            chunkArray.push(chunk)
            chunk = []
        }
    }
    if (chunk.length > 0) chunkArray.push(chunk)

    return chunkArray
}
