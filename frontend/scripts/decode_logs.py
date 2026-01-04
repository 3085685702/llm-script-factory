import subprocess
import sys
import urllib.parse
import re
import os
import signal

def main():
    # Force color output for Next.js/Chalk
    env = os.environ.copy()
    env["FORCE_COLOR"] = "1"
    
    # regex to find percent encoded substrings (at least 2 chars, e.g. %E5)
    # simple approach: unquote the whole line
    
    cmd = ["npm", "run", "dev"]
    
    # Use Popen to capture output
    # We want to keep stdout/stderr flowing
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env,
        bufsize=1,
        universal_newlines=True,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Run in frontend root
    )

    def signal_handler(sig, frame):
        process.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        if process.stdout:
            for line in process.stdout:
                # Decode line
                decoded = urllib.parse.unquote(line)
                sys.stdout.write(decoded)
                sys.stdout.flush()
        
        process.wait()
    except KeyboardInterrupt:
        process.terminate()
    except Exception as e:
        print(f"Error: {e}")
        process.terminate()

if __name__ == "__main__":
    main()
