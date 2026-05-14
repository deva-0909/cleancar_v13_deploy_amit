"""
Comprehensive corruption fix - scans ALL source files.
Run from repo root: python fix_all_corruption.py
"""
import glob

fixed = []
for path in glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True):
    try:
        with open(path, encoding='utf-8') as f:
            orig = f.read()
        fixed_content = orig
        # All known corruption patterns from GitHub web editor
        fixed_content = fixed_content.replace('};))', '};')
        fixed_content = fixed_content.replace('};,',  '};')  
        fixed_content = fixed_content.replace('},,',  '},')
        fixed_content = fixed_content.replace(']),)', '])')
        fixed_content = fixed_content.replace('}),)', '})')
        # The most dangerous: useMemo with }; instead of })
        # Pattern: };\n  // eslint-disable-line react-hooks/exhaustive-deps
        import re
        # Fix useMemo/useCallback that got }; instead of })
        fixed_content = re.sub(
            r'\};\s*\n(\s*//\s*eslint-disable-line react-hooks/exhaustive-deps)',
            r'})\n\1',
            fixed_content
        )
        if fixed_content != orig:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            fixed.append(path)
            print(f"Fixed: {path}")
    except Exception as e:
        print(f"Error {path}: {e}")

print(f"\nFixed {len(fixed)} files")
if fixed:
    print("\ngit add -A")
    print('git commit -m "fix: all syntax corruption"')
    print("git push")
