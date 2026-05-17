#!/usr/bin/env python3
"""
Debug script to verify April 2026 PDF totals
"""
import re

# Read the raw extracted text
with open('/tmp/april_raw.txt', 'r') as f:
    lines = f.readlines()

procedures = []
total_charges = 0
total_payments = 0

i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # Check if this is a procedure line (starts with date and has a code)
    if re.match(r'^\d{2}/\d{2}/\d{4}', line):
        # Check if there's a code on this line
        if re.search(r'D\d{4}', line):
            # Look for charge on this line or next line
            charge_match = re.search(r'\b(\d+\.\d{2})\s+\d+\s+SH', line)
            if not charge_match and i + 1 < len(lines):
                # Charge is on next line
                next_line = lines[i + 1].strip()
                charge_match = re.search(r'^\s*(\d+\.\d{2})', next_line)
                if charge_match:
                    i += 1  # Skip next line
            
            if charge_match:
                charge = float(charge_match.group(1))
                total_charges += charge
                procedures.append({'line': line[:80], 'charge': charge})
        
        # Check for payment lines
        elif 'Payment' in line or 'Dental Ins' in line:
            payment_match = re.search(r'-(\d+\.\d{2})', line)
            if payment_match:
                payment = float(payment_match.group(1))
                total_payments += payment
                procedures.append({'line': line[:80], 'payment': payment})
    
    i += 1

print(f"Total procedures found: {len(procedures)}")
print(f"Total charges: ${total_charges:,.2f}")
print(f"Total payments: ${total_payments:,.2f}")
print(f"\nExpected from PDF Grand TOTALS:")
print(f"Charges: $26,529.52")
print(f"Payments: $2,625.10")
print(f"\nDifference:")
print(f"Charges: ${26529.52 - total_charges:,.2f}")
print(f"Payments: ${2625.10 - total_payments:,.2f}")

print(f"\nFirst 10 procedures:")
for i, proc in enumerate(procedures[:10], 1):
    print(f"{i}. {proc}")
