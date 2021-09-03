var displayState ;
var patientId ;
var commentId ;
var editor = new MediumEditor('.editable');
var displayPatientOpen  ;
var displayPatientEdit  ;
  
var db = new PouchDB('mdb') ;
console.log(db.adapter); // prints 'idb'
console.log(db); // prints 'idb'
var remoteCouch = 'http://localhost:5984/mdb';

var PatientInfoList = [
    ["LastName","text"],
    ["FirstName","text"],
    ["DOB","date"],
    ["Weight(kg)","number"],
    ["Dx","text"], 
    ["Complaints","text"], 
    ["Procedure","text"],
    ["Length","time"],
    ["Equipment","text"],
    ["Sex","text"],
    ["Meds","text"],
    ["Allergies","text"],
    ["Surgeon","text"],
    ["ASA class","number"],
    ["phone","tel"], 
    ["email","email"], 
    ["address","text"], 
    ["Contact","text"] 
    ] ;

function showPatientList() {
    displayState = "PatientList" ;
    displayStateChange() ;
}

function showPatientEdit() {
    displayState = "PatientEdit" ;
    displayStateChange() ;
}

function showPatientOpen() {
    if ( patientId ) {
        displayState = "PatientOpen" ;
    } else {
        displayState = "PatientList" ;
    }
    displayStateChange() ;
}

function showCommentList() {
    displayState = "CommentList" ;
    displayStateChange() ;
}

function showCommentEdit() {
    displayState = "CommentEdit" ;
    displayStateChange() ;
}

function selectPatient( pid ) {
    patientId = pid ;
    setCookie( "patientId", pid ) ;
    if ( displayState == "PatientList" ) {
        let rows = document.getElementById("PatientTable").rows ;
        for ( let i = 0 ; i < rows.length ; ++i ) {
            if ( rows[i].cells[0].innerHTML == pid ) {
                rows[i].classList.add('choice') ;
            } else {
                rows[i].classList.remove('choice') ;
            }
        }
    }
    document.getElementById("editreviewpatient").disabled = false ;
}

function unselectPatient() {
    patientId = undefined ;
    deleteCookie( "patientId" ) ;
    commentId = undefined ;
    deleteCookie( "commentId" ) ;
    if ( displayState == "PatientList" ) {
        let rows = document.getElementById("PatientTable").rows ;
        for ( let i = 0 ; i < rows.length ; ++i ) {
            rows[i].classList.remove('choice') ;
        }
    }
    document.getElementById("editreviewpatient").disabled = true ;
}

function displayStateChange() {
    const dslist = [
        [ "PatientList", "patientListDiv" ] ,
        [ "PatientEdit", "patientEditDiv" ] ,
        [ "PatientOpen", "patientOpenDiv" ] ,
        [ "CommentList", "commentListDiv" ] ,
        [ "CommentEdit", "commentEditDiv" ] ,
    ] ;
    for (let ds of dslist) {
        if ( displayState == ds[0] ) {
            document.getElementById(ds[1]).style.display = "block" ;
        } else {
            document.getElementById(ds[1]).style.display = "none" ;
        }
    }

    setCookie("displayState",displayState) ;

    switch( displayState ) {
        case "PatientList":
            db.allDocs({include_docs: true, descending: true}).then( function(doc) {
                displayTable.fill(doc.rows) ;
                if ( patientId ) {
                    selectPatient( patientId ) ;
                } else {
                    unselectPatient() ;
                }
                }).catch( function(err) {
                    console.log(err);
                });
            break ;
        case "PatientOpen":
            if ( patientId ) {
                displayPatientOpen = new OpenPList( "PatientOpen", patientOpenSection ) ;
            } else {
                showPatientList() ;
            }
            break ;
        case "PatientEdit":
            displayPatientEdit = new EditPList( "PatientEdit", patientEditSection ) ;
            break ;
        case "CommentList":
            if ( patientId ) {
                CommentList() ;
            } else {
                showPatientList() ;
            }
            break ;
        case "CommentEdit":
            if ( patientId && commentId ) {
                CommentEdit() ;
            } else {
                showPatientList() ;
            }
            break ;

    }
}

function setCookie( cname, value ) {
  // From https://www.tabnine.com/academy/javascript/how-to-set-cookies-javascript/
    let date = new Date();
    date.setTime(date.getTime() + (400 * 24 * 60 * 60 * 1000)); // > 1year
    const expires = " expires=" + date.toUTCString();
    document.cookie = cname + "=" + value + "; " + expires + "; path=/";
}

function deleteCookie( cname ) {
    document.cookie = cname +  "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}

function getCookie( cname ) {
      const name = cname + "=";
      const cDecoded = decodeURIComponent(document.cookie); //to be careful
      const cArr = cDecoded .split('; ');
      let res ;
      cArr.forEach(val => {
          if (val.indexOf(name) === 0) res = val.substring(name.length);
      })
      return res;
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
        unselectPatient() ;
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
            let content = doc.doc ;
            if ( n%2 == 1 ) {
                row.classList.add('odd') ;
            }
            row.addEventListener( 'click', (e) => {
                selectPatient( content._id ) ;
            }) ;
            row.addEventListener( 'dblclick', (e) => {
                selectPatient( content._id ) ;
                showPatientOpen() ;
            }) ;
            collist.forEach( function(colname,i) {
                let c = row.insertCell(i) ;
                if ( colname in content ) {
                    c.innerHTML = content[colname] ;
                } else {
                    c.innerHTML = "" ;
                }
            }) ;
        });
    }
  
}

var displayTable = new dataTable( "PatientTable", patientListSection, ["_id", "LastName", "FirstName", "DOB","Dx","Procedure" ] ) ;

