export const CS50P_WEEKS = [
  {
    week: 'Week 0',
    title: 'Functions & Variables',
    summary: 'str methods (.strip, .title, .lower, .replace), int, float, round, def, return.',
    problems: [
      { file: 'week0/indoor.py', label: 'indoor.py', starter: '# Week 0: Indoor Voice\n# Prompt the user and output their input in lowercase.\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week0/playback.py', label: 'playback.py', starter: '# Week 0: Playback Speed\n# Replace each space with "..."\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week0/faces.py', label: 'faces.py', starter: '# Week 0: Making Faces\n\ndef convert(text: str) -> str:\n    pass\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week0/einstein.py', label: 'einstein.py', starter: '# Week 0: Einstein (E = mc^2)\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week0/tip.py', label: 'tip.py', starter: 'def main():\n    dollars = dollars_to_float(input("How much was the meal? "))\n    percent = percent_to_float(input("What percentage would you like to tip? "))\n    tip = dollars * percent\n    print(f"Leave ${tip:.2f}")\n\n\ndef dollars_to_float(d):\n    # TODO\n    pass\n\n\ndef percent_to_float(p):\n    # TODO\n    pass\n\n\nmain()\n' }
    ]
  },
  {
    week: 'Week 1',
    title: 'Conditionals',
    summary: 'if / elif / else, match / case, boolean expressions, Modulo (%).',
    problems: [
      { file: 'week1/deep.py', label: 'deep.py', starter: '# Week 1: Deep Thought\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week1/bank.py', label: 'bank.py', starter: '# Week 1: Home Federal Savings Bank\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week1/extensions.py', label: 'extensions.py', starter: '# Week 1: File Extensions\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week1/interpreter.py', label: 'interpreter.py', starter: '# Week 1: Math Interpreter\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week1/meal.py', label: 'meal.py', starter: 'def main():\n    pass\n\n\ndef convert(time):\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' }
    ]
  },
  {
    week: 'Week 2',
    title: 'Loops',
    summary: 'while, for, range, list, dict, iterating over strings and dictionaries.',
    problems: [
      { file: 'week2/camel.py', label: 'camel.py', starter: '# Week 2: camelCase -> snake_case\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week2/coke.py', label: 'coke.py', starter: '# Week 2: Coke Machine\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week2/twttr.py', label: 'twttr.py', starter: '# Week 2: Just setting up my twttr\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week2/plates.py', label: 'plates.py', starter: 'def main():\n    plate = input("Plate: ")\n    if is_valid(plate):\n        print("Valid")\n    else:\n        print("Invalid")\n\n\ndef is_valid(s):\n    # TODO\n    pass\n\n\nmain()\n' },
      { file: 'week2/nutrition.py', label: 'nutrition.py', starter: '# Week 2: Nutrition Facts\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' }
    ]
  },
  {
    week: 'Week 3',
    title: 'Exceptions',
    summary: 'try / except, ValueError, ZeroDivisionError, KeyError, EOFError (Ctrl+D button).',
    problems: [
      { file: 'week3/fuel.py', label: 'fuel.py', starter: '# Week 3: Fuel Gauge\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week3/taqueria.py', label: 'taqueria.py', starter: '# Week 3: Felipe\'s Taqueria (Use "Send EOF (Ctrl+D)" button to finish input!)\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week3/grocery.py', label: 'grocery.py', starter: '# Week 3: Grocery List (Use "Send EOF (Ctrl+D)" button to finish input!)\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week3/outdated.py', label: 'outdated.py', starter: '# Week 3: Outdated\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' }
    ]
  },
  {
    week: 'Week 4',
    title: 'Libraries',
    summary: 'sys.argv, sys.exit, random, emoji, pyfiglet, inflect, requests (lab-safe API bridge).',
    problems: [
      { file: 'week4/emojize.py', label: 'emojize.py', starter: 'import emoji\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week4/figlet.py', label: 'figlet.py', starter: 'import sys\nfrom pyfiglet import Figlet\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week4/adieu.py', label: 'adieu.py', starter: 'import inflect\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week4/game.py', label: 'game.py', starter: 'import random\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week4/professor.py', label: 'professor.py', starter: 'import random\n\n\ndef main():\n    pass\n\n\ndef get_level():\n    pass\n\n\ndef generate_integer(level):\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week4/bitcoin.py', label: 'bitcoin.py', starter: 'import sys\nimport requests\n\n\ndef main():\n    # Pass n on CLI args bar or terminal: python bitcoin.py 2\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' }
    ]
  },
  {
    week: 'Week 5',
    title: 'Unit Tests',
    summary: 'assert, pytest, testing pure functions and pytest.raises(). Click "pytest" button to run!',
    problems: [
      { file: 'week5/test_twttr.py', label: 'test_twttr.py', starter: 'from twttr import shorten\n\n\ndef test_shorten():\n    pass\n' },
      { file: 'week5/test_bank.py', label: 'test_bank.py', starter: 'from bank import value\n\n\ndef test_value():\n    pass\n' },
      { file: 'week5/test_plates.py', label: 'test_plates.py', starter: 'from plates import is_valid\n\n\ndef test_plates():\n    pass\n' },
      { file: 'week5/test_fuel.py', label: 'test_fuel.py', starter: 'import pytest\nfrom fuel import convert, gauge\n\n\ndef test_convert():\n    pass\n' }
    ]
  },
  {
    week: 'Week 6',
    title: 'File I/O',
    summary: 'with open(), csv.reader, csv.DictReader, csv.DictWriter, tabulate, Pillow (PIL).',
    problems: [
      { file: 'week6_lines/lines.py', label: 'lines.py', starter: 'import sys\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week6_pizza/pizza.py', label: 'pizza.py', starter: 'import csv\nimport sys\nfrom tabulate import tabulate\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week6_scourgify/scourgify.py', label: 'scourgify.py', starter: 'import csv\nimport sys\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week6_shirt/shirt.py', label: 'shirt.py', starter: 'import os\nimport sys\nfrom PIL import Image, ImageOps\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' }
    ]
  },
  {
    week: 'Week 7',
    title: 'Regular Expressions',
    summary: 're.search, re.fullmatch, re.sub, capture groups, validators / validator-collection.',
    problems: [
      { file: 'week7/numb3rs.py', label: 'numb3rs.py', starter: 'import re\n\n\ndef main():\n    print(validate(input("IPv4 Address: ")))\n\n\ndef validate(ip):\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week7/watch.py', label: 'watch.py', starter: 'import re\n\n\ndef main():\n    print(parse(input("HTML: ")))\n\n\ndef parse(s):\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week7/working.py', label: 'working.py', starter: 'import re\n\n\ndef main():\n    print(convert(input("Hours: ")))\n\n\ndef convert(s):\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week7/um.py', label: 'um.py', starter: 'import re\n\n\ndef main():\n    print(count(input("Text: ")))\n\n\ndef count(s):\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week7/response.py', label: 'response.py', starter: 'import validators\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' }
    ]
  },
  {
    week: 'Week 8',
    title: 'Object-Oriented Programming',
    summary: 'class, __init__, @property, @classmethod, operator overloading (__add__), fpdf2.',
    problems: [
      { file: 'week8/seasons.py', label: 'seasons.py', starter: 'from datetime import date\nimport sys\nimport inflect\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'week8/jar.py', label: 'jar.py', starter: 'class Jar:\n    def __init__(self, capacity=12):\n        pass\n\n    def __str__(self):\n        pass\n\n    def deposit(self, n):\n        pass\n\n    def withdraw(self, n):\n        pass\n\n    @property\n    def capacity(self):\n        pass\n\n    @property\n    def size(self):\n        pass\n' },
      { file: 'week8_shirtificate/shirtificate.py', label: 'shirtificate.py', starter: 'from fpdf import FPDF\n\n\ndef main():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' }
    ]
  },
  {
    week: 'Week 9',
    title: 'Et Cetera & Final Project',
    summary: 'set, list/dict comprehensions, argparse, type hints, generators, CS50P Final Project.',
    problems: [
      { file: 'final_project/project.py', label: 'project.py', starter: '# CS50P Final Project\n# Must define main() plus at least 3 custom top-level functions.\n\ndef main():\n    pass\n\n\ndef helper_one():\n    pass\n\n\ndef helper_two():\n    pass\n\n\ndef helper_three():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n' },
      { file: 'final_project/test_project.py', label: 'test_project.py', starter: 'from project import helper_one, helper_two, helper_three\n\n\ndef test_helper_one():\n    pass\n\n\ndef test_helper_two():\n    pass\n\n\ndef test_helper_three():\n    pass\n' }
    ]
  }
];

export const OFFLINE_DOC_SECTIONS = [
  {
    title: 'Using the CS50P Terminal, CLI Arguments & Ctrl+D (Chromebook Safe)',
    keywords: 'terminal cli args sys.argv ctrl+d eof eoferror pytest chromebook',
    body: 'You can run any program in three ways: (1) Click Run or press Ctrl+Enter, (2) Put arguments in the top "args" box (for scripts using sys.argv), or (3) Type full commands directly in the bottom terminal like `python pizza.py sicilian.csv` or `pytest test_twttr.py`. For Week 3/4 programs expecting Ctrl+D (EOFError), click "Send EOF (Ctrl+D)" or press Ctrl+D while the terminal input is focused.',
    example: `$ cd week6_pizza\n$ python pizza.py sicilian.csv\n$ pytest test_pizza.py`
  },
  {
    title: 'Week 0–2: Strings, Formatting, Lists & Dictionaries',
    keywords: 'string strip lower upper title split replace f-string dict list loop',
    body: 'Core CS50P building blocks: clean user input with `.strip()`, normalize case with `.lower()` or `.title()`, format output with `f"{value:.2f}"`, and store structured records using `list` and `dict`.',
    example: `name = input("Name: ").strip().title()\nmenu = {"Taco": 3.00, "Burrito": 8.50}\nprint(f"Total: \${menu.get('Taco', 0):.2f}")`
  },
  {
    title: 'Week 3: Exceptions & Input Validation Loops',
    keywords: 'try except valueerror zerodivisionerror keyerror eoferror while true',
    body: 'Wrap risky conversions (`int()`, `float()`, dict lookups, `input()`) inside `try: ... except ...:` blocks inside a `while True:` loop. Break on `EOFError` when the user sends Ctrl+D.',
    example: `while True:\n    try:\n        item = input("Item: ").title()\n    except EOFError:\n        print()\n        break`
  },
  {
    title: 'Week 4: Libraries & Offline-Safe HTTP Requests',
    keywords: 'random emoji pyfiglet inflect cowsay requests json bitcoin sys.argv',
    body: 'All CS50P libraries (`emoji`, `pyfiglet`, `inflect`, `cowsay`, `requests`) are pre-installed locally. `requests.get(...)` works transparently inside locked-down school labs via the built-in Cloudflare Worker bridge.',
    example: `import requests, sys\nresp = requests.get("https://rest.coincap.io/v3/assets/bitcoin")\nprice = float(resp.json()["data"]["priceUsd"])\nprint(f"\${price:,.4f}")`
  },
  {
    title: 'Week 5: Unit Testing with pytest',
    keywords: 'pytest assert unit test raises test_ function',
    body: 'Name test files `test_*.py` and test functions `test_*()`. Click the "pytest" button in the top bar or run `pytest` in the terminal. Use `with pytest.raises(ValueError):` to test expected exceptions.',
    example: `import pytest\nfrom fuel import convert, gauge\n\ndef test_zero_division():\n    with pytest.raises(ZeroDivisionError):\n        convert("1/0")`
  },
  {
    title: 'Week 6: File I/O, CSV, Tabulate & Pillow (PIL)',
    keywords: 'open csv dictreader dictwriter tabulate pil pillow image imageops fit shirt',
    body: 'Click "Load CS50P Sample Assets" in the left Explorer to load `sicilian.csv`, `regular.csv`, `before.csv`, `shirt.png`, `before1.jpg`, and `before2.jpg`. Generated images appear in "Generated Files" and can be previewed or saved directly to your computer.',
    example: `from PIL import Image, ImageOps\nshirt = Image.open("shirt.png")\nphoto = ImageOps.fit(Image.open("before1.jpg"), shirt.size)\nphoto.paste(shirt, shirt)\nphoto.save("after1.jpg")`
  },
  {
    title: 'Week 7: Regular Expressions (re) & Validators',
    keywords: 're regex search fullmatch sub ignorecase validators email',
    body: 'Use raw strings `r"..."` for regex patterns. `re.fullmatch()` checks the whole string; `re.search()` searches anywhere unless anchored with `^` and `$`. Both `validators` and `validator_collection` are pre-installed.',
    example: `import re\nif match := re.search(r"^(\\d{1,2}):(\\d{2}) (AM|PM)$", s):\n    hour, minute, period = match.groups()`
  },
  {
    title: 'Week 8: Classes, @property, datetime & FPDF2 Shirtificate',
    keywords: 'class init property setter str fpdf pdf shirtificate datetime date',
    body: 'Click "Load CS50P Sample Assets" to get `week8_shirtificate/shirtificate.png`. After running your `shirtificate.py`, click `shirtificate.pdf` in the Project Files or Generated Files tab to preview the rendered PDF right inside the browser.',
    example: `from fpdf import FPDF\npdf = FPDF(orientation="P", unit="mm", format="A4")\npdf.add_page()\npdf.set_font("helvetica", "B", 45)\npdf.cell(0, 60, "CS50 Shirtificate", new_x="LMARGIN", new_y="NEXT", align="C")\npdf.image("shirtificate.png", x=10, y=70, w=190)\npdf.output("shirtificate.pdf")`
  },
  {
    title: 'Saving & Submitting Your Work',
    keywords: 'save download zip submit cs50 upload chromebook',
    body: 'Your work auto-saves continuously in browser storage, AND you can save any file straight to your Chromebook/PC with Ctrl+S ("Save .py") or download the entire workspace as a `.zip` with "Export .zip". You can also drag-and-drop local `.py`, `.csv`, or image files directly into the Project Files tree.'
  }
];
