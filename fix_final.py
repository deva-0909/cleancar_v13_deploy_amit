# Final targeted fix for PayrollContext.tsx
# Removes the static useFinance import that coexists with the event bus

path = "src/app/contexts/PayrollContext.tsx"

with open(path, encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
removed = 0
for line in lines:
    # Remove the exact static import line
    if 'import { useFinance } from "./FinanceContext"' in line:
        new_lines.append("// FIX: removed circular import { useFinance } from FinanceContext\n")
        removed += 1
    # Remove the _financeCtx try/catch block lines
    elif '_financeCtx = (' in line or '_financeCtx?.' in line:
        # Skip these lines entirely
        removed += 1
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

# Verify
with open(path, encoding="utf-8") as f:
    result = f.read()

print("Lines removed:", removed)
print("static useFinance import gone:", "import { useFinance } from" not in result)
print("event bus present:", "cc360_payroll_approved" in result)
print()
if "import { useFinance } from" not in result and "cc360_payroll_approved" in result:
    print("SUCCESS - PayrollContext is now clean")
else:
    print("STILL NEEDS WORK - paste this output for help")
