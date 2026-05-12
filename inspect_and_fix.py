# Inspect PayrollContext and fix ALL useFinance imports

path = "src/app/contexts/PayrollContext.tsx"

with open(path, encoding="utf-8") as f:
    lines = f.readlines()

# Show all lines containing useFinance
print("=== All lines with 'useFinance' ===")
for i, line in enumerate(lines, 1):
    if "useFinance" in line:
        print(f"  Line {i}: {repr(line)}")

print()

# Remove ALL lines that import useFinance (not just use it)
new_lines = []
removed = 0
for i, line in enumerate(lines, 1):
    if "import" in line and "useFinance" in line and "FinanceContext" in line:
        print(f"Removing line {i}: {repr(line)}")
        new_lines.append("// FIX: removed circular useFinance import\n")
        removed += 1
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

with open(path, encoding="utf-8") as f:
    result = f.read()

print()
print(f"Removed {removed} import lines")
print("import useFinance gone:", not any(
    "import" in l and "useFinance" in l
    for l in result.splitlines()
))
print("event bus present:", "cc360_payroll_approved" in result)
