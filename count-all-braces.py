#!/usr/bin/env python3
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract main script
script_start = content.find('<script>')
script_end = content.rfind('</script>')

if script_start == -1 or script_end == -1:
    print("❌ <script> tag not found")
    exit(1)

script = content[script_start + 8:script_end]
lines = script.split('\n')

print(f"📦 Script: {len(script)} chars, {len(lines)} lines\n")

# Count braces, brackets, parens
open_brace = 0
open_bracket = 0
open_paren = 0

# Track by line
for i, line in enumerate(lines, 1):
    # Simple counting (doesn't handle strings/comments perfectly)
    for char in line:
        if char == '{': open_brace += 1
        elif char == '}': open_brace -= 1
        elif char == '[': open_bracket += 1
        elif char == ']': open_bracket -= 1
        elif char == '(': open_paren += 1
        elif char == ')': open_paren -= 1
    
    # Report mismatches
    if open_brace < 0:
        print(f"⚠️  Line {i}: Too many closing braces {{ }}")
    if open_bracket < 0:
        print(f"⚠️  Line {i}: Too many closing brackets [ ]")
    if open_paren < 0:
        print(f"⚠️  Line {i}: Too many closing parens ( )")

print(f"\n📊 Final counts:")
print(f"   {{ }} : {open_brace} (should be 0)")
print(f"   [ ] : {open_bracket} (should be 0)")
print(f"   ( ) : {open_paren} (should be 0)")

if open_brace == 0 and open_bracket == 0 and open_paren == 0:
    print("\n✅ All brackets are balanced!")
else:
    print("\n❌ Bracket mismatch detected!")
