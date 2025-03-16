import { evaluate } from 'mathjs'; // 用于计算数学表达式
import { Decimal } from 'decimal.js';

export const schema = {
  name: "calculator_tool",
  description: "A calculator_tool tool that supports various types of mathematical operations.",
  type: "object",
  properties: {
    calculation_type: {
      type: "string",
      enum: [
        "evaluate_expression",        // 基本表达式求值
        "calculate_function",         // 函数计算 - 支持sin, cos, tan, abs, sqrt, log, exp
        "calculate_statistics",       // 统计计算 - 支持均值、中位数、众数、标准差、方差、相关性、回归
        "perform_geometry",           // 几何计算 - 支持圆面积、矩形面积、立方体体积
        "perform_financial_math",     // 金融数学 - 支持单利、复利、现值、终值
        "perform_logic_operations",   // 逻辑运算 - 支持AND, OR, NOT, XOR
        "perform_number_theory",      // 数论运算 - 支持GCD, LCM, 质因数分解, 质数检测, 模幂运算
        "perform_combinatorics",      // 组合数学 - 支持排列、组合、阶乘、二项式系数
        "calculate_probability",      // 概率计算 - 支持事件概率、条件概率、贝叶斯定理
        "perform_set_theory",         // 集合论运算 - 支持并集、交集、差集、对称差集、子集检查
        "perform_complex_number"      // 复数运算 - 支持加、减、乘、除、模、辐角、共轭
      ],
      description: "The type of mathematical calculation to perform.",
    },
    expression: {
      type: "string",
      description: "The mathematical expression to calculate (used when calculation_type is 'evaluate_expression').",
    },
    function_name: {
      type: "string",
      description: "The name of the function to calculate (used when calculation_type is 'calculate_function').",
    },
    function_argument: {
      type: "number",
      description: "The argument value for the function.",
    },
    statistics_operation: {
      type: "string",
      enum: ["mean", "median", "mode", "standard_deviation", "variance", "correlation", "regression"],
      description: "The type of statistical calculation to perform (used when calculation_type is 'calculate_statistics').",
    },
    data_points: {
      type: "array",
      items: { type: "number" },
      description: "The array of data points for statistical calculations.",
    },
    data_set_x: {
      type: "array",
      items: { type: "number" },
      description: "The dataset X for bivariate statistics (only when needed).",
    },
    data_set_y: {
      type: "array",
      items: { type: "number" },
      description: "The dataset Y for bivariate statistics (only when needed).",
    },
    geometry_operation: {
      type: "string",
      enum: ["area_circle", "area_rectangle", "volume_cube"],
      description: "The type of geometric calculation to perform (used when calculation_type is 'perform_geometry').",
    },
    radius: {
      type: "number",
      description: "The radius of the circle.",
    },
    length: {
      type: "number",
      description: "The length.",
    },
    width: {
      type: "number",
      description: "The width.",
    },
    height: {
      type: "number",
      description: "The height.",
    },
    side: {
      type: "number",
      description: "The side length of the cube.",
    },
    financial_math_operation: {
      type: "string",
      enum: ["simple_interest", "compound_interest", "present_value", "future_value"],
      description: "The type of financial math calculation to perform (used when calculation_type is 'perform_financial_math').",
    },
    principal: {
      type: "number",
      description: "The principal amount.",
    },
    rate: {
      type: "number",
      description: "The interest rate (percentage).",
    },
    time: {
      type: "number",
      description: "The time (in years).",
    },
    n_compounding_periods: {
      type: "integer",
      description: "The number of compounding periods.",
    },
    logic_operation: {
      type: "string",
      enum: ["AND", "OR", "NOT", "XOR"],
      description: "The type of logic operation to perform (used when calculation_type is 'perform_logic_operations').",
    },
    operand_a: {
      type: "boolean",
      description: "The first operand.",
    },
    operand_b: {
      type: "boolean",
      description: "The second operand.",
    },
    // 数论运算的属性
    number_theory_operation: {
      type: "string",
      enum: ["gcd", "lcm", "prime_factorization", "is_prime", "modular_exponentiation"],
      description: "The type of number theory operation to perform (used when calculation_type is 'perform_number_theory')."
    },
    number_a: {
      type: "integer",
      description: "The first number for number theory operations."
    },
    number_b: {
      type: "integer",
      description: "The second number for number theory operations (if needed)."
    },
    number_theory_modulus: {
      type: "integer",
      description: "The modulus for modular exponentiation."
    },
    // 组合数学运算的属性
    combinatorics_operation: {
      type: "string",
      enum: ["permutation", "combination", "factorial", "binomial_coefficient"],
      description: "The type of combinatorics operation to perform (used when calculation_type is 'perform_combinatorics')."
    },
    n_value: {
      type: "integer",
      description: "The n value for combinatorics operations."
    },
    r_value: {
      type: "integer",
      description: "The r value for combinatorics operations (if needed)."
    },
    // 概率计算的属性
    probability_operation: {
      type: "string",
      enum: ["probability_event", "conditional_probability", "bayes_theorem"],
      description: "The type of probability calculation to perform (used when calculation_type is 'calculate_probability')."
    },
    probability_a: {
      type: "number",
      description: "The probability of event A (between 0 and 1)."
    },
    probability_b: {
      type: "number",
      description: "The probability of event B (between 0 and 1)."
    },
    probability_a_given_b: {
      type: "number",
      description: "The conditional probability of A given B (between 0 and 1)."
    },
    probability_b_given_a: {
      type: "number",
      description: "The conditional probability of B given A (between 0 and 1)."
    },
    // 集合论运算的属性
    set_theory_operation: {
      type: "string",
      enum: ["union", "intersection", "difference", "symmetric_difference", "is_subset"],
      description: "The type of set theory operation to perform (used when calculation_type is 'perform_set_theory')."
    },
    set_a: {
      type: "array",
      items: { type: "number" },
      description: "The first set for set theory operations."
    },
    set_b: {
      type: "array",
      items: { type: "number" },
      description: "The second set for set theory operations."
    },
    // 复数运算的属性
    complex_number_operation: {
      type: "string",
      enum: ["add", "subtract", "multiply", "divide", "modulus", "argument", "conjugate"],
      description: "The type of complex number operation to perform (used when calculation_type is 'perform_complex_number')."
    },
    complex_a_real: {
      type: "number",
      description: "The real part of the first complex number."
    },
    complex_a_imaginary: {
      type: "number",
      description: "The imaginary part of the first complex number."
    },
    complex_b_real: {
      type: "number",
      description: "The real part of the second complex number (if needed)."
    },
    complex_b_imaginary: {
      type: "number",
      description: "The imaginary part of the second complex number (if needed)."
    },
    precision_level: {
      type: "number",
      enum: [32, 64, 128],
      default: 64,
      description: "Calculation precision level (32, 64, 128)",
    },
  },
  required: ["calculation_type"],
  outputSchema: {
    type: "object",
    properties: {
      content: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["text"] },
            text: { type: "string" },
          },
          required: ["type", "text"],
        },
      },
      isError: { type: "boolean" },
    },
  },
};

