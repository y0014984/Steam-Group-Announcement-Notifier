
// GLOBAL CONSTANTS
var SPREADSHEET_URL = "";
var SHEET_NAME = "";
var GROUP_URL = "";
var RECIPIENTS = ["","",""];

/* ================================================================================ */

function main()
{
  arrayIncludePrototype();
  
  var oldAnnouncements = getAllValuesOnSheet(SPREADSHEET_URL, SHEET_NAME); 
  var newAnnouncements = getSteamGroupAnnouncements(GROUP_URL);
  
  var oldAnnouncementsIds = [];
  
  for (var n in oldAnnouncements){oldAnnouncementsIds.push(oldAnnouncements[n][0])};
  
  for(var n in newAnnouncements)
  {
    if(!oldAnnouncementsIds.includes(newAnnouncements[n][0]))
    {
      Logger.log("New announcement found: " + newAnnouncements[n][0]);
      
      appendRowToSheet(SPREADSHEET_URL, SHEET_NAME, newAnnouncements[n]);
      
      sendEmailNotification(RECIPIENTS, GROUP_URL, newAnnouncements[n]);
    };
  };
};

/* ================================================================================ */

function arrayIncludePrototype()
{
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      value: function(searchElement, fromIndex) {
        
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }
        
        // 1. Let O be ? ToObject(this value).
        var o = Object(this);
        
        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;
        
        // 3. If len is 0, return false.
        if (len === 0) {
          return false;
        }
        
        // 4. Let n be ? ToInteger(fromIndex).
        //    (If fromIndex is undefined, this step produces the value 0.)
        var n = fromIndex | 0;
        
        // 5. If n ≥ 0, then
        //  a. Let k be n.
        // 6. Else n < 0,
        //  a. Let k be len + n.
        //  b. If k < 0, let k be 0.
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        
        function sameValueZero(x, y) {
          return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
        }
        
        // 7. Repeat, while k < len
        while (k < len) {
          // a. Let elementK be the result of ? Get(O, ! ToString(k)).
          // b. If SameValueZero(searchElement, elementK) is true, return true.
          if (sameValueZero(o[k], searchElement)) {
            return true;
          }
          // c. Increase k by 1. 
          k++;
        }
        
        // 8. Return false
        return false;
      }
    });
  }
};

/* ================================================================================ */

function appendRowToSheet(SPREADSHEET_URL, SHEET_NAME, row)
{
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var sheet = ss.getSheetByName(SHEET_NAME);

  sheet.appendRow(row);
}

/* ================================================================================ */

function getAllValuesOnSheet(SPREADSHEET_URL, SHEET_NAME)
{
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var sheet = ss.getSheetByName(SHEET_NAME);

  var range = sheet.getDataRange();
  var values = range.getValues();
  
  if (values.length == 1 && values[0] == "")
  {
    titleRow = ["id", "type", "title", "description", "pubdate", "author", "link"];
    sheet.appendRow(titleRow);
    values = [titleRow];
  };
  
  return values;
}

/* ================================================================================ */

function getSteamGroupAnnouncements(GROUP_URL)
{
  var groupUrlString = GROUP_URL.split("/").reverse()[0];
  
  var url = Utilities.formatString("https://steamcommunity.com/groups/%s/rss", groupUrlString);
  var xml = UrlFetchApp.fetch(url).getContentText();
  var document = XmlService.parse(xml);  
  var root = document.getRootElement();
  var atom = XmlService.getNamespace("http://www.w3.org/2005/Atom");

  var channel = root.getChild("channel");
  var items = channel.getChildren("item");
  
  var results = [];
  for (var i = 0; i < items.length; i++)
  {
    var id = items[i].getChild("link").getText().split("/").reverse()[0];
    var type = items[i].getChild("link").getText().split("/").reverse()[2];
    var title = items[i].getChild("title").getText();
    var description = items[i].getChild("description").getText();
    var pubDate = items[i].getChild("pubDate").getText();
    try
    {
      var author = items[i].getChild("author").getText();
    }
    catch(e)
    {
      var author = "";
    };
    var link = items[i].getChild("link").getText();
    
    results.push([id, type, title, description, pubDate, author, link]);
  }
  
  return results;
};

/* ================================================================================ */

function sendEmailNotification(RECIPIENTS, GROUP_URL, announcement)
{
  //announcement = ["id", "type", "title", "description", "pubdate", "author", "link"];
  
  var groupUrlString = GROUP_URL.split("/").reverse()[0];
  
  var subject = "";
  
  if (announcement[1] == "events")
  {
	subject = "New Event in Steam Group " + groupUrlString;
  };
  
  if (announcement[1] == "announcements")
  {
	subject = "New Announcement in Steam Group " + groupUrlString;
  };
  
  var body = "" +
    "ID: " + announcement[0] + "<br><br>" + 
    "Type: " + announcement[1] + "<br><br>" + 
    "Title: " + announcement[2] + "<br><br>" + 
    "Description: " + announcement[3] + "<br><br>" + 
    "PubDate: " + announcement[4] + "<br><br>" + 
    "Author: " + announcement[5] + "<br><br>" + 
    "Link: " + "<a href='" + announcement[6] + "'>" + announcement[6] + "</a>";
  
  for (var n in RECIPIENTS)
  {
    MailApp.sendEmail(RECIPIENTS[n], subject, "", {htmlBody: body});
  };
};

/* ================================================================================ */