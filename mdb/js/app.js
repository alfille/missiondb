var displayState ;
var patientId ;
var commentId ;
var objectPatientOpen  ;
var objectPatientEdit  ;
var objectCommentList ;
var objectCommentEdit ;
var objectCommentImage ;
var userName ;
  
var db = new PouchDB('mdb') ;
console.log(db.adapter); // prints 'idb'
console.log(db); // prints 'idb'
var remoteCouch = 'http://192.168.1.5:5984/mdb';

var DbaseVersion = "v0" ;

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
    displayState = "PatientOpen" ;
    if ( patientId ) {
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

function showCommentImage() {
    displayState = "CommentImage" ;
    displayStateChange() ;
}

function selectPatient( pid ) {
    if ( patientId != pid ) {
        // change patient -- comments dont apply
        unselectComment() ;
    }
        
    patientId = pid ;
    setCookie( "patientId", pid ) ;
    if ( displayState == "PatientList" ) {
        // highlight the list row
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
    unselectComment() ;
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
        [ "CommentImage","commentImageDiv"] ,
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
            objectPatientOpen = null ;
            objectPatientEdit = null ;
            objectCommentList = null ;
            objectCommentOpen = null ;
            objectCommentImage= null ;
            
            db.allDocs({include_docs: true, descending: true}).then( function(docs) {
                objectPatientList.fill(docs.rows) ;
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
            objectPatientEdit = null ;
            objectCommentList = null ;
            objectCommentOpen = null ;
            objectCommentImage= null ;
            
            if ( patientId ) {
                objectPatientOpen = new OpenPList( "PatientOpen", patientOpenSection ) ;
            } else {
                showPatientList() ;
            }
            break ;
        case "PatientEdit":
            objectPatientOpen = null ;
            objectCommentList = null ;
            objectCommentOpen = null ;
            objectCommentImage= null ;
            
            objectPatientEdit = new EditPList( "PatientEdit", patientEditSection ) ;
            break ;
        case "CommentList":
            objectPatientOpen = null ;
            objectPatientEdit = null ;
            objectCommentEdit = null ;
            objectCommentImage= null ;
            
            if ( patientId ) {
                objectCommentList = new CommentList( commentListSection ) ;
            } else {
                showPatientList() ;
            }
            break ;
        case "CommentEdit":
            objectPatientOpen = null ;
            objectCommentList = null ;
            objectCommentOpen = null ;
            objectCommentImage= null ;
            
            if ( patientId && commentId ) {
                CommentEdit() ;
            } else {
                showPatientList() ;
            }
            break ;
        case "CommentImage":
            objectPatientOpen = null ;
            objectCommentList = null ;
            objectCommentOpen = null ;
            objectCommentEdit = null ;
           
            if ( patientId ) {
                CommentImage() ;
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
    constructor(tname) {
		this.dir = 1 ;
		this.lastth = -1 ;
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
            let record = doc.doc ;
            if ( n%2 == 1 ) {
                row.classList.add('odd') ;
            }
            row.addEventListener( 'click', (e) => {
                selectPatient( record._id ) ;
            }) ;
            row.addEventListener( 'dblclick', (e) => {
                selectPatient( record._id ) ;
                showPatientOpen() ;
            }) ;
            collist.forEach( function(colname,i) {
                let c = row.insertCell(i) ;
                if ( colname in record ) {
                    c.innerHTML = record[colname] ;
                } else {
                    c.innerHTML = "" ;
                }
            }) ;
        });
    }
  
}

var objectPatientList = new dataTable( "PatientTable", patientListSection, ["_id", "LastName", "FirstName", "DOB","Dx","Procedure" ] ) ;

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
            showPatientEdit() ;
        }) ;

        db.get( patientId ).then(( function(doc) {
            for ( let i=0; i < this.fieldlist.length; ++i ) {
                this.li[2*i+1].appendChild(document.createTextNode(this.nonnullstring(doc[this.fieldlist[i][0]]))) ;
            }
        }).bind(this)
        ).catch(( function(err) {
            console.log(err) ;
            for ( let i=0; i < this.fieldlist.length; ++i ) {
                this.li[2*i+1].appendChild(document.createTextNode(this.nonnullstring(''))) ;
            }
            }).bind(this)
        );
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
        this.doc._id = [ DbaseVersion, this.doc.LastName, this.doc.FirstName, this.doc.DOB ].join(";") ;
    }
    
    add() {
        this.tolist() ;
        if ( this.doc._id == "" ) {
            this.toId() ;
        }
        selectPatient( this.doc._id ) ;
        db.put(this.doc).then( function(d) {
            showPatientOpen() ;
        }).catch( function(err) {
            console.log(err) ;
        }) ;
    }
}

