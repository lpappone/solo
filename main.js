var fs = require('fs');
var csv = require('fast-csv');
var readit = require('readdir')
var path = require('path');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var csvData = [];
var fileNameStorage = {};
var interimFileList = [];
var finalFileList = [];

var files, directory, fileRange, x, y, fileName; 

var finalDocList = [];
var results = [];


//called by processInputData; extracts numbers from filenames
var processFileList = function(filename) {
  var regEx = /\d+/g;
  var strFileRange = filename.match(regEx);
  fileRange = []; 
  for (var i = 0; i < strFileRange.length; i++) {
    fileRange.push(parseInt(strFileRange[i]));
  }  
  return fileRange;
};

//calls final function, passing sorted file list, processed cite list, and file name storage object
var processInputData = function(directoryFiles, finalCsv) {
  
  var fileTypeRegEx = /\.pdf$/i;
  directoryFiles.forEach(function(filename, index, files) {
    if (filename && fileTypeRegEx.test(filename)) {
      var processedFileName = processFileList(filename);
      interimFileList.push(processedFileName);
      fileNameStorage[processedFileName] = filename; 
    }
  });
  finalFileList = interimFileList.sort(function(a,b){
    if (a[0] > b[0]) {      
      return 1;
    } else if (a[0] < b[0]) {
      return -1;
    } else {
      return 0;
    }
  });
  createDocument(finalFileList, finalCsv, fileNameStorage);
};

//called by process csvList to get a list of record files from nested directories
var getRecordFiles = function(directory, finalCsv, callback) {
  var gatherFiles = function(directory) { 
    var files = fs.readdirSync(directory); 
      files.forEach(function(filename) {
        var file = path.resolve(directory, filename);
        var stat = fs.statSync(file);

        if (stat && stat.isFile() && filename !== '.DS_Store') {
          results.push(filename);
        } else if (stat.isDirectory()) {
          gatherFiles(file);
        }
      });
      return results;
    };
  callback(gatherFiles(directory), finalCsv);
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
      if (parseInt(array[i][0]) > parseInt(prevVal[1])) {
        stack.push([parseInt(array[i][0]), parseInt(array[i][1])]);
      } else if (parseInt(array[i][1]) > parseInt(prevVal[1])) {
        var newVal = [parseInt(prevVal[0]), parseInt(array[i][1])];
        stack.pop();
        stack.push(newVal);
      }
    }
  }
  return stack; 
}

//returns a sorted, merged list of cited ranges data
var processCsvList = function(directory, csvLocation){
  csv.fromPath(csvLocation).on('record', function(data) {
    if (data.length !== 0) {
      csvData.push(data);
    }
    }).on('end', function() {
      var csvSorted = csvData.sort(function(a, b) {
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
      var finalCsv = csvMerge(csvSorted);
      getRecordFiles(directory, finalCsv, processInputData);
    });
};

var buildFinalFile = function(finalDocList) {
  var finalInput = finalDocList.join(' ');
  console.log(finalInput)
  finalpdftk = spawn('pdftk', [finalInput, 'cat output RECORD.pdf dont_ask']);

  finalpdftk.on('exit', function (code) {
    console.log('Child process exited with exit code '+code);
  });
}

var createDocument = function(fileList, citationsList, fileNameStorage) {
  console.log('FILE LIST', fileList)
  console.log('CITES LIST', citationsList)
  console.log('NEW OBJ', fileNameStorage)
  var childProcessCount = 0; 

  // var buildFile = function()

  for (var i = 0; i < citationsList.length; i++) {
    var inputFiles = [];
    var extracts = [];
    var outputFiles = [];

    var cite = citationsList[i];
    for (var k = 0; k < fileList.length; k++) {
      var file = fileList[k];
      //if the first page of the cited range is within the file's range, and the last page of
      //the cited range is beyond the last page of the cited file
      if (file[0] <= cite[0] && cite[0] <= file[1] && cite[1] > file[1]) {
        startExtract = cite[0] - file[0] + 1;
        endExtract = file[1] - file[0] + 1; 
        newFileName = [cite[0].toString(), '-', file[1].toString(), '.pdf'].join('');
        finalDocList.push(newFileName); 
        
        citationsList.splice((i+1), 0, [fileList[k+1][0], cite[1]]); 
        
        var inputFile = fileNameStorage[fileList[k].toString()];
        inputFiles.push(inputFile);
        var extract = [startExtract.toString(), '-', endExtract.toString()].join('');
        extracts.push(extract);
        var outputFile = [cite[0].toString(), '-', file[1].toString(), '.pdf'].join('');
        outputFiles.push(outputFile);

        pdftk = spawn('pdftk', [inputFile, 'cat', extract, 'output', outputFile, 'dont_ask']);
        pdftk.on('exit', function (code) {
          childProcessCount++;
          if (childProcessCount === finalDocList.length) {
            var finalpdftk = spawn('pdftk', [finalInput, 'cat', 'output', 'ER.pdf', 'dont_ask']);
            finalpdftk.on('exit', function (code) {
              console.log('Final child process exited with code '+code);
            });
          } else {
            console.log('Child process exited with exit code '+code);
          }
        });

      } else if (cite[0] >= file[0] && cite[0] <= file[1]) {
        console.log('SMASH!!!!!!!')

        startExtract = cite[0] - file[0] + 1;
        endExtract = cite[1] - file[0] + 1;
        newFileName = [cite[0].toString(), '-', cite[1].toString(), '.pdf'].join('');
        finalDocList.push(newFileName);
    
        var inputFile = fileNameStorage[fileList[k].toString()];
        inputFiles.push(inputFile);
        var extract = [startExtract.toString(), '-', endExtract.toString()].join('');
        extracts.push(extract);
        var outputFile = [cite[0].toString(), '-', cite[1].toString(), '.pdf'].join('');
        outputFiles.push(outputFile);

        pdftk = spawn('pdftk', [inputFile, 'cat', extract, 'output', outputFile, 'dont_ask']);
        pdftk.on('exit', function (code) {
          childProcessCount++;
          if (childProcessCount === finalDocList.length) {
            var args = finalDocList.concat(['cat', 'output', 'ER.pdf', 'dont_ask'])
            var finalpdftk = spawn('pdftk', args);

            finalpdftk.on('exit', function (code) {
              console.log('Final child process exited with code '+code);
            });

            finalpdftk.stderr.on('data', function(data) {
              console.log('22222 STDERRR!!!!', data);
            })
          } else {
            console.log('fdL length = ', finalDocList.length, ' cpc = ', childProcessCount);
            console.log('Child process exited with exit code '+code);
          }
        });
      }
    }
  }

  console.log('finalDocList = ', finalDocList);
  var finalInput = finalDocList.join(' ');

};

$(document).on('submit', '.inputForm', function() {
  directory = $('.recordLocation').val();
  csvLocation = $('.csvLocation').val();
  return processCsvList(directory, csvLocation);
});

