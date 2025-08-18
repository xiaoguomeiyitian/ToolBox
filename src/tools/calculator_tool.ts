import { evaluate, mean, median, mode, std, variance, gcd, lcm, factorial, combinations, permutations, complex, round } from 'mathjs';
import { Decimal } from 'decimal.js';

// The schema remains unchanged to keep it as a single tool.
export const schema = {
    name: "calculator_tool",
    description: "A powerful universal calculator supporting basic expressions, statistics, geometry, finance, logic, number theory, combinatorics, probability, set theory, and complex numbers.",
    type: "object",
    properties: {
        calculation_type: {
            type: "string",
            enum: [
                "evaluate_expression", "calculate_statistics", "perform_geometry",
                "perform_financial_math", "perform_logic_operations", "perform_number_theory",
                "perform_combinatorics", "calculate_probability", "perform_set_theory",
                "perform_complex_number"
            ],
            description: "The type of calculation to perform.",
        },
        // Common params
        expression: { type: "string", description: "The mathematical expression to evaluate (for 'evaluate_expression')." },
        // Statistics params
        statistics_operation: { type: "string", enum: ["mean", "median", "mode", "standard_deviation", "variance", "correlation", "regression"] },
        data_points: { type: "array", items: { type: "number" } },
        data_set_x: { type: "array", items: { type: "number" } },
        data_set_y: { type: "array", items: { type: "number" } },
        // Geometry params
        geometry_operation: { type: "string", enum: ["area_circle", "area_rectangle", "volume_cube"] },
        radius: { type: "number" },
        length: { type: "number" },
        width: { type: "number" },
        side: { type: "number" },
        // Financial params
        financial_math_operation: { type: "string", enum: ["simple_interest", "compound_interest", "present_value", "future_value"] },
        principal: { type: "number" },
        rate: { type: "number", description: "Interest rate as a percentage (e.g., 5 for 5%)." },
        time: { type: "number", description: "Time in years." },
        n_compounding_periods: { type: "integer" },
        future_value: { type: "number" },
        // Logic params
        logic_operation: { type: "string", enum: ["AND", "OR", "NOT", "XOR"] },
        operand_a: { type: "boolean" },
        operand_b: { type: "boolean" },
        // Number Theory params
        number_theory_operation: { type: "string", enum: ["gcd", "lcm", "prime_factorization", "is_prime", "modular_exponentiation"] },
        number_a: { type: "integer" },
        number_b: { type: "integer" },
        number_theory_modulus: { type: "integer" },
        // Combinatorics params
        combinatorics_operation: { type: "string", enum: ["permutation", "combination", "factorial", "binomial_coefficient"] },
        n_value: { type: "integer" },
        r_value: { type: "integer" },
        // Probability params
        probability_operation: { type: "string", enum: ["probability_event", "conditional_probability", "bayes_theorem"] },
        probability_a: { type: "number" },
        probability_b: { type: "number" },
        probability_a_given_b: { type: "number" },
        probability_b_given_a: { type: "number" },
        // Set Theory params
        set_theory_operation: { type: "string", enum: ["union", "intersection", "difference", "symmetric_difference", "is_subset"] },
        set_a: { type: "array", items: { "anyOf": [{ "type": "number" }, { "type": "string" }] } },
        set_b: { type: "array", items: { "anyOf": [{ "type": "number" }, { "type": "string" }] } },
        // Complex Number params
        complex_number_operation: { type: "string", enum: ["add", "subtract", "multiply", "divide", "modulus", "argument", "conjugate"] },
        complex_a: { type: "string", description: "First complex number (e.g., '3 + 4i')." },
        complex_b: { type: "string", description: "Second complex number (e.g., '1 - 2i')." },
        // Global params
        precision_level: { type: "number", enum: [32, 64, 128], default: 64 },
    },
    required: ["calculation_type"]
};

// --- Helper Functions for each category ---

function handleStatistics(params: any) {
    const { statistics_operation, data_points, data_set_x, data_set_y } = params;
    if (!statistics_operation) throw new Error("A statistics operation is required.");

    const checkDataPoints = () => {
        if (!data_points || !Array.isArray(data_points) || data_points.length === 0) {
            throw new Error("A non-empty data_points array is required.");
        }
    };
    const checkDataSets = () => {
        if (!data_set_x || !data_set_y || data_set_x.length !== data_set_y.length || data_set_x.length === 0) {
            throw new Error("Two equal-length, non-empty datasets (data_set_x and data_set_y) are required.");
        }
    };

    switch (statistics_operation) {
        case "mean": checkDataPoints(); return mean(data_points);
        case "median": checkDataPoints(); return median(data_points);
        case "mode": checkDataPoints(); return mode(data_points);
        case "standard_deviation": checkDataPoints(); return std(data_points);
        case "variance": checkDataPoints(); return variance(data_points);
        case "correlation": checkDataSets(); return evaluate('corr(x, y)', { x: data_set_x, y: data_set_y });
        case "regression":
            checkDataSets();
            const n = data_set_x.length;
            const sumX = data_set_x.reduce((s, v) => s + v, 0);
            const sumY = data_set_y.reduce((s, v) => s + v, 0);
            const sumXY = data_set_x.reduce((s, v, i) => s + v * data_set_y[i], 0);
            const sumX2 = data_set_x.reduce((s, v) => s + v * v, 0);
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            return { slope, intercept, equation: `y = ${round(slope, 4)}x + ${round(intercept, 4)}` };
        default: throw new Error(`Unsupported statistics operation: ${statistics_operation}`);
    }
}