function newPatient() {
    unselectPatient() ;
    showPatientEdit() ;  
}

function savePatient() {
    objectPatientEdit.add() ;
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

function newComment() {
    unselectComment() ;
    showCommentEdit() ;  
}

function newImage() {
    console.log("new iamge");
    unselectComment() ;
    showCommentImage() ;  
}

function saveComment() {
    objectCommentEdit.add() ;
}
  
function deleteComment() {
    if ( commentId ) {
        db.get( commentId ).then( function(doc) {
            if ( confirm("Delete comment on psatient" + commentId.split(';')[2] + " " + commentId.split(';')[1] + " " +  + commentId.split(';')[4] + ".\n -- Are you sure?") ) {
                return doc ;
            } else {
                throw "No delete" ;
            }           
        }).then( function(doc) { 
            return db.remove(doc) ;
        }).then( function() {
            unselectComment() ;
            showCommentList() ;
        }).catch( function(err) {
            console.log(err) ;
        });
    }
}    
    
function selectComment( cid ) {
    commentId = cid ;
    setCookie( "commentId", cid ) ;
    if ( displayState == "CommentList" ) {
        // highlight the list row
        let li = document.getElementById("CommentList").li ;
		if ( li && (li.length > 0) ) {
			for ( let l of li ) {
				if ( l.getAttribute("data-id") == commentId ) {
					l.classList.add('choice') ;
				} else {
					l.classList.remove('choice') ;
				}
			}
		}
    }
    document.getElementById("editreviewcomment").disabled = false ;
}

function unselectComment() {
    commentId = undefined ;
    deleteCookie( "commentId" ) ;
    if ( displayState == "CommentList" ) {
        let li = document.getElementById("CommentList").li ;
        if ( li && (li.length > 0) ) {
			for ( let l of li ) {
				l.classList.remove('choice') ;
			}
		}
    }
    document.getElementById("editreviewcomment").disabled = true ;
}


class CommentCommon {
    constructor( parent, pageid ) {
        if ( parent == null ) {
            parent = document.body ;
        }
        let uls = parent.getElementsByTagName('ul') ;
        if (uls.length > 0 ) {
            console.log(usl) ;
            parent.removeChild(uls[0]) ;
        }

        let ul = document.createElement('ul') ;
        ul.setAttribute( "id", pageid ) ;
        let li = document.createElement("li") ;
        li.appendChild(document.createTextNode("Notes and Comments")) ;
        ul.appendChild(li) ;

        li = document.createElement("li") ;
        li.classList.add("odd") ;
        let id = patientId.split(';');
        li.appendChild(document.createTextNode("Patient: "+id[1]+", "+id[2]+"    DOB: "+id[3])) ;

        ul.appendChild(li) ;

        this.ul = ul ;
        parent.appendChild(ul) ;
    }
}

class CommentList extends CommentCommon {
    constructor( parent ) {
        super( parent, "CommentList" ) ;

        // get comments
        let startkey = [ patientId, "Comment" ].join(";") ;
        db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: startkey,
            endkey: startkey+';\fff0'
        }).then(( function(docs) {
            console.log(docs);
            docs.rows.forEach( function(comment) {
                console.log(comment) ;
            }) ;
            docs.rows.forEach( function(comment, i) {
                let li = document.createElement("li") ;
                li.appendChild(document.createTextNode(comment._id.split(';').pop()+"  "+(comment.author||"anonymous"))) ;
                ul.appendChild(li) ;

                li = document.createElement("li") ;
                li.classList.add("odd") ;
                li.setAttribute("data-id", comment._id ) ;
                if ( commentId == comment._id ) {
                    li.classList.add("choice") ;
                }
                    
                li.addEventListener( 'click', (e) => {
                    selectComment( comment._id ) ;
                }) ;
                li.addEventListener( 'dblclick', (e) => {
                    selectComment( comment._id ) ;
                    showCommentEdit() ;
                }) ;
                ul.appendChild(li) ;
            }) ;
            this.li = this.ul.getElementsByTagName('li')
                
        }).bind(this)
        ).catch( function(err) {
            console.log(err) ;
        }); 
    }
}

function makeCommentId() {
    let d = new Date().toISOString() ;
    return [ patientId, "Comment" , d ].join(";") ;
}

