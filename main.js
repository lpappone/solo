var fs = require('fs');
var csv = require('fast-csv');

var files, directory, fileNameFormat, regEx, fileRange, x, y, csvSorted; 
var csvData = [];
var finalFileList = [];

//implement later to allow searching through more than one folder.
// var getRecordFiles = function(directory) {
//   var recordFiles = [];
//   fs.readdirSync(dir).forEach(function(file) {
//     file = directory+'/'+file;
//     var stat = fs.statSync(file);

//     if (stat && stat.isDirectory()) {
//       results = results.concat(_getRecordFiles(file));
//     } else {
//       results.push(file);
//     }
//   });
//   return results;
// };

// $(document).ready(function() { 

var processFileList = function(filename) {
  regEx = /\d+/g;
  fileRange = filename.match(regEx);
  return fileRange;
};

var csvMerge = function(array) {
  if (array[0].length === 0) {
    array = array.shift();
  }
  var stack = [[parseInt(array[0][0]), parseInt(array[0][1])]];
  for (var i = 1; i < array.length; i++) {
    if (array[i].length !== 0) {
      var prevVal = stack[stack.length-1];
      if (+array[i][0] > +prevVal[1]) {
        stack.push([parseInt(array[i][0]), parseInt(array[i][1])]);
      } else {
        var newVal = [parseInt(prevVal[0]), parseInt(array[i][1])];
        stack.pop();
        stack.push(newVal);
      }
    }
  }
  return stack; 
}

var processCsvList = function(csvLocation){
  csv.fromPath(csvLocation).on('record', function(data) {
    if (data.length !== 0) {
      csvData.push(data);
    }
    }).on('end', function() {
      console.log('csvdata' , csvData);
      csvSorted = csvData.sort(function(a, b) {
        if (a[0] === b[0]) {
          x = parseInt(a[1]);
          y = parseInt(b[1]);
          if (x > y) {
            return 1;
          } else if (x < y) {
            return -1;
          } else {
            return 0;
          }
        }
        return parseInt(a[0]) - parseInt(b[0]); 
      });
      console.log(csvSorted);
      finalCsv = csvMerge(csvSorted);
      console.log(finalCsv);
    });
};

//returns an array of filenames contained in the directory
var processInputData = function(directory, format) {
  fs.readdir(directory, function(err, files) {
    if (err) {
      console.log("Error getting file list.");
    } else {
      files.forEach(function(filename, index, files) {
        finalFileList.push(processFileList(filename));
      })
      return finalFileList;
    }
  })
};

$(document).on('submit', '.inputForm', function() {
  directory = $('.recordLocation').val();
  // directory = directory.toString();
  fileNameFormat = $('.fileNameFormat').val();
  return processInputData(directory, fileNameFormat);
});

$(document).on('submit', '.csvForm', function() {
  csvLocation = $('.csvLocation').val();
  return processCsvList(csvLocation);
})
  
  

// });