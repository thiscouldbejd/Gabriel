# Gabriel

##Overview
Post Google-Docs To GitHub-Pages with Gabriel (The Markdown Angel).

This is a simple Google Apps 'Add-On' which converts a Google Doc to Markdown, then commits it (together with any associated images) to a Github Repo. Particularly useful for those using Github-Pages to host Jekyll Blogs yet wish to author posts in Google Docs.

It allows for simple permalinks, tagging and titles. You can also submit arbitary YAML if you're doing custom things in Jekyll. All Gabriel related metadata is stored in the DocumentProperties of the document, making it ideal for collaboration.

##Usage
You can download the code yourself for modification/testing/usage/debugging or grab it from the [Google Web Store](https://chrome.google.com/webstore/detail/gabriel-the-markdown-ange/okimajjeocnndpifeelaajdebkkbckff). Please note that this code is currently in late-alpha/early-beta. It's functional but a little rough around the edges (especially in handling the OAuth flow to Github).

##Naming
[Gabriel](https://en.wikipedia.org/wiki/Gabriel), 'The Markdown Angel' to make generating a publishing Markdown easier for non-technical or non-confident users. Named with a nod to [Jekyll & Hyde](https://en.wikipedia.org/wiki/Strange_Case_of_Dr_Jekyll_and_Mr_Hyde) as it is mainly used in conjunction with a Jekyll / Github-Pages repository on Github.

##Licensing
It is licensed under version 2.0 of the Apache License and contains code (thanks!) from the following projects (any alterations or modifications are marked in the code):

|File|From|Copyright|License|
|---|---|---|---|
|OAuth2.gs|[Github Repo](https://github.com/googlesamples/apps-script-oauth2)|Copyright 2014 Google Inc. All Rights Reserved.|Apache License, Version 2.0|
|Markdown.gs|[Github Repo](https://github.com/mangini/gdocs2md)|Copyright 2013 Google Inc. All Rights Reserved.|Apache License, Version 2.0|
|Underscore|[Website](http://underscorejs.org)|Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors|MIT License|
|js-yaml.min.gs|[Github Repo](https://github.com/nodeca/js-yaml)|Copyright (C) 2011-2015 by Vitaly Puzrin|MIT License|

The __logo__ incorporates the [Markdown Mark](https://github.com/dcurtis/markdown-mark) which is licensed under the Creative Commons License (CC0 UNIVERSAL PUBLIC DOMAIN DEDICATION LICENSE).

All else, __Copyright JD, 2015__.
