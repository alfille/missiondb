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

function tbarFunc(command) {
    document.execCommand(command, false, null);
}

class Tbar {
    constructor() {
        this.textdiv = null ;
        this.text = null ;
        this.toolbar = document.getElementById("editToolbar") ;
        this.toolbar.parentNode.removeChild(this.toolbar) ;
    }

    startedit( existingdiv ) {
        if ( this.textdiv === null ) {
            this.text = existingdiv.innerText || "" ;
            existingdiv.innerHTML = "" ;
            existingdiv.appendChild(this.toolbar) ;
            this.textdiv = document.createElement("div") ;
            this.textdiv.innerText = this.text ;
            this.textdiv.contentEditable = true ;
            existingdiv.appendChild(this.textdiv) ;
            this.toolbar = null ;
            return true ;
        }
        return false ;
    }

    saveedit() {
        if ( this.textdiv ) {
            this.text = this.textdiv.innerText ;
            this.canceledit() ;
        }
    }

    canceledit() {
        if ( this.textdiv ) {
            p = this.textdiv.parentNode ;
            this.toolbar = p.getElementById("editToolbar") ;
            p.removeChild( this.toolbar ) ;
            p.removeChild( this.textdiv ) ;
            this.textdiv = null ;
            p.innerText = this.text ;
        }
    }
}

