import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from gemini_service import parse_transaction

# Test with mock text (Requires API KEY to work properly, but we can verify imports at least)
print("gemini_service imported successfully.")
