export function concatTids(...args: Array<string | undefined>): string {
    return args.filter(x => x != undefined).join(" ");
}
