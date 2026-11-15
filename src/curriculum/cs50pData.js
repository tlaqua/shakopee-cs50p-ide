export const CS50P_WEEKS = [
  {
    week: 'Week 0',
    title: 'Functions & Variables',
    summary: 'str methods (.strip, .title, .lower, .replace), int, float, round, def, return.',
    problems: [
      {
        file: 'week0/indoor.py',
        label: 'indoor.py',
        starter: '# Week 0: Indoor Voice\n# Prompt the user for input and output it in lowercase.\n\ndef main():\n    text = input("Input: ")\n    # TODO: print text in lowercase\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week0/playback.py',
        label: 'playback.py',
        starter: '# Week 0: Playback Speed\n# Prompt the user for input and replace each space with "..."\n\ndef main():\n    text = input("Input: ")\n    # TODO: replace spaces with three periods\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week0/faces.py',
        label: 'faces.py',
        starter: '# Week 0: Making Faces\n# Convert ":)" to "🙂" and ":(" to "🙁".\n\ndef main():\n    text = input("Input: ")\n    # TODO: call convert(text) and print the result\n\n\ndef convert(text: str) -> str:\n    # TODO: replace ":)" and ":(" and return the updated string\n    return text\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week0/einstein.py',
        label: 'einstein.py',
        starter: '# Week 0: Einstein (E = mc^2)\n\ndef main():\n    m = int(input("m: "))\n    # TODO: compute E = m * (300000000 ** 2) and print E\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week0/tip.py',
        label: 'tip.py',
        starter: '# Week 0: Tip Calculator (Harvard official starter)\ndef main():\n    dollars = dollars_to_float(input("How much was the meal? "))\n    percent = percent_to_float(input("What percentage would you like to tip? "))\n    tip = dollars * percent\n    print(f"Leave ${tip:.2f}")\n\n\ndef dollars_to_float(d):\n    # TODO: remove leading "$" and return float (e.g. "$50.00" -> 50.0)\n    pass\n\n\ndef percent_to_float(p):\n    # TODO: remove trailing "%" and return float (e.g. "15%" -> 0.15)\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 1',
    title: 'Conditionals',
    summary: 'if / elif / else, match / case, boolean expressions, modulo (%).',
    problems: [
      {
        file: 'week1/deep.py',
        label: 'deep.py',
        starter: '# Week 1: Deep Thought\n\ndef main():\n    answer = input("What is the Answer to the Great Question of Life, the Universe, and Everything? ")\n    # TODO: print "Yes" for 42, "forty-two", or "forty two" (case/whitespace-insensitive), else "No"\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week1/bank.py',
        label: 'bank.py',
        starter: '# Week 1: Home Federal Savings Bank\n\ndef main():\n    greeting = input("Greeting: ").strip().lower()\n    # TODO: print "$0" if starts with "hello", "$20" if starts with "h", else "$100"\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week1/extensions.py',
        label: 'extensions.py',
        starter: '# Week 1: File Extensions\n\ndef main():\n    filename = input("File name: ").strip().lower()\n    # TODO: print the MIME media type based on the file extension\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week1/interpreter.py',
        label: 'interpreter.py',
        starter: '# Week 1: Math Interpreter\n\ndef main():\n    expression = input("Expression: ").strip()\n    x, y, z = expression.split(" ")\n    # TODO: convert x and z to floats, apply operator y (+, -, *, /), print formatted to 1 decimal\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week1/meal.py',
        label: 'meal.py',
        starter: '# Week 1: Meal Time\n\ndef main():\n    time = input("What time is it? ").strip()\n    hours = convert(time)\n    # TODO: print "breakfast time" (7-8), "lunch time" (12-13), or "dinner time" (18-19)\n\n\ndef convert(time):\n    # TODO: split "hours:minutes" and return float hours (e.g. "7:30" -> 7.5)\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 2',
    title: 'Loops',
    summary: 'while, for, range, list, dict, iterating over strings and dictionaries.',
    problems: [
      {
        file: 'week2/camel.py',
        label: 'camel.py',
        starter: '# Week 2: camelCase\n\ndef main():\n    camel = input("camelCase: ")\n    # TODO: convert camelCase string to snake_case and print it\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week2/coke.py',
        label: 'coke.py',
        starter: '# Week 2: Coke Machine\n\ndef main():\n    amount_due = 50\n    while amount_due > 0:\n        print(f"Amount Due: {amount_due}")\n        coin = int(input("Insert Coin: "))\n        # TODO: subtract coin if coin is 25, 10, or 5\n    # TODO: print f"Change Owed: {abs(amount_due)}"\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week2/twttr.py',
        label: 'twttr.py',
        starter: '# Week 2: Just setting up my twttr\n\ndef main():\n    text = input("Input: ")\n    # TODO: remove vowels (a, e, i, o, u, upper & lower) and print output\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week2/plates.py',
        label: 'plates.py',
        starter: '# Week 2: Vanity Plates (Harvard official starter)\ndef main():\n    plate = input("Plate: ")\n    if is_valid(plate):\n        print("Valid")\n    else:\n        print("Invalid")\n\n\ndef is_valid(s):\n    # TODO: enforce length 2-6, start with 2 letters, no middle numbers,\n    #       first number != "0", and no punctuation/spaces\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week2/nutrition.py',
        label: 'nutrition.py',
        starter: '# Week 2: Nutrition Facts\n\ndef main():\n    fruits = {\n        # TODO: add FDA fruit calorie entries (lowercase keys)\n    }\n    item = input("Item: ").strip().lower()\n    # TODO: if item is in fruits, print f"Calories: {fruits[item]}"\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 3',
    title: 'Exceptions',
    summary: 'try / except, ValueError, ZeroDivisionError, KeyError, EOFError (Ctrl+D button).',
    problems: [
      {
        file: 'week3/fuel.py',
        label: 'fuel.py',
        starter: '# Week 3: Fuel Gauge\n\ndef main():\n    while True:\n        fraction = input("Fraction: ")\n        try:\n            # TODO: split fraction on "/", convert X and Y to int, validate X <= Y and Y > 0\n            break\n        except (ValueError, ZeroDivisionError):\n            pass\n    # TODO: print "E" (<=1%), "F" (>=99%), or rounded "<percent>%"\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week3/taqueria.py',
        label: 'taqueria.py',
        starter: '# Week 3: Felipe\'s Taqueria\n# Click "Send EOF (Ctrl+D)" in Terminal to finish ordering.\n\ndef main():\n    menu = {\n        "Baja Taco": 4.25,\n        "Burrito": 7.50,\n        "Bowl": 8.50,\n        "Nachos": 11.00,\n        "Quesadilla": 8.50,\n        "Super Burrito": 8.50,\n        "Super Quesadilla": 9.50,\n        "Taco": 3.00,\n        "Tortilla Salad": 8.00,\n    }\n    total = 0.0\n    while True:\n        try:\n            item = input("Item: ").strip().title()\n            # TODO: add menu[item] to total if found and print f"Total: ${total:.2f}"\n        except EOFError:\n            print()\n            break\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week3/grocery.py',
        label: 'grocery.py',
        starter: '# Week 3: Grocery List\n# Click "Send EOF (Ctrl+D)" in Terminal when done adding items.\n\ndef main():\n    counts = {}\n    while True:\n        try:\n            item = input().strip().upper()\n            # TODO: increment counts[item]\n        except EOFError:\n            break\n    # TODO: print sorted items as "<COUNT> <ITEM>"\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week3/outdated.py',
        label: 'outdated.py',
        starter: '# Week 3: Outdated\n\ndef main():\n    months = [\n        "January", "February", "March", "April", "May", "June",\n        "July", "August", "September", "October", "November", "December"\n    ]\n    while True:\n        date_str = input("Date: ").strip()\n        try:\n            # TODO: parse "MM/DD/YYYY" or "Month DD, YYYY", validate 1<=month<=12 and 1<=day<=31\n            break\n        except ValueError:\n            pass\n    # TODO: print formatted as YYYY-MM-DD\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 4',
    title: 'Libraries',
    summary: 'sys.argv, sys.exit, random, emoji, pyfiglet, inflect, requests (lab-safe API bridge).',
    problems: [
      {
        file: 'week4/emojize.py',
        label: 'emojize.py',
        starter: 'import emoji\n\n\ndef main():\n    text = input("Input: ")\n    # TODO: print emoji.emojize(text, language="alias")\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week4/figlet.py',
        label: 'figlet.py',
        starter: 'import random\nimport sys\nfrom pyfiglet import Figlet\n\n\ndef main():\n    figlet = Figlet()\n    # TODO: check sys.argv length (0 args = random font, 2 args = -f/--font <name>)\n    #       call sys.exit("Invalid usage") on bad arguments\n    text = input("Input: ")\n    print(figlet.renderText(text))\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week4/adieu.py',
        label: 'adieu.py',
        starter: 'import inflect\n\n\ndef main():\n    p = inflect.engine()\n    names = []\n    while True:\n        try:\n            names.append(input("Name: "))\n        except EOFError:\n            print()\n            break\n    # TODO: print "Adieu, adieu, to " + p.join(names)\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week4/game.py',
        label: 'game.py',
        starter: 'import random\n\n\ndef main():\n    # TODO: prompt "Level: " until positive int, pick secret = random.randint(1, level)\n    # TODO: loop "Guess: " printing "Too small!", "Too large!", or "Just right!"\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week4/professor.py',
        label: 'professor.py',
        starter: 'import random\n\n\ndef main():\n    level = get_level()\n    score = 0\n    # TODO: ask 10 random X + Y = problems (3 tries each), print "EEE" on wrong answers\n    print(f"Score: {score}")\n\n\ndef get_level():\n    # TODO: prompt "Level: " until 1, 2, or 3 is entered; return int\n    pass\n\n\ndef generate_integer(level):\n    # TODO: return random int with `level` digits, or raise ValueError\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week4/bitcoin.py',
        label: 'bitcoin.py',
        starter: 'import sys\nimport requests\n\n\ndef main():\n    if len(sys.argv) != 2:\n        sys.exit("Missing command-line argument")\n    try:\n        n = float(sys.argv[1])\n    except ValueError:\n        sys.exit("Command-line argument is not a number")\n\n    try:\n        resp = requests.get("https://rest.coincap.io/v3/assets/bitcoin")\n        resp.raise_for_status()\n        # TODO: extract priceUsd from resp.json() and print f"${n * price:,.4f}"\n    except requests.RequestException:\n        sys.exit("Request failed")\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 5',
    title: 'Unit Tests',
    summary: 'Refactored functions + pytest test suites. Click "pytest" button to run tests!',
    problems: [
      {
        file: 'week5/twttr.py',
        label: 'twttr.py (for tests)',
        starter: 'def main():\n    text = input("Input: ")\n    print(shorten(text))\n\n\ndef shorten(word):\n    # TODO: return word with vowels removed\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week5/test_twttr.py',
        label: 'test_twttr.py',
        starter: 'from twttr import shorten\n\n\ndef test_shorten():\n    # TODO: write assert statements testing lowercase, uppercase, numbers, punctuation\n    pass\n'
      },
      {
        file: 'week5/bank.py',
        label: 'bank.py (for tests)',
        starter: 'def main():\n    greeting = input("Greeting: ")\n    print(f"${value(greeting)}")\n\n\ndef value(greeting):\n    # TODO: return 0, 20, or 100 (int)\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week5/test_bank.py',
        label: 'test_bank.py',
        starter: 'from bank import value\n\n\ndef test_value():\n    # TODO: assert value() returns 0, 20, and 100 appropriately\n    pass\n'
      },
      {
        file: 'week5/plates.py',
        label: 'plates.py (for tests)',
        starter: 'def main():\n    plate = input("Plate: ")\n    print("Valid" if is_valid(plate) else "Invalid")\n\n\ndef is_valid(s):\n    # TODO: return True if valid vanity plate, else False\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week5/test_plates.py',
        label: 'test_plates.py',
        starter: 'from plates import is_valid\n\n\ndef test_plates():\n    # TODO: test all vanity plate rules with assert\n    pass\n'
      },
      {
        file: 'week5/fuel.py',
        label: 'fuel.py (for tests)',
        starter: 'def main():\n    fraction = input("Fraction: ")\n    pct = convert(fraction)\n    print(gauge(pct))\n\n\ndef convert(fraction):\n    # TODO: return int percentage 0..100 or raise ValueError / ZeroDivisionError\n    pass\n\n\ndef gauge(percentage):\n    # TODO: return "E", "F", or f"{percentage}%"\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week5/test_fuel.py',
        label: 'test_fuel.py',
        starter: 'import pytest\nfrom fuel import convert, gauge\n\n\ndef test_convert():\n    # TODO: test valid fractions and pytest.raises(ValueError / ZeroDivisionError)\n    pass\n'
      }
    ]
  },
  {
    week: 'Week 6',
    title: 'File I/O',
    summary: 'with open(), csv.reader, csv.DictReader, csv.DictWriter, tabulate, Pillow (PIL).',
    problems: [
      {
        file: 'week6_lines/lines.py',
        label: 'lines.py',
        starter: 'import sys\n\n\ndef main():\n    if len(sys.argv) != 2:\n        sys.exit("Too few or too many command-line arguments")\n    if not sys.argv[1].endswith(".py"):\n        sys.exit("Not a Python file")\n    # TODO: open sys.argv[1], count non-blank and non-comment lines, and print the count\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week6_pizza/pizza.py',
        label: 'pizza.py',
        starter: 'import csv\nimport sys\nfrom tabulate import tabulate\n\n\n# Tip: Click "Load CS50P Sample Assets" in Explorer to get sicilian.csv & regular.csv.\n# Test in terminal: cd week6_pizza && python pizza.py sicilian.csv\ndef main():\n    if len(sys.argv) != 2:\n        sys.exit("Too few or too many command-line arguments")\n    # TODO: read CSV with csv.reader and print tabulate(rows, headers="firstrow", tablefmt="grid")\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week6_scourgify/scourgify.py',
        label: 'scourgify.py',
        starter: 'import csv\nimport sys\n\n\n# Tip: Click "Load CS50P Sample Assets" to get before.csv.\n# Test in terminal: cd week6_scourgify && python scourgify.py before.csv after.csv\ndef main():\n    if len(sys.argv) != 3:\n        sys.exit("Too few or too many command-line arguments")\n    # TODO: read sys.argv[1] with csv.DictReader, split "last, first", write sys.argv[2] with csv.DictWriter\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week6_shirt/shirt.py',
        label: 'shirt.py',
        starter: 'import os\nimport sys\nfrom PIL import Image, ImageOps\n\n\n# Tip: Click "Load CS50P Sample Assets" to get shirt.png, before1.jpg, before2.jpg.\n# Test in terminal: cd week6_shirt && python shirt.py before1.jpg after1.jpg\ndef main():\n    if len(sys.argv) != 3:\n        sys.exit("Too few or too many command-line arguments")\n    # TODO: validate extensions, open shirt.png & input image, ImageOps.fit, paste, and save\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 7',
    title: 'Regular Expressions',
    summary: 're.search, re.fullmatch, re.sub, capture groups, validators, plus pytest suites.',
    problems: [
      {
        file: 'week7/numb3rs.py',
        label: 'numb3rs.py',
        starter: '# Week 7: NUMB3RS (Harvard official starter)\nimport re\n\n\ndef main():\n    print(validate(input("IPv4 Address: ")))\n\n\ndef validate(ip):\n    # TODO: return True if ip is a valid IPv4 address (0-255 per octet), else False\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week7/test_numb3rs.py',
        label: 'test_numb3rs.py',
        starter: 'from numb3rs import validate\n\n\ndef test_validate():\n    # TODO: test valid and invalid IPv4 addresses\n    pass\n'
      },
      {
        file: 'week7/watch.py',
        label: 'watch.py',
        starter: '# Week 7: Watch on YouTube (Harvard official starter)\nimport re\n\n\ndef main():\n    print(parse(input("HTML: ")))\n\n\ndef parse(s):\n    # TODO: extract YouTube iframe src URL and return "https://youtu.be/<id>" or None\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week7/working.py',
        label: 'working.py',
        starter: '# Week 7: Working 9 to 5 (Harvard official starter)\nimport re\n\n\ndef main():\n    print(convert(input("Hours: ")))\n\n\ndef convert(s):\n    # TODO: convert 12-hour range (e.g. "9:00 AM to 5:00 PM") to "09:00 to 17:00" or raise ValueError\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week7/test_working.py',
        label: 'test_working.py',
        starter: 'import pytest\nfrom working import convert\n\n\ndef test_convert():\n    # TODO: test valid conversions and ValueError cases\n    pass\n'
      },
      {
        file: 'week7/um.py',
        label: 'um.py',
        starter: '# Week 7: Regular, um, Expressions (Harvard official starter)\nimport re\n\n\ndef main():\n    print(count(input("Text: ")))\n\n\ndef count(s):\n    # TODO: count standalone "um" words (case-insensitive)\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week7/test_um.py',
        label: 'test_um.py',
        starter: 'from um import count\n\n\ndef test_count():\n    # TODO: test standalone "um" vs words like "yummy" or "album"\n    pass\n'
      },
      {
        file: 'week7/response.py',
        label: 'response.py',
        starter: 'import validators\n\n\ndef main():\n    email = input("What\'s your email address? ")\n    # TODO: print "Valid" if validators.email(email) else "Invalid"\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 8',
    title: 'Object-Oriented Programming',
    summary: 'class, __init__, @property, @classmethod, operator overloading, datetime, fpdf2.',
    problems: [
      {
        file: 'week8/seasons.py',
        label: 'seasons.py',
        starter: 'from datetime import date\nimport sys\nimport inflect\n\n\ndef main():\n    dob_str = input("Date of Birth: ")\n    # TODO: parse YYYY-MM-DD via date.fromisoformat (sys.exit on ValueError),\n    #       compute minutes lived, and print in English words without "and"\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'week8/test_seasons.py',
        label: 'test_seasons.py',
        starter: 'from seasons import *\n\n\ndef test_seasons():\n    # TODO: test helper conversion function(s) from seasons.py\n    pass\n'
      },
      {
        file: 'week8/jar.py',
        label: 'jar.py',
        starter: '# Week 8: Cookie Jar (Harvard official starter)\nclass Jar:\n    def __init__(self, capacity=12):\n        pass\n\n    def __str__(self):\n        pass\n\n    def deposit(self, n):\n        pass\n\n    def withdraw(self, n):\n        pass\n\n    @property\n    def capacity(self):\n        pass\n\n    @property\n    def size(self):\n        pass\n'
      },
      {
        file: 'week8/test_jar.py',
        label: 'test_jar.py',
        starter: 'import pytest\nfrom jar import Jar\n\n\ndef test_init():\n    pass\n\n\ndef test_str():\n    jar = Jar()\n    assert str(jar) == ""\n\n\ndef test_deposit():\n    pass\n\n\ndef test_withdraw():\n    pass\n'
      },
      {
        file: 'week8_shirtificate/shirtificate.py',
        label: 'shirtificate.py',
        starter: 'from fpdf import FPDF\n\n\n# Tip: Click "Load CS50P Sample Assets" to get shirtificate.png.\n# Output should save "shirtificate.pdf" (previewable right inside the IDE!).\ndef main():\n    name = input("Name: ")\n    # TODO: build A4 portrait FPDF, add header, place shirtificate.png, overlay f"{name} took CS50", pdf.output("shirtificate.pdf")\n\n\nif __name__ == "__main__":\n    main()\n'
      }
    ]
  },
  {
    week: 'Week 9',
    title: 'Et Cetera & Final Project',
    summary: 'set, list/dict comprehensions, argparse, type hints, generators, CS50P Final Project.',
    problems: [
      {
        file: 'final_project/project.py',
        label: 'project.py',
        starter: '# CS50P Final Project\n# Must define main() plus at least 3 custom top-level functions.\n\ndef main():\n    # TODO: main program entry point\n    pass\n\n\ndef helper_one():\n    pass\n\n\ndef helper_two():\n    pass\n\n\ndef helper_three():\n    pass\n\n\nif __name__ == "__main__":\n    main()\n'
      },
      {
        file: 'final_project/test_project.py',
        label: 'test_project.py',
        starter: 'from project import helper_one, helper_two, helper_three\n\n\ndef test_helper_one():\n    pass\n\n\ndef test_helper_two():\n    pass\n\n\ndef test_helper_three():\n    pass\n'
      }
    ]
  }
];

export const OFFLINE_DOC_SECTIONS = [
  {
    title: 'Using the CS50P Terminal, CLI Arguments & Ctrl+D (Chromebook Safe)',
    keywords: 'terminal cli args sys.argv ctrl+d eof eoferror pytest chromebook',
    body: 'You can run any program in three ways: (1) Click Run or press Ctrl+Enter, (2) Put arguments in the top "args" box (for scripts using sys.argv), or (3) Type full commands directly in the bottom terminal like `python pizza.py sicilian.csv` or `pytest test_twttr.py`. For Week 3/4 programs expecting Ctrl+D (EOFError), click "Send EOF (Ctrl+D)" or press Ctrl+D while the terminal input is focused.',
    example: '$ cd week6_pizza\n$ python pizza.py sicilian.csv\n$ pytest test_pizza.py'
  },
  {
    title: 'Week 0–2: Strings, Formatting, Lists & Dictionaries',
    keywords: 'string strip lower upper title split replace f-string dict list loop',
    body: 'Core CS50P building blocks: clean user input with `.strip()`, normalize case with `.lower()` or `.title()`, format output with `f"{value:.2f}"`, and store structured records using `list` and `dict`.',
    example: 'name = input("Name: ").strip().title()\nmenu = {"Taco": 3.00, "Burrito": 8.50}\nprint(f"Total: ${menu.get(\'Taco\', 0):.2f}")'
  },
  {
    title: 'Week 3: Exceptions & Input Validation Loops',
    keywords: 'try except valueerror zerodivisionerror keyerror eoferror while true',
    body: 'Wrap risky conversions (`int()`, `float()`, dict lookups, `input()`) inside `try: ... except ...:` blocks inside a `while True:` loop. Break on `EOFError` when the user sends Ctrl+D.',
    example: 'while True:\n    try:\n        item = input("Item: ").title()\n    except EOFError:\n        print()\n        break'
  },
  {
    title: 'Week 4: Libraries & Offline-Safe HTTP Requests',
    keywords: 'random emoji pyfiglet inflect cowsay requests json bitcoin sys.argv',
    body: 'All CS50P libraries (`emoji`, `pyfiglet`, `inflect`, `cowsay`, `requests`) are pre-installed locally. `requests.get(...)` works transparently inside locked-down school labs via the built-in Cloudflare Worker bridge.',
    example: 'import requests\nresp = requests.get("https://rest.coincap.io/v3/assets/bitcoin")\nprice = float(resp.json()["data"]["priceUsd"])\nprint(f"${price:,.4f}")'
  },
  {
    title: 'Week 5: Unit Testing with pytest',
    keywords: 'pytest assert unit test raises test_ function',
    body: 'Name test files `test_*.py` and test functions `test_*()`. Click the "pytest" button in the top bar or run `pytest` in the terminal. Use `with pytest.raises(ValueError):` to test expected exceptions.',
    example: 'import pytest\nfrom fuel import convert, gauge\n\ndef test_zero_division():\n    with pytest.raises(ZeroDivisionError):\n        convert("1/0")'
  },
  {
    title: 'Week 6: File I/O, CSV, Tabulate & Pillow (PIL)',
    keywords: 'open csv dictreader dictwriter tabulate pil pillow image imageops fit shirt',
    body: 'Click "Load CS50P Sample Assets" in the left Explorer to load `sicilian.csv`, `regular.csv`, `before.csv`, `shirt.png`, `before1.jpg`, and `before2.jpg`. Generated images appear in "Generated Files" and can be previewed or saved directly to your computer.',
    example: 'from PIL import Image, ImageOps\nshirt = Image.open("shirt.png")\nphoto = ImageOps.fit(Image.open("before1.jpg"), shirt.size)\nphoto.paste(shirt, shirt)\nphoto.save("after1.jpg")'
  },
  {
    title: 'Week 7: Regular Expressions (re) & Validators',
    keywords: 're regex search fullmatch sub ignorecase validators email',
    body: 'Use raw strings `r"..."` for regex patterns. `re.fullmatch()` checks the whole string; `re.search()` searches anywhere unless anchored with `^` and `$`. Both `validators` and `validator_collection` are pre-installed.',
    example: 'import re\nif match := re.search(r"^(\\d{1,2}):(\\d{2}) (AM|PM)$", s):\n    hour, minute, period = match.groups()'
  },
  {
    title: 'Week 8: Classes, @property, datetime & FPDF2 Shirtificate',
    keywords: 'class init property setter str fpdf pdf shirtificate datetime date',
    body: 'Click "Load CS50P Sample Assets" to get `week8_shirtificate/shirtificate.png`. After running your `shirtificate.py`, click `shirtificate.pdf` in the Project Files or Generated Files tab to preview the rendered PDF right inside the browser.',
    example: 'from fpdf import FPDF\npdf = FPDF(orientation="P", unit="mm", format="A4")\npdf.add_page()\npdf.set_font("helvetica", "B", 45)\npdf.cell(0, 60, "CS50 Shirtificate", new_x="LMARGIN", new_y="NEXT", align="C")\npdf.image("shirtificate.png", x=10, y=70, w=190)\npdf.output("shirtificate.pdf")'
  },
  {
    title: 'Saving & Submitting Your Work',
    keywords: 'save download zip submit cs50 upload chromebook',
    body: 'Your work auto-saves continuously in browser storage, AND you can save any file straight to your Chromebook/PC with Ctrl+S ("Save .py") or download the entire workspace as a `.zip` with "Export .zip". You can also drag-and-drop local `.py`, `.csv`, or image files directly into the Project Files tree.',
    example: 'Ctrl+S        # Save active file to computer\nExport .zip   # Download entire project folder'
  }
];
