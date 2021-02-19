export function capitalizeFirstLetter(str?: string): string {
    if (str == null || str.length === 0) {
        return "";
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}
