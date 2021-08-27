var displayState = "none" ;

function showPatientList() {
  var x = document.getElementById("patientListDiv") ;
  if (x.style.display !== "block") {
    x.style.display = "block" ;
  }
  displayState = "PatientList" ;
}

class sortTable {
  dir = 1 ;
  lastth = -1 ;
  constructor(tname) {
    this.tname = tname ;
    tname.onclick = this.allClick.bind(this) ;
  }

  allClick(e) {
    if (e.target.tagName == 'TH') {
      return this.sortClick(e) ;
    }
  };

  resort() {
    if ( this.lastth < 0 ) {
      this.lastth = 0 ;
      this.dir = 1 ;
    }
    this.sortGrid(this.lastth) ;
  }

  sortClick(e) {
    let th = e.target;
    if ( th.cellIndex == this.lastth ) {
      this.dir = -this.dir ;
    } else {
      this.dir = 1;
      this.lastth = th.cellIndex
    }
    // if TH, then sort
    // cellIndex is the number of th:
    //   0 for the first column
    //   1 for the second column, etc
    this.sortGrid(th.cellIndex);
  };

  sortGrid(colNum) {
    let tbody = this.tname.querySelector('tbody');
    if ( tbody == null ) {
      // empty table
      return ;
    }

    let rowsArray = Array.from(tbody.rows);
          
    let type = "number" ;
    rowsArray.some( function(r) {
      let c = r.cells[colNum].innerHTML ;
      if ( c == "" ) {
      } else if ( isNaN( Number(r.cells[colNum].innerHTML) ) ) {
        type = "string" ;
        return true ;
      } else {
        return true ;
      }
    });

    // compare(a, b) compares two rows, need for sorting
    let dir = this.dir ;
    let compare;

    switch (type) {
      case 'number':
        compare = function(rowA, rowB) {
          return (rowA.cells[colNum].innerHTML - rowB.cells[colNum].innerHTML) * dir;
        };
        break;
      case 'string':
        compare = function(rowA, rowB) {
          return rowA.cells[colNum].innerHTML > rowB.cells[colNum].innerHTML ? dir : -dir;
        };
        break;
    }
    
    // sort
    rowsArray.sort(compare);
    rowsArray.forEach( function( v, i ) {
      if (i%2 == 1 ) {
        v.classList.add('odd') ;
      } else {
        v.classList.remove('odd') ;
      }
    });

    tbody.append(...rowsArray);
  }

  delete () {
    this.tname.parentNode.removeChild(this.tname) ;
  } 
}

class dataTable extends sortTable {
  constructor( idname, parent, collist ) {
    if ( parent == null ) {
      parent = document.body ;
    }
      
    let tbl = document.createElement('table') ;
    tbl.setAttribute( "id", idname ) ;

    // Table Head
    let header = tbl.createTHead() ;
    let row = header.insertRow(0);
      row.classList.add('head') ;
    collist.forEach( function(v,i,a) {
      //row.insertCell(i).appendChild( document.createTextNode(v)) ;
      row.insertCell(i).outerHTML='<th>'+v+'</th>' ;
    } );

    // Table Body
    let tbody = document.createElement('tbody');
    tbl.appendChild(tbody) ;
    parent.appendChild(tbl) ;
    super(tbl) ;
    this.collist = collist ;
  
  }
    
  fill( doclist ) {
    // typically called with doc.rows from allDocs
    let tbody = this.tname.querySelector('tbody') ;
    tbody.innerHTML = "" ;
    let collist = this.collist ;
    
    doclist.forEach( function(doc,n) {
      let row = tbody.insertRow(n) ;
      if ( n%2 == 1 ) {
        row.classList.add('odd') ;
      }
      collist.forEach( function(colname,i) {
        let c = row.insertCell(i) ;
        if ( colname in doc ) {
          c.innerHTML = doc[colname] ;
        } else {
          c.innerHTML = "" ;
        }
      }) ;
    });
  }
  
  }

var displayTable = new dataTable( "PatientTable", null, ["ID", "title", "text", "revision","id" ] ) ;

