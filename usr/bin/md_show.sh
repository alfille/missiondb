#!/bin/bash

wwwDir=/srv/www
helpDir=$wwwDir/help
topMd=$helpDir/header.md
bottomMd=$helpDir/footer.md
titleName=`grep -m1 "^#\s\+.*" $SCRIPT_FILENAME`

/usr/bin/pandoc -f gfm -t html -s $topMd $SCRIPT_FILENAME $bottomMd --metadata title="${titleName}"

exit 0
