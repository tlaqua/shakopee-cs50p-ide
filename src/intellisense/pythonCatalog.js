export const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for',
  'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'match', 'case',
  'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
];

export const BUILTIN_DOCS = {
  print: {
    signature: 'print(*objects, sep=" ", end="\\n", file=sys.stdout, flush=False)',
    doc: 'Print objects to the terminal stream, separated by `sep` and followed by `end`.',
    example: 'print("hello,", name, sep=" ", end="!\\n")'
  },
  input: {
    signature: 'input(prompt="") -> str',
    doc: 'Display `prompt`, wait for a line of text from the user, and return it as a `str` (without the trailing newline). Raises `EOFError` on Ctrl+D.',
    example: 'name = input("What\'s your name? ").strip()'
  },
  int: {
    signature: 'int(x=0, base=10) -> int',
    doc: 'Convert a number or numeric string `x` to an integer. Raises `ValueError` if `x` is not a valid integer.',
    example: 'x = int(input("x: "))'
  },
  float: {
    signature: 'float(x=0.0) -> float',
    doc: 'Convert a string or number `x` to a floating-point number.',
    example: 'dollars = float(input("Amount: ").removeprefix("$"))'
  },
  str: {
    signature: 'str(object="") -> str',
    doc: 'Return a string representation of `object`.',
    example: 'text = str(42)'
  },
  bool: {
    signature: 'bool(x=False) -> bool',
    doc: 'Return `True` if `x` is truthy, otherwise `False`.',
    example: 'bool("hello")  # True'
  },
  len: {
    signature: 'len(s) -> int',
    doc: 'Return the number of items in a string, list, tuple, dict, or set.',
    example: 'if len(plate) < 2 or len(plate) > 6: return False'
  },
  range: {
    signature: 'range(stop) / range(start, stop[, step])',
    doc: 'Generate an immutable sequence of integers from `start` (default 0) up to (not including) `stop`.',
    example: 'for i in range(3): print("meow")'
  },
  round: {
    signature: 'round(number, ndigits=None)',
    doc: 'Round a number to a given precision in decimal digits (or nearest integer if `ndigits` is omitted).',
    example: 'round(2 / 3, 2)  # 0.67'
  },
  abs: {
    signature: 'abs(x)',
    doc: 'Return the absolute value of a number.',
    example: 'abs(-5)  # 5'
  },
  sum: {
    signature: 'sum(iterable, start=0)',
    doc: 'Sum the items of `iterable` from left to right and return the total.',
    example: 'sum([10, 20, 30])  # 60'
  },
  min: {
    signature: 'min(iterable, *, key=None) / min(arg1, arg2, *args)',
    doc: 'Return the smallest item in an iterable or the smallest of two or more arguments.',
    example: 'min(scores)'
  },
  max: {
    signature: 'max(iterable, *, key=None) / max(arg1, arg2, *args)',
    doc: 'Return the largest item in an iterable or the largest of two or more arguments.',
    example: 'max(scores)'
  },
  sorted: {
    signature: 'sorted(iterable, *, key=None, reverse=False) -> list',
    doc: 'Return a new sorted list from the items in `iterable`.',
    example: 'for student in sorted(students, key=lambda s: s["name"]): ...'
  },
  enumerate: {
    signature: 'enumerate(iterable, start=0)',
    doc: 'Yield `(index, value)` pairs while iterating over `iterable`.',
    example: 'for i, name in enumerate(students, start=1): print(i, name)'
  },
  zip: {
    signature: 'zip(*iterables, strict=False)',
    doc: 'Iterate over several iterables in parallel, producing tuples of items from each.',
    example: 'for a, b in zip(names, houses): ...'
  },
  open: {
    signature: 'open(file, mode="r", encoding="utf-8", newline="")',
    doc: 'Open a file and return a file object. Always prefer `with open(...) as file:` so it closes automatically. Use `newline=""` with `csv`.',
    example: 'with open("names.csv", "r", encoding="utf-8") as file:\n    reader = csv.DictReader(file)'
  },
  type: {
    signature: 'type(object)',
    doc: 'Return the type/class of an object.',
    example: 'type(3.14)  # <class \'float\'>'
  },
  isinstance: {
    signature: 'isinstance(object, classinfo) -> bool',
    doc: 'Return `True` if `object` is an instance of `classinfo`.',
    example: 'if not isinstance(n, int): raise ValueError'
  },
  map: {
    signature: 'map(function, iterable, *iterables)',
    doc: 'Return an iterator that applies `function` to every item of `iterable`.',
    example: 'uppercased = map(str.upper, words)'
  },
  filter: {
    signature: 'filter(function, iterable)',
    doc: 'Construct an iterator from elements of `iterable` for which `function(item)` is true.',
    example: 'gryffindors = filter(lambda s: s["house"] == "Gryffindor", students)'
  },
  any: {
    signature: 'any(iterable) -> bool',
    doc: 'Return `True` if any element of `iterable` is truthy.',
    example: 'any(c.isdigit() for c in text)'
  },
  all: {
    signature: 'all(iterable) -> bool',
    doc: 'Return `True` if all elements of `iterable` are truthy (or empty).',
    example: 'all(c.isalnum() for c in plate)'
  },
  super: {
    signature: 'super([type[, object-or-type]])',
    doc: 'Return a proxy object to call methods on a parent/superclass (e.g. `super().__init__(name)`).',
    example: 'super().__init__(name)'
  },
  property: {
    signature: '@property',
    doc: 'Decorator that turns a method into a read-only attribute with an optional `@name.setter`.',
    example: '@property\ndef house(self): return self._house'
  },
  classmethod: {
    signature: '@classmethod',
    doc: 'Decorator for a method bound to the class (`cls`) rather than an instance (`self`).',
    example: '@classmethod\ndef get(cls): return cls(input("Name: "))'
  }
};

