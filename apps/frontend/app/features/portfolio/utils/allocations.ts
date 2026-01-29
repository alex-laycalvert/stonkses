/**
 * Provide a list of categories with either desired percentage of your total portfolio, or a desired amount.
 *
 * This function will return the require allocations needed to meet those goals.
 */
export function generateRequiredAllocations(
    desiredCategories: (
        | { name: string; percentage: number }
        | { name: string; amount: string }
    )[],
): { name: string; amount: number; percentage: number }[] {
    // Separate categories into those with percentages and those with amounts
    const percentageCategories: { name: string; percentage: number }[] = [];
    const amountCategories: { name: string; amount: number }[] = [];

    for (const category of desiredCategories) {
        if ("percentage" in category) {
            percentageCategories.push(category);
        } else {
            amountCategories.push({
                name: category.name,
                amount: parseFloat(category.amount),
            });
        }
    }

    // Calculate total percentage from percentage categories
    const totalPercentageAllocated = percentageCategories.reduce(
        (sum, cat) => sum + cat.percentage,
        0,
    );

    // Calculate remaining percentage for amount categories
    const remainingPercentage = 100 - totalPercentageAllocated;

    // Calculate total amount from amount categories
    const totalAmountAllocated = amountCategories.reduce(
        (sum, cat) => sum + cat.amount,
        0,
    );

    // Calculate the total portfolio value
    // If remainingPercentage represents totalAmountAllocated, then:
    // totalPortfolio * (remainingPercentage / 100) = totalAmountAllocated
    // totalPortfolio = totalAmountAllocated / (remainingPercentage / 100)
    const totalPortfolio =
        remainingPercentage > 0
            ? totalAmountAllocated / (remainingPercentage / 100)
            : totalAmountAllocated;

    // Build the result array
    const result: { name: string; amount: number; percentage: number }[] = [];

    // Add percentage categories with calculated amounts
    for (const category of percentageCategories) {
        result.push({
            name: category.name,
            percentage: category.percentage,
            amount: totalPortfolio * (category.percentage / 100),
        });
    }

    // Add amount categories with calculated percentages
    for (const category of amountCategories) {
        result.push({
            name: category.name,
            amount: category.amount,
            percentage:
                totalPortfolio > 0
                    ? (category.amount / totalPortfolio) * 100
                    : 0,
        });
    }

    return result;
}
