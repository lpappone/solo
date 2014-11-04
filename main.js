var fs = require('fs');
var csv = require('fast-csv');
var readit = require('readdir')
var path = require('path');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var recursive = require('recursive-readdir');
var p = require('path')

var csvData = [];
var fileNameStorage = {};
var finalFileList = [];

var files, fileName, directory, savedFilesFolder; 

var finalDocList = [];


//called by processInputData; extracts numbers from filenames
var processFileList = function(filename) {
  var regEx = /\d+/g;
  var strFileRange = filename.match(regEx);
  var fileRange = []; 
  for (var i = 0; i < strFileRange.length; i++) {
    fileRange.push(parseInt(strFileRange[i]));
  }  
  return fileRange;
};

//calls final function, passing sorted file list, processed cite list, and file name storage object
var processInputData = function(directoryFiles, finalCsv) {
  console.log('processInputData: ', directoryFiles, finalCsv)
  //these directory files have full path name
  var interimFileList = [];
  var fileTypeRegEx = /\.pdf$/i;
  directoryFiles.forEach(function(filename, index, files) {
    if (filename[1] && fileTypeRegEx.test(filename[1])) {
      var processedFileName = processFileList(filename[1]);
      interimFileList.push(processedFileName);
      fileNameStorage[processedFileName] = filename[0]; 
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
var getRecordFiles = function(finalCsv, callback) {
  console.log('getRecordFiles: ', directory, finalCsv, callback)
  var results = [];
  recursive(directory, function (err, files) {
    console.log('DIRECTORY', directory)
    // Files is an array of filename
    console.log("FILES", files);
   });
  
  
  var gatherFiles = function(directory) { 
    var files = fs.readdirSync(directory); 
      files.forEach(function(filename) {
        var file = path.resolve(directory, filename);
        var stat = fs.statSync(file)

        if (stat && stat.isFile() && filename !== '.DS_Store') {
          results.push([file, filename])
          console.log("RESULTS", results)
        } else if (stat.isDirectory()) {
          gatherFiles(file);
        }
      });
      return results;
    };
  callback(gatherFiles(directory), finalCsv); //this calls processInputData
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
var processCsvList = function(csvLocation){
  console.log('processCsvList: ', directory, csvLocation);
  csv.fromPath(csvLocation).on('record', function(data) {
    if (data.length !== 0) {
      csvData.push(data);
    }
    }).on('end', function() {
      var csvSorted = csvData.sort(function(a, b) {
        if (a[0] === b[0]) {
          var x = parseInt(a[1]);
          var y = parseInt(b[1]);
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
      getRecordFiles(finalCsv, processInputData);
    });
};

var createDocument = function(fileList, citationsList, fileNameStorage) {
  console.log('FILE LIST', fileList)
  console.log('CITES LIST', citationsList)
  console.log('FILE NAME STORAGE', fileNameStorage)
  console.log('SAVED LOCATION', savedFilesFolder)

  var childProcessCount = 0; 

  var buildFile = function(inputFile, extract, outputFile) {
    pdftk = spawn('pdftk', [inputFile, 'cat', extract, 'output', outputFile, 'dont_ask']);
    pdftk.on('exit', function (code) {
      childProcessCount++;
      if (childProcessCount === finalDocList.length) {
        var finalFile = savedFilesFolder + '/Excerpts_of_Record.pdf'
        var args = finalDocList.concat(['cat', 'output', finalFile, 'dont_ask'])
        var finalpdftk = spawn('pdftk', args);
        finalpdftk.on('exit', function (code) {
          console.log('Final child process exited with code '+code);
        });
      } else {
        console.log('Child process exited with exit code '+code);
      }
    });
  };

  for (var i = 0; i < citationsList.length; i++) {
    var inputFiles = [];
    var extracts = [];
    var outputFiles = [];

    var cite = citationsList[i];
    for (var k = 0; k < fileList.length; k++) {
      var file = fileList[k];
      if (file[0] <= cite[0] && cite[0] <= file[1]) {
        var endOfFileCalc = cite[1];
        var needInsertNewFile = false;
        if (cite[1] > file[1]) {
          endOfFileCalc = file[1];
          needInsertNewFile = true; 
        }

        startExtract = cite[0] - file[0] + 1;
        endExtract = endOfFileCalc - file[0] + 1;
        newFileName = [savedFilesFolder, '/', cite[0].toString(), '-', endOfFileCalc.toString(), '.pdf'].join('');
        finalDocList.push(newFileName); 
        if (needInsertNewFile) {
          //insert the end of the cited range into the list of ranges
          citationsList.splice((i+1), 0, [fileList[k+1][0], cite[1]]); 
        }
        
        var inputFile = fileNameStorage[fileList[k].toString()];
        inputFiles.push(inputFile);
        var extract = [startExtract.toString(), '-', endExtract.toString()].join('');
        extracts.push(extract);
        var outputFile = [savedFilesFolder + '/' + cite[0].toString(), '-', endOfFileCalc.toString(), '.pdf'].join('');
        outputFiles.push(outputFile);

        buildFile(inputFile, extract, outputFile);
      } 
    }
  }
  console.log('finalDocList = ', finalDocList);
  var finalInput = finalDocList.join(' ');

};

$(document).on('submit', '.inputForm', function() {
  directory = $('#recordLocation').val();
  var csvLocation = $('#csvLocation').val();
  savedFilesFolder = $('#savedFilesLocation').val(); 
  return processCsvList(csvLocation);
});

$(document).on('click', '#directoryBrowse', function() {
  chooseFile('#fileDialog-folder', 'recordLocation');
});

$(document).on('click', '#csvBrowse', function() {
  chooseFile('#fileDialog-file', 'csvLocation');
});

$(document).on('click', '#savedFilesBrowse', function() {
  chooseFile('#fileDialog-savefolder', 'savedFilesLocation');
});

function chooseFile(name, inputField) {
  var chooser = document.querySelector(name);
  chooser.addEventListener("change", function(event) {
    document.getElementById(inputField).value = this.value;
  }, false);
  chooser.click();
}

