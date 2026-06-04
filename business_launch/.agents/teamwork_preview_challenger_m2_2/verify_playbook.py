import re
import os

def verify_playbook():
    playbook_path = r"c:\_Projects\Gridpass-v4\business_launch\outreach_playbook.md"
    if not os.path.exists(playbook_path):
        print(f"Error: Playbook not found at {playbook_path}")
        return
        
    with open(playbook_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    lines = content.splitlines()
    
    print("=== VERIFYING PLAYBOOK INTERNALS ===")
    
    # 1. Extract Headers and verify TOC anchors
    headers = []
    for line_num, line in enumerate(lines, 1):
        if line.startswith("## "):
            headers.append((line_num, line[3:].strip()))
        elif line.startswith("### "):
            headers.append((line_num, line[4:].strip()))
            
    print(f"Found {len(headers)} headers.")
    
    # Generate expected anchors from headers (standard GitHub style)
    def slugify(text):
        slug = text.lower()
        slug = re.sub(r'[^a-z0-9\s&-]', '', slug)  # Keep letters, digits, spaces, ampersands, hyphens
        slug = slug.replace(' ', '-')
        # GitHub anchors keep ampersand but replace/remove some chars. 
        # Usually, ampersands are removed or kept. In standard markdown: '6.-playbook-operations-&-campaign-management'
        return slug

    slugs = {}
    for ln, h in headers:
        slug = slugify(h)
        slugs[slug] = (ln, h)
        
    # Find all Markdown internal links
    internal_links = re.findall(r'\[([^\]]+)\]\(#([^\)]+)\)', content)
    print(f"Found {len(internal_links)} internal anchors in TOC/body:")
    for text, anchor in internal_links:
        matched = False
        # Try direct match
        for s in slugs:
            if s == anchor or s.replace('&', '') == anchor or s.replace('&', '-') == anchor or anchor in s:
                matched = True
                break
        if not matched:
            print(f"  [!] Potential Broken Anchor: [ {text} ] -> #{anchor}")
        else:
            print(f"  [OK] Anchor: #{anchor}")
            
    # 2. Search for raw bracket placeholders like [Placeholder]
    # We ignore standard markdown links [text](url) and image blocks
    # A placeholder is usually [Word] or [Word / Word] or [Word, e.g. Word]
    placeholders = []
    # Find all brackets
    all_brackets = re.finditer(r'\[([^\]\n]+)\]', content)
    for m in all_brackets:
        token = m.group(1)
        start_char = m.start()
        # Find line number
        line_no = content[:start_char].count('\n') + 1
        
        # Exclude: markdown links, images, and slides layout blocks (Slide 1: [  [||||] GRIDPASS.APP  ])
        # If followed by '(' it's a markdown link
        if start_char + len(token) + 2 < len(content) and content[start_char + len(token) + 2] == '(':
            continue
        # If it's a standard table representation, e.g., | [★ VERIFIED BUILD] ...
        if "★" in token or "█" in token or "||||" in token or "Windshield Tag" in token:
            continue
        # If it is inside the Python code block
        # We can approximate this by checking if the line is inside code boundaries
        is_code = False
        in_block = False
        for i, l in enumerate(lines):
            if l.strip().startswith("```"):
                in_block = not in_block
            if i + 1 == line_no:
                is_code = in_block
                break
        if is_code:
            # We still want to see if the script contains placeholders
            placeholders.append((line_no, token, "Python Code"))
        else:
            placeholders.append((line_no, token, "Markdown Body"))
            
    print(f"\nFound {len(placeholders)} raw bracket placeholders:")
    for l_no, token, source in placeholders:
        print(f"  Line {l_no:3d} ({source}): [{token}]")
        
    # 3. Check for external and internal URLs
    urls = re.findall(r'https?://[^\s\)\]]+', content)
    print(f"\nFound {len(urls)} external/internal URLs:")
    for url in urls:
        print(f"  - {url}")

if __name__ == "__main__":
    verify_playbook()
