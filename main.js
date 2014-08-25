var fs = require('fs');
var files, directory;

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


//returns an array of filenames contained in the directory
var getFileNames = function(directory) {
  fs.readdir(directory, function(err, files) {
    console.log(directory)
    if (err) {
      console.log("Error getting file list.");
    } else {
      console.log(files);
      return files;
    }
  })
};

$(document).on('submit', '.inputform', function() {
  directory = $('.recordLocation').val();
  directory = directory.toString();
  console.log('directory input is ', directory)
  return getFileNames(directory);
});

// });