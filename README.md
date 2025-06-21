# 🗺️ FreePath: Accessibility Map

If you have access to this, you know what this is for.  
This is our accessibility map **prototype** - we are not making a full product.  

This project is licensed under the **GNU Affero GPL V3.** See the license for details.

## Contributing
To contribute, please:
1. Use `git` to copy the **`devel` branch** - this is where any changes are made.
2. Make commits with sensible, short and concise messages.

## Running
### 1. Configure the Data Path
By default, the data path is in `./data` but you can set it with the `DFP_DATA` environment variable. In the data path you only need one file: `cfg.yaml`.  
The configuration file is simple with only a few fields:
- The dictionary `server`, under which the `port` field is  
- The optional boolean `make_garbage`, which if `true` will run a garbage data generator before serving  
- An optional string `database_path` which allows you to control where the database file is stored, defaults to `{DATA_PATH}/data.db`  
For example, to serve on port `11210`, store the database in `/mnt/external/data.db` and generate test data on launch:
```yaml
server:
  port: 11210
database_path: "/mnt/external/data.db"
make_garbage: true
```

### 2. Install Dependencies
#### 2.1. Install Python
Since the back-end is written in Python, you need Python! This project is built around **Python 3.13** - but any post-3.12 version should work.  

**Install Examples**  
**Windows:** Download the installer and run it.  
**`apt`-based Linux (e.g. Ubuntu, Debian):** `sudo apt install python`  
**`dnf`-based Linux (e.g. Fedora, RHEL):** `sudo dnf install python`
**Linux Hard Mode:** *(in extracted source)* `./configure --enable-optimizations --prefix=/usr/local; make; sudo make altinstall`  

#### 2.2. Install Python Packages
Using `pip`, install `quart`, `PyYaml` and `SqliteDict`. These are the only third-party libraries we use (along with their dependencies) - if your python install includes all the standard libraries this is sufficient.

### 3. Start the App
To start from the root of the repository:
```bash
python ./src/main.py
```
Alternatively, to specify the data path, set the `DFP_DATA` first:
```bash
export DFP_DATA=/mnt/external/data
python ./src/main.py
```

**These steps should work on any platform, however this project has only been tested on these platforms:**
- Arch Linux, Python 3.13.3 and Python 3.13.5 *(from source)*
- Debian Linux, Python 3.13.1 and Python 3.13.5 *(from source)*
- Fedora Linux, Python 3.13.3 *(from `dnf install python`)*

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
