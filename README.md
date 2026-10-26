# Wordly Dictionary

A simple single-page dictionary. Search for a word, read its meanings and examples, and save words.

## Run it

Open `index.html` in a browser. If the browser blocks a feature on a local file, open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How it works

- Uses `fetch` and `async/await` to search the Free Dictionary API.
- Saves favorite words and the theme in the browser.
- Needs an internet connection to search.
