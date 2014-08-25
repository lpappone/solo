var fs = require('fs');
var files, directory, fileNameFormat;

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

//returns an array of filenames contained in the directory
var getFileNames = function(directory, format) {
  console.log('format ', format)
  fs.readdir(directory, function(err, files) {
    if (err) {
      console.log("Error getting file list.");
    } else {
      console.log(files);
      return files;
    }
  })
};

var processInputData = function() {
  getFileNames(directory);
}

$(document).on('submit', '.inputForm', function() {
  directory = $('.recordLocation').val();
  directory = directory.toString();
  fileNameFormat = $('.fileNameFormat').val();
  return getFileNames(directory, fileNameFormat);
});


  
  
// console.log('format ', fileNameFormat);

// });