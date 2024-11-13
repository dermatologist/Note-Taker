let noteTitle;
let noteText;
let saveNoteBtn;
let newNoteBtn;
let noteList;

if (window.location.pathname === '/notes') {
  noteTitle = document.querySelector('.note-title');
  patientID = document.querySelector('.patient-id');
  citationIds = document.querySelector('.citation-ids');
  noteText = document.querySelector('.note-textarea');
  noteAnswer = document.querySelector('.note-answer');
  saveNoteBtn = document.querySelector('.save-note');
  newNoteBtn = document.querySelector('.new-note');
  noteList = document.querySelectorAll('.list-container .list-group');
  viewPatientsBtn = document.querySelector('.view-patients');
}

const handleSelectPatients = () => {
      return new Promise(function(resolve, reject) {

        let selection = noteTitle.value;

        let _selection = `/patient/${selection}`;

        // The origin of the patient browser app
        let origin = "https://patient-browser.smarthealthit.org";

        // What config file to load
        let config = "default";

        // Popup height
        let height = 700;

        // Popup width
        let width  = 1000;

        // Open the popup
        let popup  = window.open(
            origin + (
                selection ?
                    `/index.html?config=${config}#${_selection}` :
                    ""
            ),
            "picker",
            [
                "height=" + height,
                "width=" + width,
                "menubar=0",
                "resizable=1",
                "status=0",
                "top=" + (screen.height - height) / 2,
                "left=" + (screen.width - width) / 2
            ].join(",")
        );

        // The function that handles incoming messages
        const onMessage = function onMessage(e) {

            // only if the message is coming from the patient picker
            if (e.origin === origin) {

                // Add the patient ID to the note if it is not already there
                if(e.data.data)
                  patientID.value = e.data.data;

                // OPTIONAL: Send your custom configuration options if needed
                // when the patient browser says it is ready
                if (e.data.type === 'ready') {
                    popup.postMessage({
                        type: 'config',
                        data: {
                            submitStrategy: "manual",
                            // ...
                        }
                    }, '*');
                }

                // When the picker requests to be closed:
                // 1. Stop listening for messages
                // 2. Close the popup window
                // 3. Resolve the promise with the new selection (if any)
                else if (e.data.type === 'result' || e.data.type === 'close') {
                    window.removeEventListener('message', onMessage);
                    popup.close();
                    resolve(e.data.data);
                }
            }
        };

        // Now just wait for the user to interact with the patient picker
        window.addEventListener('message', onMessage);
    });

};

// Show an element
const show = (elem) => {
  elem.style.display = 'inline';
};

// Hide an element
const hide = (elem) => {
  elem.style.display = 'none';
};

// activeNote is used to keep track of the note in the textarea
let activeNote = {};

const getNotes = () =>
  fetch('/api/notes', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

const saveNote = (note) =>
  fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });

const deleteNote = (id) =>
  fetch(`/api/notes/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

const renderActiveNote = () => {
  hide(saveNoteBtn);

  if (activeNote.id) {
    noteTitle.setAttribute('readonly', true);
    noteText.setAttribute('readonly', true);
    noteAnswer.setAttribute('readonly', true);
    patientID.setAttribute('readonly', true);
    citationIds.setAttribute('readonly', true);
    noteTitle.value = activeNote.title;
    noteText.value = activeNote.text;
    noteAnswer.value = activeNote.answer;
    patientID.value = activeNote.patientID;
    citationIds.value = activeNote.citationIds;
  } else {
    noteTitle.removeAttribute('readonly');
    noteText.removeAttribute('readonly');
    noteAnswer.removeAttribute('readonly');
    patientID.removeAttribute('readonly');
    citationIds.removeAttribute('readonly');
    noteTitle.value = '';
    noteText.value = '';
    noteAnswer.value = '';
    patientID.value = '';
    citationIds.value = '';
  }
};

const handleNoteSave = () => {
  const newNote = {
    title: noteTitle.value,
    text: noteText.value,
    answer: noteAnswer.value,
    patientID: patientID.value,
    citationIds: citationIds.value,
  };
  saveNote(newNote).then(() => {
    getAndRenderNotes();
    renderActiveNote();
  });
};

// Delete the clicked note
const handleNoteDelete = (e) => {
  // Prevents the click listener for the list from being called when the button inside of it is clicked
  e.stopPropagation();

  const note = e.target;
  const noteId = JSON.parse(note.parentElement.getAttribute('data-note')).id;

  if (activeNote.id === noteId) {
    activeNote = {};
  }

  deleteNote(noteId).then(() => {
    getAndRenderNotes();
    renderActiveNote();
  });
};

// Sets the activeNote and displays it
const handleNoteView = (e) => {
  e.preventDefault();
  activeNote = JSON.parse(e.target.parentElement.getAttribute('data-note'));
  renderActiveNote();
};

// Sets the activeNote to and empty object and allows the user to enter a new note
const handleNewNoteView = (e) => {
  activeNote = {};
  renderActiveNote();
};

const handleRenderSaveBtn = () => {
  if (!noteTitle.value.trim() || !noteText.value.trim()) {
    hide(saveNoteBtn);
  } else {
    show(saveNoteBtn);
  }
};

// Render the list of note titles
const renderNoteList = async (notes) => {
  let jsonNotes = await notes.json();
  if (window.location.pathname === '/notes') {
    noteList.forEach((el) => (el.innerHTML = ''));
  }

  let noteListItems = [];

  // Returns HTML element with or without a delete button
  const createLi = (text, delBtn = true) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item');

    const spanEl = document.createElement('span');
    spanEl.classList.add('list-item-title');
    spanEl.innerText = text;
    spanEl.addEventListener('click', handleNoteView);

    liEl.append(spanEl);

    if (delBtn) {
      const delBtnEl = document.createElement('i');
      delBtnEl.classList.add(
        'fas',
        'fa-trash-alt',
        'float-right',
        'text-danger',
        'delete-note'
      );
      delBtnEl.addEventListener('click', handleNoteDelete);

      liEl.append(delBtnEl);
    }

    return liEl;
  };

  if (jsonNotes.length === 0) {
    noteListItems.push(createLi('No saved Notes', false));
  }

  jsonNotes.forEach((note) => {
    const li = createLi(note.title);
    li.dataset.note = JSON.stringify(note);

    noteListItems.push(li);
  });

  if (window.location.pathname === '/notes') {
    noteListItems.forEach((note) => noteList[0].append(note));
  }
};

// Gets notes from the db and renders them to the sidebar
const getAndRenderNotes = () => getNotes().then(renderNoteList);

if (window.location.pathname === '/notes') {
  saveNoteBtn.addEventListener('click', handleNoteSave);
  newNoteBtn.addEventListener('click', handleNewNoteView);
  viewPatientsBtn.addEventListener('click', handleSelectPatients);
  noteTitle.addEventListener('keyup', handleRenderSaveBtn);
  noteText.addEventListener('keyup', handleRenderSaveBtn);
  noteAnswer.addEventListener('keyup', handleRenderSaveBtn);
  patientID.addEventListener('keyup', handleRenderSaveBtn);
  citationIds.addEventListener('keyup', handleRenderSaveBtn);
}

getAndRenderNotes();
