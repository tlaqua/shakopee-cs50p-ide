const DB_NAME = 'shakopee-cs50p-workspace';
const DB_VERSION = 1;
const STORE = 'files';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadWorkspaceFiles() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get('workspace_v1');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveWorkspaceFiles(filesMap) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.put(filesMap, 'workspace_v1');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function getDefaultWorkspaceFiles() {
  return {
    'welcome.py': {
      type: 'file',
      encoding: 'utf8',
      content: `# Welcome to Shakopee CS50P Studio!
# Hover over functions like print(), input(), or str.strip() for tooltips.
# Press Ctrl+Enter (or click Run) to execute.

def main():
    name = input("What's your name, Saber? ").strip().title()
    print(greet(name))


def greet(student: str = "World") -> str:
    """Return a welcoming Shakopee CS50P greeting."""
    return f"Hello, {student}! Welcome to CS50 Python at Shakopee."


if __name__ == "__main__":
    main()
`
    },
    'test_welcome.py': {
      type: 'file',
      encoding: 'utf8',
      content: `from welcome import greet


def test_greet_default():
    assert greet() == "Hello, World! Welcome to CS50 Python at Shakopee."


def test_greet_name():
    assert greet("Alex") == "Hello, Alex! Welcome to CS50 Python at Shakopee."
`
    }
  };
}
