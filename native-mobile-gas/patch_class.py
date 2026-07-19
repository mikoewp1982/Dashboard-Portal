import os
import re

directory = "app/src/main/java/com/satupintu/mobile/ui/viewmodel"

old_func = """    private fun normalizeClassName(value: String): String {
        return value
            .uppercase()
            .replace("KELAS", "")
            .replace("\\\\s".toRegex(), "")
            .trim()
    }"""

new_func = """    private fun normalizeClassName(value: String): String {
        var normalized = value.uppercase().replace("KELAS", "").trim()
        normalized = normalized.replace("VIII", "8")
        normalized = normalized.replace("VII", "7")
        normalized = normalized.replace("IX", "9")
        normalized = normalized.replace("III", "3")
        normalized = normalized.replace("II", "2")
        normalized = normalized.replace("IV", "4")
        normalized = normalized.replace("VI", "6")
        normalized = normalized.replace("V", "5")
        return normalized.replace("\\\\s".toRegex(), "").trim()
    }"""

for filename in os.listdir(directory):
    if filename.startswith("Teacher") and filename.endswith("ViewModel.kt"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if "normalizeClassName" in content:
            # We use a regex to replace the function body
            # because some files might have slightly different whitespace
            pattern = re.compile(r'private fun normalizeClassName\(value: String\): String \{[\s\S]*?\.trim\(\)\n\s*\}')
            
            content = pattern.sub(new_func, content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Patched {filename}")
