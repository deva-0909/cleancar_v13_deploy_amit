import re

# Fix 1: Remove static useFinance import from PayrollContext
path1 = "src/app/contexts/PayrollContext.tsx"
with open(path1, encoding="utf-8") as f:
    c = f.read()

old = 'import { useFinance } from "./FinanceContext";'
if old in c:
    c = c.replace(old, "// FIX: removed circular import of useFinance")
    with open(path1, "w", encoding="utf-8") as f:
        f.write(c)
    print("PayrollContext: static import removed OK")
else:
    print("PayrollContext: import already removed or pattern changed")

print("  useFinance import present:", "import { useFinance } from" in c)
print("  event bus present:", "cc360_payroll_approved" in c)

# Fix 2: Remove nested React.lazy for GeneratedPayslip
path2 = "src/app/components/hr/EmployeeAttendanceDrillDown.tsx"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

# Replace the lazy block with static import
pattern = r'const GeneratedPayslip = React\.lazy\(\s*\(\s*\)\s*=>\s*\n?\s*import\(["\']\.\/GeneratedPayslip["\']\)\.then\([^)]+\)\s*\);'
replacement = 'import { GeneratedPayslip } from "./GeneratedPayslip";'

new_c2, n = re.subn(pattern, replacement, c2, flags=re.DOTALL)
if n:
    # Remove any comment lines above the lazy block that reference it
    new_c2 = re.sub(r'// [^\n]*lazy[^\n]*\n// [^\n]*GeneratedPayslip[^\n]*\n', '', new_c2)
    new_c2 = re.sub(r'// [^\n]*GeneratedPayslip[^\n]*chunk[^\n]*\n', '', new_c2)
    # Remove Suspense wrapper if present
    new_c2 = re.sub(r'<React\.Suspense[^>]*>\s*\n(\s*<GeneratedPayslip)', r'\1', new_c2)
    new_c2 = re.sub(r'(/>)\s*\n\s*</React\.Suspense>', r'\1', new_c2)
    with open(path2, "w", encoding="utf-8") as f:
        f.write(new_c2)
    print("EmployeeAttendanceDrillDown: React.lazy removed OK")
else:
    print("EmployeeAttendanceDrillDown: lazy pattern not found - checking...")
    if 'import { GeneratedPayslip }' in c2:
        print("  Already has static import")
    if 'React.lazy' in c2:
        print("  Still has React.lazy - manual check needed")

print("  static import present:", 'import { GeneratedPayslip }' in new_c2)
print("  React.lazy for GP gone:", not re.search(r'React\.lazy.*GeneratedPayslip', new_c2))
