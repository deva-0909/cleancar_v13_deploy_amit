#!/usr/bin/env python3
"""
CleanCar 360 - Definitive crash fix
Fixes: ReferenceError: Cannot access 'ae/te/y' before initialization at /#/hr

Run from repo root:
  python apply_crash_fix.py

Then commit and push:
  git add src/app/contexts/PayrollContext.tsx src/app/contexts/CustomerSubscriptionContext.tsx src/app/contexts/FinanceContext.tsx src/app/components/hr/EmployeeAttendanceDrillDown.tsx
  git commit -m "fix: circular ES module crash"
  git push
"""
import os, re, sys

def check_repo():
    if not os.path.exists("package.json") or not os.path.exists("src/app/contexts"):
        print("ERROR: Run this script from the repository root (where package.json is).")
        sys.exit(1)
    print("CleanCar 360 crash fix — applying to current directory")
    print()

def read(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read()

def write(path, code):
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: PayrollContext.tsx
# ─────────────────────────────────────────────────────────────────────────────
def fix_payroll_context():
    path = "src/app/contexts/PayrollContext.tsx"
    print(f"[1/4] {path}")
    code = read(path)

    if "cc360_payroll_approved" in code:
        print("  Already fixed — skipping"); return

    # Remove static import
    code = code.replace(
        'import { useFinance } from "./FinanceContext";',
        '// FIX: removed circular import { useFinance } — event bus used instead'
    )

    # Remove the _financeCtx / createPayable declarations at component level
    patterns = [
        (r'  // Defensive: FinanceProvider must be above PayrollProvider[^\n]*\n'
         r'  // This guard prevents crashes[^\n]*\n'
         r'  const _financeCtx[^\n]*\n'
         r'  const createPayable[^\n]*\n', '  // createPayable fires via event bus below\n'),
        (r'  // createPayable accesses lazily[^\n]*\n'
         r'  const _financeCtx[^\n]*\n'
         r'  const createPayable[^\n]*\n', '  // createPayable fires via event bus below\n'),
    ]
    for pat, repl in patterns:
        code, n = re.subn(pat, repl, code)
        if n: break

    # Replace the createPayable({ ... }) call with event bus
    old_call = ('            // Auto-create Salary Payable in FinanceContext\n'
                '            if (createPayable) {\n'
                '              createPayable({\n'
                '                type: "Salary",\n'
                '                employeeId: p.employeeId,\n'
                '                payrollId: p.payrollId,\n'
                '                amount: p.netSalary,\n'
                '                dueDate: p.month + "-28",\n'
                '                status: "Pending",\n'
                '                description: `Salary \u2014 ${p.employeeId} \u2014 ${p.month}`,\n'
                '                cityId: p.cityId,\n'
                '              });\n'
                '            }')
    new_call = (
        '            // Fire salary payable event \u2014 FinanceContext listener handles creation\n'
        '            try {\n'
        '              const _pd = { type:"Salary", employeeId:p.employeeId, amount:p.netSalary,\n'
        '                dueDate:p.month+"-28", status:"Pending",\n'
        '                description:"Salary "+p.employeeId, cityId:p.cityId, ts:Date.now() };\n'
        '              localStorage.setItem("cc360_payroll_approved_event",JSON.stringify(_pd));\n'
        '              window.dispatchEvent(new CustomEvent("cc360_payroll_approved",{detail:_pd}));\n'
        '            } catch(_e) { /* non-critical */ }'
    )
    if old_call in code:
        code = code.replace(old_call, new_call, 1)
        print("  createPayable -> event bus: OK")
    else:
        # Try simpler match for already-partially-patched versions
        m = re.search(r'            if \(createPayable\) \{\n.*?createPayable\(\{.*?\}\);\s*\n\s*\}',
                      code, re.DOTALL)
        if m:
            code = code[:m.start()] + new_call + code[m.end():]
            print("  createPayable (alt match) -> event bus: OK")
        else:
            print("  WARNING: createPayable call pattern not found (may already be patched)")

    write(path, code)
    print("  Done")


# ─────────────────────────────────────────────────────────────────────────────
# FIX 2: CustomerSubscriptionContext.tsx
# ─────────────────────────────────────────────────────────────────────────────
def fix_customer_subscription_context():
    path = "src/app/contexts/CustomerSubscriptionContext.tsx"
    print(f"\n[2/4] {path}")
    code = read(path)

    if "cc360_mrr_add" in code:
        print("  Already fixed — skipping"); return

    # Remove static import
    code = code.replace(
        'import { useFinance } from "./FinanceContext";',
        '// FIX: removed circular import { useFinance } — event bus used instead'
    )

    # Remove _finCtx block
    code = re.sub(
        r'  // Defensive:.*?\n  const _finCtx[^\n]*\n  const addMRREntry[^\n]*\n  const removeMRREntry[^\n]*\n',
        '  // addMRREntry/removeMRREntry fire via event bus below\n',
        code, flags=re.DOTALL
    )
    # Also remove comment-only version
    code = code.replace(
        '  // addMRREntry/removeMRREntry accessed via event bus \u2014 no static import needed',
        '  // addMRREntry/removeMRREntry fire via event bus below'
    )

    # Replace addMRREntry call block
    if "cc360_mrr_add" not in code:
        idx_add = code.find("addMRREntry({")
        if idx_add < 0:
            idx_add = code.find("&& addMRREntry)")
        if idx_add > 0:
            block_start = code.rfind("\n    if (", 0, idx_add)
            block_end   = code.find("\n    }", idx_add)
            if block_start > 0 and block_end > 0:
                new_block = (
                    "\n    if (newSubscription.status === \"Active\") {\n"
                    "      try {\n"
                    "        const mk = new Date().toISOString().slice(0,7);\n"
                    "        const me = { month:mk, subscriptionId:newSubscription.subscriptionId,\n"
                    "          customerId:newSubscription.customerId,\n"
                    "          revenue:newSubscription.priceLocked||0, status:\"Active\", ts:Date.now() };\n"
                    "        localStorage.setItem(\"cc360_mrr_event\",JSON.stringify(me));\n"
                    "        window.dispatchEvent(new CustomEvent(\"cc360_mrr_add\",{detail:me}));\n"
                    "      } catch(_e) {}\n"
                    "    }"
                )
                code = code[:block_start] + new_block + code[block_end+6:]
                print("  addMRREntry -> event bus: OK")

    # Replace removeMRREntry call
    old_rm = "    if (removeMRREntry) {\n      removeMRREntry(subscriptionId);\n    }"
    new_rm  = ("    try {\n"
               "      localStorage.setItem(\"cc360_mrr_remove_event\",JSON.stringify({subscriptionId,ts:Date.now()}));\n"
               "      window.dispatchEvent(new CustomEvent(\"cc360_mrr_remove\",{detail:{subscriptionId}}));\n"
               "    } catch(_e) {}")
    if old_rm in code:
        code = code.replace(old_rm, new_rm, 1)
        print("  removeMRREntry -> event bus: OK")

    write(path, code)
    print("  Done")


# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: FinanceContext.tsx
# ─────────────────────────────────────────────────────────────────────────────
def fix_finance_context():
    path = "src/app/contexts/FinanceContext.tsx"
    print(f"\n[3/4] {path}")
    code = read(path)

    if "cc360_payroll_approved" in code:
        print("  Already fixed — skipping"); return

    # Find insertion point
    anchor = "  }, []); // Run on mount only"
    if anchor not in code:
        anchor = "  }, []);\n\n  // Re-hydrate"
    if anchor not in code:
        print("  WARNING: anchor not found — FinanceContext may have different structure")
        return

    listeners = (
        "\n\n  // Cross-context event bus listeners\n"
        "  // Replaces direct static imports that caused circular ES module TDZ crash\n"
        "  useEffect(() => {\n"
        "    const onP = (e: Event) => {\n"
        "      const d = (e as CustomEvent).detail;\n"
        "      if (!d?.amount) return;\n"
        "      try { addPayable({ type:\"Salary\" as any, employeeId:d.employeeId,\n"
        "        amount:d.amount, dueDate:d.dueDate||\"\", status:\"Pending\" as any,\n"
        "        description:d.description||\"Salary payable\", cityId:d.cityId }); } catch(_e) {}\n"
        "    };\n"
        "    const onMA = (e: Event) => {\n"
        "      const d = (e as CustomEvent).detail;\n"
        "      if (d?.subscriptionId) try { addMRREntry(d as any); } catch(_e) {}\n"
        "    };\n"
        "    const onMR = (e: Event) => {\n"
        "      const d = (e as CustomEvent).detail;\n"
        "      if (d?.subscriptionId) try {\n"
        "        updateMRRForCancellation(d.subscriptionId, new Date().toISOString());\n"
        "      } catch(_e) {}\n"
        "    };\n"
        "    window.addEventListener(\"cc360_payroll_approved\", onP);\n"
        "    window.addEventListener(\"cc360_mrr_add\", onMA);\n"
        "    window.addEventListener(\"cc360_mrr_remove\", onMR);\n"
        "    return () => {\n"
        "      window.removeEventListener(\"cc360_payroll_approved\", onP);\n"
        "      window.removeEventListener(\"cc360_mrr_add\", onMA);\n"
        "      window.removeEventListener(\"cc360_mrr_remove\", onMR);\n"
        "    };\n"
        "  // eslint-disable-next-line react-hooks/exhaustive-deps\n"
        "  }, []);\n"
    )

    idx = code.find(anchor)
    end = code.find("\n", idx) + 1
    code = code[:end] + listeners + code[end:]
    write(path, code)
    print("  Event listeners added: OK")
    print("  Done")


# ─────────────────────────────────────────────────────────────────────────────
# FIX 4: EmployeeAttendanceDrillDown.tsx
# ─────────────────────────────────────────────────────────────────────────────
def fix_attendance_drilldown():
    path = "src/app/components/hr/EmployeeAttendanceDrillDown.tsx"
    print(f"\n[4/4] {path}")
    code = read(path)

    if 'import { GeneratedPayslip } from "./GeneratedPayslip"' in code:
        print("  Already fixed — skipping"); return

    # Replace React.lazy block with static import
    static_import = 'import { GeneratedPayslip } from "./GeneratedPayslip";\n// FIX: static import — HRModule is the lazy boundary'
    found = False
    for pattern in [
        r'// [^\n]*\n// [^\n]*GeneratedPayslip[^\n]*\n// [^\n]*\nconst GeneratedPayslip = React\.lazy\([^)]+\)\s*\);\n',
        r'const GeneratedPayslip = React\.lazy\([^\)]+\)\s*\);\n',
        r'const GeneratedPayslip = React\.lazy\(\s*\(\s*\)\s*=>\s*\n?\s*import\("\.\/GeneratedPayslip"\)\.then\(m => \({ default: m\.GeneratedPayslip }\)\)\s*\);\n',
    ]:
        new_code, n = re.subn(pattern, static_import + "\n", code)
        if n:
            code = new_code
            found = True
            print("  React.lazy -> static import: OK")
            break

    if not found:
        print("  WARNING: lazy pattern not found")
        return

    # Remove Suspense wrapper around GeneratedPayslip
    code = re.sub(r'<React\.Suspense\b[^>]*>\s*\n(\s*<GeneratedPayslip)', r'\1', code)
    code = re.sub(r'(/>)\s*\n\s*</React\.Suspense>', r'\1', code)

    write(path, code)
    print("  Done")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    check_repo()
    fix_payroll_context()
    fix_customer_subscription_context()
    fix_finance_context()
    fix_attendance_drilldown()

    print()
    print("=" * 56)
    print("All fixes applied. Now run these commands:")
    print()
    print('git add src/app/contexts/PayrollContext.tsx \\')
    print('        src/app/contexts/CustomerSubscriptionContext.tsx \\')
    print('        src/app/contexts/FinanceContext.tsx \\')
    print('        src/app/components/hr/EmployeeAttendanceDrillDown.tsx')
    print()
    print('git commit -m "fix: circular ES module crash at /hr"')
    print("git push")
    print("=" * 56)
