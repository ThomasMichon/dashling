function _mix(dest, source) {
  for (var i in source) {
    if (source.hasOwnProperty(i)) {
      dest[i] = source[i];
    }
  }

  return dest;
}

function _bind(obj, func) {
  return function() {
    return func.apply(obj, arguments);
  };
}

function _average(numbers, startIndex) {
  startIndex = Math.max(0, startIndex || 0);

  var total = 0;
  var count = numbers ? numbers.length - startIndex : 0;

  if (count) {
    for (startIndex; startIndex < numbers.length; startIndex++) {
      total += numbers[startIndex];
    }
    total /= count;
  }

  return total;
}

function _log(message, settings) {
  if (!settings || settings.logToConsole) {
    console.log(message);
  }
}

function _getXmlNodeValue(xmlDoc, elementName, defaultValue) {
  var element = xmlDoc.getElementsByTagName(elementName)[0];
  var elementText = element ? element.childNodes[0] : null;

  return elementText ? elementText.nodeValue : defaultValue;
}

function _fromISOToSeconds(isoString) {
  // "PT0H0M29.367S";
  var seconds = 0;
  var tempString = isoString.substring("2"); // Remove PT
  var tempIndex = tempString.indexOf("H");

  if (tempIndex > -1) {
    seconds += Number(tempString.substring(0, tempIndex)) * 60 * 60;
    tempString = tempString.substring(tempIndex + 1);
  }

  tempIndex = tempString.indexOf("M");
  if (tempIndex > -1) {
    seconds += Number(tempString.substring(0, tempIndex)) * 60;
    tempString = tempString.substring(tempIndex + 1);
  }

  tempIndex = tempString.indexOf("S");
  if (tempIndex > -1) {
    seconds += Number(tempString.substring(0, tempIndex));
  }

  return seconds;
}