export const TYPE_METHODS = {
  str: {
    strip: { signature: 'str.strip(chars=None) -> str', doc: 'Return a copy of the string with leading and trailing whitespace (or `chars`) removed.' },
    lstrip: { signature: 'str.lstrip(chars=None) -> str', doc: 'Remove leading whitespace or characters.' },
    rstrip: { signature: 'str.rstrip(chars=None) -> str', doc: 'Remove trailing whitespace or characters.' },
    lower: { signature: 'str.lower() -> str', doc: 'Return a copy of the string converted to lowercase.' },
    upper: { signature: 'str.upper() -> str', doc: 'Return a copy of the string converted to uppercase.' },
    title: { signature: 'str.title() -> str', doc: 'Return a titlecased version of the string (First Letter Of Each Word Capitalized).' },
    capitalize: { signature: 'str.capitalize() -> str', doc: 'Capitalize only the first character of the string.' },
    replace: { signature: 'str.replace(old, new, count=-1) -> str', doc: 'Return a copy with occurrences of `old` replaced by `new`.' },
    split: { signature: 'str.split(sep=None, maxsplit=-1) -> list[str]', doc: 'Split the string into a list of substrings using `sep` (default: any whitespace).' },
    join: { signature: 'str.join(iterable) -> str', doc: 'Concatenate an iterable of strings using this string as separator.' },
    startswith: { signature: 'str.startswith(prefix) -> bool', doc: 'Return `True` if the string starts with `prefix` (string or tuple of strings).' },
    endswith: { signature: 'str.endswith(suffix) -> bool', doc: 'Return `True` if the string ends with `suffix` (string or tuple of strings).' },
    removeprefix: { signature: 'str.removeprefix(prefix) -> str', doc: 'Remove `prefix` from the start of the string if present (Python 3.9+).' },
    removesuffix: { signature: 'str.removesuffix(suffix) -> str', doc: 'Remove `suffix` from the end of the string if present (Python 3.9+).' },
    isdigit: { signature: 'str.isdigit() -> bool', doc: 'Return `True` if all characters are digits and there is at least one character.' },
    isalpha: { signature: 'str.isalpha() -> bool', doc: 'Return `True` if all characters are alphabetic.' },
    isalnum: { signature: 'str.isalnum() -> bool', doc: 'Return `True` if all characters are alphanumeric (letters or digits).' },
    find: { signature: 'str.find(sub) -> int', doc: 'Return the lowest index where `sub` is found, or `-1` if not found.' },
    count: { signature: 'str.count(sub) -> int', doc: 'Return the number of non-overlapping occurrences of `sub`.' }
  },
  list: {
    append: { signature: 'list.append(x)', doc: 'Add an item to the end of the list.' },
    extend: { signature: 'list.extend(iterable)', doc: 'Extend the list by appending all items from `iterable`.' },
    insert: { signature: 'list.insert(i, x)', doc: 'Insert item `x` at index `i`.' },
    remove: { signature: 'list.remove(x)', doc: 'Remove the first item equal to `x` (raises `ValueError` if absent).' },
    pop: { signature: 'list.pop(i=-1)', doc: 'Remove and return the item at index `i` (default last).' },
    sort: { signature: 'list.sort(*, key=None, reverse=False)', doc: 'Sort the list in place.' },
    reverse: { signature: 'list.reverse()', doc: 'Reverse the elements of the list in place.' },
    clear: { signature: 'list.clear()', doc: 'Remove all items from the list.' }
  },
  dict: {
    get: { signature: 'dict.get(key, default=None)', doc: 'Return the value for `key` if present, else `default` (avoids `KeyError`).' },
    keys: { signature: 'dict.keys()', doc: 'Return a view of the dictionary\'s keys.' },
    values: { signature: 'dict.values()', doc: 'Return a view of the dictionary\'s values.' },
    items: { signature: 'dict.items()', doc: 'Return a view of `(key, value)` pairs.' },
    update: { signature: 'dict.update(other)', doc: 'Update the dictionary with key/value pairs from `other`.' },
    pop: { signature: 'dict.pop(key[, default])', doc: 'Remove `key` and return its value.' }
  },
  set: {
    add: { signature: 'set.add(elem)', doc: 'Add element `elem` to the set.' },
    remove: { signature: 'set.remove(elem)', doc: 'Remove `elem` from the set; raises `KeyError` if absent.' },
    discard: { signature: 'set.discard(elem)', doc: 'Remove `elem` from the set if present.' },
    union: { signature: 'set.union(*others)', doc: 'Return a new set with elements from the set and all others.' }
  }
};

