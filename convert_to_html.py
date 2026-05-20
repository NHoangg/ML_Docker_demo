import re
import sys
from pathlib import Path

# Beautiful modern style sheet with copy button support
STYLE = """
<style>
    :root {
        --bg-color: #f8fafc;
        --text-color: #1e293b;
        --primary-color: #0f172a;
        --accent-color: #2563eb;
        --border-color: #e2e8f0;
        --code-bg: #0f172a;
        --code-text: #f8fafc;
        --callout-bg: #eff6ff;
        --callout-border: #3b82f6;
        --math-bg: #f8fafc;
        --math-border: #10b981;
    }

    body {
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: var(--bg-color);
        margin: 0;
        padding: 40px 20px;
    }

    .container {
        max-width: 900px;
        margin: 0 auto;
        background: #ffffff;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
    }

    h1, h2, h3, h4 {
        color: var(--primary-color);
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 1rem;
    }

    h1 {
        font-size: 2.25rem;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 0.5rem;
        margin-top: 0;
    }

    h2 {
        font-size: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.25rem;
    }

    h3 {
        font-size: 1.25rem;
    }

    p {
        margin-top: 0;
        margin-bottom: 1.5rem;
    }

    /* Command and Code Boxes with relative positioning for copy button */
    pre {
        position: relative;
        background-color: var(--code-bg);
        color: var(--code-text);
        padding: 18px 16px 16px 16px;
        border-radius: 8px;
        overflow-x: auto;
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        font-size: 0.9rem;
        margin: 1.5rem 0;
        border: 1px solid #1e293b;
        box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06);
    }

    code {
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        font-size: 0.9rem;
        background-color: #f1f5f9;
        color: #0f172a;
        padding: 2px 6px;
        border-radius: 4px;
    }

    pre code {
        background-color: transparent;
        color: inherit;
        padding: 0;
        border-radius: 0;
    }

    /* Math Formula Boxes */
    .math-box {
        background-color: var(--math-bg);
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--math-border);
        padding: 16px;
        margin: 1.5rem 0;
        border-radius: 4px;
        display: block;
        overflow-x: auto;
        text-align: center;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    /* Callout Box */
    .callout {
        background-color: var(--callout-bg);
        border-left: 4px solid var(--callout-border);
        padding: 16px;
        margin: 1.5rem 0;
        border-radius: 0 8px 8px 0;
    }

    .callout p:last-child {
        margin-bottom: 0;
    }

    /* Table Styles */
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.95rem;
    }

    th, td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }

    th {
        background-color: #f8fafc;
        color: var(--primary-color);
        font-weight: 600;
    }

    tr:hover {
        background-color: #f8fafc;
    }

    /* Lists */
    ul, ol {
        margin-top: 0;
        margin-bottom: 1.5rem;
        padding-left: 2rem;
    }

    li {
        margin-bottom: 0.5rem;
    }

    /* Copy Button Styling */
    .copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: rgba(248, 250, 252, 0.15);
        color: #cbd5e1;
        border: 1px solid rgba(248, 250, 252, 0.25);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        outline: none;
    }

    .copy-btn:hover {
        background-color: rgba(248, 250, 252, 0.25);
        color: #ffffff;
        border-color: rgba(248, 250, 252, 0.4);
    }

    .copy-btn.copied {
        background-color: #10b981;
        color: #ffffff;
        border-color: #10b981;
    }
</style>
"""


