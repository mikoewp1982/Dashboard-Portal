import sys
file_path = 'app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

teacher_start = 922 # index 922 is line 923
teacher_end = 977 # line 977 is index 976, so slice is 922:977
student_start = 978 # line 979 is index 978
student_end = 1071 # line 1071 is index 1071

teacher_block = lines[teacher_start:teacher_end]
student_block = lines[student_start:student_end]

# Swapping them
new_lines = lines[:teacher_start] + student_block + ['\n'] + teacher_block + lines[student_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('File modified.')