// Pouchdb routines
(function() {

  'use strict';

  var ENTER_KEY = 13;
  var newTodoDom = document.getElementById('new-field');
  var syncDom = document.getElementById('sync-wrapper');

  // EDITING STARTS HERE (you dont need to edit anything above this line)

  var db = new PouchDB('todos') ;
  console.log(db.adapter); // prints 'idb'
  console.log(db); // prints 'idb'
  var remoteCouch = 'http://localhost:5984/todos';

  db.changes({
    since: 'now',
    live: true
  }).on('change', showTodos);
  
  designDoc()

  // We have to create a new todo document and enter it in the database
  function addTodo(text) {
  var todo = {
    _id: new Date().toISOString(),
    title: text,
    completed: false
  };
  db.put(todo).then(function() {
      console.log('Successfully posted a todo!');
  }).catch( function(err) {
    console.log(err);
  });
  }
  
  // Design document
  function designDoc() {
  var desname = "_design/alpha"
  var des = {
    _id: desname,
    views: {
      text: {
        map: 'function(doc){ emit(doc.title,doc._id) }'
      }
    }
  };
  db.get(desname).then(function(doc){
    db.remove(doc)
    }).catch(function(err){
      console.log(err)
    })
  db.put(des).then( function () {
      console.log('Successfully posted a design!');
    }).catch( function(err) {
      console.log('Unuccessfully posted a design!');
  });
  }
  
  // Show the current list of todos by reading them from the database
  function showTodos() {
    db.allDocs({include_docs: true, descending: true}).then( function(doc) {
    displayTable.fill(doc.rows) ;
      redrawTodosUI(doc.rows);
    }).catch( function(err) {
      console.log(err);
    });
  }

  function checkboxChanged(todo, event) {
    todo.completed = event.target.checked;
    db.put(todo);
  }

  // User pressed the delete button for a todo, delete it
  function deleteButtonPressed(todo) {
    db.remove(todo);
  }

  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  function todoBlurred(todo, event) {
    var trimmedText = event.target.value.trim();
    if (!trimmedText) {
      db.remove(todo);
    } else {
      todo.title = trimmedText;
      db.put(todo);
    }
 }

  // Initialise a sync with the remote server
  function sync() {
    syncDom.setAttribute('data-sync-state', 'syncing');
    db.sync( remoteCouch, {
    live: true,
    retry: true
  }).on('change', function(info) {
    syncDom.setAttribute('data-sync-state', 'c');
  }).on('paused', function(err) {
    syncDom.setAttribute('data-sync-state', 'p');
  }).on('active', function() {
    syncDom.setAttribute('data-sync-state', 'a');
  }).on('denied', function(err) {
    syncDom.setAttribute('data-sync-state', 'd');
  }).on('complete', function(info) {
    syncDom.setAttribute('data-sync-state', '!');
  }).on('error', function(err) {
    syncDom.setAttribute('data-sync-state', 'Error');
  });
  }

  // EDITING STARTS HERE (you dont need to edit anything below this line)

  // There was some form or error syncing
  function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
  }

  // User has double clicked a todo, display an input so they can edit the title
  function todoDblClicked(todo) {
    var div = document.getElementById('li_' + todo._id);
    var inputEditTodo = document.getElementById('input_' + todo._id);
    div.className = 'editing';
    inputEditTodo.focus();
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  function todoKeyPressed(todo, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditTodo = document.getElementById('input_' + todo._id);
      inputEditTodo.blur();
    }
  }

  // Given an object representing a todo, this will create a list item
  // to display it.
  function createTodoListItem(todo) {
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(getProp(todo,"title")));
    label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, todo));

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(deleteLink);

    var inputEditTodo = document.createElement('input');
    inputEditTodo.id = 'input_' + todo._id;
    inputEditTodo.className = 'edit';
    inputEditTodo.value = todo.title;
    inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
    inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

    var li = document.createElement('li');
    li.id = 'li_' + todo._id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditTodo);

    if (todo.completed) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }
  
  function getProp( obj, prop ) {
    if (prop in obj ) {
      return obj[prop] ;
    } else {
      return prop+"?" ;
    }
  }

  function redrawTodosUI(todos) {
    var ul = document.getElementById('patient-list');
    ul.innerHTML = '';
    todos.forEach(function(todo) {
      ul.appendChild(createTodoListItem(todo.doc));
    });
  }

  function newTodoKeyPressHandler( event ) {
    if (event.keyCode === ENTER_KEY) {
      addTodo(newTodoDom.value);
      newTodoDom.value = '';
    }
  }

  function addEventListeners() {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
  }

  addEventListeners();
  showTodos();

  if (remoteCouch) {
    sync();
  }

})();

  
