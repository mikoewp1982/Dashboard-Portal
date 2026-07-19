import os

directory = "app/src/main/java/com/satupintu/mobile/ui/viewmodel"

for filename in os.listdir(directory):
    if filename.startswith("Teacher") and filename.endswith("ViewModel.kt"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if r'"\s".toRegex()' in content:
            content = content.replace(r'"\s".toRegex()', r'"\\s".toRegex()')
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Patched {filename}")