var tBar = new Tbar() ;        

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
            if ( rows[i].getAttribute("data-id") == pid ) {
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
        [ "CommentImage2","commentImage2Div"] ,
    ] ;
    for (let ds of dslist) {
        if ( displayState == ds[0] ) {
            document.getElementById(ds[1]).style.display = "block" ;
        } else {
            document.getElementById(ds[1]).style.display = "none" ;
        }
    }

    setCookie("displayState",displayState) ;
    objectPatientOpen = null ;
    objectPatientEdit = null ;
    objectCommentList = null ;
    objectCommentOpen = null ;
    objectCommentImage= null ;

    switch( displayState ) {
        case "PatientList":            
            db.allDocs({include_docs: true, descending: true}).then( function(docs) {
				//console.log(docs) ;
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
            if ( patientId ) {
                objectPatientOpen = new OpenPList( "PatientOpen", patientOpenSection ) ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "PatientEdit":            
            objectPatientEdit = new EditPList( "PatientEdit", patientEditSection ) ;
            break ;
            
        case "CommentList":            
            if ( patientId ) {
                objectCommentList = new CommentList( commentListSection ) ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "CommentEdit":
            if ( patientId ) {
                updateComment() ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "CommentImage":
            if ( patientId ) {
                CommentImage() ;
            } else {
                showPatientList() ;
            }
            break ;
            
		default:
			showPatientList() ;
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

function isAndroid() {
	return navigator.userAgent.toLowerCase().indexOf("android") > -1 ;
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
            let c = r.cells[colNum].innerText ;
            if ( c == "" ) {
            } else if ( isNaN( Number(r.cells[colNum].innerText) ) ) {
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
                    return (rowA.cells[colNum].innerText - rowB.cells[colNum].innerText) * dir;
                };
                break;
            case 'string':
                compare = function(rowA, rowB) {
                    return rowA.cells[colNum].innerText > rowB.cells[colNum].innerText ? dir : -dir;
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
        let n = 0
        doclist.forEach( function(doc) {
            //console.log(doc);
            if (doc.id.split(";").length < 5 ) {
                let row = tbody.insertRow(n) ;
                let record = doc.doc ;
                n += 1 ;
                if ( n%2 == 1 ) {
                    row.classList.add('odd') ;
                }
                row.setAttribute("data-id",record._id) ;
                if (record._id == patientId) {
                    row.classList.add("choice") ;
                }
                row.addEventListener( 'click', (e) => {
                    console.log("select by click");
                }) ;
                row.addEventListener( 'dblclick', (e) => {
                    selectPatient( record._id ) ;
                    showPatientOpen() ;
                }) ;
                collist.forEach( function(colname,i) {
                    let c = row.insertCell(i) ;
                    if ( colname in record ) {
                        c.innerText = record[colname] ;
                    } else {
                        c.innerText = "" ;
                    }
                }) ;
            }
        });
    }
  
}

var objectPatientList = new dataTable( "PatientTable", patientListSection, ["LastName", "FirstName", "DOB","Dx","Procedure" ] ) ;

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
    let indexdoc ;
    if ( patientId ) {        
        db.get(patientId).then( function(doc) {
            indexdoc = doc ;
            return plusComments(false) ;
        }).then( function(docs) {
            let c = "Delete patient \n   " + indexdoc.FirstName + " " + indexdoc.LastName + "\n    " ;
            if (docs.rows.length == 0 ) {
                c += "(no comment records on this patient) \n   " ;
            } else {
                c += "also delete "+docs.rows.length+" comment records\n   " ;
            }
            c += "Are you sure?" ;
            if ( confirm(c) ) {
                return docs ;
            } else {
                throw "No delete" ;
            }           
        }).then( function(docs) {
            return Promise.all(docs.rows.map( function (doc) {
                return db.remove(doc.id,doc.value.rev) ;
            })) ;
        }).then( function() {
            return db.remove(indexdoc) ;
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
    console.log("new image");
    unselectComment() ;
    showCommentImage() ;  
}

function deleteComment() {
    if ( commentId ) {
        db.get( commentId ).then( function(doc) {
            if ( confirm("Delete comment on patient" + commentId.split(';')[2] + " " + commentId.split(';')[1] + " " +  + commentId.split(';')[4] + ".\n -- Are you sure?") ) {
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


function commentTitle( doc ) {
    if ( doc ) {
        let d = doc ;
        if ( "doc" in doc ) {
            d = doc.doc ;
        }
        return d._id.split(';').pop()+"  "+(d.author||"anonymous") ;
    }
    return "New comment" ;
}

function plusComments(attachments) {
    let skey = [ patientId, "Comment" ].join(";") ;
    doc = {
        startkey: skey,
        endkey: skey+'\\fff0'
    }
    if (attachments) {
        doc.include_docs = true ;
        doc.binary = true ;
        doc.attachments = true ;
    }
    return db.allDocs(doc) ;
}


class CommentList {
    constructor( parent ) {
        if ( parent == null ) {
            parent = document.body ;
        }
        let uls = parent.getElementsByTagName('ul') ;
        if (uls.length > 0 ) { // get rid of old
            parent.removeChild(uls[0]) ;
        }

        let ul = document.createElement('ul') ;
        ul.setAttribute( "id", "CommentList" ) ;
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

        // get comments
        let skey = [ patientId, "Comment" ].join(";") ;
        console.log(skey);
        console.log(skey+'\\fff0');
        
        plusComments(true).then(( function(docs) {
            console.log(docs);
            docs.rows.forEach(( function(comment, i) {
                console.log(comment);
                let li = document.createElement("li") ;
                li.appendChild(document.createTextNode(commentTitle(comment))) ;
                this.ul.appendChild(li) ;

                li = document.createElement("li") ;
                li.classList.add("odd") ;
                li.setAttribute("data-id", comment.id ) ;
                if ( commentId == comment.id ) {
                    li.classList.add("choice") ;
                }
                if ( "doc" in comment ) {
                    console.log(comment.doc);
                    if ("_attachments" in comment.doc ){
                        let img = document.createElement("img") ;
                        img.className = "fullimage" ;
                        img.src = URL.createObjectURL(comment.doc._attachments.image.data) ;
                        li.appendChild(img);
                    }
                    if ("text" in comment.doc ){
                        let div = document.createElement("div") ;
                        console.log(div) ;
                        console.log(comment.doc.text);
                        div.innerText = comment.doc.text ;
                        li.appendChild(div);
                    }
                }    
                
                li.addEventListener( 'click', (e) => {
                    selectComment( comment.id ) ;
                }) ;
                li.addEventListener( 'dblclick', (e) => {
                    if ( tBar.startedit(li) ) {
                        selectComment( comment.id ) ;
                    }
                }) ;
                this.ul.appendChild(li) ;
            }).bind(this)) ;
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

function updateComment() {
    if ( commentId ) {
        db.get( commentId ).then( function(doc) {
            commentEdit(doc) ;
        }).catch( function(err) {
            console.log(err);
            commentEdit(null) ;
        }) ;
    } else {
        commentEdit(null) ;
    }
}

function commentEdit(doc) {
    console.log(document.getElementById("commentEditLabel")) ;
    document.getElementById("commentEditLabel").innerHTML = commentTitle(doc)  ;
    if (doc) {
        console.log(doc) ;
        console.log("old comment") ;
        if ( "_attachments" in doc ) {
            document.getElementById("commentrEditImage").src = URL.createObjectURL(doc._attachments.image) ;
        }
        document.getElementById("commentEditField").innerText = doc.text ;
    } else {
        console.log("new comment") ;
        document.getElementById("commentEditField").innerText = "" ;
    }
}

function saveComment() {
    if ( commentId ) {
        db.get(commentId).then( function(doc) {
            doc.text = document.getElementById("commentEditField").innerText ;
            db.put( doc ) ;
        }).catch( function(err) {
            consult.log(err) ;
        });
    } else {
        db.put({
            _id: makeCommentId(),
            author: userName,
            text: document.getElementById("commentEditField").innerText,
        }).catch( function(err) {
            console.log(err);
        });
    }
    showCommentList() ;
}
  
function CommentImage() {
    let inp = document.getElementById("imageInput") ;
    if ( isAndroid() ) {
        inp.removeAttribute("capture") ;
    } else {
        inp.setAttribute("capture","environment");
    }
    console.log("commentimage");
}

function getImage() {
    let inp = document.getElementById("imageInput") ;
    inp.click() ;
}
    
   
//let urlObject;
function handleImage() {
    const files = document.getElementById('imageInput')
    const image = files.files[0];


//    if (urlObject) {
//        URL.revokeObjectURL(urlObject) // only required if you do that multiple times
//        urlObject = null ;
//    }

    // change display
    document.getElementById("commentImageDiv").style.display = "none" ;
    document.getElementById("commentImage2Div").style.display = "block" ;

    //urlObject = URL.createObjectURL(new Blob([arrayBuffer]));
//    urlObject = URL.createObjectURL(image);

//    document.getElementById('imageCheck').src = urlObject;
    document.getElementById('imageCheck').src = URL.createObjectURL(image) ;
     // see https://www.geeksforgeeks.org/html-dom-createobjecturl-method/
}    

function saveImage() {
    const files = document.getElementById('imageInput')
    const image = files.files[0];
    const text = document.getElementById("annotation").innerText ;

    db.put( {
        _id: makeCommentId(),
        text: text.value,
        author: userName,
        _attachments: {
            image: {
                content_type: image.type,
                data: image,
            }
        }
    }).then( function(doc) {
        console.log(doc) ;
        showCommentList() ;
    }).catch( function(err) {
        console.log(err) ;
        showCommentList() ;
    }) ;
    document.getElementById('imageCheck').src = "" ;
}

function setUserButton() {
	if ( userName ) {
		document.getElementById("userbutton").innerText = "User: "+userName ;
	} else {    
		document.getElementById("userbutton").innerText = "User?" ;
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
		document.getElementById("remotebutton").innerText = "Remote CouchDB: "+remoteCouch ;
	} else {    
		document.getElementById("remotebutton").innerText = "Remote CouchDB: http://host:5984" ;
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
            case "PatientOpen":
            case "CommentList":
                displayStateChange();
                break ;
            case "PatientEdit":
            case "CommentEdit":
                break ;
        }
    });

	// Initialise a sync with the remote server
	function sync() {
		let synctext = document.getElementById("syncstatus") ;
		synctext.innerText = "Sync status: syncing..." ;
		console.log(remoteCouch+'/mdb') ;
		db.sync( remoteCouch+'/mdb', {
			live: true,
			retry: true
		}).on('change', function(info) {
			synctext.innerText = "Sync status: changed";
		}).on('paused', function(err) {
			synctext.innerText = "Sync status: paused";
		}).on('active', function() {
			synctext.innerText = "Sync status: active";
		}).on('denied', function(err) {
			synctext.innerText = "Sync status: denied "+err;
		}).on('complete', function(info) {
			synctext.innerText = "Sync status: complete";
		}).on('error', function(err) {
			synctext.innerText = "Sync status: error "+err ;
		});
	}

    if (remoteCouch) {
        sync();
    }
    displayState = getCookie( "displayState" ) ;
    displayStateChange() ;
    patientId = getCookie( "patientId" ) ;
    if ( patientId ) {
        selectPatient( patientId ) ;
    }
    

})();

  
