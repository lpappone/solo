var fs = require('fs');
var csv = require('fast-csv');
var readit = require('readdir')
// var Promise = require('bluebird');
// Promise.promisifyAll(fs);
// Promise.promisifyAll(csv);

var files, directory, format, regEx, fileRange, x, y, csvSorted, fileName; 
var csvData = [];
var finalFileList = [];
var finalDocList = [];

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

//called by processInputData; extracts numbers from filenames
var processFileList = function(filename) {
  regEx = /\d+/g;
  var strFileRange = filename.match(regEx);
  fileRange = []; 
  for (var i = 0; i < strFileRange.length; i++) {
    fileRange.push(parseInt(strFileRange[i]));
  }  
  return fileRange;
};

//returns an array of filenames contained in the directory
var processInputData = function(directory, finalCsv, format) {
  fs.readdir(directory, function(err, files) {
    if (err) {
      console.log("Error getting file list.");
    } else {
      fileTypeRegEx = /\.pdf$/i;
      files.forEach(function(filename, index, files) {
        if (filename && fileTypeRegEx.test(filename)) {
          finalFileList.push(processFileList(filename));
        // console.log('INTERIM FILE LIST', finalFileList)
        }
      })
      createDocument(finalFileList, finalCsv, format);
    }
  })
};

//called by processCsvList to get rid of duplicates and overlaps
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

//returns a sorted, merged list of cited ranges data
var processCsvList = function(directory, csvLocation, format){
  csv.fromPath(csvLocation).on('record', function(data) {
    if (data.length !== 0) {
      csvData.push(data);
    }
    }).on('end', function() {
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
      finalCsv = csvMerge(csvSorted);
      processInputData(directory, finalCsv, format); 
    });
};



var createDocument = function(fileList, citationsList, format) {
  var prefix1 = format[0];
  var prefix2 = format[2];
  if (format[1] !== null) {
    var leadingzeros = format[1].length;
  }

  var fileToFind = function(begin, end) {
    var result = [];
    if (prefix1 !== null) {
      result.push(prefix1);
    }
    if (leadingzeros) {
      var zerosNeeded = leadingzeros - end.length;
      var counter = 0;
      while (counter < zerosNeeded) {
        result.push('0');
        counter++
      }
    }
    result.push(begin.toString());
    result.push('-');
    if (prefix2 !== null) {
      result.push(prefix2);
    }
    if (leadingzeros) {
      var zerosNeeded = leadingzeros - end.length;
      var counter = 0;
      while (counter < zerosNeeded) {
        result.push('0');
        counter++
      }
    }
    result.push(end.toString());
    result.push('.pdf');
    result = result.join('');
    return result;
  };

  for (var i = 0; i < citationsList.length; i++) {
    var cite = citationsList[i];
    // console.log("i=", i)
    // console.log('cite=', cite)
    for (var k = 0; k < fileList.length; k++) {
      var file = fileList[k];
      // console.log('k=', k);
      // console.log('file=',file);
      if (file[0] <= cite[0] && cite[0] <= file[1] && cite[1] > file[1]) {
        console.log('in first if');
        startExtract = cite[0] - file[0] + 1;
        endExtract = file[1] - file[0] + 1; 
        newFileName = [cite[0].toString(), '-', file[1].toString(), '.pdf'].join('');
        finalDocList.push(newFileName); 
        cmd1 = ['pdftk ', fileToFind(file[0], file[1]), ' cat ', startExtract.toString(), '-', endExtract.toString(), ' output ', cite[0].toString(), '-', file[1].toString(), '.pdf dont_ask'].join('');          
        // os.popen(cmd1).read() 
        console.log('cmd1=',cmd1)
        citationsList.splice((i+1), 0, [fileList[k+1][0], cite[1]]); 

    } else if (cite[0] >= file[0] && cite[0] <= file[1]) {
      console.log('in second if')
      startExtract = cite[0] - file[0] + 1;
      endExtract = cite[1] - file[0] + 1;
      newFileName = [cite[0].toString(), '-', cite[1].toString(), '.pdf'].join('');
      finalDocList.push(newFileName);
      // cmd = 'pdftk ' + str("%05d"%(item[0])) + "-" + str("%05d"%(item[1])) + '.pdf cat ' + str(begin) + '-' + str(end) + ' output ' + str(rng[0]) + '-' + str(rng[1]) + '.pdf dont_ask'
      cmd = ['pdftk ', fileToFind(file[0], file[1]), ' cat ', startExtract.toString(), '-', endExtract.toString(), ' output ', cite[0].toString(), '-', cite[1].toString(), '.pdf dont_ask'].join('');            
      console.log('cmd=',cmd)
      // os.popen(cmd).read() 
    }
    }
  }
  console.log('finalDocList = ', finalDocList)
};

$(document).on('submit', '.inputForm', function() {
  directory = $('.recordLocation').val();
  format = [$('.fileNameFormat1').val(), $('.fileNumberFormat').val(), $('.fileNameFormat2').val()];
  csvLocation = $('.csvLocation').val();
  // return createDocument(directory, fileNameFormat, csvLocation);
  return processCsvList(directory, csvLocation, format);
});

// $(document).on('submit', '.csvForm', function() {
//   csvLocation = $('.csvLocation').val();
//   return processCsvList(csvLocation);
// })

// $(document).on('click', '.go', function() {
//   createDocument();
// })
  
  

// });