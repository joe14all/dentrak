# Feature #3: Tax Planning & Expense Tracking

## Overview
A comprehensive tax planning and business expense tracking system for independent contractors (dentists). Helps track deductible business expenses, estimate tax liability, and plan quarterly estimated tax payments.

## Database Schema (Version 11)
- **Table**: `expenses`
- **Indexes**: `++id, date, category, practiceId, year, [year+category]`
- **Fields**:
  - `id`: Auto-incrementing primary key
  - `date`: Date of expense
  - `category`: Expense category (e.g., "Mileage", "Continuing Education")
  - `amount`: Expense amount
  - `description`: Brief description
  - `vendor`: Vendor/payee name
  - `practiceId`: Optional link to a practice
  - `taxDeductible`: Boolean flag
  - `paymentMethod`: How it was paid
  - `receiptNumber`: Optional receipt tracking
  - `notes`: Additional notes
  - `year`: Auto-calculated from date for indexing

## Expense Categories
Pre-defined IRS-compliant categories:
- **Vehicle & Travel**: Mileage, Parking & Tolls, Travel & Lodging
- **Professional Development**: Continuing Education, Professional Dues, Subscriptions
- **Office & Equipment**: Supplies, Equipment & Tools, Software & Technology
- **Insurance**: Malpractice, Health, Disability
- **Professional Services**: Accounting & Tax Prep, Legal Fees, Consulting
- **Business Operations**: Marketing, Phone & Internet, Business Meals (50% deductible)
- **Other**: Uniforms & Scrubs, Licenses & Permits, Other Business Expense

## Tax Calculation Features
### Self-Employment Tax
- Calculates 15.3% SE tax (Social Security + Medicare)
- Applies Social Security wage base cap ($168,600 for 2024)
- Additional Medicare tax for high earners (0.9% over $200k)
- Deducts half of SE tax from gross income

### Federal Income Tax
- Progressive tax brackets for 2024/2025
- Standard deduction ($14,600 single, $29,200 married)
- Calculates effective tax rate

### Year-End Projections
- Projects annual income based on YTD pace
- Estimates total tax liability
- Accounts for business expenses reducing taxable income

### Quarterly Estimates
- Calculates quarterly estimated tax payments
- Shows due dates (April 15, June 15, Sept 15, Jan 15)
- Highlights current quarter
- Recommends quarterly payments if liability > $1,000

## Components

### ExpenseForm (`src/features/expenses/ExpenseForm.jsx`)
- Comprehensive form for adding/editing expenses
- Grouped category selection with optgroups
- Practice association (optional)
- Payment method tracking
- Tax deductible checkbox

### ExpensesList (`src/features/expenses/ExpensesList.jsx`)
- Card-based expense list
- Sort by date (newest first)
- Total expenses calculation
- Edit/delete actions
- Empty state handling

### TaxPlanning Dashboard Widget (`src/features/dashboard/TaxPlanning/TaxPlanning.jsx`)
- YTD summary cards (Income, Deductions, Tax Liability)
- Quarterly estimated payment schedule
- Top 5 expense categories pie chart
- Detailed tax calculation breakdown (expandable)
- Filing status selector (Single/Married)
- Effective tax rate display
- Tax disclaimer

## Integration Points

### Settings Page
- New "Business Expenses" section
- Add/edit/delete expenses
- Full expense list with filtering
- Modal-based form

### Dashboard Page
- New full-width "Tax Planning" section
- Positioned below Cash Flow Forecast
- Complements financial overview

### Context Provider
- `ExpenseContext` integrated into `AppProvider`
- Global state management for expenses
- CRUD operations via hooks

## Utility Functions (`src/utils/taxCalculations.js`)
- `calculateFederalIncomeTax()`: Progressive bracket calculation
- `calculateSelfEmploymentTax()`: SE tax with Medicare surtax
- `calculateTotalTaxLiability()`: Complete tax calculation
- `calculateQuarterlyEstimates()`: Quarterly payment schedule
- `calculateExpenseTaxSavings()`: Tax savings from deductions
- `estimateMarginalRate()`: Marginal tax rate estimation
- `projectYearEndTaxes()`: Year-end projection based on YTD

## Key Features
1. **IRS-Compliant Categories**: Pre-defined business expense categories
2. **Automatic Tax Calculations**: Real-time tax liability estimates
3. **Quarterly Planning**: Know when and how much to pay
4. **Practice Association**: Link expenses to specific practices
5. **Receipt Tracking**: Optional receipt numbers
6. **Tax Deductible Flag**: Mark non-deductible expenses
7. **Year-End Projections**: Estimate based on current pace
8. **Effective Rate Display**: See actual tax burden percentage
9. **Expense Breakdown**: Visual pie chart of top categories
10. **Detailed Calculations**: Expandable breakdown showing all steps

## Data Safety
- All operations are read-only for income data (payments, entries)
- Only expenses table is modified
- No impact on existing financial data
- Database upgrade from v10 to v11

## Tax Disclaimer
The widget includes a disclaimer: "This is an estimate based on 2024 tax rates. Consult a tax professional for personalized advice."

## Future Enhancements
- Receipt image upload/attachment
- Married filing jointly tax brackets
- State tax calculations
- Mileage tracking with IRS standard rate
- Export to CSV for accountants
- Tax form pre-population (Schedule C)
- Multi-year comparison
