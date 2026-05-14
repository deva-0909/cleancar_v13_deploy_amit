"""
Fixes syntax corruption in all source files caused by GitHub web editor.
Patterns fixed:
  };))  → };
  };,   → };
  }),)  → })
  },,   → },
Run from repo root: python fix_syntax_corruption.py
"""
import glob, re

fixed_files = []
checked = 0

for path in glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True):
    try:
        with open(path, encoding='utf-8') as f:
            content = f.read()
        checked += 1

        original = content
        content = content.replace('};))', '};')
        content = content.replace('};,',  '};')
        content = content.replace(']),)', '])')
        content = content.replace('},,',  '},')

        if content != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed_files.append(path)
            print(f"  Fixed: {path}")
    except Exception as e:
        print(f"  Error {path}: {e}")

print(f"\nChecked {checked} files, fixed {len(fixed_files)}")
if fixed_files:
    print("\nNow run:")
    print("  git add -A")
    print('  git commit -m "fix: syntax corruption"')
    print("  git push")
