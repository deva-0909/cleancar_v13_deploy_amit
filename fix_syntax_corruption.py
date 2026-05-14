"""
Fixes the };)) syntax corruption in all context files.
The GitHub web editor corrupted useMemo/useCallback closing syntax.
Run from repo root: python fix_syntax_corruption.py
"""
import os, re, glob

fixed_files = []
checked = 0

# Search all .tsx and .ts files
for path in glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True):
    try:
        with open(path, encoding='utf-8') as f:
            content = f.read()
        
        checked += 1
        
        # The corruption pattern: };)) followed by a comment or newline
        # Should be: }; (just closing the object, not a useMemo)
        # OR: }) (closing a useMemo/useCallback without the extra semicolon)
        
        if '};))' not in content:
            continue
            
        # Count occurrences
        count = content.count('};))')
        
        # Fix: };)) → }; 
        # The object value was fine, the extra )) was added by the editor
        fixed = content.replace('};))', '};')
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        
        fixed_files.append((path, count))
        print(f"  Fixed {count}x in: {path}")
        
    except Exception as e:
        print(f"  Error reading {path}: {e}")

print()
print(f"Checked {checked} files, fixed {len(fixed_files)} files")
if fixed_files:
    print()
    print("Now run:")
    for path, _ in fixed_files:
        print(f"  git add {path}")
    print('  git commit -m "fix: syntax corruption from GitHub web editor"')
    print("  git push")
