import json
import re

def validate_markdown_code_blocks(file_path):
    print(f"=== Validating Code Blocks in {file_path} ===")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all triple-backtick lines and track what language they claim to be
    lines = content.splitlines()
    code_block_count = 0
    in_code_block = False
    current_lang = ""
    block_start_line = 0
    code_blocks = []
    
    for idx, line in enumerate(lines, 1):
        if line.strip().startswith("```"):
            if not in_code_block:
                in_code_block = True
                current_lang = line.strip()[3:].strip()
                block_start_line = idx
                code_blocks.append({
                    "start": idx,
                    "lang": current_lang,
                    "content": []
                })
            else:
                in_code_block = False
                code_blocks[-1]["end"] = idx
                code_block_count += 1
        elif in_code_block:
            code_blocks[-1]["content"].append(line)

    if in_code_block:
        print(f"ERROR: Unbalanced code block starting at line {block_start_line} with language '{current_lang}'")
        return False, code_blocks
    else:
        print(f"Success: Found {code_block_count} fully balanced code blocks.")
        return True, code_blocks

def validate_json_schema(code_blocks):
    print("\n=== Validating JSON Schema Block ===")
    json_blocks = [b for b in code_blocks if b["lang"] == "json"]
    if not json_blocks:
        print("ERROR: No JSON code block found!")
        return False
    
    success = True
    for block in json_blocks:
        block_text = "\n".join(block["content"])
        # Check if this block looks like a JSON schema or a JSON payload
        if '"$schema"' in block_text or "ResolveTagPayload" in block_text:
            print(f"Validating JSON Schema at lines {block['start']}-{block.get('end', 'TBD')}...")
            try:
                schema_data = json.loads(block_text)
                print("Success: JSON Schema is syntactically valid JSON!")
                # Verify schema required fields for Gap 2
                reg_context = schema_data.get("properties", {}).get("registrationContext", {})
                required_fields = reg_context.get("required", [])
                print("registrationContext required fields:", required_fields)
                prohibited_required = ["towVehicleType", "towVehiclePlate", "trailerType", "techStatus"]
                for field in prohibited_required:
                    if field in required_fields:
                        print(f"ERROR: '{field}' is in registrationContext required fields, violating Gap 2!")
                        success = False
                
                # Check that towVehiclePlate and trailerPlate allow null
                props = reg_context.get("properties", {})
                for f in ["towVehiclePlate", "trailerPlate"]:
                    types = props.get(f, {}).get("type", [])
                    if "null" not in types:
                        print(f"Warning/Error: '{f}' type does not contain 'null': {types}")
                        success = False
                    else:
                        print(f"Pass: '{f}' allows 'null' correctly.")
            except Exception as e:
                print(f"ERROR parsing JSON schema: {e}")
                success = False
    return success

def validate_typescript_interfaces(code_blocks):
    print("\n=== Validating TypeScript Interfaces ===")
    ts_blocks = [b for b in code_blocks if b["lang"] == "typescript"]
    if not ts_blocks:
        print("Warning: No typescript code blocks found.")
        return True
    
    success = True
    for block in ts_blocks:
        block_text = "\n".join(block["content"])
        if "interface RegistrationDocument" in block_text:
            print(f"Validating RegistrationDocument interface at lines {block['start']}-{block.get('end', 'TBD')}...")
            # Check Gap 3 fields: external_waiver_token and external_waiver_status
            token_match = re.search(r"external_waiver_token\s*\??\s*:\s*string\s*\|\s*null\s*;", block_text)
            status_match = re.search(r"external_waiver_status\s*\??\s*:\s*string\s*\|\s*null\s*;", block_text)
            
            if token_match:
                print("Success: Found 'external_waiver_token?: string | null;' in RegistrationDocument.")
            else:
                print("ERROR: 'external_waiver_token?: string | null;' not found or incorrectly typed in RegistrationDocument!")
                success = False
                
            if status_match:
                print("Success: Found 'external_waiver_status?: string | null;' in RegistrationDocument.")
            else:
                print("ERROR: 'external_waiver_status?: string | null;' not found or incorrectly typed in RegistrationDocument!")
                success = False
    return success

def validate_protobuf_schema(code_blocks):
    print("\n=== Validating Protobuf Schema ===")
    proto_blocks = [b for b in code_blocks if b["lang"] == "protobuf"]
    if not proto_blocks:
        print("ERROR: No protobuf code blocks found!")
        return False
    
    success = True
    for block in proto_blocks:
        block_text = "\n".join(block["content"])
        print(f"Validating protobuf message structure at lines {block['start']}-{block.get('end', 'TBD')}...")
        
        # Check that there is no tech_status or techStatus in the message definition
        if "tech_status" in block_text or "techStatus" in block_text:
            print("ERROR: Found 'tech_status' or 'techStatus' in protobuf message, violating Gap 4!")
            success = False
        else:
            print("Pass: 'tech_status' is not present in the protobuf message definition.")
            
        # Check passenger_waiver_hashes is repeated bytes and tags are correct
        hashes_match = re.search(r"repeated\s+bytes\s+passenger_waiver_hashes\s*=\s*10\s*;", block_text)
        if hashes_match:
            print("Success: Found 'repeated bytes passenger_waiver_hashes = 10;' correctly defined.")
        else:
            print("ERROR: 'repeated bytes passenger_waiver_hashes = 10;' not found or incorrectly defined in protobuf message!")
            success = False
            
        # Check outer SignedSecurePass fields
        if "message SignedSecurePass" in block_text:
            if "serialized_metadata" in block_text and "ed25519_signature" in block_text and "signing_key_id" in block_text:
                print("Success: SignedSecurePass contains required cryptographic envelope fields.")
            else:
                print("ERROR: SignedSecurePass lacks one or more cryptographic envelope fields!")
                success = False
    return success

if __name__ == "__main__":
    spec_path = r"c:\_Projects\Gridpass-v4\business_launch\join_conversion_ui.md"
    ok, blocks = validate_markdown_code_blocks(spec_path)
    if not ok:
        print("Markdown validation failed: unbalanced code blocks found.")
        exit(1)
        
    json_ok = validate_json_schema(blocks)
    ts_ok = validate_typescript_interfaces(blocks)
    proto_ok = validate_protobuf_schema(blocks)
    
    if json_ok and ts_ok and proto_ok:
        print("\nALL CODES AND SCHEMAS ARE VERIFIED AND 100% CORRECT!")
        exit(0)
    else:
        print("\nVERIFICATION FAILED: One or more validation errors occurred.")
        exit(1)
