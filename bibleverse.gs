// Setup toolbar menu
function onOpen() {
  SlidesApp.getUi().createMenu("Bible Verses")
      .addItem("Show Bible Verses", "showSidebar")
      .addToUi();
}

function showSidebar() {
  var sidebar = HtmlService.createHtmlOutputFromFile("sidebar")
      .setTitle("Bible Verses")
      .setWidth(300);
  SlidesApp.getUi().showSidebar(sidebar);
}

function addVerse(passage, version) {
  // Error checking
  checkPassage(passage);
  checkSelection();
  
  var presentation = SlidesApp.getActivePresentation();
  var selection = presentation.getSelection();
  var textRange = selection.getTextRange();
  
  // Adds verse to textbox
  var textArray = splitText(getVerse(passage, version));
  
  textRange.appendText(textArray[0]);
  
  var index = getPageIndex(selection.getCurrentPage()) + 1;
  var parent = presentation.getSlides()[index-1];
  var title = parent.getPageElements()[0].asShape().getText().asString();
  var layout = parent.getLayout();
  
  for (var i=textArray.length-1; i >= 1; i--) {
    presentation.insertSlide(index, layout);
    getTitleElement(index).appendText(title.replace(/\r?\n|\r/," ") + "cont.");
    getTextElement(index).appendText(textArray[i]);
  }

  getTextElement(index+textArray.length-2).appendText("("+passage+")");
}

function getVerse(passage, version) {
  var response = UrlFetchApp.fetch("http://getbible.net/json?passage=" + passage + "&version=" + version +"&raw=true");
  var json = response.getContentText();
  var data = JSON.parse(json);
  
  return extractVerses(data);
}

// Gets verses from json data
function extractVerses(data) {
  var finalVerse = "";
  
  // Loop through all chapters
  for (var i=0; i < data.book.length; i++) {
    var chapter = data.book[i].chapter;
    
    // Loop through all verses
    for (var verse in chapter) {
      if (chapter.hasOwnProperty(verse)) {
        
        // Get rid of newline characters
        finalVerse += chapter[verse].verse.replace(/\r?\n|\r/," ");
      }
    }
  }
  return finalVerse;
}

// Check if user selected a text box
function checkSelection() {
  var selection = SlidesApp.getActivePresentation().getSelection();
  var textRange = selection.getTextRange();
  if (textRange == null) {
    throw "SelectionError";
  }
}

// Check if passage is valid
function checkPassage(passage) {
  var response = UrlFetchApp.fetch("http://getbible.net/json?passage=" + passage + "&raw=true");
  if (response.getContentText() == "NULL") {
    throw "PassageError";
  }
}

function splitText(text) {
  var wordLimit = 165;
  var textArray = text.split(" ");
  var wordCount = textArray.length;
  var verseArray = [];
  
  var startIndex = 0;
  while (startIndex < wordCount) {
    var endIndex = startIndex + wordLimit;
    if (endIndex > wordCount) {
      endIndex = wordCount;
    }
    verseArray.push(textArray.slice(startIndex,endIndex).join(" "));
    startIndex += wordLimit;
  }
  return verseArray;
}

function getPageIndex(page) {
  var slides = SlidesApp.getActivePresentation().getSlides();
  var idArray = [];
  for (var i=0; i < slides.length; i++) {
    idArray.push(slides[i].getObjectId());
  }
  return idArray.indexOf(page.getObjectId());
}

function getTitleElement(pageIndex) {
  return SlidesApp.getActivePresentation().getSlides()[pageIndex].getPageElements()[0].asShape().getText();
}

function getTextElement(pageIndex) {
  return SlidesApp.getActivePresentation().getSlides()[pageIndex].getPageElements()[1].asShape().getText();
}