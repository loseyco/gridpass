import json
import re

def verify_markdown_schemas(filepath):
    print(f"Reading file: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find JSON blocks
    json_blocks = re.findall(r'```json\s*(.*?)\s*```', content, re.DOTALL)
    print(f"Found {len(json_blocks)} JSON blocks.")
    
    for i, block in enumerate(json_blocks, 1):
        try:
            parsed = json.loads(block)
            print(f"JSON block {i} is VALID. Keys: {list(parsed.keys())}")
        except json.JSONDecodeError as e:
            print(f"JSON block {i} is INVALID: {e}")
            print(block)
            return False

    # Check protobuf syntax basic check
    proto_blocks = re.findall(r'```protobuf\s*(.*?)\s*```', content, re.DOTALL)
    print(f"Found {len(proto_blocks)} protobuf blocks.")
    for i, block in enumerate(proto_blocks, 1):
        # basic syntax checks: balance of braces
        open_braces = block.count('{')
        close_braces = block.count('}')
        if open_braces != close_braces:
            print(f"Protobuf block {i} has unbalanced braces: {open_braces} open vs {close_braces} close.")
            return False
        else:
            print(f"Protobuf block {i} has balanced braces: {open_braces} pairs.")

    print("All syntax checks PASSED!")
    return True

if __name__ == '__main__':
    verify_markdown_schemas(r"c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md")