class FieldList {
    constructor( idname, parent, fieldlist ) {
        if ( parent == null ) {
            parent = document.body ;
        }
        this.fieldlist = fieldlist ;

        let uls = parent.getElementsByTagName('ul') ;
        if (uls.length > 0 ) {
            parent.removeChild(uls[0]) ;
        }

        let ul = document.createElement('ul') ;
        ul.setAttribute( "id", idname ) ;
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            let li = document.createElement("li") ;
            li.appendChild(document.createTextNode(this.fieldlist[i][0])) ;
            ul.appendChild(li) ;

            li = document.createElement("li") ;
            li.classList.add("odd") ;
            ul.appendChild(li)
        }
        this.ul = ul ;
        parent.appendChild(ul) ;
        this.li = this.ul.getElementsByTagName('li')
    }

    nonnullstring(s) {
        if (s == "" ) {
            return '\u200B' ;
        }
        return s ;
    }
}
  
class OpenPList extends FieldList {
    constructor( idname, parent ) {
        super( idname, parent, PatientInfoList ) ;
        this.ul.addEventListener( 'dblclick', (e) => {
            editPatient() ;
        }) ;

        db.get( patientId ).then(( function(doc) {
            for ( let i=0; i < this.fieldlist.length; ++i ) {
                this.li[2*i+1].appendChild(document.createTextNode(this.nonnullstring(doc[this.fieldlist[i][0]]))) ;
            }
        }).bind(this)).catch(( function(err) {
            console.log(err) ;
            for ( let i=0; i < this.fieldlist.length; ++i ) {
                this.li[2*i+1].appendChild(document.createTextNode(this.nonnullstring(''))) ;
            }
            }).bind(this));
    }
}

class EditPList extends FieldList {
    constructor( idname, parent ) {
        super( idname, parent, PatientInfoList ) ;
        document.getElementById("saveeditpatient").disabled = true ;
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            let inp = document.createElement("input") ;
            inp.type = this.fieldlist[i][1] ;
            this.li[2*i+1].appendChild(inp) ;
        }

        this.doc = { "_id": "" } ;
        if ( patientId ) {
            db.get( patientId ).then(
            ( function(doc) {
                this.doc = doc ;
            }).bind(this)
            ).then(( function() {
                for ( let i=0; i<this.fieldlist.length; ++i ) {
                    let contain = this.li[2*i+1].querySelector('input') ;
                    let field = this.fieldlist[i][0] ;
                    if ( field in this.doc ) {
                        contain.value = this.doc[field] ;
                    } else {
                        contain.value = "" ;
                    }
                }
            }).bind(this)
            ).catch( function(err) {
                // no matching record
                console.log(err);
            });
        }
        
        this.ul.addEventListener( 'input', (e) => {
            document.getElementById("saveeditpatient").disabled = false ;
            }) ;
    }
    
    tolist() {
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            this.doc[this.fieldlist[i][0]] =  this.li[2*i+1].querySelector('input').value ;
        }
    }
    
    toId() {
        this.doc._id = [ this.doc.LastName, this.doc.FirstName, this.doc.DOB ].join(";") ;
    }
    
    add() {
        this.tolist() ;
        if ( this.doc._id == "" ) {
            this.toId() ;
        }
        selectPatient( this.doc._id ) ;
        db.put(this.doc).then( function(d) {
            displayPatientEdit = null ;
            showPatientOpen() ;
            return true ;
        }).catch( function(err) {
            console.log(err) ;
        }) ;
    }
}

function newPatient() {
    unselectPatient() ;
    showPatientEdit() ;  
}

function editPatient() {
    displayPatientOpen = null ;
    showPatientEdit() ;
}

function unopenPatient() {
    displayPatientOpen = null ;
    showPatientList() ;
}

function savePatient() {
    displayPatientEdit.add() ;
    displayPatientEdit = null ;
    showPatientOpen() ;
}
  
function nosavePatient() {
    displayPatientEdit = null ;
    showPatientOpen() ;
}

function deletePatient() {
    if ( patientId ) {
        db.get( patientId ).then( function(doc) {
            if ( confirm("Delete patient " + doc.FirstName + " " + doc.LastName + ".\n -- Are you sure?") ) {
                return doc ;
            } else {
                throw "No delete" ;
            }           
        }).then( function(doc) { 
            return db.remove(doc) ;
        }).then( function() {
            unselectPatient() ;
            showPatientList() ;
        }).catch( function(err) {
            console.log(err) ;
        });
    }
}    
  
// Pouchdb routines
(function() {

    'use strict';

    // EDITING STARTS HERE (you dont need to edit anything above this line)

    db.changes({
        since: 'now',
        live: true
    }).on('change', showPatientList);

    // Initialise a sync with the remote server
    function sync() {
        let sync = document.getElementById("syncstatus") ;
        sync.innerHTML = "Sync status: syncing..." ;
        db.sync( remoteCouch, {
            live: true,
            retry: true
        }).on('change', function(info) {
            sync.innerHTML = "Sync status: changed";
        }).on('paused', function(err) {
            sync.innerHTML = "Sync status: paused";
        }).on('active', function() {
            sync.innerHTML = "Sync status: active";
        }).on('denied', function(err) {
            sync.innerHTML = "Sync status: denied "+err;
        }).on('complete', function(info) {
            sync.innerHTML = "Sync status: complete";
        }).on('error', function(err) {
            sync.innerHTML = "Sync status: error "+err ;
        });
    }

    if (remoteCouch) {
        sync();
    }
    displayState = getCookie( "displayState" ) ;
    displayStateChange() ;

})();

  