class EditComment extends CommentCommon{
    constructor( parent ) {
        super( parent, "CommentEdit" ) ;

        let li = document.createElement("li") ;
        let li2 = document.createElement("li") ;
        
        this.doc = {} ;

        if ( commentId ) {
            db.get( commentId ).then (( function(doc) {
                li.appendChild(document.createTextNode("New comment")) ;
                this.ul.appendChild(li) ;
                li2.appendChild( this.commentfield("") );
                this.appendChild(li2) ;
            }).bind(this)
            );
                
        } else {
            li.appendChild(document.createTextNode("New comment")) ;
            this.ul.appendChild(li) ;
            
            li2.appendChild( this.commentfield("") ) ;
            this.appendChild(li2) ;
        }
            
        li.appendChild(document.createTextNode("Notes and Comments")) ;
        this.ul.appendChild(li) ;
        
        // get comment
        db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: startkey,
            endkey: startkey+';\fff0'
        }).then(( function(docs) {
            console.log(docs);
            doc.rows.forEach( function(v, i) {
                console.log(v) ;
            }) ;
            doc.rows.forEach( function(v, i) {
                let li = document.createElement("li") ;
                li.appendChild(document.createTextNode(v._id.split(';').pop()+"  "+(v.author||"anonymous"))) ;
                ul.appendChild(li) ;

                li = document.createElement("li") ;
                li.classList.add("odd") ;
                li.setAttribute("data-id", v._id ) ;
                if ( commentId == v._id ) {
                    li.classList.add("choice") ;
                }
                    
                li.addEventListener( 'click', (e) => {
                    selectComment( v._id ) ;
                }) ;
                li.addEventListener( 'dblclick', (e) => {
                    selectComment( v._id ) ;
                    showCommentEdit() ;
                }) ;
                ul.appendChild(li) ;
            }) ;
            this.li = this.ul.getElementsByTagName('li')
                
        }).bind(this)
        ).catch( function(err) {
            console.log(err) ;
        }); 
    }
}

function CommentImage() {
    console.log("commentimage");
}
   
function handleImage() {
     const files = document.getElementById('imageInput')
     const image = files.files[0];
     console.log(files) ;
     console.log(files.type) ;
     console.log(image) ;
     console.log(image.type) ;
     // see https://www.geeksforgeeks.org/html-dom-createobjecturl-method/
}    


function setUserButton() {
	if ( userName ) {
		document.getElementById("userbutton").innerHTML = "User: "+userName ;
	} else {    
		document.getElementById("userbutton").innerHTML = "User?" ;
	}
}
function setUser() {
	let un = prompt( "User name:",userName ) ;
	if ( un ) {
		userName = un ;
		setCookie( "userName", un ) ;
		setUserButton() ;
	}
}
userName = getCookie( "userName" ) ;
setUserButton() ;
		  

function setRemoteButton() {
	if ( remoteCouch ) {
		document.getElementById("remotebutton").innerHTML = "Remote CouchDB: "+remoteCouch ;
	} else {    
		document.getElementById("remotebutton").innerHTML = "Remote CouchDB: http://host:5984" ;
	}
}
function setRemote() {
	let un = prompt( "Remote CouchDB address:", remoteCouch ) ;
	let rem = remoteCouch ;
	if ( un ) {

		setCookie( "remoteCouch", un ) ;
		setRemoteButton() ;
		// start page over with new remote
		window.location.reload(false) ;
	}
}

remoteCouch = getCookie( "remoteCouch" ) ;
setRemoteButton() ;
		  


// Pouchdb routines
(function() {

    'use strict';

    db.changes({
        since: 'now',
        live: true
    }).on('change', function(change) {
        switch (displayState) {
            case "PatientList":
                showPatientList();
                break ;
            case "PatientOpen":
            case "PatientEdit":
            case "CommentList":
            case "CommentEdit":
                break ;
        }
    });

	// Initialise a sync with the remote server
	function sync() {
		let synctext = document.getElementById("syncstatus") ;
		synctext.innerHTML = "Sync status: syncing..." ;
		console.log(remoteCouch+'/mdb') ;
		db.sync( remoteCouch+'/mdb', {
			live: true,
			retry: true
		}).on('change', function(info) {
			synctext.innerHTML = "Sync status: changed";
		}).on('paused', function(err) {
			synctext.innerHTML = "Sync status: paused";
		}).on('active', function() {
			synctext.innerHTML = "Sync status: active";
		}).on('denied', function(err) {
			synctext.innerHTML = "Sync status: denied "+err;
		}).on('complete', function(info) {
			synctext.innerHTML = "Sync status: complete";
		}).on('error', function(err) {
			synctext.innerHTML = "Sync status: error "+err ;
		});
	}

    if (remoteCouch) {
        sync();
    }
    displayState = getCookie( "displayState" ) ;
    displayStateChange() ;
    patientId = getCookie( "patientd" ) ;
    if ( patientId ) {
        selectPatient( patientId ) ;
    }
    

})();

  
