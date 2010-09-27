// evaluate xpath
function xpath(path, node) {
  return document.evaluate(path, node).iterateNext();
}

// open link in new tab
function openInNewTab(url) {
  return 'javascript:chrome.tabs.create({url: \'' + encodeURI(url) + '\'})';
}

// add links to tweet
function linkify(tweet) {
  // links
  tweet = tweet.replace(
    /[a-z\d+-.]+:\/\/[\w\d$-+!*'(),;?:@&=%]+\.[\w\d$-.+!*'(),;\/?:@&=%]+/ig,
    function(str) {
      return '<a href="javascript:chrome.tabs.create({url: \'' + encodeURI(str)
        + '\'})">' + str + '</a>';
    }
  );

  // twitter ids
  tweet = tweet.replace(/@\w+/g, function(str) {
    return '<a href="javascript:chrome.tabs.create({url: \'http://twitter.com/'
      + str.substring(1) + '\'})">' + str + '</a>';
  });

  // twitter hashes
  tweet = tweet.replace(/#[a-z]+/ig, function(str) {
    return '<a href="javascript:chrome.tabs.create({url: \'http://twitter.com/#search?q=%2523'
      + str.substring(1) + '\'})">' + str + '</a>';
  });

  return tweet;
}
