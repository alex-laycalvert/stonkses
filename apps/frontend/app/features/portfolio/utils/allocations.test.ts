import { describe, expect, it } from "vitest";
import { generateRequiredAllocations } from "./allocations";

describe("generateRequiredAllocations", () => {
    describe("all categories have percentages", () => {
        it("should handle when all categories have percentages that sum to 100%", () => {
            const input = [
                { name: "ETFs", percentage: 70 },
                { name: "Stocks", percentage: 20 },
                { name: "Bonds", percentage: 10 },
            ];

            const result = generateRequiredAllocations(input);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                name: "ETFs",
                percentage: 70,
                amount: 0,
            });
            expect(result[1]).toEqual({
                name: "Stocks",
                percentage: 20,
                amount: 0,
            });
            expect(result[2]).toEqual({
                name: "Bonds",
                percentage: 10,
                amount: 0,
            });

            // Verify percentages sum to 100
            const totalPercentage = result.reduce(
                (sum, cat) => sum + cat.percentage,
                0,
            );
            expect(totalPercentage).toBe(100);
        });
    });

    describe("all categories have amounts", () => {
        it("should calculate percentages when all categories have amounts", () => {
            const input = [
                { name: "ETFs", amount: "7000" },
                { name: "Stocks", amount: "2000" },
                { name: "Bonds", amount: "1000" },
            ];

            const result = generateRequiredAllocations(input);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                name: "ETFs",
                amount: 7000,
                percentage: 70,
            });
            expect(result[1]).toEqual({
                name: "Stocks",
                amount: 2000,
                percentage: 20,
            });
            expect(result[2]).toEqual({
                name: "Bonds",
                amount: 1000,
                percentage: 10,
            });

            // Verify percentages sum to 100
            const totalPercentage = result.reduce(
                (sum, cat) => sum + cat.percentage,
                0,
            );
            expect(totalPercentage).toBe(100);
        });
    });

    describe("all percentages with one amount", () => {
        it("should calculate percentage for the amount category and amounts for percentage categories", () => {
            const input = [
                { name: "ETFs", percentage: 70 },
                { name: "Stocks", percentage: 20 },
                { name: "Options", amount: "1000" },
            ];

            const result = generateRequiredAllocations(input);

            expect(result).toHaveLength(3);

            // Find each category in result
            const etfs = result.find((cat) => cat.name === "ETFs");
            const stocks = result.find((cat) => cat.name === "Stocks");
            const options = result.find((cat) => cat.name === "Options");

            expect(etfs).toEqual({
                name: "ETFs",
                percentage: 70,
                amount: 7000,
            });
            expect(stocks).toEqual({
                name: "Stocks",
                percentage: 20,
                amount: 2000,
            });
            expect(options).toEqual({
                name: "Options",
                percentage: 10,
                amount: 1000,
            });

            // Verify percentages sum to 100
            const totalPercentage = result.reduce(
                (sum, cat) => sum + cat.percentage,
                0,
            );
            expect(totalPercentage).toBe(100);
        });
    });

    describe("all amounts with one percentage", () => {
        it("should calculate amount for the percentage category and percentages for amount categories", () => {
            const input = [
                { name: "ETFs", amount: "7000" },
                { name: "Stocks", amount: "2000" },
                { name: "Bonds", percentage: 10 },
            ];

            const result = generateRequiredAllocations(input);

            expect(result).toHaveLength(3);

            // Find each category in result
            const etfs = result.find((cat) => cat.name === "ETFs");
            const stocks = result.find((cat) => cat.name === "Stocks");
            const bonds = result.find((cat) => cat.name === "Bonds");

            expect(bonds).toEqual({
                name: "Bonds",
                percentage: 10,
                amount: 1000,
            });
            expect(etfs).toEqual({
                name: "ETFs",
                percentage: 70,
                amount: 7000,
            });
            expect(stocks).toEqual({
                name: "Stocks",
                percentage: 20,
                amount: 2000,
            });

            // Verify percentages sum to 100
            const totalPercentage = result.reduce(
                (sum, cat) => sum + cat.percentage,
                0,
            );
            expect(totalPercentage).toBe(100);
        });
    });

    describe("mix of percentages and amounts", () => {
        it("should handle multiple categories with percentages and multiple with amounts", () => {
            const input = [
                { name: "ETFs", percentage: 50 },
                { name: "Stocks", percentage: 30 },
                { name: "Options", amount: "1000" },
                { name: "Crypto", amount: "1000" },
            ];

            const result = generateRequiredAllocations(input);

            expect(result).toHaveLength(4);

            // Find each category in result
            const etfs = result.find((cat) => cat.name === "ETFs");
            const stocks = result.find((cat) => cat.name === "Stocks");
            const options = result.find((cat) => cat.name === "Options");
            const crypto = result.find((cat) => cat.name === "Crypto");

            // Total percentage from percentages: 80%
            // Remaining percentage: 20%
            // Total amount: 2000
            // Total portfolio: 2000 / 0.20 = 10000

            expect(etfs).toEqual({
                name: "ETFs",
                percentage: 50,
                amount: 5000,
            });
            expect(stocks).toEqual({
                name: "Stocks",
                percentage: 30,
                amount: 3000,
            });
            expect(options).toEqual({
                name: "Options",
                percentage: 10,
                amount: 1000,
            });
            expect(crypto).toEqual({
                name: "Crypto",
                percentage: 10,
                amount: 1000,
            });

            // Verify percentages sum to 100
            const totalPercentage = result.reduce(
                (sum, cat) => sum + cat.percentage,
                0,
            );
            expect(totalPercentage).toBe(100);
        });

        it("should handle uneven mix of percentages and amounts", () => {
            const input = [
                { name: "ETFs", percentage: 40 },
                { name: "Stocks", amount: "3000" },
                { name: "Bonds", percentage: 20 },
                { name: "Options", amount: "1000" },
            ];

            const result = generateRequiredAllocations(input);

            expect(result).toHaveLength(4);

            // Total percentage from percentages: 60%
            // Remaining percentage: 40%
            // Total amount: 4000
            // Total portfolio: 4000 / 0.40 = 10000

            const etfs = result.find((cat) => cat.name === "ETFs");
            const stocks = result.find((cat) => cat.name === "Stocks");
            const bonds = result.find((cat) => cat.name === "Bonds");
            const options = result.find((cat) => cat.name === "Options");

            expect(etfs).toEqual({
                name: "ETFs",
                percentage: 40,
                amount: 4000,
            });
            expect(bonds).toEqual({
                name: "Bonds",
                percentage: 20,
                amount: 2000,
            });
            expect(stocks).toEqual({
                name: "Stocks",
                percentage: 30,
                amount: 3000,
            });
            expect(options).toEqual({
                name: "Options",
                percentage: 10,
                amount: 1000,
            });

            // Verify percentages sum to 100
            const totalPercentage = result.reduce(
                (sum, cat) => sum + cat.percentage,
                0,
            );
            expect(totalPercentage).toBe(100);
        });
    });
});
