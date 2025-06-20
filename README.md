# FreePath: Accessibility Map

> [!WARNING]
> This document is outdated and may not reflect the current state of the project.

If you have access to this, you know what this is for.  
This is our accessibility map **prototype** - we are not making a full product.  

This project is licensed under the **GNU Affero GPL V3.**

## Contributing
To contribute, please:
1. Use `git` to copy the **`devel` branch** - this is where any changes are made.
2. Make commits with sensible, short and concise messages.

## Running
Currently, there is no app to run, so this section will be left incomplete.  

## The Code
The **back-end** is written in Python. You will find the code in `.py` files. To run a single file, use `python file.py`.  
The **front-end** is written in HTML, CSS and JS. These are in `.html`, `.css` and `.js` files respectively. **Please do not use `.htm` for HTML.**  
The **configuration** is written in YAML. These are in `.yaml` files. Like HTML, **please do not use `.yml` for YAML.**

### Style Guide
When writing JS or Python:
- Use `snake_case` for variables and methods.
- Use `PascalCase` for classes and types.
- Use 4 spaces (not tabs) for indentation.
- If a statement is spanning multiple lines, add an additional indentation level.
    - For `if`, `for`, `while` or other similar statements, the additional lines should be one level more than the contents of the block.
- Do not try to cram lots of code into a small area.

Specifically in JS, please use semicolons after each not empty line that does **not** end with a `}` character.

In CSS:
- Use `long-case` for classes and variables.
- Please try not to use hard-coded colours - each colour should be a variable.
- Use 4 spaces for indentation.

In HTML:
- Give elements an ID in `long-case`. Only assign IDs if needed.
- Elements with no child nodes should be on one line.
    - If the element contains any elements within itsself, they should be on the next indentation level.
    - The element's tags should be on their own lines.
- Use 4 spaces for indentation.

In YAML:
- Use 2 spaces for indentation.
- Wrap any strings in quotes (`""`).
- If you are going to share or use the file as a template, add comments to describe configuration.