def parse_markdown_to_html(md_text: str) -> str:
    # 1. Parse code blocks
    def repl_code(match):
        code_content = match.group(1).replace("<", "&lt;").replace(">", "&gt;")
        return f'<pre><code>{code_content}</code></pre>'
    md_text = re.sub(r'```(?:[a-zA-Z0-9]+)?\n(.*?)```', repl_code, md_text, flags=re.DOTALL)

    # 2. Parse inline code
    md_text = re.sub(r'`([^`]+)`', r'<code>\1</code>', md_text)

    # 3. Parse Math equations $$ equation $$ (Wrap in standard MathJax Block)
    md_text = re.sub(r'\$\$(.*?)\$\$', r'<div class="math-box">$$\1$$</div>', md_text)
    # Inline math $equation$ (MathJax format)
    md_text = re.sub(r'\$([^\$]+)\$', r' \(\1\) ', md_text)

    # 4. Parse headers
    md_text = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', md_text, flags=re.M)
    md_text = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', md_text, flags=re.M)
    md_text = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', md_text, flags=re.M)

    # 5. Parse bold text
    md_text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', md_text)

    # 6. Parse Callouts (lines starting with >)
    def repl_quote(match):
        content = match.group(0)
        lines = [line.lstrip("> ").strip() for line in content.split("\n")]
        cleaned = "<br>".join([l for l in lines if l])
        cleaned = re.sub(r'^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]', r'<strong>\1:</strong>', cleaned)
        return f'<div class="callout"><p>{cleaned}</p></div>'
    
    md_text = re.sub(r'(?:^>.*$\n?)+', repl_quote, md_text, flags=re.M)

    # 7. Parse Tables
    lines = md_text.split("\n")
    in_table = False
    table_lines = []
    output_lines = []

    for line in lines:
        if line.strip().startswith("|"):
            in_table = True
            table_lines.append(line)
        else:
            if in_table:
                html_table = parse_html_table(table_lines)
                output_lines.append(html_table)
                table_lines = []
                in_table = False
            output_lines.append(line)
            
    if in_table:
        output_lines.append(parse_html_table(table_lines))
        
    md_text = "\n".join(output_lines)

    # 8. Clean up lists
    md_text = re.sub(r'^\s*-\s+(.*?)$', r'<li>\1</li>', md_text, flags=re.M)
    md_text = re.sub(r'^\s*\*\s+(.*?)$', r'<li>\1</li>', md_text, flags=re.M)
    
    def wrap_lis(match):
        return f'<ul>\n{match.group(0)}\n</ul>'
    md_text = re.sub(r'(?:<li>.*?</li>\n?)+', wrap_lis, md_text)

    # Convert newlines to paragraphs (except inside html blocks)
    paragraphs = []
    lines = md_text.split("\n\n")
    for para in lines:
        stripped = para.strip()
        if not stripped:
            continue
        if stripped.startswith("<h") or stripped.startswith("<pre") or stripped.startswith("<div") or stripped.startswith("<table") or stripped.startswith("<ul") or stripped.endswith(">"):
            paragraphs.append(stripped)
        else:
            formatted = stripped.replace("\n", "<br>")
            paragraphs.append(f"<p>{formatted}</p>")

    return "\n".join(paragraphs)


def parse_html_table(table_lines: list[str]) -> str:
    rows = []
    for line in table_lines:
        if re.match(r'^\s*\|\s*[-:]+\s*\|', line):
            continue
        cells = [c.strip() for c in line.split("|")[1:-1]]
        rows.append(cells)

    if not rows:
        return ""

    html = ["<table>"]
    html.append("  <thead>")
    html.append("    <tr>")
    for cell in rows[0]:
        html.append(f"      <th>{cell}</th>")
    html.append("    </tr>")
    html.append("  </thead>")
    
    html.append("  <tbody>")
    for row in rows[1:]:
        html.append("    <tr>")
        for cell in row:
            html.append(f"      <td>{cell}</td>")
        html.append("    </tr>")
    html.append("  </tbody>")
    html.append("</table>")
    return "\n".join(html)


def convert_file(src_path: Path, dest_path: Path, title: str):
    print(f"Converting {src_path} -> {dest_path}")
    with open(src_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    html_body = parse_markdown_to_html(md_content)

    html_page = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fira+Code&display=swap" rel="stylesheet">
    <!-- MathJax for rendering LaTeX formulas -->
    <script>
        window.MathJax = {{
            tex: {{
                inlineMath: [['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$']],
                processEscapes: true
            }},
            svg: {{
                fontCache: 'global'
            }}
        }};
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    {STYLE}
</head>
<body>
    <div class="container">
        {html_body}
    </div>

    <!-- Script to add Copy Buttons to all <pre> elements -->
    <script>
        document.querySelectorAll('pre').forEach((preElement) => {{
            // Create copy button
            const button = document.createElement('button');
            button.className = 'copy-btn';
            button.innerText = 'Copy';
            
            // Append button to pre
            preElement.appendChild(button);
            
            // Add click listener
            button.addEventListener('click', async () => {{
                const codeElement = preElement.querySelector('code');
                const text = codeElement ? codeElement.innerText : preElement.innerText;
                
                try {{
                    await navigator.clipboard.writeText(text);
                    button.innerText = 'Copied!';
                    button.classList.add('copied');
                    
                    // Reset button text after 2 seconds
                    setTimeout(() => {{
                        button.innerText = 'Copy';
                        button.classList.remove('copied');
                    }}, 2000);
                }} catch (err) {{
                    console.error('Failed to copy: ', err);
                }}
            }});
        }});
    </script>
</body>
</html>
"""
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(html_page)


if __name__ == "__main__":
    workspace = Path(".")
    
    demo_md = workspace / "DEMO.md"
    demo_html = workspace / "DEMO.html"
    if demo_md.exists():
        convert_file(demo_md, demo_html, "Dự án ML Bán Lẻ - Kịch bản Demo")

    report_md = workspace / "REPORT.md"
    report_html = workspace / "REPORT.html"
    if report_md.exists():
        convert_file(report_md, report_html, "Dự án ML Bán Lẻ - Báo cáo cải tiến")

    print("Success! HTML versions generated with MathJax and Copy buttons.")
