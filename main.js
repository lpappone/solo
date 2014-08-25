var fs = require('fs');
var files, directory, fileNameFormat, regEx, fileRange;
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
  console.log('in process, filename ', filename)
  regEx = /\d+/g;
  fileRange = filename.match(regEx);
  return fileRange
}
//returns an array of filenames contained in the directory
var processInputData = function(directory, format) {
  fs.readdir(directory, function(err, files) {
    if (err) {
      console.log("Error getting file list.");
    } else {
      console.log('files ', files)
      files.forEach(function(filename, index, files) {
        finalFileList.push(processFileList(filename));
        console.log(finalFileList)
      })
      console.log('fINAL list ' , finalFileList);
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


  
  

// });