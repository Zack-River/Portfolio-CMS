import re

with open('src/routes/content.routes.ts', 'r') as f:
    content = f.read()

# Extract delete route (lines 212-247 roughly)
delete_pattern = r"router\.delete\('/:model/:id', async \(req: any, res\) => \{.*?\n\}\);\n"
delete_match = re.search(delete_pattern, content, re.DOTALL)
delete_str = delete_match.group(0)

# Extract get route (lines 249-286 roughly)
get_pattern = r"router\.get\('/:model/:id', async \(req: any, res\) => \{.*?\n\}\);\n"
get_match = re.search(get_pattern, content, re.DOTALL)
get_str = get_match.group(0)

# Remove them from their original positions
content = content.replace(delete_str, "")
content = content.replace(get_str, "")

# Append them before export default router;
export_str = "export default router;"
content = content.replace(export_str, f"{delete_str}\n{get_str}\n{export_str}")

with open('src/routes/content.routes.ts', 'w') as f:
    f.write(content)
