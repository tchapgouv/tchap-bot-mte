export class Brain {

    private data: any = {}

    set(key: string, value: any) {
        this.data[key] = value
    }

    get(key: string) {
        return this.data[key]
    }

}
