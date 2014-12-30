yayhooray-porter
================

Ports the yayhooray database from Codeigniter to Tesla format

You must have the database dump saved in a local database - see src/mysql.js for the connection it expects, or change it here. Bit ghetto but yolo

Usage
-----

node port.js [options]

options:
- --port-users : ports all user accounts from mysql to mongo
- --port-relationships : ports buddy and ignore details for existing users from mysql to mongo
- --delete-relationships : delete all relationship data from mongo
- --delete-users : delete all users from mongo
- --drop-users-indexes : drop user collection indexes from mongo
- --port-threads : ports all threads (without comments!) from mysql to mongo
- --delete-threads : deletes all threads from mongo
- --delete-rangecache : deletes all entries in the range cache (always do this after deleting threads or comments). Running this won't break anything, but causes longer threads to load much slower on their _first load_ - after the first load the cache will populate itself
- --port-comments : ports all comments / posts from mysql to mongo
- --delete-comments : deletes all comments / posts
