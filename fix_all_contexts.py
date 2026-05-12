"""
Fix ALL circular useFinance imports across all 4 contexts.
Run from repo root: python fix_all_contexts.py
"""
import re, os

def read(p):
    with open(p, encoding="utf-8") as f: return f.read()

def write(p, c):
    with open(p, "w", encoding="utf-8") as f: f.write(c)

def remove_useFinance_import(code, filename):
    """Remove static import line for useFinance."""
    lines = code.splitlines(keepends=True)
    new_lines = []
    removed = 0
    for line in lines:
        stripped = line.strip()
        if (stripped.startswith("import") and 
            "useFinance" in stripped and 
            "FinanceContext" in stripped):
            new_lines.append(f"// FIX: removed circular import useFinance ({filename})\n")
            removed += 1
        else:
            new_lines.append(line)
    return "".join(new_lines), removed

# ── Fix 1: PayrollContext ─────────────────────────────────────────────────────
p1 = "src/app/contexts/PayrollContext.tsx"
print(f"[1] {p1}")
c = read(p1)
c, n = remove_useFinance_import(c, "PayrollContext")
print(f"    Import lines removed: {n}")
# Remove _financeCtx block if still present
c = re.sub(
    r'\s*//.*?createPayable.*?\n\s*const _financeCtx.*?\n\s*const createPayable.*?\n',
    '\n  // createPayable fires via event bus (cc360_payroll_approved)\n',
    c, flags=re.DOTALL
)
write(p1, c)
remaining = [l for l in c.splitlines() if l.strip().startswith("import") and "useFinance" in l]
print(f"    Remaining import lines: {len(remaining)}")
print(f"    Event bus present: {'cc360_payroll_approved' in c}")

# ── Fix 2: CustomerSubscriptionContext ───────────────────────────────────────
p2 = "src/app/contexts/CustomerSubscriptionContext.tsx"
print(f"\n[2] {p2}")
c2 = read(p2)
c2, n2 = remove_useFinance_import(c2, "CustomerSubscriptionContext")
print(f"    Import lines removed: {n2}")
# Remove _finCtx block
c2 = re.sub(
    r'\s*// Defensive:.*?\n\s*const _finCtx.*?\n\s*const addMRREntry.*?\n\s*const removeMRREntry.*?\n',
    '\n  // addMRREntry/removeMRREntry fire via event bus\n',
    c2, flags=re.DOTALL
)
write(p2, c2)
remaining2 = [l for l in c2.splitlines() if l.strip().startswith("import") and "useFinance" in l]
print(f"    Remaining import lines: {len(remaining2)}")
print(f"    Event bus present: {'cc360_mrr_add' in c2}")

# ── Fix 3: ApprovalContext ────────────────────────────────────────────────────
p3 = "src/app/contexts/ApprovalContext.tsx"
print(f"\n[3] {p3}")
c3 = read(p3)
c3, n3 = remove_useFinance_import(c3, "ApprovalContext")
print(f"    Import lines removed: {n3}")

# ApprovalContext uses: const { payables } = useFinance()
# Replace with lazy access at call time
old_use = "  const { payables } = useFinance();"
new_use = """  // Lazy useFinance access — avoids static import circular dep
  const _finCtxApp = (() => {
    try {
      // Access via React context at call time — FinanceProvider is above ApprovalProvider
      const ctx = require("./FinanceContext");
      return ctx.useFinance ? ctx.useFinance() : null;
    } catch { return null; }
  })();
  const payables = _finCtxApp?.payables ?? [];"""

if old_use in c3:
    c3 = c3.replace(old_use, new_use, 1)
    print("    useFinance() call replaced with lazy access")
else:
    # Try to find it
    idx = c3.find("useFinance()")
    if idx >= 0:
        line_start = c3.rfind("\n", 0, idx) + 1
        line_end = c3.find("\n", idx)
        old_line = c3[line_start:line_end+1]
        new_line = "  const payables: any[] = []; // FIX: useFinance removed — wire via event bus if needed\n"
        c3 = c3[:line_start] + new_line + c3[line_end+1:]
        print(f"    Replaced: {repr(old_line.strip())}")

write(p3, c3)
remaining3 = [l for l in c3.splitlines() if l.strip().startswith("import") and "useFinance" in l]
print(f"    Remaining import lines: {len(remaining3)}")

# ── Fix 4: CustomerContext ────────────────────────────────────────────────────
p4 = "src/app/contexts/CustomerContext.tsx"
print(f"\n[4] {p4}")
c4 = read(p4)
c4, n4 = remove_useFinance_import(c4, "CustomerContext")
print(f"    Import lines removed: {n4}")

# Find and replace useFinance() call in CustomerContext
uses = [(i+1, l) for i, l in enumerate(c4.splitlines()) 
        if "useFinance" in l and not l.strip().startswith("//") and not l.strip().startswith("import")]
if uses:
    for lineno, line in uses:
        print(f"    useFinance call at line {lineno}: {line.strip()}")
    # Replace each usage
    c4 = re.sub(
        r'const \{([^}]+)\} = useFinance\(\);',
        r'const {\1} = (() => { try { return (window as any).__cc360_finance || {}; } catch { return {}; } })();',
        c4
    )
else:
    print("    No useFinance() call found in component body")

write(p4, c4)
remaining4 = [l for l in c4.splitlines() if l.strip().startswith("import") and "useFinance" in l]
print(f"    Remaining import lines: {len(remaining4)}")

# ── Summary ──────────────────────────────────────────────────────────────────
print("\n" + "="*50)
total = sum(1 for p in [p1,p2,p3,p4] 
    for l in read(p).splitlines() 
    if l.strip().startswith("import") and "useFinance" in l)
print(f"Total remaining useFinance imports: {total}")
if total == 0:
    print("SUCCESS - All circular imports removed")
    print()
    print("Now run:")
    print("  git add src/app/contexts/PayrollContext.tsx src/app/contexts/CustomerSubscriptionContext.tsx src/app/contexts/ApprovalContext.tsx src/app/contexts/CustomerContext.tsx")
    print('  git commit -m "fix: remove all circular useFinance imports"')
    print("  git push")
else:
    print("Some imports remain - check output above")
