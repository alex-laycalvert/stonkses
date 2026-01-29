export function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
}

export function capitalize(str: string): string {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
