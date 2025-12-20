/* eslint-disable no-unused-vars */
/**
 * Tax Planning & Estimation Calculator
 *
 * Helps independent contractors estimate tax obligations based on:
 * - Income from various practices
 * - Business expenses (deductions)
 * - Self-employment tax
 * - Estimated quarterly tax payments
 */

/**
 * 2024/2025 Tax Brackets for Single Filers (adjust as needed)
 */
const TAX_BRACKETS_SINGLE = [
  { rate: 0.1, min: 0, max: 11600 },
  { rate: 0.12, min: 11600, max: 47150 },
  { rate: 0.22, min: 47150, max: 100525 },
  { rate: 0.24, min: 100525, max: 191950 },
  { rate: 0.32, min: 191950, max: 243725 },
  { rate: 0.35, min: 243725, max: 609350 },
  { rate: 0.37, min: 609350, max: Infinity },
];

/**
 * Standard deduction for 2024/2025
 */
const STANDARD_DEDUCTION_SINGLE = 14600;
const STANDARD_DEDUCTION_MARRIED = 29200;

/**
 * Self-employment tax rates
 */
const SELF_EMPLOYMENT_TAX_RATE = 0.153; // 15.3% (12.4% Social Security + 2.9% Medicare)
const SOCIAL_SECURITY_WAGE_BASE = 168600; // 2024 limit

/**
 * Calculate federal income tax using progressive brackets
 * @param {number} taxableIncome - Income after deductions
 * @param {string} filingStatus - 'single' or 'married' (reserved for future use)
 * @returns {number} - Federal income tax owed
 */

export function calculateFederalIncomeTax(
  taxableIncome,
  filingStatus = "single"
) {
  if (taxableIncome <= 0) return 0;

  const brackets = TAX_BRACKETS_SINGLE; // Could expand for married brackets
  let tax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];

    if (taxableIncome > bracket.min) {
      const taxableInBracket =
        Math.min(taxableIncome, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;

      if (taxableIncome <= bracket.max) break;
    }
  }

  return tax;
}

/**
 * Calculate self-employment tax
 * Self-employed individuals pay both employer and employee portions of Social Security and Medicare
 * @param {number} netSelfEmploymentIncome - Income from self-employment after business expenses
 * @returns {Object} - Breakdown of self-employment tax
 */
export function calculateSelfEmploymentTax(netSelfEmploymentIncome) {
  if (netSelfEmploymentIncome <= 0) {
    return { total: 0, socialSecurity: 0, medicare: 0, deduction: 0 };
  }

  // Only 92.35% of net self-employment income is subject to SE tax
  const adjustedIncome = netSelfEmploymentIncome * 0.9235;

  // Social Security tax (12.4%) capped at wage base
  const socialSecurityBase = Math.min(
    adjustedIncome,
    SOCIAL_SECURITY_WAGE_BASE
  );
  const socialSecurity = socialSecurityBase * 0.124;

  // Medicare tax (2.9%) - no cap
  const medicare = adjustedIncome * 0.029;

  // Additional Medicare tax for high earners (0.9% on income over $200k)
  const additionalMedicare =
    adjustedIncome > 200000 ? (adjustedIncome - 200000) * 0.009 : 0;

  const total = socialSecurity + medicare + additionalMedicare;

  // You can deduct half of SE tax from your gross income
  const deduction = total * 0.5;

  return {
    total,
    socialSecurity,
    medicare: medicare + additionalMedicare,
    deduction,
  };
}

/**
 * Calculate estimated total tax liability for the year
 * @param {Object} params
 * @param {number} params.grossIncome - Total income before expenses
 * @param {number} params.businessExpenses - Total tax-deductible business expenses
 * @param {number} params.otherDeductions - Other deductions (IRA contributions, HSA, etc.)
 * @param {string} params.filingStatus - 'single' or 'married'
 * @param {boolean} params.isSelfEmployed - Whether income is from self-employment
 * @returns {Object} - Complete tax breakdown
 */
export function calculateTotalTaxLiability({
  grossIncome,
  businessExpenses = 0,
  otherDeductions = 0,
  filingStatus = "single",
  isSelfEmployed = true,
}) {
  // Step 1: Calculate net self-employment income
  const netSelfEmploymentIncome = grossIncome - businessExpenses;

  // Step 2: Calculate self-employment tax (if applicable)
  const selfEmploymentTax = isSelfEmployed
    ? calculateSelfEmploymentTax(netSelfEmploymentIncome)
    : { total: 0, deduction: 0 };

  // Step 3: Calculate adjusted gross income (AGI)
  const agi =
    grossIncome -
    businessExpenses -
    selfEmploymentTax.deduction -
    otherDeductions;

  // Step 4: Apply standard deduction
  const standardDeduction =
    filingStatus === "married"
      ? STANDARD_DEDUCTION_MARRIED
      : STANDARD_DEDUCTION_SINGLE;

  const taxableIncome = Math.max(0, agi - standardDeduction);

  // Step 5: Calculate federal income tax
  const federalIncomeTax = calculateFederalIncomeTax(
    taxableIncome,
    filingStatus
  );

  // Step 6: Total tax liability
  const totalTax = federalIncomeTax + selfEmploymentTax.total;

  // Effective tax rate
  const effectiveTaxRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    businessExpenses,
    netSelfEmploymentIncome,
    selfEmploymentTax: selfEmploymentTax.total,
    selfEmploymentTaxDeduction: selfEmploymentTax.deduction,
    otherDeductions,
    agi,
    standardDeduction,
    taxableIncome,
    federalIncomeTax,
    totalTax,
    effectiveTaxRate,
  };
}

