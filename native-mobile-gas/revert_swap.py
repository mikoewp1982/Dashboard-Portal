import sys

file_path = 'app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Current corrupted layout:
# lines[:922] (same)
# lines[922:1015] (Block B - student block - 93 lines)
# lines[1015] ('\n')
# lines[1016:1071] (Block A - teacher block - 55 lines)
# lines[1071:] (same)

block_b = lines[922:1015]
block_a = lines[1016:1071]
newline = [lines[1015]]

# The original was:
# lines[:922] + block_a + [original_line_977] + block_b + lines[1071:]
# Since my swap script inserted '\n', maybe the original_line_977 was lost?
# Wait, swap.py did:
# new_lines = lines[:teacher_start] + student_block + ['\n'] + teacher_block + lines[student_end:]
# This replaced everything from 922 to 1070 (inclusive) with a list of length 55 + 93 + 1 = 149 lines.
# And 1071 - 922 = 149 lines! So exactly the same length!
# And it DROPPED line 977 (because teacher_end is 977, student_start is 978. So line 977 was missing from the concatenation!).
# What was line 977 originally? Looking at LoginScreen.kt, probably just a blank line.
# Let's restore it with a blank line for line 977.

new_lines = lines[:922] + block_a + ['\n'] + block_b + lines[1071:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('File restored.')
