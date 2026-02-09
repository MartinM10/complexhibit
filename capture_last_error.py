import subprocess
import json

def run_lint():
    try:
        result = subprocess.run(['npm', 'run', 'lint'], capture_output=True, text=True, cwd='frontend')
        with open('lint_full_output.txt', 'w', encoding='utf-8') as f:
            f.write(result.stdout)
            f.write(result.stderr)
        print("Lint finished")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_lint()