function handleGeometry(params: any) {
    const { geometry_operation, radius, length, width, side } = params;
    if (!geometry_operation) throw new Error("A geometry operation is required.");
    switch (geometry_operation) {
        case "area_circle":
            if (typeof radius !== 'number') throw new Error("The radius is required.");
            return Math.PI * radius ** 2;
        case "area_rectangle":
            if (typeof length !== 'number' || typeof width !== 'number') throw new Error("Length and width are required.");
            return length * width;
        case "volume_cube":
            if (typeof side !== 'number') throw new Error("The side length is required.");
            return side ** 3;
        default: throw new Error(`Unsupported geometry operation: ${geometry_operation}`);
    }
}

function handleFinancialMath(params: any) {
    const { financial_math_operation, principal, rate, time, n_compounding_periods, future_value } = params;
    if (!financial_math_operation) throw new Error("A financial math operation is required.");
    const r = (rate || 0) / 100; // Convert percentage to decimal

    switch (financial_math_operation) {
        case "simple_interest":
            if (typeof principal !== 'number' || typeof rate !== 'number' || typeof time !== 'number') throw new Error("Principal, rate, and time are required.");
            return principal * r * time;
        case "compound_interest":
            if (typeof principal !== 'number' || typeof rate !== 'number' || typeof time !== 'number' || typeof n_compounding_periods !== 'number') throw new Error("Principal, rate, time, and n_compounding_periods are required.");
            return principal * (1 + r / n_compounding_periods) ** (n_compounding_periods * time);
        case "present_value":
            if (typeof future_value !== 'number' || typeof rate !== 'number' || typeof time !== 'number') throw new Error("Future value, rate, and time are required.");
            return future_value / (1 + r) ** time;
        case "future_value":
            if (typeof principal !== 'number' || typeof rate !== 'number' || typeof time !== 'number') throw new Error("Principal, rate, and time are required.");
            return principal * (1 + r) ** time;
        default: throw new Error(`Unsupported financial math operation: ${financial_math_operation}`);
    }
}

function handleLogicOperations(params: any) {
    const { logic_operation, operand_a, operand_b } = params;
    if (!logic_operation || typeof operand_a !== 'boolean') throw new Error("A logic operation and operand_a are required.");

    switch (logic_operation.toUpperCase()) {
        case "AND":
            if (typeof operand_b !== 'boolean') throw new Error("operand_b is required for AND.");
            return operand_a && operand_b;
        case "OR":
            if (typeof operand_b !== 'boolean') throw new Error("operand_b is required for OR.");
            return operand_a || operand_b;
        case "NOT":
            return !operand_a;
        case "XOR":
            if (typeof operand_b !== 'boolean') throw new Error("operand_b is required for XOR.");
            return operand_a !== operand_b;
        default: throw new Error(`Unsupported logic operation: ${logic_operation}`);
    }
}

function handleNumberTheory(params: any) {
    const { number_theory_operation, number_a, number_b, number_theory_modulus } = params;
    if (!number_theory_operation) throw new Error("A number theory operation is required.");
    if (typeof number_a !== 'number') throw new Error("number_a is required.");

    switch (number_theory_operation) {
        case "gcd":
            if (typeof number_b !== 'number') throw new Error("number_b is required for gcd.");
            return gcd(number_a, number_b);
        case "lcm":
            if (typeof number_b !== 'number') throw new Error("number_b is required for lcm.");
            return lcm(number_a, number_b);
        case "is_prime":
            return evaluate(`isPrime(${number_a})`);
        case "prime_factorization":
            return evaluate(`primeFactor(${number_a})`);
        case "modular_exponentiation":
            if (typeof number_b !== 'number' || typeof number_theory_modulus !== 'number') throw new Error("Base, exponent, and modulus are required.");
            return evaluate(`pow(a, b) % m`, { a: number_a, b: number_b, m: number_theory_modulus });
        default: throw new Error(`Unsupported number theory operation: ${number_theory_operation}`);
    }
}

function handleCombinatorics(params: any) {
    const { combinatorics_operation, n_value, r_value } = params;
    if (!combinatorics_operation) throw new Error("A combinatorics operation is required.");
    if (typeof n_value !== 'number') throw new Error("n_value is required.");

    switch (combinatorics_operation) {
        case "factorial": return factorial(n_value);
        case "permutation":
            if (typeof r_value !== 'number') throw new Error("r_value is required for permutation.");
            return permutations(n_value, r_value);
        case "combination":
        case "binomial_coefficient":
            if (typeof r_value !== 'number') throw new Error("r_value is required for combination.");
            return combinations(n_value, r_value);
        default: throw new Error(`Unsupported combinatorics operation: ${combinatorics_operation}`);
    }
}