/**
 * Calculate quarterly estimated tax payments
 * IRS requires quarterly payments if you expect to owe $1,000+ in taxes
 * @param {number} estimatedAnnualTax - Total tax liability for the year
 * @param {number} taxesPaidYTD - Taxes already paid this year (withholding, previous quarterlies)
 * @returns {Object} - Quarterly payment schedule
 */
export function calculateQuarterlyEstimates(
  estimatedAnnualTax,
  taxesPaidYTD = 0
) {
  const remainingTax = Math.max(0, estimatedAnnualTax - taxesPaidYTD);
  const quarterlyPayment = remainingTax / 4;

  // Typical quarterly due dates
  const currentYear = new Date().getFullYear();
  const quarters = [
    {
      quarter: "Q1",
      dueDate: `April 15, ${currentYear}`,
      payment: quarterlyPayment,
    },
    {
      quarter: "Q2",
      dueDate: `June 15, ${currentYear}`,
      payment: quarterlyPayment,
    },
    {
      quarter: "Q3",
      dueDate: `September 15, ${currentYear}`,
      payment: quarterlyPayment,
    },
    {
      quarter: "Q4",
      dueDate: `January 15, ${currentYear + 1}`,
      payment: quarterlyPayment,
    },
  ];

  return {
    totalRemaining: remainingTax,
    quarterlyPayment,
    quarters,
    shouldPayQuarterly: estimatedAnnualTax >= 1000,
  };
}

/**
 * Calculate tax savings from business expenses
 * Shows how much in taxes each dollar of expenses saves
 * @param {number} expense - Amount of business expense
 * @param {number} marginalTaxRate - Combined marginal rate (federal + SE tax)
 * @returns {Object} - Tax savings breakdown
 */
export function calculateExpenseTaxSavings(expense, marginalTaxRate = 0.37) {
  // For self-employed, expenses reduce both income tax AND self-employment tax
  // Typical combined marginal rate is around 35-40% for high earners

  const taxSavings = expense * marginalTaxRate;
  const netCost = expense - taxSavings;
  const savingsPercentage = (taxSavings / expense) * 100;

  return {
    expense,
    taxSavings,
    netCost,
    savingsPercentage,
  };
}

/**
 * Estimate marginal tax rate based on income
 * This is a simplified estimate - actual rate depends on many factors
 * @param {number} taxableIncome - Income after deductions
 * @returns {number} - Marginal tax rate (as decimal, e.g., 0.22 for 22%)
 */
export function estimateMarginalRate(taxableIncome) {
  for (let i = TAX_BRACKETS_SINGLE.length - 1; i >= 0; i--) {
    if (taxableIncome > TAX_BRACKETS_SINGLE[i].min) {
      return TAX_BRACKETS_SINGLE[i].rate;
    }
  }
  return TAX_BRACKETS_SINGLE[0].rate;
}

/**
 * Project year-end tax liability based on current data
 * @param {Object} params
 * @param {number} params.incomeYTD - Income earned so far this year
 * @param {number} params.expensesYTD - Expenses so far this year
 * @param {number} params.monthsElapsed - Months of the year completed
 * @param {string} params.filingStatus
 * @returns {Object} - Projected year-end tax situation
 */
export function projectYearEndTaxes({
  incomeYTD,
  expensesYTD,
  monthsElapsed,
  filingStatus = "single",
}) {
  // Project full year based on current pace
  const monthlyIncomeRate = incomeYTD / monthsElapsed;
  const monthlyExpenseRate = expensesYTD / monthsElapsed;
  const monthsRemaining = 12 - monthsElapsed;

  const projectedAnnualIncome = incomeYTD + monthlyIncomeRate * monthsRemaining;
  const projectedAnnualExpenses =
    expensesYTD + monthlyExpenseRate * monthsRemaining;

  const projectedTaxLiability = calculateTotalTaxLiability({
    grossIncome: projectedAnnualIncome,
    businessExpenses: projectedAnnualExpenses,
    filingStatus,
    isSelfEmployed: true,
  });

  return {
    projectedAnnualIncome,
    projectedAnnualExpenses,
    ...projectedTaxLiability,
  };
}