export async function destroy() {
  // 清理资源
  console.log("Cleaning up universal_calculator resources");
}
export default async function (request: any) {
  try {
    const { calculation_type, ...params } = request.params.arguments;
    const precisionLevel = params.precision_level || 64;
    Decimal.set({ precision: precisionLevel });

    let result;

    switch (calculation_type) {
      case "evaluate_expression":
        if (!params.expression) {
          return { content: [{ type: "text", text: "Error: An expression is required." }], isError: true };
        }
        result = evaluate(params.expression);
        break;

      case "calculate_function":
        if (!params.function_name || typeof params.function_argument === 'undefined') {
          return { content: [{ type: "text", text: "Error: A function name and argument are required." }], isError: true };
        }
        switch (params.function_name.toLowerCase()) {
          case "sin":
            result = Math.sin(params.function_argument);
            break;
          case "cos":
            result = Math.cos(params.function_argument);
            break;
          case "tan":
            result = Math.tan(params.function_argument);
            break;
          case "abs":
            result = Math.abs(params.function_argument);
            break;
          case "sqrt":
            result = Math.sqrt(params.function_argument);
            break;
          case "log":
            result = Math.log(params.function_argument);
            break;
          case "exp":
            result = Math.exp(params.function_argument);
            break;
          default:
            return { content: [{ type: "text", text: `Error: Unsupported function: ${params.function_name}` }], isError: true };
        }
        break;

      case "calculate_statistics":
        if (!params.statistics_operation || !params.data_points || !Array.isArray(params.data_points)) {
          return { content: [{ type: "text", text: "Error: A statistics operation and data points array are required." }], isError: true };
        }
        switch (params.statistics_operation) {
          case "mean":
            result = params.data_points.reduce((sum, num) => sum + num, 0) / params.data_points.length;
            break;
          case "median":
            const sortedData = [...params.data_points].sort((a, b) => a - b);
            const middle = Math.floor(sortedData.length / 2);
            if (sortedData.length % 2 === 0) {
              result = (sortedData[middle - 1] + sortedData[middle]) / 2;
            } else {
              result = sortedData[middle];
            }
            break;
          case "mode":
            const frequencyMap = {};
            params.data_points.forEach(value => {
              frequencyMap[value] = (frequencyMap[value] || 0) + 1;
            });
            let modes = [];
            let maxFrequency = 0;
            for (const value in frequencyMap) {
              if (frequencyMap[value] > maxFrequency) {
                modes = [Number(value)];
                maxFrequency = frequencyMap[value];
              } else if (frequencyMap[value] === maxFrequency) {
                modes.push(Number(value));
              }
            }
            result = modes.length === Object.keys(frequencyMap).length ? [] : modes; // 如果所有数字出现次数相同，则无众数
            break;
          case "standard_deviation":
            const mean = params.data_points.reduce((sum, num) => sum + num, 0) / params.data_points.length;
            const squaredDifferences = params.data_points.map(num => Math.pow(num - mean, 2));
            const variance = squaredDifferences.reduce((sum, num) => sum + num, 0) / params.data_points.length;
            result = Math.sqrt(variance);
            break;
          case "variance":
            const meanVar = params.data_points.reduce((sum, num) => sum + num, 0) / params.data_points.length;
            const squaredDiffsVar = params.data_points.map(num => Math.pow(num - meanVar, 2));
            result = squaredDiffsVar.reduce((sum, num) => sum + num, 0) / params.data_points.length;
            break;
          case "correlation":
            if (!params.data_set_x || !params.data_set_y || params.data_set_x.length !== params.data_set_y.length) {
              return { content: [{ type: "text", text: "Error: Two equal-length datasets (data_set_x and data_set_y) are required to calculate correlation." }], isError: true };
            }
            const n = params.data_set_x.length;
            const sumX = params.data_set_x.reduce((sum, val) => sum + val, 0);
            const sumY = params.data_set_y.reduce((sum, val) => sum + val, 0);
            const sumXY = params.data_set_x.reduce((sum, val, i) => sum + val * params.data_set_y[i], 0);
            const sumX2 = params.data_set_x.reduce((sum, val) => sum + val * val, 0);
            const sumY2 = params.data_set_y.reduce((sum, val) => sum + val * val, 0);

            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            result = denominator === 0 ? 0 : numerator / denominator;
            break;
          case "regression":
            if (!params.data_set_x || !params.data_set_y || params.data_set_x.length !== params.data_set_y.length) {
              return { content: [{ type: "text", text: "Error: Two equal-length datasets (data_set_x and data_set_y) are required to calculate linear regression." }], isError: true };
            }
            const nReg = params.data_set_x.length;
            const sumXReg = params.data_set_x.reduce((sum, val) => sum + val, 0);
            const sumYReg = params.data_set_y.reduce((sum, val) => sum + val, 0);
            const sumXYReg = params.data_set_x.reduce((sum, val, i) => sum + val * params.data_set_y[i], 0);
            const sumX2Reg = params.data_set_x.reduce((sum, val) => sum + val * val, 0);

            const slope = (nReg * sumXYReg - sumXReg * sumYReg) / (nReg * sumX2Reg - sumXReg * sumXReg);
            const intercept = (sumYReg - slope * sumXReg) / nReg;
            result = { slope, intercept };
            break;
          default:
            return { content: [{ type: "text", text: `Error: Unsupported statistics operation: ${params.statistics_operation}` }], isError: true };
        }
        break;

      case "perform_geometry":
        if (!params.geometry_operation) {
          return { content: [{ type: "text", text: "Error: A geometry calculation type is required." }], isError: true };
        }
        switch (params.geometry_operation) {
          case "area_circle":
            if (typeof params.radius !== 'number') return { content: [{ type: "text", text: "Error: The radius of the circle is required." }], isError: true };
            result = Math.PI * Math.pow(params.radius, 2);
            break;
          case "area_rectangle":
            if (typeof params.length !== 'number' || typeof params.width !== 'number') return { content: [{ type: "text", text: "Error: The length and width of the rectangle are required." }], isError: true };
            result = params.length * params.width;
            break;
          case "volume_cube":
            if (typeof params.side !== 'number') return { content: [{ type: "text", text: "Error: The side length of the cube is required." }], isError: true };
            result = Math.pow(params.side, 3);
            break;
          default:
            return { content: [{ type: "text", text: `Error: Unsupported geometry calculation: ${params.geometry_operation}` }], isError: true };
        }
        break;

      case "perform_financial_math":
        if (!params.financial_math_operation) {
          return { content: [{ type: "text", text: "Error: A financial math calculation type is required." }], isError: true };
        }
        switch (params.financial_math_operation) {
          case "simple_interest":
            if (typeof params.principal !== 'number' || typeof params.rate !== 'number' || typeof params.time !== 'number') return { content: [{ type: "text", text: "Error: Principal, rate, and time are required." }], isError: true };
            result = params.principal * (params.rate / 100) * params.time;
            break;
          case "compound_interest":
            if (typeof params.principal !== 'number' || typeof params.rate !== 'number' || typeof params.time !== 'number' || typeof params.n_compounding_periods !== 'number') return { content: [{ type: "text", text: "Error: Principal, rate, time, and number of compounding periods are required." }], isError: true };
            result = params.principal * Math.pow(1 + (params.rate / 100) / params.n_compounding_periods, params.n_compounding_periods * params.time) - params.principal;
            break;
          case "present_value":
            if (typeof params.future_value !== 'number' || typeof params.rate !== 'number' || typeof params.time !== 'number') return { content: [{ type: "text", text: "Error: Future value, rate, and time are required." }], isError: true };
            result = params.future_value / Math.pow(1 + (params.rate / 100), params.time);
            break;
          case "future_value":
            if (typeof params.principal !== 'number' || typeof params.rate !== 'number' || typeof params.time !== 'number') return { content: [{ type: "text", text: "Error: Principal, rate, and time are required." }], isError: true };
            result = params.principal * Math.pow(1 + (params.rate / 100), params.time);
            break;
          default:
            return { content: [{ type: "text", text: `Error: Unsupported financial math calculation: ${params.financial_math_operation}` }], isError: true };
        }
        break;

      case "perform_logic_operations":
        if (!params.logic_operation || typeof params.operand_a === 'undefined') {
          return { content: [{ type: "text", text: "Error: A logic operation and at least one operand are required." }], isError: true };
        }
        switch (params.logic_operation.toUpperCase()) {
          case "AND":
            if (typeof params.operand_b === 'undefined') return { content: [{ type: "text", text: "Error: Both operands are required for AND operation." }], isError: true };
            result = params.operand_a && params.operand_b;
            break;
          case "OR":
            if (typeof params.operand_b === 'undefined') return { content: [{ type: "text", text: "Error: Both operands are required for OR operation." }], isError: true };
            result = params.operand_a || params.operand_b;
            break;
          case "NOT":
            result = !params.operand_a;
            break;
          case "XOR":
            if (typeof params.operand_b === 'undefined') return { content: [{ type: "text", text: "Error: Both operands are required for XOR operation." }], isError: true };
            result = params.operand_a !== params.operand_b;
            break;
          default:
            return { content: [{ type: "text", text: `Error: Unsupported logic operation: ${params.logic_operation}` }], isError: true };
        }
        break;

      // 数论运算实现
      case "perform_number_theory":
        if (!params.number_theory_operation) {
          return { content: [{ type: "text", text: "Error: A number theory operation is required." }], isError: true };
        }

        switch (params.number_theory_operation) {
          case "gcd":
            if (typeof params.number_a !== 'number' || typeof params.number_b !== 'number') {
              return { content: [{ type: "text", text: "Error: Two integers are required for GCD calculation." }], isError: true };
            }

            // 欧几里得算法计算最大公约数
            const gcd = (a: number, b: number): number => {
              a = Math.abs(Math.floor(a));
              b = Math.abs(Math.floor(b));
              while (b) {
                const temp = b;
                b = a % b;
                a = temp;
              }
              return a;
            };

            result = gcd(params.number_a, params.number_b);
            break;

          case "lcm":
            if (typeof params.number_a !== 'number' || typeof params.number_b !== 'number') {
              return { content: [{ type: "text", text: "Error: Two integers are required for LCM calculation." }], isError: true };
            }

            // 使用公式计算最小公倍数: LCM(a,b) = |a*b| / GCD(a,b)
            const gcdForLcm = (a: number, b: number): number => {
              a = Math.abs(Math.floor(a));
              b = Math.abs(Math.floor(b));
              while (b) {
                const temp = b;
                b = a % b;
                a = temp;
              }
              return a;
            };

            const lcm = (a: number, b: number): number => {
              if (a === 0 || b === 0) return 0;
              return Math.abs(a * b) / gcdForLcm(a, b);
            };

            result = lcm(params.number_a, params.number_b);
            break;

          case "prime_factorization":
            if (typeof params.number_a !== 'number') {
              return { content: [{ type: "text", text: "Error: An integer is required for prime factorization." }], isError: true };
            }

            const primeFactorization = (n: number): number[] => {
              n = Math.abs(Math.floor(n));
              if (n <= 1) return [n];

              const factors: number[] = [];
              let divisor = 2;

              while (n > 1) {
                while (n % divisor === 0) {
                  factors.push(divisor);
                  n /= divisor;
                }
                divisor++;

                // 优化: 如果除数 > sqrt(n)，则n是质数
                if (divisor * divisor > n && n > 1) {
                  factors.push(n);
                  break;
                }
              }

              return factors;
            };

            result = primeFactorization(params.number_a);
            break;

          case "is_prime":
            if (typeof params.number_a !== 'number') {
              return { content: [{ type: "text", text: "Error: An integer is required to check primality." }], isError: true };
            }

            const isPrime = (n: number): boolean => {
              n = Math.abs(Math.floor(n));
              if (n <= 1) return false;
              if (n <= 3) return true;
              if (n % 2 === 0 || n % 3 === 0) return false;

              for (let i = 5; i * i <= n; i += 6) {
                if (n % i === 0 || n % (i + 2) === 0) return false;
              }

              return true;
            };

            result = isPrime(params.number_a);
            break;

          case "modular_exponentiation":
            if (typeof params.number_a !== 'number' || typeof params.number_b !== 'number' || typeof params.number_theory_modulus !== 'number') {
              return { content: [{ type: "text", text: "Error: Base, exponent, and modulus are required for modular exponentiation." }], isError: true };
            }

            const modExp = (base: number, exponent: number, modulus: number): number => {
              if (modulus === 1) return 0;

              base = Math.floor(base);
              exponent = Math.floor(exponent);
              modulus = Math.floor(modulus);

              let result = 1;
              base = base % modulus;

              while (exponent > 0) {
                if (exponent % 2 === 1) {
                  result = (result * base) % modulus;
                }
                exponent = Math.floor(exponent / 2);
                base = (base * base) % modulus;
              }

              return result;
            };

            result = modExp(params.number_a, params.number_b, params.number_theory_modulus);
            break;

          default:
            return { content: [{ type: "text", text: `Error: Unsupported number theory operation: ${params.number_theory_operation}` }], isError: true };
        }
        break;

      // 组合数学运算实现
      case "perform_combinatorics":
        if (!params.combinatorics_operation) {
          return { content: [{ type: "text", text: "Error: A combinatorics operation is required." }], isError: true };
        }

        switch (params.combinatorics_operation) {
          case "factorial":
            if (typeof params.n_value !== 'number' || params.n_value < 0 || !Number.isInteger(params.n_value)) {
              return { content: [{ type: "text", text: "Error: A non-negative integer is required for factorial calculation." }], isError: true };
            }

            const factorial = (n: number): number => {
              if (n > 170) return Infinity; // 防止溢出
              if (n <= 1) return 1;
              let result = 1;
              for (let i = 2; i <= n; i++) {
                result *= i;
              }
              return result;
            };

            result = factorial(params.n_value);
            break;

          case "permutation":
            if (typeof params.n_value !== 'number' || typeof params.r_value !== 'number' ||
              params.n_value < 0 || params.r_value < 0 ||
              !Number.isInteger(params.n_value) || !Number.isInteger(params.r_value) ||
              params.r_value > params.n_value) {
              return { content: [{ type: "text", text: "Error: Valid n and r values are required for permutation (n ≥ r ≥ 0)." }], isError: true };
            }

            const permutation = (n: number, r: number): number => {
              let result = 1;
              for (let i = 0; i < r; i++) {
                result *= (n - i);
              }
              return result;
            };

            result = permutation(params.n_value, params.r_value);
            break;

          case "combination":
            if (typeof params.n_value !== 'number' || typeof params.r_value !== 'number' ||
              params.n_value < 0 || params.r_value < 0 ||
              !Number.isInteger(params.n_value) || !Number.isInteger(params.r_value) ||
              params.r_value > params.n_value) {
              return { content: [{ type: "text", text: "Error: Valid n and r values are required for combination (n ≥ r ≥ 0)." }], isError: true };
            }

            const combination = (n: number, r: number): number => {
              // 使用公式 C(n,r) = C(n,n-r) 来最小化计算
              if (r > n - r) r = n - r;

              let result = 1;
              for (let i = 1; i <= r; i++) {
                result *= (n - (r - i));
                result /= i;
              }

              return result;
            };

            result = combination(params.n_value, params.r_value);
            break;
          case "binomial_coefficient":
            // 这与组合是相同的
            if (typeof params.n_value !== 'number' || typeof params.r_value !== 'number' ||
              !Number.isInteger(params.n_value) || !Number.isInteger(params.r_value)) {
              return { content: [{ type: "text", text: "Error: Valid n and r integers are required for binomial coefficient." }], isError: true };
            }

            const binomialCoefficient = (n: number, k: number): number => {
              if (k < 0 || k > n) return 0;
              if (k === 0 || k === n) return 1;

              // 使用公式 C(n,k) = C(n,n-k) 来最小化计算
              if (k > n - k) k = n - k;

              let result = 1;
              for (let i = 1; i <= k; i++) {
                result *= (n - (k - i));
                result /= i;
              }

              return result;
            };

            result = binomialCoefficient(params.n_value, params.r_value);
            break;

          default:
            return { content: [{ type: "text", text: `Error: Unsupported combinatorics operation: ${params.combinatorics_operation}` }], isError: true };
        }
        break;

      // 概率计算实现
      case "calculate_probability":
        if (!params.probability_operation) {
          return { content: [{ type: "text", text: "Error: A probability operation is required." }], isError: true };
        }

        switch (params.probability_operation) {
          case "probability_event":
            if (typeof params.probability_a !== 'number' || params.probability_a < 0 || params.probability_a > 1) {
              return { content: [{ type: "text", text: "Error: A valid probability value between 0 and 1 is required." }], isError: true };
            }

            result = params.probability_a;
            break;

          case "conditional_probability":
            if (typeof params.probability_a_given_b !== 'number' || typeof params.probability_b !== 'number' ||
              params.probability_a_given_b < 0 || params.probability_a_given_b > 1 ||
              params.probability_b <= 0 || params.probability_b > 1) {
              return { content: [{ type: "text", text: "Error: Valid probability values are required (P(A|B) and P(B), where P(B) > 0)." }], isError: true };
            }

            // P(A∩B) = P(A|B) * P(B)
            result = params.probability_a_given_b * params.probability_b;
            break;

          case "bayes_theorem":
            if (typeof params.probability_a !== 'number' || typeof params.probability_b !== 'number' ||
              typeof params.probability_b_given_a !== 'number' ||
              params.probability_a < 0 || params.probability_a > 1 ||
              params.probability_b <= 0 || params.probability_b > 1 ||
              params.probability_b_given_a < 0 || params.probability_b_given_a > 1) {
              return { content: [{ type: "text", text: "Error: Valid probability values are required for Bayes' theorem." }], isError: true };
            }

            // P(A|B) = P(B|A) * P(A) / P(B)
            result = (params.probability_b_given_a * params.probability_a) / params.probability_b;
            break;

          default:
            return { content: [{ type: "text", text: `Error: Unsupported probability operation: ${params.probability_operation}` }], isError: true };
        }
        break;

      // 集合论运算实现
      case "perform_set_theory":
        if (!params.set_theory_operation) {
          return { content: [{ type: "text", text: "Error: A set theory operation is required." }], isError: true };
        }

        if (!params.set_a || !Array.isArray(params.set_a)) {
          return { content: [{ type: "text", text: "Error: Set A is required and must be an array." }], isError: true };
        }

        switch (params.set_theory_operation) {
          case "union":
            if (!params.set_b || !Array.isArray(params.set_b)) {
              return { content: [{ type: "text", text: "Error: Set B is required and must be an array for union operation." }], isError: true };
            }

            // 使用Set去除重复项
            result = [...new Set([...params.set_a, ...params.set_b])];
            break;

          case "intersection":
            if (!params.set_b || !Array.isArray(params.set_b)) {
              return { content: [{ type: "text", text: "Error: Set B is required and must be an array for intersection operation." }], isError: true };
            }

            result = params.set_a.filter(item => params.set_b.includes(item));
            // 去除重复项
            result = [...new Set(result)];
            break;

          case "difference":
            if (!params.set_b || !Array.isArray(params.set_b)) {
              return { content: [{ type: "text", text: "Error: Set B is required and must be an array for difference operation." }], isError: true };
            }

            result = params.set_a.filter(item => !params.set_b.includes(item));
            // 去除重复项
            result = [...new Set(result)];
            break;

          case "symmetric_difference":
            if (!params.set_b || !Array.isArray(params.set_b)) {
              return { content: [{ type: "text", text: "Error: Set B is required and must be an array for symmetric difference operation." }], isError: true };
            }

            const aNotInB = params.set_a.filter(item => !params.set_b.includes(item));
            const bNotInA = params.set_b.filter(item => !params.set_a.includes(item));
            result = [...aNotInB, ...bNotInA];
            // 去除重复项
            result = [...new Set(result)];
            break;

          case "is_subset":
            if (!params.set_b || !Array.isArray(params.set_b)) {
              return { content: [{ type: "text", text: "Error: Set B is required and must be an array for subset check." }], isError: true };
            }

            result = params.set_a.every(item => params.set_b.includes(item));
            break;

          default:
            return { content: [{ type: "text", text: `Error: Unsupported set theory operation: ${params.set_theory_operation}` }], isError: true };
        }
        break;

      // 复数运算实现
      case "perform_complex_number":
        if (!params.complex_number_operation) {
          return { content: [{ type: "text", text: "Error: A complex number operation is required." }], isError: true };
        }

        if (typeof params.complex_a_real !== 'number' || typeof params.complex_a_imaginary !== 'number') {
          return { content: [{ type: "text", text: "Error: Complex number A (real and imaginary parts) is required." }], isError: true };
        }

        switch (params.complex_number_operation) {
          case "add":
            if (typeof params.complex_b_real !== 'number' || typeof params.complex_b_imaginary !== 'number') {
              return { content: [{ type: "text", text: "Error: Complex number B (real and imaginary parts) is required for addition." }], isError: true };
            }

            result = {
              real: params.complex_a_real + params.complex_b_real,
              imaginary: params.complex_a_imaginary + params.complex_b_imaginary
            };
            break;

          case "subtract":
            if (typeof params.complex_b_real !== 'number' || typeof params.complex_b_imaginary !== 'number') {
              return { content: [{ type: "text", text: "Error: Complex number B (real and imaginary parts) is required for subtraction." }], isError: true };
            }

            result = {
              real: params.complex_a_real - params.complex_b_real,
              imaginary: params.complex_a_imaginary - params.complex_b_imaginary
            };
            break;

          case "multiply":
            if (typeof params.complex_b_real !== 'number' || typeof params.complex_b_imaginary !== 'number') {
              return { content: [{ type: "text", text: "Error: Complex number B (real and imaginary parts) is required for multiplication." }], isError: true };
            }

            // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
            result = {
              real: params.complex_a_real * params.complex_b_real - params.complex_a_imaginary * params.complex_b_imaginary,
              imaginary: params.complex_a_real * params.complex_b_imaginary + params.complex_a_imaginary * params.complex_b_real
            };
            break;

          case "divide":
            if (typeof params.complex_b_real !== 'number' || typeof params.complex_b_imaginary !== 'number') {
              return { content: [{ type: "text", text: "Error: Complex number B (real and imaginary parts) is required for division." }], isError: true };
            }

            // 检查除以零的情况
            if (params.complex_b_real === 0 && params.complex_b_imaginary === 0) {
              return { content: [{ type: "text", text: "Error: Division by zero is not allowed." }], isError: true };
            }

            // (a + bi) / (c + di) = ((ac + bd) + (bc - ad)i) / (c² + d²)
            const denominator = Math.pow(params.complex_b_real, 2) + Math.pow(params.complex_b_imaginary, 2);
            result = {
              real: (params.complex_a_real * params.complex_b_real + params.complex_a_imaginary * params.complex_b_imaginary) / denominator,
              imaginary: (params.complex_a_imaginary * params.complex_b_real - params.complex_a_real * params.complex_b_imaginary) / denominator
            };
            break;

          case "modulus":
            // |a + bi| = √(a² + b²)
            result = Math.sqrt(Math.pow(params.complex_a_real, 2) + Math.pow(params.complex_a_imaginary, 2));
            break;

          case "argument":
            // arg(a + bi) = atan2(b, a)
            result = Math.atan2(params.complex_a_imaginary, params.complex_a_real);
            break;

          case "conjugate":
            // (a + bi)* = a - bi
            result = {
              real: params.complex_a_real,
              imaginary: -params.complex_a_imaginary
            };
            break;

          default:
            return { content: [{ type: "text", text: `Error: Unsupported complex number operation: ${params.complex_number_operation}` }], isError: true };
        }
        break;

      default:
        return {
          content: [
            {
              type: "text",
              text: `Error: Unsupported calculation type: ${calculation_type}`
            }
          ],
          isError: true
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(`Error: ${error instanceof Error ? error.message : String(error)}`, null, 2),
        },
      ],
      isError: true,
    };
  }
}