export const MODULE_CATALOG = {
  sys: {
    doc: 'System-specific parameters and functions (CLI arguments & exit status).',
    members: {
      argv: { kind: 'Variable', signature: 'sys.argv: list[str]', doc: 'List of command-line arguments passed to the Python script. `sys.argv[0]` is the script filename.' },
      exit: { kind: 'Function', signature: 'sys.exit(status=0)', doc: 'Exit from Python immediately. Passing a string prints it to `stderr` and exits with status 1.' }
    }
  },
  random: {
    doc: 'Generate pseudo-random numbers and choices.',
    members: {
      choice: { kind: 'Function', signature: 'random.choice(seq)', doc: 'Return a random element from a non-empty sequence `seq`.' },
      randint: { kind: 'Function', signature: 'random.randint(a, b) -> int', doc: 'Return a random integer `N` such that `a <= N <= b` (inclusive).' },
      shuffle: { kind: 'Function', signature: 'random.shuffle(x)', doc: 'Shuffle list `x` in place.' },
      sample: { kind: 'Function', signature: 'random.sample(population, k)', doc: 'Return a `k`-length list of unique elements chosen from `population`.' }
    }
  },
  statistics: {
    doc: 'Mathematical statistics functions.',
    members: {
      mean: { kind: 'Function', signature: 'statistics.mean(data)', doc: 'Return the sample arithmetic mean of `data`.' },
      median: { kind: 'Function', signature: 'statistics.median(data)', doc: 'Return the median (middle value) of numeric `data`.' },
      mode: { kind: 'Function', signature: 'statistics.mode(data)', doc: 'Return the single most common data point.' }
    }
  },
  math: {
    doc: 'Standard mathematical functions and constants.',
    members: {
      sqrt: { kind: 'Function', signature: 'math.sqrt(x) -> float', doc: 'Return the square root of `x`.' },
      ceil: { kind: 'Function', signature: 'math.ceil(x) -> int', doc: 'Return the ceiling of `x` (smallest integer `>= x`).' },
      floor: { kind: 'Function', signature: 'math.floor(x) -> int', doc: 'Return the floor of `x` (largest integer `<= x`).' },
      pi: { kind: 'Constant', signature: 'math.pi: float', doc: 'Mathematical constant pi (3.141592653589793).' }
    }
  },
  re: {
    doc: 'Regular expression matching operations (CS50P Week 7).',
    members: {
      search: { kind: 'Function', signature: 're.search(pattern, string, flags=0)', doc: 'Scan through `string` looking for the first match to `pattern`. Returns a `Match` object or `None`.' },
      match: { kind: 'Function', signature: 're.match(pattern, string, flags=0)', doc: 'Try to apply `pattern` at the start of `string`.' },
      fullmatch: { kind: 'Function', signature: 're.fullmatch(pattern, string, flags=0)', doc: 'Return a `Match` object if the **entire** `string` matches `pattern`.' },
      sub: { kind: 'Function', signature: 're.sub(pattern, repl, string, count=0, flags=0)', doc: 'Return the string obtained by replacing occurrences of `pattern` with `repl`.' },
      findall: { kind: 'Function', signature: 're.findall(pattern, string, flags=0)', doc: 'Return all non-overlapping matches of `pattern` in `string` as a list.' },
      IGNORECASE: { kind: 'Constant', signature: 're.IGNORECASE', doc: 'Flag to perform case-insensitive matching.' }
    }
  },
  csv: {
    doc: 'CSV file reading and writing (CS50P Week 6).',
    members: {
      reader: { kind: 'Function', signature: 'csv.reader(csvfile, dialect="excel")', doc: 'Return a reader object that iterates over lines in `csvfile`, yielding each row as a `list[str]`.' },
      DictReader: { kind: 'Class', signature: 'csv.DictReader(f, fieldnames=None)', doc: 'Create an object that maps each row in the CSV file to a `dict` whose keys come from the header row.' },
      writer: { kind: 'Function', signature: 'csv.writer(csvfile)', doc: 'Return a writer object with `.writerow(row)` and `.writerows(rows)`.' },
      DictWriter: { kind: 'Class', signature: 'csv.DictWriter(f, fieldnames)', doc: 'Create a writer that maps dictionaries onto CSV rows. Call `.writeheader()` then `.writerow({...})`.' }
    }
  },
  json: {
    doc: 'JSON encoder and decoder (CS50P Week 4).',
    members: {
      dumps: { kind: 'Function', signature: 'json.dumps(obj, indent=None) -> str', doc: 'Serialize `obj` to a JSON-formatted `str`.' },
      loads: { kind: 'Function', signature: 'json.loads(s)', doc: 'Deserialize a JSON string `s` to a Python object.' },
      dump: { kind: 'Function', signature: 'json.dump(obj, fp, indent=None)', doc: 'Serialize `obj` as JSON to file object `fp`.' },
      load: { kind: 'Function', signature: 'json.load(fp)', doc: 'Deserialize JSON from file object `fp`.' }
    }
  },
  os: {
    doc: 'Miscellaneous operating system interfaces.',
    members: {
      path: { kind: 'Module', signature: 'os.path', doc: 'Common pathname manipulations (`os.path.splitext`, `os.path.exists`, `os.path.basename`).' },
      listdir: { kind: 'Function', signature: 'os.listdir(path=".")', doc: 'Return a list of filenames in the directory given by `path`.' }
    }
  },
  datetime: {
    doc: 'Basic date and time types (CS50P Week 8 Seasons of Love).',
    members: {
      date: { kind: 'Class', signature: 'datetime.date(year, month, day)', doc: 'Date object (`year`, `month`, `day`). Supports `date.today()`, `date.fromisoformat()`, and subtraction returning `timedelta`.' },
      timedelta: { kind: 'Class', signature: 'datetime.timedelta(days=0, seconds=0, ...)', doc: 'Difference between two dates or times. Has `.days` and `.total_seconds()`.' },
      datetime: { kind: 'Class', signature: 'datetime.datetime(year, month, day, ...)', doc: 'Combined date and time object.' }
    }
  },
  requests: {
    doc: 'HTTP library for Python (CS50P Week 4). Routed automatically through the lab-safe worker bridge.',
    members: {
      get: { kind: 'Function', signature: 'requests.get(url, params=None, **kwargs) -> Response', doc: 'Send a GET request and return a `Response` object (`response.json()`, `response.status_code`, `response.raise_for_status()`).' },
      RequestException: { kind: 'Class', signature: 'requests.RequestException', doc: 'Base exception raised when an HTTP request fails.' }
    }
  },
  pytest: {
    doc: 'Unit testing framework (CS50P Week 5).',
    members: {
      raises: { kind: 'Function', signature: 'pytest.raises(ExpectedException)', doc: 'Context manager asserting that a block raises `ExpectedException`, e.g. `with pytest.raises(ValueError):`.' }
    }
  },
  cowsay: {
    doc: 'ASCII art characters saying a message (CS50P Week 4).',
    members: {
      cow: { kind: 'Function', signature: 'cowsay.cow(message)', doc: 'Print an ASCII cow speaking `message`.' },
      trex: { kind: 'Function', signature: 'cowsay.trex(message)', doc: 'Print an ASCII T-Rex speaking `message`.' }
    }
  },
  emoji: {
    doc: 'Emoji conversion utilities (CS50P Week 4 Emojize).',
    members: {
      emojize: { kind: 'Function', signature: 'emoji.emojize(string, language="en") -> str', doc: 'Replace `:emoji_code:` aliases in `string` with Unicode emojis. Pass `language="alias"` for legacy aliases like `:thumbsup:`.' }
    }
  },
  pyfiglet: {
    doc: 'Render ASCII-art text banners (CS50P Week 4 Figlet).',
    members: {
      Figlet: { kind: 'Class', signature: 'pyfiglet.Figlet(font="standard")', doc: 'Create a Figlet renderer. Use `.getFonts()`, `.setFont(font=...)`, and `.renderText(text)`.' },
      figlet_format: { kind: 'Function', signature: 'pyfiglet.figlet_format(text, font="standard") -> str', doc: 'Format `text` as ASCII art using the specified font.' }
    }
  },
  tabulate: {
    doc: 'Pretty-print tabular data (CS50P Week 6 Pizza Py).',
    members: {
      tabulate: { kind: 'Function', signature: 'tabulate(tabular_data, headers=(), tablefmt="simple") -> str', doc: 'Format a list of lists or dicts into an ASCII table. CS50P Pizza Py uses `headers="keys"` (or `"firstrow"`) and `tablefmt="grid"`.' }
    }
  },
  inflect: {
    doc: 'Correctly generate plurals, ordinals, and number-to-words (CS50P Week 4 & Week 8).',
    members: {
      engine: { kind: 'Class', signature: 'inflect.engine()', doc: 'Create an inflect engine instance `p = inflect.engine()`. Call `p.join(words)` or `p.number_to_words(n, andword="")`.' }
    }
  },
  validators: {
    doc: 'Python Data Validation for Humans (CS50P Week 7 Response Validation).',
    members: {
      email: { kind: 'Function', signature: 'validators.email(value) -> bool | ValidationError', doc: 'Return `True` if `value` is a valid email address, otherwise a falsy `ValidationError`.' }
    }
  },
  validator_collection: {
    doc: 'Python validation library (CS50P Week 7 Response Validation).',
    members: {
      checkers: { kind: 'Module', signature: 'validator_collection.checkers', doc: 'Contains boolean checkers like `checkers.is_email(value)` returning `True` or `False`.' },
      validators: { kind: 'Module', signature: 'validator_collection.validators', doc: 'Contains validators like `validators.email(value)` raising `ValueError` on invalid input.' }
    }
  },
  PIL: {
    doc: 'Pillow Python Imaging Library (CS50P Week 6 CS50 P-Shirt).',
    members: {
      Image: { kind: 'Module', signature: 'PIL.Image', doc: 'Open (`Image.open(path)`), resize, paste (`img.paste(overlay, mask=overlay)`), and save (`img.save(path)`).' },
      ImageOps: { kind: 'Module', signature: 'PIL.ImageOps', doc: 'Contains `ImageOps.fit(image, size)` to resize and crop an image to exact dimensions.' }
    }
  },
  fpdf: {
    doc: 'FPDF2 PDF generation library (CS50P Week 8 CS50 Shirtificate).',
    members: {
      FPDF: { kind: 'Class', signature: 'fpdf.FPDF(orientation="P", unit="mm", format="A4")', doc: 'Create a PDF document. Key methods: `.add_page()`, `.set_font(family, style, size)`, `.image(name, x, y, w)`, `.cell(w, h, text, align="C")`, `.output(name)`.' }
    }
  }
};

