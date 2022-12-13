# Update a database of databases
# Couchdb specific
# contains credentials

# {c} 2022 Paul H Alfille

import couchdb
import argparse # for parsing the command line

class Couchdb:
    def __init__(self,args):
        # args holds parsed command line args
        self.show = not args.quiet
        if args.ssl:
            if args.port==None:
                args.port=6984
            s = 'https://'+args.admin+':'+args.password+'@'+args.couchdb+':'+str(args.port)+'/'
            if self.show:
                print(s)
            self.server = couchdb.Server( s)
            self.address = s + ":" + str(args.port)
        else:
            if args.port==None:
                args.port=5984
            s = 'http://'+args.admin+':'+args.password+'@'+args.couchdb+':'+str(args.port)+'/'
            if self.show:
                print(s)
            self.server = couchdb.Server( s)
            self.address = s + ":" + str(args.port)

    def test(self):
        try:
            v = self.server.version()
            if self.show:
                print( "Success. Coucbdb version "+v )
            return True
        except:
            if self.show:
                print("Cannot connect to couchdb server")
            return False

    def getlist(self):
        self.dblist = [self.server[db] for db in self.server if db[0] != '_' and db!="databases" ]
        self.serverset = { '0'+db.name for db in self.dblist }
        if self.show:
            print("From server directory")
            print( "Databases",self.dblist )
            print( "id names",self.serverset )

    def create_db(self):
        # create or open database of databases called 'databases' 
        try:
            self.databases = self.server.create('databases')
        except:
            self.databases = self.server['databases']
        self.dbset = { doc for doc in self.databases }
        if self.show:
            print("From databases keys")
            print("id names",self.dbset)

    def delete_extra(self):
        # delete stale entries in the database
        # Use sets to find difference
        for did in self.dbset - self.serverset :
            doc = self.databases.get(did)
            if doc:
                self.databases.delete(doc)
        # update set
        self.dbset = { doc for doc in self.databases }

    def server_doc(self,db):
        doc = {
            'dbname': db.name,
            'server': self.address,
            '_id': '0'+db.name,
            }
        sdoc = db.get('m;0;;;')
        keys = ['Organization','Name','Location','StartDate','EndDate','Mission','Link']
        if sdoc:
            for k in keys:
                doc[k] = sdoc.get(k,"")
        else:
            for k in keys:
                doc[k] = ""
            doc['Name'] = db.name
        return doc
            

    def update(self):
        # update database entries (or create new ones)
        for db in self.dblist:
            db_id = '0'+db.name
            db_doc = self.databases.get(db_id)
            s_doc = self.server_doc(db)
            if db_doc:
                ## check and possibly update
                need_to_save = False
                for k,v in s_doc.items():
                    if ( k not in db_doc) or db_doc[k] != v:
                        db_doc[k] = v
                        need_to_save = True
                if need_to_save:
                    self.databases.save(db_doc)
            else:
                self.databases.save(s_doc)
                
def CommandLineArgs( cl ):
    cl.add_argument("-c","--couchdb",help="Couchdb server address (IP name or number)",default="emissionsystem.org")
    cl.add_argument("-s","--ssl",help="Use SSL encrpytion (https and port 6984)",action="store_true")
    cl.add_argument("-a","--admin",help="administrative user name",default="admin")
    cl.add_argument("-p","--password",help="admin password (required)",required=True)
    cl.add_argument("-n","--port",help="Couchdb server port number",type=int)
    cl.add_argument("-q","--quiet",help="Quiet -- suppress extraneous messages",action="store_true")

if __name__ == '__main__':
    """Setup argparser object to process the command line"""
    cl = argparse.ArgumentParser(description="Create database of databases in Couchdb, part of emissionsystem medical mission database, see https://github.com/alfille/emissionsystem",epilog="{c} 2022 by Paul H Alfille")
    CommandLineArgs( cl )
    args = cl.parse_args()
    cb = Couchdb(args)
    if not cb.test():
        exit(1)
    cb.getlist()
    cb.create_db()
    cb.delete_extra()
    cb.update()

