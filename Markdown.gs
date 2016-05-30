// ** GitScript **
// GitScript.Repo: Gabriel
// GitScript.File: Markdown.gs
// ** GitScript **

/*
Copyright 2013 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
Modifications made to code to:
- Added support for Github-flavoured Markdown with strikethrough.
- Added check for formatting only whitespace characters (removed formatting!)
- remove emailing sections in 'ConvertToMarkdown' function;
- add assets_Path parameter to 'ConvertToMarkdown' function and into processParagraph, allowing image paths in Jekyll;
- add assets_Namespace parameter to 'ConvertToMarkdown' and into processParagraph, ensuring no namespace clashes when adding image assets;
- replacing apostrophes / single-quotation marks
- changed image handling to include 'safe' name & use .copy()

Original version can be found at: https://github.com/mangini/gdocs2md
*/

function ConvertToMarkdown(assets_Path, assets_Namespace) {
  if (assets_Path) {
    assets_Path = "{{ site.url }}/" + assets_Path + "/";
  } else {
    assets_Path = "";
  }
  
  var value = {};
  
  var numChildren = DocumentApp.getActiveDocument().getActiveSection().getNumChildren();
  var text = "";
  var inSrc = false;
  var inClass = false;
  var globalImageCounter = 0;
  var globalListCounters = {};
  // edbacher: added a variable for indent in src <pre> block. Let style sheet do margin.
  var srcIndent = "";
  
  value.attachments = [];
  
  // Walk through all the child elements of the doc.
  for (var i = 0; i < numChildren; i++) {
    var child = DocumentApp.getActiveDocument().getActiveSection().getChild(i);
    var result = processParagraph(i, child, inSrc, globalImageCounter, globalListCounters, assets_Path, assets_Namespace);
    globalImageCounter += (result && result.images) ? result.images.length : 0;
    if (result!==null) {
      if (result.sourcePretty==="start" && !inSrc) {
        inSrc=true;
        text+="<pre class=\"prettyprint\">\n";
      } else if (result.sourcePretty==="end" && inSrc) {
        inSrc=false;
        text+="</pre>\n\n";
      } else if (result.source==="start" && !inSrc) {
        inSrc=true;
        text+="<pre>\n";
      } else if (result.source==="end" && inSrc) {
        inSrc=false;
        text+="</pre>\n\n";
      } else if (result.inClass==="start" && !inClass) {
        inClass=true;
        text+="<div class=\""+result.className+"\">\n";
      } else if (result.inClass==="end" && inClass) {
        inClass=false;
        text+="</div>\n\n";
      } else if (inClass) {
        text+=result.text+"\n\n";
      } else if (inSrc) {
        text+=(srcIndent+escapeHTML(result.text)+"\n");
      } else if (result.text && result.text.length>0) {
        text+=result.text+"\n\n";
      }
      
      if (result.images && result.images.length>0) {
        for (var j=0; j<result.images.length; j++) {
          value.attachments.push( {
            "fileName": result.images[j].name,
            "mimeType": result.images[j].type,
            "content": result.images[j].bytes } );
        }
      }
    } else if (inSrc) { // support empty lines inside source code
      text+='\n';
    }
  }
  
  value.contents = text;
  
  return value;
}

