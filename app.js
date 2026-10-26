const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const STORAGE_KEY = 'wordly-saved-words';

const form = document.querySelector('#search-form');
const input = document.querySelector('#word-input');
const message = document.querySelector('#message');
const result = document.querySelector('#result');
const savedList = document.querySelector('#saved-list');
const savedEmpty = document.querySelector('#saved-empty');
const themeButton = document.querySelector('#theme-button');

let savedWords = readSavedWords();
let currentEntry = null;

function readSavedWords() {
  try {
    const words = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(words) ? words : [];
  } catch {
    return [];
  }
}

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

async function searchWord(word) {
  const cleanWord = word.trim();
  if (!cleanWord) {
    showMessage('Type a word to search.', 'error');
    return;
  }

  input.value = cleanWord;
  result.replaceChildren();
  currentEntry = null;
  showMessage(`Looking up “${cleanWord}”…`, 'loading');

  try {
    const response = await fetch(`${API_URL}${encodeURIComponent(cleanWord)}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('We could not find that word. Check the spelling and try again.');
      throw new Error('The dictionary is unavailable right now. Please try again.');
    }

    const entries = await response.json();
    if (!Array.isArray(entries) || entries.length === 0) throw new Error('No definitions were found for that word.');
    currentEntry = entries[0];
    showMessage('');
    displayEntry(currentEntry);
  } catch (error) {
    showMessage(error.message || 'Could not connect. Check your internet and try again.', 'error');
  }
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function displayEntry(entry) {
  result.replaceChildren();
  const top = makeElement('div', 'word-top');
  const titleArea = document.createElement('div');
  titleArea.append(makeElement('h2', 'word-title', entry.word || 'Word'));
  const phonetic = entry.phonetic || entry.phonetics?.find((item) => item.text)?.text;
  if (phonetic) titleArea.append(makeElement('p', 'phonetic', phonetic));

  const actions = makeElement('div', 'word-actions');
  const saveButton = makeElement('button', `icon-button ${isSaved(entry.word) ? 'active' : ''}`, isSaved(entry.word) ? '♥' : '♡');
  saveButton.type = 'button';
  saveButton.setAttribute('aria-label', isSaved(entry.word) ? 'Remove from saved words' : 'Save this word');
  saveButton.addEventListener('click', () => toggleSaved(entry.word));
  actions.append(saveButton);
  top.append(titleArea, actions);
  result.append(top);

  for (const meaning of entry.meanings || []) {
    const section = makeElement('section', 'meaning');
    section.append(makeElement('h3', 'part-of-speech', meaning.partOfSpeech || 'Meaning'));
    const definitions = document.createElement('ol');
    definitions.className = 'definitions';
    for (const item of meaning.definitions || []) {
      const listItem = document.createElement('li');
      listItem.append(document.createTextNode(item.definition || 'Definition unavailable.'));
      if (item.example) listItem.append(makeElement('span', 'example', `“${item.example}”`));
      definitions.append(listItem);
    }
    section.append(definitions);
    result.append(section);
  }

  if (entry.origin) result.append(makeElement('p', 'origin', `Origin: ${entry.origin}`));
  const source = entry.sourceUrls?.[0];
  if (source) {
    const link = makeElement('a', 'source-link', 'View source ↗');
    link.href = source;
    link.target = '_blank';
    link.rel = 'noreferrer';
    result.append(link);
  }
}

function isSaved(word) {
  return savedWords.some((savedWord) => savedWord.toLowerCase() === word.toLowerCase());
}

function toggleSaved(word) {
  if (isSaved(word)) {
    savedWords = savedWords.filter((savedWord) => savedWord.toLowerCase() !== word.toLowerCase());
  } else {
    savedWords = [word, ...savedWords];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords));
  renderSavedWords();
  if (currentEntry) displayEntry(currentEntry);
}

function renderSavedWords() {
  savedList.replaceChildren();
  savedEmpty.hidden = savedWords.length > 0;
  savedWords.forEach((word) => {
    const item = document.createElement('li');
    const openButton = makeElement('button', 'saved-word', word);
    openButton.type = 'button';
    openButton.addEventListener('click', () => searchWord(word));
    const removeButton = makeElement('button', 'remove-word', '×');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Remove ${word} from saved words`);
    removeButton.addEventListener('click', () => toggleSaved(word));
    item.append(openButton, removeButton);
    savedList.append(item);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  searchWord(input.value);
});

themeButton.addEventListener('click', () => {
  const darkMode = document.body.dataset.theme !== 'dark';
  document.body.dataset.theme = darkMode ? 'dark' : 'light';
  localStorage.setItem('wordly-theme', darkMode ? 'dark' : 'light');
  themeButton.innerHTML = darkMode ? '☀ <span>Theme</span>' : '☾ <span>Theme</span>';
});

if (localStorage.getItem('wordly-theme') === 'dark') {
  document.body.dataset.theme = 'dark';
  themeButton.innerHTML = '☀ <span>Theme</span>';
}
renderSavedWords();