export const CS50P_SNIPPETS = [
  {
    label: 'main',
    detail: 'CS50P main() entry pattern',
    insertText: 'def main():\n    ${1:pass}\n\n\nif __name__ == "__main__":\n    main()\n'
  },
  {
    label: 'tryexcept',
    detail: 'Loop until valid input (Week 3 Fuel/Grocery)',
    insertText: 'while True:\n    try:\n        ${1:value = input("Input: ")}\n    except (ValueError, EOFError):\n        break\n'
  },
  {
    label: 'withopen',
    detail: 'Open file safely with utf-8 (Week 6)',
    insertText: 'with open("${1:file.csv}", "r", encoding="utf-8") as file:\n    ${2:for line in file:\n        print(line.rstrip())}\n'
  },
  {
    label: 'pytest',
    detail: 'pytest test function + raises (Week 5)',
    insertText: 'import pytest\nfrom ${1:module} import ${2:func}\n\n\ndef test_${2:func}():\n    assert ${2:func}(${3}) == ${4}\n'
  },
  {
    label: 'classinit',
    detail: 'Python class with __init__ & @property (Week 8)',
    insertText: 'class ${1:ClassName}:\n    def __init__(self, ${2:value}):\n        self.${2:value} = ${2:value}\n\n    def __str__(self):\n        return f"{self.${2:value}}"\n'
  }
];