function escapeHTML(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Process each child element (not just paragraphs).
function processParagraph(index, element, inSrc, imageCounter, listCounters, assets_Path, assets_Namespace) {
  // First, check for things that require no processing.
  if (element.getNumChildren()==0) {
    return null;
  }  
  // Punt on TOC.
  if (element.getType() === DocumentApp.ElementType.TABLE_OF_CONTENTS) {
    return {"text": "[[TOC]]"};
  }
  
  // Set up for real results.
  var result = {};
  var pOut = "";
  var textElements = [];
  var imagePrefix = "img_";
  if (assets_Namespace) imagePrefix = assets_Namespace + "_" + imagePrefix;
  
  // Handle Table elements. Pretty simple-minded now, but works for simple tables.
  // Note that Markdown does not process within block-level HTML, so it probably 
  // doesn't make sense to add markup within tables.
  if (element.getType() === DocumentApp.ElementType.TABLE) {
    textElements.push("<table>\n");
    var nCols = element.getChild(0).getNumCells();
    for (var i = 0; i < element.getNumChildren(); i++) {
      textElements.push("  <tr>\n");
      // process this row
      for (var j = 0; j < nCols; j++) {
        textElements.push("    <td>" + element.getChild(i).getChild(j).getText() + "</td>\n");
      }
      textElements.push("  </tr>\n");
    }
    textElements.push("</table>\n");
  }
  
  // Process various types (ElementType).
  for (var i = 0; i < element.getNumChildren(); i++) {
    var t=element.getChild(i).getType();
    
    if (t === DocumentApp.ElementType.TABLE_ROW) {
      // do nothing: already handled TABLE_ROW
    } else if (t === DocumentApp.ElementType.TEXT) {
      var txt=element.getChild(i);
      pOut += txt.getText();
      textElements.push(txt);
    } else if (t === DocumentApp.ElementType.INLINE_IMAGE) {
      result.images = result.images || [];
      var img = element.getChild(i).copy();
      // image/png
      var contentType = img.getBlob().getContentType();
      var extension = "";
      if (/\/png$/.test(contentType)) {
        extension = ".png";
      } else if (/\/gif$/.test(contentType)) {
        extension = ".gif";
      } else if (/\/jpe?g$/.test(contentType)) {
        extension = ".jpg";
      } else {
        throw "Unsupported image type: "+contentType;
      }
      var name = imagePrefix + imageCounter + extension;
      imageCounter++;
      textElements.push('![image alt text](' + assets_Path + name + ')');
      result.images.push( {
        "bytes": img.getBlob().getBytes(),
        "type": contentType,
        "name": name});
    } else if (t === DocumentApp.ElementType.PAGE_BREAK) {
      // ignore
    } else if (t === DocumentApp.ElementType.HORIZONTAL_RULE) {
      textElements.push('* * *\n');
    } else if (t === DocumentApp.ElementType.FOOTNOTE) {
      textElements.push(' (NOTE: '+element.getChild(i).getFootnoteContents().getText()+')');
    } else {
      throw "Paragraph "+index+" of type "+element.getType()+" has an unsupported child: "
      +t+" "+(element.getChild(i)["getText"] ? element.getChild(i).getText():'')+" index="+index;
    }
  }

  if (textElements.length==0) {
    // Isn't result empty now?
    return result;
  }
  
  // evb: Add source pretty too. (And abbreviations: src and srcp.)
  // process source code block:
  if (/^\s*---\s+srcp\s*$/.test(pOut) || /^\s*---\s+source pretty\s*$/.test(pOut)) {
    result.sourcePretty = "start";
  } else if (/^\s*---\s+src\s*$/.test(pOut) || /^\s*---\s+source code\s*$/.test(pOut)) {
    result.source = "start";
  } else if (/^\s*---\s+class\s+([^ ]+)\s*$/.test(pOut)) {
    result.inClass = "start";
    result.className = RegExp.$1;
  } else if (/^\s*---\s*$/.test(pOut)) {
    result.source = "end";
    result.sourcePretty = "end";
    result.inClass = "end";
  } else if (/^\s*---\s+jsperf\s*([^ ]+)\s*$/.test(pOut)) {
    result.text = '<iframe style="width: 100%; height: 340px; overflow: hidden; border: 0;" '+
                  'src="http://www.html5rocks.com/static/jsperfview/embed.html?id='+RegExp.$1+
                  '"></iframe>';
  } else {

    prefix = findPrefix(inSrc, element, listCounters);
  
    var pOut = "";
    for (var i=0; i<textElements.length; i++) {
      pOut += processTextElement(inSrc, textElements[i]);
    }

    // replace Unicode Double-quotation marks
    pOut = pOut.replace('\u201d', '"').replace('\u201c', '"');
    // replace Unicode apostrophes/Single-quotation marks
    pOut = pOut.replace("\u2018", "'").replace("\u2019", "'");
 
    result.text = prefix+pOut;
  }
  
  return result;
}

// Add correct prefix to list items.
function findPrefix(inSrc, element, listCounters) {
  var prefix="";
  if (!inSrc) {
    if (element.getType()===DocumentApp.ElementType.PARAGRAPH) {
      var paragraphObj = element;
      switch (paragraphObj.getHeading()) {
        // Add a # for each heading level. No break, so we accumulate the right number.
        case DocumentApp.ParagraphHeading.HEADING6: prefix+="#";
        case DocumentApp.ParagraphHeading.HEADING5: prefix+="#";
        case DocumentApp.ParagraphHeading.HEADING4: prefix+="#";
        case DocumentApp.ParagraphHeading.HEADING3: prefix+="#";
        case DocumentApp.ParagraphHeading.HEADING2: prefix+="#";
        case DocumentApp.ParagraphHeading.HEADING1: prefix+="# ";
        default:
      }
    } else if (element.getType()===DocumentApp.ElementType.LIST_ITEM) {
      var listItem = element;
      var nesting = listItem.getNestingLevel()
      for (var i=0; i<nesting; i++) {
        prefix += "    ";
      }
      var gt = listItem.getGlyphType();
      // Bullet list (<ul>):
      if (gt === DocumentApp.GlyphType.BULLET
          || gt === DocumentApp.GlyphType.HOLLOW_BULLET
          || gt === DocumentApp.GlyphType.SQUARE_BULLET) {
        prefix += "* ";
      } else {
        // Ordered list (<ol>):
        var key = listItem.getListId() + '.' + listItem.getNestingLevel();
        var counter = listCounters[key] || 0;
        counter++;
        listCounters[key] = counter;
        prefix += counter+". ";
      }
    }
  }
  return prefix;
}

function processTextElement(inSrc, txt) {
  if (typeof(txt) === 'string') {
    return txt;
  }
  
  var pOut = txt.getText();
  if (! txt.getTextAttributeIndices) {
    return pOut;
  }
  
  var attrs=txt.getTextAttributeIndices();
  var lastOff=pOut.length;

  for (var i=attrs.length-1; i>=0; i--) {
  
    var off=attrs[i];
    var url=txt.getLinkUrl(off);
    var font=txt.getFontFamily(off);
    if (url) {  // start of link
      if (i>=1 && attrs[i-1]==off-1 && txt.getLinkUrl(attrs[i-1])===url) {
        // detect links that are in multiple pieces because of errors on formatting:
        i-=1;
        off=attrs[i];
        url=txt.getLinkUrl(off);
      }
      pOut=pOut.substring(0, off)+'['+pOut.substring(off, lastOff)+']('+url+')'+pOut.substring(lastOff);
    } else if (font) {
      if (!inSrc && font===font.COURIER_NEW) {
        while (i>=1 && txt.getFontFamily(attrs[i-1]) && txt.getFontFamily(attrs[i-1])===font.COURIER_NEW) {
          // detect fonts that are in multiple pieces because of errors on formatting:
          i-=1;
          off=attrs[i];
        }
        pOut=pOut.substring(0, off)+'`'+pOut.substring(off, lastOff)+'`'+pOut.substring(lastOff);
      }
    }
    
    if (lastOff && !isEmpty(pOut.substring(off, lastOff))) {
    
      if (txt.isBold(off)) {
        var d1 = d2 = "**";
        if (txt.isItalic(off)) {
          d1 += "_"; d2 = "_" + d2;
        }
        if (txt.isStrikethrough(off)) {
          d1 += "~~"; d2 = "~~" + d2;
        }
        pOut=pOut.substring(0, off)+d1+pOut.substring(off, lastOff)+d2+pOut.substring(lastOff);
      } else if (txt.isStrikethrough(off)) {
        pOut=pOut.substring(0, off)+'~~'+pOut.substring(off, lastOff)+'~~'+pOut.substring(lastOff);
      } else if (txt.isItalic(off)) {
        pOut=pOut.substring(0, off)+'*'+pOut.substring(off, lastOff)+'*'+pOut.substring(lastOff);
      }
      
    }
    
    lastOff = off;
    
  }
  return pOut;
}

function isEmpty(str) {
    return str.replace(/^\s+|\s+$/gm,'').length == 0;
}