function handleProbability(params: any) {
    const { probability_operation, probability_a, probability_b, probability_a_given_b, probability_b_given_a } = params;
    if (!probability_operation) throw new Error("A probability operation is required.");

    const checkProb = (p: any) => typeof p === 'number' && p >= 0 && p <= 1;

    switch (probability_operation) {
        case "probability_event":
            if (!checkProb(probability_a)) throw new Error("A valid probability_a (0-1) is required.");
            return probability_a;
        case "conditional_probability":
            if (!checkProb(probability_a_given_b) || !checkProb(probability_b) || probability_b === 0) throw new Error("Valid P(A|B) and P(B) > 0 are required.");
            return probability_a_given_b * probability_b; // P(A and B)
        case "bayes_theorem":
            if (!checkProb(probability_a) || !checkProb(probability_b) || !checkProb(probability_b_given_a) || probability_b === 0) throw new Error("Valid P(A), P(B) > 0, and P(B|A) are required.");
            return (probability_b_given_a * probability_a) / probability_b; // P(A|B)
        default: throw new Error(`Unsupported probability operation: ${probability_operation}`);
    }
}

function handleSetTheory(params: any) {
    const { set_theory_operation, set_a, set_b } = params;
    if (!set_theory_operation) throw new Error("A set theory operation is required.");
    if (!Array.isArray(set_a)) throw new Error("Set A is required.");
    if (!Array.isArray(set_b) && ["union", "intersection", "difference", "symmetric_difference", "is_subset"].includes(set_theory_operation)) {
        throw new Error("Set B is required for this operation.");
    }

    const sA = new Set(set_a);
    const sB = new Set(set_b);

    switch (set_theory_operation) {
        case "union": return Array.from(new Set([...sA, ...sB]));
        case "intersection": return Array.from(new Set([...sA].filter(x => sB.has(x))));
        case "difference": return Array.from(new Set([...sA].filter(x => !sB.has(x))));
        case "symmetric_difference":
            const diff1 = [...sA].filter(x => !sB.has(x));
            const diff2 = [...sB].filter(x => !sA.has(x));
            return Array.from(new Set([...diff1, ...diff2]));
        case "is_subset": return [...sA].every(x => sB.has(x));
        default: throw new Error(`Unsupported set theory operation: ${set_theory_operation}`);
    }
}

function handleComplexNumber(params: any) {
    const { complex_number_operation, complex_a, complex_b } = params;
    if (!complex_number_operation) throw new Error("A complex number operation is required.");
    if (typeof complex_a !== 'string') throw new Error("Complex number 'complex_a' (e.g., '3 + 4i') is required.");

    const a = complex(complex_a);
    let b;
    if (["add", "subtract", "multiply", "divide"].includes(complex_number_operation)) {
        if (typeof complex_b !== 'string') throw new Error(`Complex number 'complex_b' is required for ${complex_number_operation}.`);
        b = complex(complex_b);
    }

    switch (complex_number_operation) {
        case "add": return evaluate('a + b', { a, b });
        case "subtract": return evaluate('a - b', { a, b });
        case "multiply": return evaluate('a * b', { a, b });
        case "divide": return evaluate('a / b', { a, b });
        case "modulus": return evaluate('abs(a)', { a });
        case "argument": return evaluate('arg(a)', { a });
        case "conjugate": return evaluate('conjugate(a)', { a });
        default: throw new Error(`Unsupported complex number operation: ${complex_number_operation}`);
    }
}

export async function destroy() {
    console.log("Cleaning up calculator_tool resources");
}

export default async function (request: any) {
    try {
        const { calculation_type, ...params } = request.params.arguments;
        const precisionLevel = params.precision_level || 64;
        Decimal.set({ precision: precisionLevel });

        let result;

        switch (calculation_type) {
            case "evaluate_expression":
                if (!params.expression) throw new Error("An expression is required.");
                result = evaluate(params.expression);
                break;
            case "calculate_statistics":
                result = handleStatistics(params);
                break;
            case "perform_geometry":
                result = handleGeometry(params);
                break;
            case "perform_financial_math":
                result = handleFinancialMath(params);
                break;
            case "perform_logic_operations":
                result = handleLogicOperations(params);
                break;
            case "perform_number_theory":
                result = handleNumberTheory(params);
                break;
            case "perform_combinatorics":
                result = handleCombinatorics(params);
                break;
            case "calculate_probability":
                result = handleProbability(params);
                break;
            case "perform_set_theory":
                result = handleSetTheory(params);
                break;
            case "perform_complex_number":
                result = handleComplexNumber(params);
                break;
            default:
                throw new Error(`Unsupported calculation type: ${calculation_type}`);
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify({ result }, null, 2),
            }],
        };
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2),
            }],
            isError: true,
        };
    }
}
